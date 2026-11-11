import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { z } from 'zod';
import { errorCodes, errorMessages, protocolCloseCodes } from './protocol-constants.js';
import type { ServerMessage } from './protocol-messages.js';
import { parseClientMessage } from './protocol-parser.js';
import {
  createConnectedMessage,
  createErrorMessage,
  serializeServerMessage,
} from './protocol-serializer.js';
import { createProtocolSession, negotiateVersion } from './protocol-session.js';

function loadFixture(name: string): unknown {
  const text = readFileSync(new URL(`./fixtures/${name}`, import.meta.url), 'utf8');
  const parsed: unknown = JSON.parse(text);
  return parsed;
}

const clientFixtures = z
  .object({
    valid: z.array(z.object({ name: z.string(), raw: z.string(), expected: z.unknown() })),
    invalid: z.array(
      z.object({
        name: z.string(),
        raw: z.string(),
        code: z.enum(errorCodes),
        id: z.string().optional(),
      }),
    ),
  })
  .parse(loadFixture('client-messages.json'));

const serverFixtures = z
  .object({
    cases: z.array(z.object({ name: z.string(), message: z.unknown(), serialized: z.string() })),
  })
  .parse(loadFixture('server-messages.json'));

const encode = (text: string): Uint8Array => new TextEncoder().encode(text);

describe('parseClientMessage fixtures', () => {
  for (const fixture of clientFixtures.valid) {
    it(`accepts: ${fixture.name}`, () => {
      const result = parseClientMessage(encode(fixture.raw), false);
      expect(result.ok).toBe(true);
      if (result.ok) expect(result.message).toEqual(fixture.expected);
    });
  }

  for (const fixture of clientFixtures.invalid) {
    it(`rejects: ${fixture.name}`, () => {
      const result = parseClientMessage(encode(fixture.raw), false);
      expect(result.ok).toBe(false);
      if (!result.ok && result.kind === 'error') {
        expect(result.code).toBe(fixture.code);
        expect(result.id).toBe(fixture.id);
      } else {
        expect.unreachable('expected an error result');
      }
    });
  }
});

describe('parseClientMessage edge cases', () => {
  it('closes with 4003 on a binary frame', () => {
    const result = parseClientMessage(new Uint8Array([1, 2, 3]), true);
    expect(result).toEqual({
      ok: false,
      kind: 'close',
      closeCode: protocolCloseCodes.unsupportedData,
    });
  });

  it('rejects invalid UTF-8', () => {
    const result = parseClientMessage(new Uint8Array([0xff, 0xfe, 0xfd]), false);
    expect(result).toMatchObject({ ok: false, kind: 'error', code: 'invalid_message' });
  });

  it('rejects an id that is too long and does not echo it', () => {
    const longId = 'x'.repeat(65);
    const result = parseClientMessage(encode(`{"type":"ping","id":"${longId}"}`), false);
    expect(result).toMatchObject({ ok: false, kind: 'error', code: 'invalid_message' });
    if (!result.ok && result.kind === 'error') expect(result.id).toBeUndefined();
  });

  it('rejects a channel longer than 128 characters', () => {
    const channel = 'a'.repeat(129);
    const result = parseClientMessage(encode(`{"type":"subscribe","channel":"${channel}"}`), false);
    expect(result).toMatchObject({ ok: false, kind: 'error', code: 'invalid_channel' });
  });

  it('accepts a channel of exactly 128 characters', () => {
    const channel = 'a'.repeat(128);
    const result = parseClientMessage(encode(`{"type":"subscribe","channel":"${channel}"}`), false);
    expect(result.ok).toBe(true);
  });
});

describe('serializer fixtures', () => {
  for (const fixture of serverFixtures.cases) {
    it(`serializes: ${fixture.name}`, () => {
      expect(serializeServerMessage(fixture.message as ServerMessage)).toBe(fixture.serialized);
    });
  }

  it('builds the fixed error text for every code and never echoes input', () => {
    for (const code of errorCodes) {
      const message = createErrorMessage(code, { id: 'c1' });
      expect(message).toMatchObject({
        type: 'error',
        error: { code, message: errorMessages[code] },
      });
    }
    const text = serializeServerMessage(createErrorMessage('invalid_channel', { id: 'c3' }));
    expect(text).toBe(
      '{"type":"error","error":{"code":"invalid_channel","message":"The channel name is not valid."},"id":"c3"}',
    );
  });

  it('builds the connected message', () => {
    expect(serializeServerMessage(createConnectedMessage('example-connection', 25_000))).toBe(
      '{"type":"connected","connectionId":"example-connection","heartbeatIntervalMs":25000}',
    );
  });
});

