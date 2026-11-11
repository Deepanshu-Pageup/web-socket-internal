import { createHmac, timingSafeEqual } from 'node:crypto';
import {
  keyIdRegex,
  maxTokenLength,
  tokenClaimsSchema,
  tokenFormatVersion,
  type TokenClaims,
} from './token-claims.js';

export interface TokenVerifierOptions {
  /** Key id to shared secret. */
  readonly keys: ReadonlyMap<string, string>;
  readonly deploymentId: string;
  readonly maxLifetimeSeconds: number;
  readonly clockSkewSeconds: number;
}

/** Categories for logs and metrics only; never sent to the client. */
export type VerifyFailureReason =
  | 'malformed'
  | 'unknown_key'
  | 'bad_signature'
  | 'invalid_claims'
  | 'wrong_deployment'
  | 'expired'
  | 'not_yet_valid'
  | 'lifetime_exceeded';

export type VerifyResult =
  | { readonly ok: true; readonly claims: TokenClaims }
  | { readonly ok: false; readonly reason: VerifyFailureReason };

const base64urlRegex = /^[A-Za-z0-9_-]+$/;
const signatureLength = 43; // 32 bytes, base64url without padding

export function computeSignature(secret: string, kid: string, payload: string): string {
  return createHmac('sha256', secret)
    .update(`${tokenFormatVersion}.${kid}.${payload}`)
    .digest('base64url');
}

function fail(reason: VerifyFailureReason): VerifyResult {
  return { ok: false, reason };
}

function signaturesMatch(expected: string, received: string): boolean {
  const expectedBytes = Buffer.from(expected, 'utf8');
  const receivedBytes = Buffer.from(received, 'utf8');
  return (
    expectedBytes.length === receivedBytes.length && timingSafeEqual(expectedBytes, receivedBytes)
  );
}

/**
 * Verifies a connection token. The signature is checked before the payload is
 * parsed. Never throws on bad input and never includes token data in results.
 */
export function verifyToken(
  token: string,
  options: TokenVerifierOptions,
  nowSeconds: number,
): VerifyResult {
  if (token.length === 0 || token.length > maxTokenLength) return fail('malformed');

  const parts = token.split('.');
  const [version, kid, payload, signature] = parts;
  if (
    parts.length !== 4 ||
    version !== tokenFormatVersion ||
    kid === undefined ||
    payload === undefined ||
    signature === undefined ||
    !keyIdRegex.test(kid) ||
    !base64urlRegex.test(payload) ||
    signature.length !== signatureLength ||
    !base64urlRegex.test(signature)
  ) {
    return fail('malformed');
  }

  const secret = options.keys.get(kid);
  if (secret === undefined) return fail('unknown_key');

  if (!signaturesMatch(computeSignature(secret, kid, payload), signature)) {
    return fail('bad_signature');
  }

  let json: unknown;
  try {
    json = JSON.parse(Buffer.from(payload, 'base64url').toString('utf8'));
  } catch {
    return fail('invalid_claims');
  }
  const parsed = tokenClaimsSchema.safeParse(json);
  if (!parsed.success || parsed.data.exp <= parsed.data.iat) return fail('invalid_claims');
  const claims = parsed.data;

  if (claims.dep !== options.deploymentId) return fail('wrong_deployment');
  if (nowSeconds > claims.exp + options.clockSkewSeconds) return fail('expired');
  if (claims.iat > nowSeconds + options.clockSkewSeconds) return fail('not_yet_valid');
  if (claims.exp - claims.iat > options.maxLifetimeSeconds) return fail('lifetime_exceeded');

  return { ok: true, claims };
}
