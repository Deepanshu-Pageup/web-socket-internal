import { randomUUID } from 'node:crypto';
import type { IncomingMessage, Server } from 'node:http';
import type { Duplex } from 'node:stream';
import { WebSocket, WebSocketServer, type RawData } from 'ws';
import type { Logger } from '../logging/logger.js';
import {
  closeCodes,
  type ConnectionState,
  type SendResult,
  type TransportConnection,
  type TransportHandlers,
  type TransportOptions,
  type TransportStats,
  type UpgradeRequestInfo,
  type WebSocketTransport,
} from './transport-types.js';

type RejectStatus = 400 | 401 | 403 | 404 | 405 | 503;

const statusText: Readonly<Record<RejectStatus, string>> = {
  400: 'Bad Request',
  401: 'Unauthorized',
  403: 'Forbidden',
  404: 'Not Found',
  405: 'Method Not Allowed',
  503: 'Service Unavailable',
};

function rejectUpgrade(socket: Duplex, status: RejectStatus): void {
  if (socket.writable) {
    socket.write(
      `HTTP/1.1 ${String(status)} ${statusText[status]}\r\n` +
        'Connection: close\r\nContent-Length: 0\r\n\r\n',
    );
  }
  socket.destroy();
}

function toBytes(data: RawData): Uint8Array {
  if (Array.isArray(data)) return Buffer.concat(data);
  if (data instanceof ArrayBuffer) return new Uint8Array(data);
  return data;
}

class Connection implements TransportConnection {
  readonly id = randomUUID();
  alive = true;
  slowClosed = false;
  private closing = false;

  constructor(
    private readonly socket: WebSocket,
    private readonly maxBufferedBytes: number,
    private readonly onSlowClient: () => void,
    private readonly log: Logger,
    readonly attachment: unknown,
  ) {}

  get state(): ConnectionState {
    if (this.socket.readyState === WebSocket.OPEN && !this.closing) return 'open';
    if (this.socket.readyState === WebSocket.CLOSED) return 'closed';
    return 'closing';
  }

  send(data: string | Uint8Array): SendResult {
    if (this.state !== 'open') return 'closed';
    const size = typeof data === 'string' ? Buffer.byteLength(data) : data.byteLength;
    if (this.socket.bufferedAmount + size > this.maxBufferedBytes) {
      this.closeSlowClient();
      return 'backpressure';
    }
    this.socket.send(data, (error?: Error) => {
      if (error) {
        this.log.warn({ connectionId: this.id }, 'send failed; terminating connection');
        this.socket.terminate();
      }
    });
    return 'sent';
  }

  close(code: number, reason: string): void {
    if (this.socket.readyState !== WebSocket.OPEN || this.closing) return;
    this.closing = true;
    this.socket.close(code, reason);
  }

  exceedsBuffer(): boolean {
    return this.socket.bufferedAmount > this.maxBufferedBytes;
  }

  closeSlowClient(): void {
    if (this.slowClosed) return;
    this.slowClosed = true;
    this.onSlowClient();
    this.log.warn({ connectionId: this.id }, 'closing slow client');
    this.close(closeCodes.policyViolation, 'slow client');
  }

  ping(): void {
    this.socket.ping();
  }

  terminate(): void {
    this.socket.terminate();
  }
}

