import type { AddressInfo } from 'node:net';
import { afterEach, describe, expect, it } from 'vitest';
import { WebSocket } from 'ws';
import { createHttpServer } from '../http/http-server.js';
import { createLogger } from '../logging/logger.js';
import type {
  TransportConnection,
  TransportHandlers,
  TransportOptions,
  WebSocketTransport,
} from './transport-types.js';
import { createWebSocketTransport } from './websocket-transport.js';

const baseOptions: TransportOptions = {
  path: '/ws',
  allowedOrigins: [],
  maxPayloadBytes: 1024,
  pingIntervalMs: 60_000,
  maxConnections: 10,
  maxBufferedBytes: 1_048_576,
};

interface Harness {
  readonly base: string;
  readonly transport: WebSocketTransport;
  readonly connections: TransportConnection[];
  readonly messages: string[];
  readonly closed: { code: number; reason: string }[];
}

const cleanups: (() => Promise<void>)[] = [];
const clients: WebSocket[] = [];

async function startHarness(
  overrides: Partial<TransportOptions> = {},
  handlerOverrides: Partial<TransportHandlers> = {},
): Promise<Harness> {
  const connections: TransportConnection[] = [];
  const messages: string[] = [];
  const closed: { code: number; reason: string }[] = [];
  const handlers: TransportHandlers = {
    onConnection: (connection) => {
      connections.push(connection);
    },
    onMessage: (_connection, data) => {
      messages.push(Buffer.from(data).toString('utf8'));
    },
    onClose: (_connection, code, reason) => {
      closed.push({ code, reason });
    },
    ...handlerOverrides,
  };
  const transport = createWebSocketTransport(
    { ...baseOptions, ...overrides },
    handlers,
    createLogger('silent'),
  );
  const server = createHttpServer(() => true);
  transport.attach(server);
  await new Promise<void>((resolve) => {
    server.listen(0, '127.0.0.1', resolve);
  });
  cleanups.push(async () => {
    await transport.close(200);
    server.closeAllConnections();
    await new Promise<void>((resolve) => {
      server.close(() => {
        resolve();
      });
    });
  });
  const { port } = server.address() as AddressInfo;
  return { base: `127.0.0.1:${String(port)}`, transport, connections, messages, closed };
}

function connect(url: string, options?: ConstructorParameters<typeof WebSocket>[2]): WebSocket {
  const client = new WebSocket(url, options);
  clients.push(client);
  return client;
}

async function open(
  url: string,
  options?: ConstructorParameters<typeof WebSocket>[2],
): Promise<WebSocket> {
  const client = connect(url, options);
  await new Promise<void>((resolve, reject) => {
    client.once('open', () => {
      resolve();
    });
    client.once('error', reject);
  });
  return client;
}

/** Resolves with the HTTP status of a rejected upgrade. */
function rejectedStatus(
  url: string,
  options?: ConstructorParameters<typeof WebSocket>[2],
): Promise<number> {
  const client = connect(url, options);
  return new Promise<number>((resolve, reject) => {
    client.once('unexpected-response', (_request, response) => {
      resolve(response.statusCode ?? 0);
    });
    client.once('open', () => {
      reject(new Error('upgrade was accepted'));
    });
    client.once('error', () => {
      // The error event follows unexpected-response handling.
    });
  });
}

function closeCodeOf(client: WebSocket): Promise<number> {
  return new Promise<number>((resolve) => {
    client.once('close', (code) => {
      resolve(code);
    });
  });
}

async function waitFor(condition: () => boolean, timeoutMs = 2000): Promise<void> {
  const start = Date.now();
  while (!condition()) {
    if (Date.now() - start > timeoutMs) throw new Error('condition not met in time');
    await new Promise((resolve) => setTimeout(resolve, 10));
  }
}

afterEach(async () => {
  for (const client of clients.splice(0)) client.terminate();
  for (const cleanup of cleanups.splice(0)) await cleanup();
});

describe('upgrade handling', () => {
  it('accepts a valid handshake and delivers frames both ways', async () => {
    const harness = await startHarness();
    const client = await open(`ws://${harness.base}/ws`);
    await waitFor(() => harness.connections.length === 1);

    client.send('hello');
    await waitFor(() => harness.messages.length === 1);
    expect(harness.messages[0]).toBe('hello');

    const received = new Promise<string>((resolve) => {
      client.once('message', (data: Buffer) => {
        resolve(data.toString('utf8'));
      });
    });
    expect(harness.connections[0]?.send('world')).toBe('sent');
    expect(await received).toBe('world');
    expect(harness.transport.stats().activeConnections).toBe(1);
  });

  it('rejects an unknown path with 404', async () => {
    const harness = await startHarness();
    expect(await rejectedStatus(`ws://${harness.base}/other`)).toBe(404);
    expect(harness.transport.stats().rejectedUpgrades).toBe(1);
  });

  it('ignores the query string when matching the path', async () => {
    const harness = await startHarness();
    await open(`ws://${harness.base}/ws?x=1`);
    await waitFor(() => harness.connections.length === 1);
  });

  it('accepts any origin when no allow-list is configured', async () => {
    const harness = await startHarness();
    await open(`ws://${harness.base}/ws`, { origin: 'https://anything.example' });
  });

  it('rejects a disallowed origin with 403', async () => {
    const harness = await startHarness({ allowedOrigins: ['https://app.example'] });
    expect(
      await rejectedStatus(`ws://${harness.base}/ws`, { origin: 'https://evil.example' }),
    ).toBe(403);
  });

  it('rejects a missing origin when an allow-list is configured', async () => {
    const harness = await startHarness({ allowedOrigins: ['https://app.example'] });
    expect(await rejectedStatus(`ws://${harness.base}/ws`)).toBe(403);
  });

  it('accepts an allowed origin', async () => {
    const harness = await startHarness({ allowedOrigins: ['https://app.example'] });
    await open(`ws://${harness.base}/ws`, { origin: 'https://app.example' });
    await waitFor(() => harness.connections.length === 1);
  });

  it('rejects connections over the limit with 503', async () => {
    const harness = await startHarness({ maxConnections: 1 });
    await open(`ws://${harness.base}/ws`);
    expect(await rejectedStatus(`ws://${harness.base}/ws`)).toBe(503);
  });

  it('applies the authentication hook', async () => {
    const harness = await startHarness({
      authenticate: (request) =>
        request.query === '?ok' ? { allow: true } : { allow: false, status: 401 },
    });
    expect(await rejectedStatus(`ws://${harness.base}/ws`)).toBe(401);
    await open(`ws://${harness.base}/ws?ok`);
    await waitFor(() => harness.connections.length === 1);
  });

  it('rejects the upgrade when the authentication hook throws', async () => {
    const harness = await startHarness({
      authenticate: () => {
        throw new Error('boom');
      },
    });
    expect(await rejectedStatus(`ws://${harness.base}/ws`)).toBe(403);
  });
});

