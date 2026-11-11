import { createHmac } from 'node:crypto';
import type { AddressInfo } from 'node:net';
import { afterEach, describe, expect, it } from 'vitest';
import { WebSocket } from 'ws';
import { createHttpServer } from '../http/http-server.js';
import { createLogger } from '../logging/logger.js';
import type { TransportConnection } from '../transport/transport-types.js';
import { createWebSocketTransport } from '../transport/websocket-transport.js';
import { canAccessChannel } from './channel-scope.js';
import { signToken } from './sign-token.js';
import type { TokenClaims } from './token-claims.js';
import { verifyToken, type TokenVerifierOptions } from './token-verifier.js';
import { createUpgradeAuthenticator } from './upgrade-authenticator.js';

const secret = 'example-placeholder-secret-0123456789abcdef';
const otherSecret = 'another-placeholder-secret-fedcba9876543210';
const now = 1_800_000_000;

const options: TokenVerifierOptions = {
  keys: new Map([
    ['key1', secret],
    ['key2', otherSecret],
  ]),
  deploymentId: 'example-deployment',
  maxLifetimeSeconds: 300,
  clockSkewSeconds: 5,
};

function claims(overrides: Partial<TokenClaims> = {}): TokenClaims {
  return {
    sub: 'user-1',
    dep: 'example-deployment',
    iat: now,
    exp: now + 60,
    channels: ['orders.*', 'private.me'],
    ...overrides,
  };
}

function token(overrides: Partial<TokenClaims> = {}, kid = 'key1', key = secret): string {
  return signToken({ kid, secret: key, claims: claims(overrides) });
}

function reason(value: string, at = now): string {
  const result = verifyToken(value, options, at);
  return result.ok ? 'ok' : result.reason;
}

describe('verifyToken', () => {
  it('accepts a valid token and returns its claims', () => {
    const result = verifyToken(token(), options, now);
    expect(result).toEqual({ ok: true, claims: claims() });
  });

  it('accepts a token signed by any configured key', () => {
    expect(reason(token({}, 'key2', otherSecret))).toBe('ok');
  });

  it('rejects an unknown key id', () => {
    expect(reason(token({}, 'key3'))).toBe('unknown_key');
  });

  it('rejects a token signed with the wrong secret', () => {
    expect(reason(token({}, 'key1', otherSecret))).toBe('bad_signature');
  });

  it('rejects a tampered payload even when the signature is intact', () => {
    const parts = token().split('.');
    const forged = Buffer.from(JSON.stringify(claims({ channels: ['*'] }))).toString('base64url');
    parts[2] = forged;
    expect(reason(parts.join('.'))).toBe('bad_signature');
  });

  it('rejects a tampered signature', () => {
    const value = token();
    const flipped = value.slice(0, -1) + (value.endsWith('A') ? 'B' : 'A');
    expect(reason(flipped)).toBe('bad_signature');
  });

  it('rejects malformed tokens', () => {
    const valid = token();
    const cases = [
      '',
      'garbage',
      'a.b.c',
      `${valid}.extra`,
      valid.replace(/^v1/, 'v2'),
      valid.slice(0, -5),
      `v1.bad kid.${valid.split('.')[2] ?? ''}.${valid.split('.')[3] ?? ''}`,
      'x'.repeat(5000),
    ];
    for (const value of cases) {
      expect(reason(value), value.slice(0, 20)).toBe('malformed');
    }
  });

  it('rejects correctly signed but invalid claims', () => {
    const payload = Buffer.from(JSON.stringify({ sub: 'user-1', extra: true })).toString(
      'base64url',
    );
    const signature = createHmac('sha256', secret).update(`v1.key1.${payload}`).digest('base64url');
    expect(reason(`v1.key1.${payload}.${signature}`)).toBe('invalid_claims');
    expect(reason(token({ exp: now }))).toBe('invalid_claims');
    expect(reason(token({ channels: ['bad channel'] }))).toBe('invalid_claims');
  });

  it('rejects another deployment', () => {
    expect(reason(token({ dep: 'other-deployment' }))).toBe('wrong_deployment');
  });

  it('rejects expired tokens but honors clock skew', () => {
    expect(reason(token(), now + 60 + 5)).toBe('ok');
    expect(reason(token(), now + 60 + 6)).toBe('expired');
  });

  it('rejects tokens issued in the future beyond the skew', () => {
    expect(reason(token(), now - 5)).toBe('ok');
    expect(reason(token(), now - 6)).toBe('not_yet_valid');
  });

  it('rejects tokens whose lifetime exceeds the maximum', () => {
    expect(reason(token({ exp: now + 300 }))).toBe('ok');
    expect(reason(token({ exp: now + 301 }))).toBe('lifetime_exceeded');
  });
});

