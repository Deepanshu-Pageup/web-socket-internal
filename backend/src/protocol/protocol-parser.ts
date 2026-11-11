import {
  clientMessageTypes,
  protocolCloseCodes,
  type ClientMessageType,
  type ErrorCode,
} from './protocol-constants.js';
import { clientMessageSchema, isValidRequestId, type ClientMessage } from './protocol-messages.js';

export type ParseResult =
  | { readonly ok: true; readonly message: ClientMessage }
  | {
      readonly ok: false;
      readonly kind: 'error';
      readonly code: Extract<ErrorCode, 'invalid_message' | 'unknown_type' | 'invalid_channel'>;
      readonly id?: string | undefined;
      readonly channel?: string | undefined;
    }
  | { readonly ok: false; readonly kind: 'close'; readonly closeCode: number };

const decoder = new TextDecoder('utf-8', { fatal: true });

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function isClientMessageType(value: string): value is ClientMessageType {
  return (clientMessageTypes as readonly string[]).includes(value);
}

/**
 * Parses one inbound WebSocket frame. Never throws on bad input: every failure
 * is returned as data. The `id` echoed in a failure is only ever a value that
 * passed id validation; other client input is never reflected.
 */
export function parseClientMessage(data: Uint8Array, isBinary: boolean): ParseResult {
  if (isBinary) {
    return { ok: false, kind: 'close', closeCode: protocolCloseCodes.unsupportedData };
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(decoder.decode(data));
  } catch {
    return { ok: false, kind: 'error', code: 'invalid_message' };
  }

  if (!isRecord(parsed) || typeof parsed['type'] !== 'string') {
    return { ok: false, kind: 'error', code: 'invalid_message' };
  }

  const id = isValidRequestId(parsed['id']) ? parsed['id'] : undefined;

  if (!isClientMessageType(parsed['type'])) {
    return { ok: false, kind: 'error', code: 'unknown_type', id };
  }

  const result = clientMessageSchema.safeParse(parsed);
  if (result.success) {
    return { ok: true, message: result.data };
  }

  const channelIssue = result.error.issues.some((issue) => issue.path[0] === 'channel');
  if (channelIssue && typeof parsed['channel'] === 'string') {
    return { ok: false, kind: 'error', code: 'invalid_channel', id };
  }
  return { ok: false, kind: 'error', code: 'invalid_message', id };
}
