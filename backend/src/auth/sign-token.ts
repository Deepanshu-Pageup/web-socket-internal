import { tokenFormatVersion, type TokenClaims } from './token-claims.js';
import { computeSignature } from './token-verifier.js';

/**
 * Reference signer for tests and documentation. The realtime server never issues
 * tokens; consuming backends sign them following
 * docs/auth/token-and-authorization-specification.md.
 */
export function signToken(input: {
  readonly kid: string;
  readonly secret: string;
  readonly claims: TokenClaims;
}): string {
  const payload = Buffer.from(JSON.stringify(input.claims), 'utf8').toString('base64url');
  const signature = computeSignature(input.secret, input.kid, payload);
  return `${tokenFormatVersion}.${input.kid}.${payload}.${signature}`;
}
