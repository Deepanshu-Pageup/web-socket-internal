import type { IncomingHttpHeaders, Server } from 'node:http';

/**
 * Transport-layer contracts. These describe raw WebSocket connections only.
 * They contain no application protocol, channel, token or publishing concepts.
 */

/** Close codes the transport itself uses. */
export const closeCodes = {
  normal: 1000,
  goingAway: 1001,
  policyViolation: 1008,
  internalError: 1011,
} as const;

export type ConnectionState = 'open' | 'closing' | 'closed';

export type SendResult = 'sent' | 'closed' | 'backpressure';

export interface TransportConnection {
  readonly id: string;
  readonly state: ConnectionState;
  /** Queues a frame. Returns `backpressure` (and closes the connection) when the outbound buffer limit would be exceeded. */
  send(data: string | Uint8Array): SendResult;
  /** Starts the closing handshake. */
  close(code: number, reason: string): void;
}

export interface TransportHandlers {
  onConnection(connection: TransportConnection): void;
  onMessage(connection: TransportConnection, data: Uint8Array, isBinary: boolean): void;
  onClose(connection: TransportConnection, code: number, reason: string): void;
}

/** Read-only view of an upgrade request handed to the authentication hook. */
export interface UpgradeRequestInfo {
  readonly path: string;
  readonly query: string;
  readonly origin: string | undefined;
  readonly headers: Readonly<IncomingHttpHeaders>;
  readonly remoteAddress: string | undefined;
}

export type UpgradeDecision =
  { readonly allow: true } | { readonly allow: false; readonly status: 401 | 403 };

/**
 * Hook for a later phase to accept or reject an upgrade. The transport does
 * not define any token format; with no hook configured every upgrade that
 * passes the path, origin and capacity checks is accepted.
 */
export type UpgradeAuthenticator = (
  request: UpgradeRequestInfo,
) => UpgradeDecision | Promise<UpgradeDecision>;

export interface TransportOptions {
  readonly path: string;
  /** Empty list disables origin checking. A non-empty list requires a matching `Origin` header. */
  readonly allowedOrigins: readonly string[];
  readonly maxPayloadBytes: number;
  readonly pingIntervalMs: number;
  readonly maxConnections: number;
  readonly maxBufferedBytes: number;
  readonly authenticate?: UpgradeAuthenticator;
}

export interface TransportStats {
  readonly activeConnections: number;
  readonly acceptedConnections: number;
  readonly rejectedUpgrades: number;
  readonly deadConnectionsTerminated: number;
  readonly slowClientsClosed: number;
  readonly messagesReceived: number;
  readonly bytesReceived: number;
}

export interface WebSocketTransport {
  /** Registers the explicit `upgrade` listener on an HTTP server. */
  attach(server: Server): void;
  stats(): TransportStats;
  /**
   * Stops accepting upgrades, closes every connection with 1001 and waits for
   * the closing handshake. Connections still open after `graceMs` are terminated.
   */
  close(graceMs: number): Promise<void>;
}