describe('canAccessChannel', () => {
  it('matches exact names', () => {
    expect(canAccessChannel(['private.me'], 'private.me')).toBe(true);
    expect(canAccessChannel(['private.me'], 'private.me2')).toBe(false);
    expect(canAccessChannel(['private.me'], 'Private.me')).toBe(false);
  });

  it('matches prefix patterns only below the prefix', () => {
    expect(canAccessChannel(['orders.*'], 'orders.1')).toBe(true);
    expect(canAccessChannel(['orders.*'], 'orders.1.items')).toBe(true);
    expect(canAccessChannel(['orders.*'], 'orders')).toBe(false);
    expect(canAccessChannel(['orders.*'], 'orders.')).toBe(false);
    expect(canAccessChannel(['orders.*'], 'ordersX.1')).toBe(false);
  });

  it('denies everything for an empty scope', () => {
    expect(canAccessChannel([], 'orders.1')).toBe(false);
  });
});

describe('upgrade authentication over a real socket', () => {
  const cleanups: (() => Promise<void>)[] = [];
  const clients: WebSocket[] = [];

  afterEach(async () => {
    for (const client of clients.splice(0)) client.terminate();
    for (const cleanup of cleanups.splice(0)) await cleanup();
  });

  async function start(
    lines: string[] = [],
  ): Promise<{ base: string; connections: TransportConnection[] }> {
    const connections: TransportConnection[] = [];
    const sink = {
      write: (line: string): void => {
        lines.push(line);
      },
    };
    const log = createLogger('warn', sink);
    const transport = createWebSocketTransport(
      {
        path: '/ws',
        allowedOrigins: [],
        maxPayloadBytes: 1024,
        pingIntervalMs: 60_000,
        maxConnections: 10,
        maxBufferedBytes: 1_048_576,
        authenticate: createUpgradeAuthenticator(options, log, () => now),
      },
      {
        onConnection: (connection) => {
          connections.push(connection);
        },
        onMessage: () => undefined,
        onClose: () => undefined,
      },
      log,
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
    return { base: `127.0.0.1:${String(port)}`, connections };
  }

  function status(url: string): Promise<number> {
    const client = new WebSocket(url);
    clients.push(client);
    return new Promise<number>((resolve, reject) => {
      client.once('unexpected-response', (_request, response) => {
        resolve(response.statusCode ?? 0);
      });
      client.once('open', () => {
        reject(new Error('upgrade was accepted'));
      });
      client.once('error', () => undefined);
    });
  }

  async function waitFor(condition: () => boolean): Promise<void> {
    const started = Date.now();
    while (!condition()) {
      if (Date.now() - started > 2000) throw new Error('timeout');
      await new Promise((resolve) => setTimeout(resolve, 10));
    }
  }

  it('accepts a valid token and attaches the verified claims', async () => {
    const { base, connections } = await start();
    const client = new WebSocket(`ws://${base}/ws?v=1&token=${token()}`);
    clients.push(client);
    await waitFor(() => connections.length === 1);
    expect(connections[0]?.attachment).toEqual(claims());
  });

  it('rejects a missing, invalid or expired token with a generic 401', async () => {
    const { base } = await start();
    expect(await status(`ws://${base}/ws`)).toBe(401);
    expect(await status(`ws://${base}/ws?token=garbage`)).toBe(401);
    expect(await status(`ws://${base}/ws?token=${token({ exp: now - 100, iat: now - 160 })}`)).toBe(
      401,
    );
    expect(await status(`ws://${base}/ws?token=${token({ dep: 'other' })}`)).toBe(401);
  });

  it('never logs the token, secret or signature', async () => {
    const lines: string[] = [];
    const { base } = await start(lines);
    const bad = token({}, 'key1', otherSecret);
    await status(`ws://${base}/ws?token=${bad}`);
    const output = lines.join('');
    expect(output).toContain('bad_signature');
    expect(output).not.toContain(bad);
    expect(output).not.toContain(bad.split('.')[3] ?? 'missing');
    expect(output).not.toContain(secret);
    expect(output).not.toContain(otherSecret);
  });
});