describe('protocol session flows', () => {
  it('answers ping with pong and echoes the id', () => {
    const outcome = createProtocolSession().handle(encode('{"type":"ping","id":"p1"}'), false);
    expect(outcome.replies).toEqual([{ type: 'pong', id: 'p1' }]);
    expect(outcome.close).toBeUndefined();
  });

  it('forwards a public subscribe to the channel layer', () => {
    const outcome = createProtocolSession().handle(
      encode('{"type":"subscribe","channel":"orders.updates","id":"c1"}'),
      false,
    );
    expect(outcome.replies).toEqual([]);
    expect(outcome.request).toEqual({ type: 'subscribe', channel: 'orders.updates', id: 'c1' });
  });

  it('forwards an unsubscribe to the channel layer', () => {
    const outcome = createProtocolSession().handle(
      encode('{"type":"unsubscribe","channel":"orders.updates"}'),
      false,
    );
    expect(outcome.request).toEqual({
      type: 'unsubscribe',
      channel: 'orders.updates',
      id: undefined,
    });
  });

  it('refuses private channels until authorization exists', () => {
    const outcome = createProtocolSession().handle(
      encode('{"type":"subscribe","channel":"private.orders","id":"c1"}'),
      false,
    );
    expect(outcome.request).toBeUndefined();
    expect(outcome.replies).toHaveLength(1);
    expect(outcome.replies[0]).toMatchObject({
      type: 'error',
      error: { code: 'forbidden' },
      id: 'c1',
      channel: 'private.orders',
    });
  });

  it('reports malformed input with an error and keeps the connection open', () => {
    const outcome = createProtocolSession().handle(encode('not json'), false);
    expect(outcome.replies).toHaveLength(1);
    expect(outcome.replies[0]).toMatchObject({ type: 'error', error: { code: 'invalid_message' } });
    expect(outcome.close).toBeUndefined();
  });

  it('closes with 4001 after 5 consecutive invalid messages', () => {
    const session = createProtocolSession();
    for (let attempt = 1; attempt <= 4; attempt += 1) {
      expect(session.handle(encode('nope'), false).close).toBeUndefined();
    }
    const fifth = session.handle(encode('nope'), false);
    expect(fifth.close).toEqual({
      code: protocolCloseCodes.protocolViolation,
      reason: 'protocol violation',
    });
    expect(fifth.replies).toHaveLength(1);
  });

  it('resets the invalid-message count after a valid message', () => {
    const session = createProtocolSession();
    for (let attempt = 0; attempt < 4; attempt += 1) session.handle(encode('nope'), false);
    session.handle(encode('{"type":"ping"}'), false);
    for (let attempt = 0; attempt < 4; attempt += 1) {
      expect(session.handle(encode('nope'), false).close).toBeUndefined();
    }
  });

  it('does not count unknown types or invalid channels as strikes', () => {
    const session = createProtocolSession();
    for (let attempt = 0; attempt < 10; attempt += 1) {
      expect(session.handle(encode('{"type":"publish"}'), false).close).toBeUndefined();
      expect(
        session.handle(encode('{"type":"subscribe","channel":"bad channel"}'), false).close,
      ).toBeUndefined();
    }
  });

  it('closes immediately with 4003 on a binary frame', () => {
    const outcome = createProtocolSession().handle(new Uint8Array([1]), true);
    expect(outcome.close?.code).toBe(protocolCloseCodes.unsupportedData);
    expect(outcome.replies).toEqual([]);
  });
});

describe('version negotiation', () => {
  it('accepts v=1', () => {
    expect(negotiateVersion('?v=1')).toEqual({ ok: true, version: 1 });
    expect(negotiateVersion('v=1&x=2')).toEqual({ ok: true, version: 1 });
  });

  for (const query of ['', '?', '?v=2', '?v=0', '?v=abc', '?v=1.0', '?v=', '?v=-1', '?x=1']) {
    it(`rejects ${JSON.stringify(query)} with an in-band error and close 4002`, () => {
      const result = negotiateVersion(query);
      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.outcome.close?.code).toBe(protocolCloseCodes.unsupportedVersion);
        expect(result.outcome.replies[0]).toMatchObject({
          type: 'error',
          error: { code: 'unsupported_version' },
          supportedVersions: [1],
        });
      }
    });
  }
});
