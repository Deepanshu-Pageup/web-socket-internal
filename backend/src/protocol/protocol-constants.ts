/**
 * Protocol v1 constants. Source of truth: docs/protocol/protocol-specification.md.
 * This module is pure data; it never touches sockets or channel state.
 */

export const PROTOCOL_VERSION = 1;
export const supportedVersions: readonly number[] = [1];

export const clientMessageTypes = ['subscribe', 'unsubscribe', 'ping'] as const;
export type ClientMessageType = (typeof clientMessageTypes)[number];

export const errorCodes = [
  'invalid_message',
  'unknown_type',
  'unsupported_version',
  'invalid_channel',
  'subscription_limit',
  'forbidden',
  'internal_error',
] as const;
export type ErrorCode = (typeof errorCodes)[number];

/** Fixed text per code. Never echoes client input, payloads or tokens. */
export const errorMessages: Readonly<Record<ErrorCode, string>> = {
  invalid_message: 'The message is not valid.',
  unknown_type: 'The message type is not supported.',
  unsupported_version: 'The protocol version is not supported.',
  invalid_channel: 'The channel name is not valid.',
  subscription_limit: 'The subscription limit has been reached.',
  forbidden: 'Access to this channel is not permitted.',
  internal_error: 'An internal error occurred.',
};

/** Application close codes (4000-4999). Transport codes live in the transport module. */
export const protocolCloseCodes = {
  protocolViolation: 4001,
  unsupportedVersion: 4002,
  unsupportedData: 4003,
} as const;

export const limits = {
  maxIdLength: 64,
  maxChannelLength: 128,
  maxEventLength: 64,
  maxConsecutiveInvalidMessages: 5,
  /** Enforced by the channel layer (Phase 05); defined here as the protocol's value. */
  maxSubscriptionsPerConnection: 100,
} as const;

export const channelNamePattern = /^[A-Za-z0-9][A-Za-z0-9._:-]{0,127}$/;
export const eventNamePattern = /^[A-Za-z0-9][A-Za-z0-9._-]{0,63}$/;

/** Placeholder convention pending ADR-0021. */
export const privateChannelPrefix = 'private.';

export function isPrivateChannel(channel: string): boolean {
  return channel.startsWith(privateChannelPrefix);
}