describe('connection lifecycle', () => {
  it('reports client disconnects and releases the connection', async () => {
    const harness = await startHarness();
    const client = await open(`ws://${harness.base}/ws`);
    await waitFor(() => harness.connections.length === 1);

    client.close(1000, 'bye');
    await waitFor(() => harness.closed.length === 1);
    expect(harness.closed[0]).toEqual({ code: 1000, reason: 'bye' });
    expect(harness.transport.stats().activeConnections).toBe(0);
    expect(harness.connections[0]?.state).toBe('closed');
    expect(harness.connections[0]?.send('late')).toBe('closed');
  });

  it('cleans up after an abrupt disconnect', async () => {
    const harness = await startHarness();
    const client = await open(`ws://${harness.base}/ws`);
    await waitFor(() => harness.connections.length === 1);

    client.terminate();
    await waitFor(() => harness.closed.length === 1);
    expect(harness.transport.stats().activeConnections).toBe(0);
  });

  it('closes a connection whose message handler throws', async () => {
    const harness = await startHarness(
      {},
      {
        onMessage: () => {
          throw new Error('handler failure');
        },
      },
    );
    const client = await open(`ws://${harness.base}/ws`);
    const code = closeCodeOf(client);
    client.send('trigger');
    expect(await code).toBe(1011);
  });
});

describe('limits and liveness', () => {
  it('closes with 1009 when a frame exceeds the payload limit', async () => {
    const harness = await startHarness({ maxPayloadBytes: 16 });
    const client = await open(`ws://${harness.base}/ws`);
    const code = closeCodeOf(client);
    client.send('x'.repeat(100));
    expect(await code).toBe(1009);
    await waitFor(() => harness.closed.length === 1);
    expect(harness.messages).toEqual([]);
  });

  it('terminates connections that stop answering pings', async () => {
    const harness = await startHarness({ pingIntervalMs: 30 });
    await open(`ws://${harness.base}/ws`, { autoPong: false });
    await waitFor(() => harness.closed.length === 1);
    expect(harness.transport.stats().deadConnectionsTerminated).toBe(1);
    expect(harness.transport.stats().activeConnections).toBe(0);
  });

  it('keeps connections that answer pings', async () => {
    const harness = await startHarness({ pingIntervalMs: 30 });
    await open(`ws://${harness.base}/ws`);
    await new Promise((resolve) => setTimeout(resolve, 200));
    expect(harness.transport.stats().activeConnections).toBe(1);
    expect(harness.transport.stats().deadConnectionsTerminated).toBe(0);
  });

  it('closes a slow client with 1008 when the outbound buffer limit is exceeded', async () => {
    const harness = await startHarness({ maxBufferedBytes: 10 });
    const client = await open(`ws://${harness.base}/ws`);
    await waitFor(() => harness.connections.length === 1);

    const code = closeCodeOf(client);
    expect(harness.connections[0]?.send('x'.repeat(100))).toBe('backpressure');
    expect(await code).toBe(1008);
    expect(harness.transport.stats().slowClientsClosed).toBe(1);
  });
});

describe('graceful shutdown', () => {
  it('closes clients with 1001 and rejects new upgrades', async () => {
    const harness = await startHarness();
    const client = await open(`ws://${harness.base}/ws`);
    await waitFor(() => harness.connections.length === 1);

    const code = closeCodeOf(client);
    await harness.transport.close(1000);
    expect(await code).toBe(1001);
    expect(harness.transport.stats().activeConnections).toBe(0);
    expect(await rejectedStatus(`ws://${harness.base}/ws`)).toBe(503);
  });

  it('terminates clients that ignore the closing handshake after the grace period', async () => {
    const harness = await startHarness();
    const client = await open(`ws://${harness.base}/ws`);
    await waitFor(() => harness.connections.length === 1);

    client.pause();
    const started = Date.now();
    await harness.transport.close(100);
    expect(Date.now() - started).toBeGreaterThanOrEqual(90);
    await waitFor(() => harness.transport.stats().activeConnections === 0);
  });

  it('resolves immediately when there are no connections', async () => {
    const harness = await startHarness();
    await harness.transport.close(1000);
  });
});
