import type { Logger } from '../logging/logger.js';
import type { UpgradeAuthenticator } from '../transport/transport-types.js';
import { verifyToken, type TokenVerifierOptions } from './token-verifier.js';

/**
 * Adapts token verification to the transport's upgrade hook. The token is read
 * from the `token` query parameter. The client only ever sees a generic 401;
 * the failure category is logged, never the token or request URL.
 */
export function createUpgradeAuthenticator(
  options: TokenVerifierOptions,
  log: Logger,
  now: () => number = () => Math.floor(Date.now() / 1000),
): UpgradeAuthenticator {
  return (request) => {
    const token = new URLSearchParams(request.query).get('token') ?? '';
    const result = verifyToken(token, options, now());
    if (!result.ok) {
      log.warn({ reason: result.reason }, 'connection token rejected');
      return { allow: false, status: 401 };
    }
    return { allow: true, attachment: result.claims };
  };
}