export function createWebSocketTransport(
  options: TransportOptions,
  handlers: TransportHandlers,
  log: Logger,
): WebSocketTransport {
  const wss = new WebSocketServer({
    noServer: true,
    maxPayload: options.maxPayloadBytes,
    perMessageDeflate: false,
  });
  const connections = new Set<Connection>();
  const counters = {
    accepted: 0,
    rejected: 0,
    dead: 0,
    slow: 0,
    messages: 0,
    bytes: 0,
  };
  let pendingUpgrades = 0;
  let accepting = true;
  let pingTimer: NodeJS.Timeout | undefined;

  const reject = (socket: Duplex, status: RejectStatus, reason: string): void => {
    counters.rejected += 1;
    log.warn({ status, reason }, 'websocket upgrade rejected');
    rejectUpgrade(socket, status);
  };

  const sweep = (): void => {
    for (const connection of connections) {
      if (connection.state !== 'open') continue;
      if (!connection.alive) {
        counters.dead += 1;
        log.warn({ connectionId: connection.id }, 'no pong received; terminating connection');
        connection.terminate();
        continue;
      }
      if (connection.exceedsBuffer()) {
        connection.closeSlowClient();
        continue;
      }
      connection.alive = false;
      connection.ping();
    }
  };

  const startPinging = (): void => {
    pingTimer ??= setInterval(sweep, options.pingIntervalMs);
    pingTimer.unref();
  };

  const stopPinging = (): void => {
    if (pingTimer) clearInterval(pingTimer);
    pingTimer = undefined;
  };

  const accept = (
    request: IncomingMessage,
    socket: Duplex,
    head: Buffer,
    attachment: unknown,
  ): void => {
    wss.handleUpgrade(request, socket, head, (ws) => {
      const connection = new Connection(
        ws,
        options.maxBufferedBytes,
        () => {
          counters.slow += 1;
        },
        log,
        attachment,
      );
      connections.add(connection);
      counters.accepted += 1;
      startPinging();
      log.info({ connectionId: connection.id, active: connections.size }, 'connection opened');

      ws.on('pong', () => {
        connection.alive = true;
      });
      ws.on('message', (data: RawData, isBinary: boolean) => {
        const bytes = toBytes(data);
        counters.messages += 1;
        counters.bytes += bytes.byteLength;
        connection.alive = true;
        try {
          handlers.onMessage(connection, bytes, isBinary);
        } catch {
          log.error({ connectionId: connection.id }, 'message handler failed');
          connection.close(closeCodes.internalError, 'internal error');
        }
      });
      ws.on('error', (error: Error) => {
        // Covers oversize frames (1009) and malformed frames; never log payloads.
        log.warn({ connectionId: connection.id, err: error.message }, 'connection error');
      });
      ws.on('close', (code: number, reason: Buffer) => {
        connections.delete(connection);
        log.info(
          { connectionId: connection.id, code, active: connections.size },
          'connection closed',
        );
        try {
          handlers.onClose(connection, code, reason.toString('utf8'));
        } catch {
          log.error({ connectionId: connection.id }, 'close handler failed');
        }
        if (connections.size === 0) stopPinging();
      });

      try {
        handlers.onConnection(connection);
      } catch {
        log.error({ connectionId: connection.id }, 'connection handler failed');
        connection.close(closeCodes.internalError, 'internal error');
      }
    });
  };

  interface Rejection {
    readonly status: RejectStatus;
    readonly reason: string;
  }

  const validate = (request: IncomingMessage, url: URL): Rejection | undefined => {
    if (!accepting) return { status: 503, reason: 'shutting_down' };
    if (url.pathname !== options.path) return { status: 404, reason: 'path_not_found' };
    if (request.method !== 'GET') return { status: 405, reason: 'method_not_allowed' };
    if (request.headers.upgrade?.toLowerCase() !== 'websocket') {
      return { status: 400, reason: 'not_websocket_upgrade' };
    }
    const origin = request.headers.origin;
    if (
      options.allowedOrigins.length > 0 &&
      (origin === undefined || !options.allowedOrigins.includes(origin))
    ) {
      return { status: 403, reason: 'origin_not_allowed' };
    }
    if (connections.size + pendingUpgrades >= options.maxConnections) {
      return { status: 503, reason: 'connection_limit' };
    }
    return undefined;
  };

  const parseUrl = (raw: string | undefined): URL | undefined => {
    try {
      return new URL(raw ?? '/', 'http://localhost');
    } catch {
      return undefined;
    }
  };

  const onUpgrade = (request: IncomingMessage, socket: Duplex, head: Buffer): void => {
    socket.on('error', () => {
      // Client reset during the handshake; nothing to clean up.
    });

    const url = parseUrl(request.url);
    if (!url) {
      reject(socket, 400, 'malformed_url');
      return;
    }
    const rejection = validate(request, url);
    if (rejection) {
      reject(socket, rejection.status, rejection.reason);
      return;
    }

    const { authenticate } = options;
    if (!authenticate) {
      accept(request, socket, head, undefined);
      return;
    }

    const info: UpgradeRequestInfo = {
      path: url.pathname,
      query: url.search,
      origin: request.headers.origin,
      headers: request.headers,
      remoteAddress: request.socket.remoteAddress,
    };
    pendingUpgrades += 1;
    Promise.resolve()
      .then(() => authenticate(info))
      .then(
        (decision) => {
          pendingUpgrades -= 1;
          if (socket.destroyed) return;
          if (!accepting) {
            reject(socket, 503, 'shutting_down');
          } else if (!decision.allow) {
            reject(socket, decision.status, 'authentication_failed');
          } else {
            accept(request, socket, head, decision.attachment);
          }
        },
        () => {
          pendingUpgrades -= 1;
          reject(socket, 403, 'authentication_error');
        },
      );
  };

  return {
    attach(server: Server): void {
      server.on('upgrade', onUpgrade);
    },

    stats(): TransportStats {
      return {
        activeConnections: connections.size,
        acceptedConnections: counters.accepted,
        rejectedUpgrades: counters.rejected,
        deadConnectionsTerminated: counters.dead,
        slowClientsClosed: counters.slow,
        messagesReceived: counters.messages,
        bytesReceived: counters.bytes,
      };
    },

    async close(graceMs: number): Promise<void> {
      accepting = false;
      stopPinging();
      const remaining = [...connections];
      if (remaining.length === 0) return;
      log.info({ active: remaining.length }, 'closing connections');

      await new Promise<void>((resolve) => {
        const timer = setTimeout(() => {
          clearInterval(check);
          for (const connection of connections) {
            log.warn({ connectionId: connection.id }, 'close grace expired; terminating');
            connection.terminate();
          }
          resolve();
        }, graceMs);
        const check = setInterval(() => {
          if (connections.size === 0) {
            clearTimeout(timer);
            clearInterval(check);
            resolve();
          }
        }, 10);
        for (const connection of remaining) {
          connection.close(closeCodes.goingAway, 'server shutting down');
        }
      });
    },
  };
}
