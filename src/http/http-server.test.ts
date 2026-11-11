import type { AddressInfo } from 'node:net';
import { afterEach, describe, expect, it } from 'vitest';
import { createHttpServer } from './http-server.js';

let closeServer: (() => Promise<void>) | undefined;

async function start(ready: boolean): Promise<string> {
  const server = createHttpServer(() => ready);
  await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', resolve));
  closeServer = () =>
    new Promise<void>((resolve, reject) => {
      server.close((error) => {
        if (error) reject(error);
        else resolve();
      });
    });
  const { port } = server.address() as AddressInfo;
  return `http://127.0.0.1:${String(port)}`;
}

afterEach(async () => {
  await closeServer?.();
  closeServer = undefined;
});

describe('http server', () => {
  it('reports liveness', async () => {
    const base = await start(true);
    const response = await fetch(`${base}/health`);
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ status: 'ok' });
  });

  it('reports ready', async () => {
    const base = await start(true);
    const response = await fetch(`${base}/ready`);
    expect(response.status).toBe(200);
  });

  it('reports not ready with 503', async () => {
    const base = await start(false);
    const response = await fetch(`${base}/ready`);
    expect(response.status).toBe(503);
  });

  it('returns 404 for unknown paths', async () => {
    const base = await start(true);
    expect((await fetch(`${base}/nope`)).status).toBe(404);
  });

  it('rejects non-GET methods', async () => {
    const base = await start(true);
    expect((await fetch(`${base}/health`, { method: 'POST' })).status).toBe(405);
  });
});
