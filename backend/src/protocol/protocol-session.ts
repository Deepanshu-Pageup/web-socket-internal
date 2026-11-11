import {
  isPrivateChannel,
  limits,
  protocolCloseCodes,
  supportedVersions,
} from './protocol-constants.js';
import type { ServerMessage } from './protocol-messages.js';
import { parseClientMessage } from './protocol-parser.js';
import { createErrorMessage } from './protocol-serializer.js';

export interface CloseInstruction {
  readonly code: number;
  readonly reason: string;
}

/** A valid request the channel layer (Phase 05) must act on. */
export interface ChannelRequest {
  readonly type: 'subscribe' | 'unsubscribe';
  readonly channel: string;
  readonly id?: string | undefined;
}

export interface SessionOutcome {
  readonly replies: readonly ServerMessage[];
  readonly close?: CloseInstruction;
  readonly request?: ChannelRequest;
}

export interface ProtocolSession {
  handle(data: Uint8Array, isBinary: boolean): SessionOutcome;
}

/**
 * Per-connection protocol state: only the consecutive-invalid-message counter.
 * Holds no channel state and never touches a socket; it returns what the caller
 * should send, close, or forward to the channel layer.
 */
export function createProtocolSession(): ProtocolSession {
  let consecutiveInvalid = 0;

  return {
    handle(data, isBinary): SessionOutcome {
      const result = parseClientMessage(data, isBinary);

      if (!result.ok) {
        if (result.kind === 'close') {
          return {
            replies: [],
            close: { code: result.closeCode, reason: 'unsupported data' },
          };
        }
        const reply = createErrorMessage(result.code, { id: result.id });
        if (result.code === 'invalid_message') {
          consecutiveInvalid += 1;
          if (consecutiveInvalid >= limits.maxConsecutiveInvalidMessages) {
            return {
              replies: [reply],
              close: { code: protocolCloseCodes.protocolViolation, reason: 'protocol violation' },
            };
          }
        }
        return { replies: [reply] };
      }

      consecutiveInvalid = 0;
      const message = result.message;

      switch (message.type) {
        case 'ping':
          return { replies: [{ type: 'pong', id: message.id }] };
        case 'unsubscribe':
          return {
            replies: [],
            request: { type: 'unsubscribe', channel: message.channel, id: message.id },
          };
        case 'subscribe':
          // Private channels need an authorization design (ADR-0020, Phase 06).
          if (isPrivateChannel(message.channel)) {
            return {
              replies: [
                createErrorMessage('forbidden', { id: message.id, channel: message.channel }),
              ],
            };
          }
          return {
            replies: [],
            request: { type: 'subscribe', channel: message.channel, id: message.id },
          };
      }
    },
  };
}

/**
 * Validates the `v` query parameter of the upgrade URL. On failure the
 * outcome carries the in-band error and the close instruction (4002).
 */
export function negotiateVersion(
  query: string,
):
  | { readonly ok: true; readonly version: number }
  | { readonly ok: false; readonly outcome: SessionOutcome } {
  const raw = new URLSearchParams(query).get('v');
  if (raw !== null && /^[0-9]{1,6}$/.test(raw)) {
    const version = Number(raw);
    if (supportedVersions.includes(version)) {
      return { ok: true, version };
    }
  }
  return {
    ok: false,
    outcome: {
      replies: [createErrorMessage('unsupported_version')],
      close: { code: protocolCloseCodes.unsupportedVersion, reason: 'unsupported version' },
    },
  };
}
