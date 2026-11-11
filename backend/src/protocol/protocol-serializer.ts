import { errorMessages, supportedVersions, type ErrorCode } from './protocol-constants.js';
import type { ServerMessage } from './protocol-messages.js';

/** Serializes a server message to a JSON text frame. Undefined fields are omitted. */
export function serializeServerMessage(message: ServerMessage): string {
  return JSON.stringify(message);
}

export function createErrorMessage(
  code: ErrorCode,
  context: { readonly id?: string | undefined; readonly channel?: string | undefined } = {},
): ServerMessage {
  return {
    type: 'error',
    error: { code, message: errorMessages[code] },
    id: context.id,
    channel: context.channel,
    supportedVersions: code === 'unsupported_version' ? supportedVersions : undefined,
  };
}

export function createConnectedMessage(
  connectionId: string,
  heartbeatIntervalMs: number,
): ServerMessage {
  return { type: 'connected', connectionId, heartbeatIntervalMs };
}
