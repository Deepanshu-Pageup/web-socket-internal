import { z } from 'zod';
import { channelNamePattern, limits, type ErrorCode } from './protocol-constants.js';

const idSchema = z.string().min(1).max(limits.maxIdLength);
const channelSchema = z.string().regex(channelNamePattern);

/** Strict objects: unknown fields are rejected, not ignored. */
export const subscribeSchema = z.strictObject({
  type: z.literal('subscribe'),
  channel: channelSchema,
  id: idSchema.optional(),
});

export const unsubscribeSchema = z.strictObject({
  type: z.literal('unsubscribe'),
  channel: channelSchema,
  id: idSchema.optional(),
});

export const pingSchema = z.strictObject({
  type: z.literal('ping'),
  id: idSchema.optional(),
});

export const clientMessageSchema = z.discriminatedUnion('type', [
  subscribeSchema,
  unsubscribeSchema,
  pingSchema,
]);

export type ClientMessage = z.infer<typeof clientMessageSchema>;

export function isValidRequestId(value: unknown): value is string {
  return idSchema.safeParse(value).success;
}

export interface ProtocolErrorBody {
  readonly code: ErrorCode;
  readonly message: string;
}

export type ServerMessage =
  | {
      readonly type: 'connected';
      readonly connectionId: string;
      readonly heartbeatIntervalMs: number;
    }
  | { readonly type: 'subscribed'; readonly channel: string; readonly id?: string | undefined }
  | { readonly type: 'unsubscribed'; readonly channel: string; readonly id?: string | undefined }
  | {
      readonly type: 'event';
      readonly channel: string;
      readonly event: string;
      readonly data: unknown;
    }
  | { readonly type: 'pong'; readonly id?: string | undefined }
  | {
      readonly type: 'error';
      readonly error: ProtocolErrorBody;
      readonly id?: string | undefined;
      readonly channel?: string | undefined;
      readonly supportedVersions?: readonly number[] | undefined;
    };
