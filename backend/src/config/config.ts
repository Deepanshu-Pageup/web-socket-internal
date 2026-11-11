import { z } from 'zod';
import { keyIdRegex } from '../auth/token-claims.js';

const logLevels = ['fatal', 'error', 'warn', 'info', 'debug', 'trace', 'silent'] as const;

/** `kid:secret` pairs, comma separated. Secrets must be at least 32 characters. */
const authKeysSchema = z.string().transform((value, ctx) => {
  const keys = new Map<string, string>();
  for (const entry of value.split(',')) {
    const trimmed = entry.trim();
    if (trimmed.length === 0) continue;
    const separator = trimmed.indexOf(':');
    const kid = separator < 0 ? '' : trimmed.slice(0, separator);
    const secret = separator < 0 ? '' : trimmed.slice(separator + 1);
    if (!keyIdRegex.test(kid) || secret.length < 32 || /\s/.test(secret) || keys.has(kid)) {
      ctx.addIssue({ code: 'custom', message: 'invalid key entry' });
      return z.NEVER;
    }
    keys.set(kid, secret);
  }
  if (keys.size === 0) {
    ctx.addIssue({ code: 'custom', message: 'at least one key is required' });
    return z.NEVER;
  }
  return keys;
});

const configSchema = z.object({
  AUTH_TOKEN_KEYS: authKeysSchema,
  AUTH_DEPLOYMENT_ID: z.string().regex(/^[A-Za-z0-9._-]{1,64}$/),
  AUTH_TOKEN_MAX_LIFETIME_S: z.coerce.number().int().min(1).max(86_400).default(300),
  AUTH_CLOCK_SKEW_S: z.coerce.number().int().min(0).max(60).default(5),
  HOST: z.string().min(1).default('0.0.0.0'),
  PORT: z.coerce.number().int().min(1).max(65535).default(6001),
  LOG_LEVEL: z.enum(logLevels).default('info'),
  ALLOWED_ORIGINS: z
    .string()
    .default('')
    .transform((value) =>
      value
        .split(',')
        .map((origin) => origin.trim())
        .filter((origin) => origin.length > 0),
    ),
  SHUTDOWN_TIMEOUT_MS: z.coerce.number().int().min(0).max(120_000).default(10_000),
  WS_PATH: z
    .string()
    .regex(/^\/[A-Za-z0-9._~/-]*$/)
    .refine((value) => value !== '/health' && value !== '/ready')
    .default('/ws'),
  WS_MAX_PAYLOAD_BYTES: z.coerce.number().int().min(1).max(16_777_216).default(65_536),
  WS_PING_INTERVAL_MS: z.coerce.number().int().min(10).max(300_000).default(30_000),
  WS_MAX_CONNECTIONS: z.coerce.number().int().min(1).max(1_000_000).default(10_000),
  WS_MAX_BUFFERED_BYTES: z.coerce.number().int().min(1).max(268_435_456).default(1_048_576),
});

export type Config = Readonly<{
  authKeys: ReadonlyMap<string, string>;
  authDeploymentId: string;
  authMaxLifetimeSeconds: number;
  authClockSkewSeconds: number;
  host: string;
  port: number;
  logLevel: (typeof logLevels)[number];
  allowedOrigins: readonly string[];
  shutdownTimeoutMs: number;
  wsPath: string;
  wsMaxPayloadBytes: number;
  wsPingIntervalMs: number;
  wsMaxConnections: number;
  wsMaxBufferedBytes: number;
}>;

export class ConfigError extends Error {
  readonly invalidKeys: readonly string[];

  constructor(invalidKeys: readonly string[]) {
    super(`Invalid configuration for: ${invalidKeys.join(', ')}`);
    this.name = 'ConfigError';
    this.invalidKeys = invalidKeys;
  }
}

/**
 * Validates environment input. Errors name the offending keys only; values
 * (which may be sensitive) are never included.
 */
export function loadConfig(env: Readonly<Record<string, string | undefined>>): Config {
  const result = configSchema.safeParse(env);
  if (!result.success) {
    const keys = new Set<string>();
    for (const issue of result.error.issues) {
      keys.add(String(issue.path[0] ?? 'unknown'));
    }
    throw new ConfigError([...keys]);
  }
  const data = result.data;
  return {
    authKeys: data.AUTH_TOKEN_KEYS,
    authDeploymentId: data.AUTH_DEPLOYMENT_ID,
    authMaxLifetimeSeconds: data.AUTH_TOKEN_MAX_LIFETIME_S,
    authClockSkewSeconds: data.AUTH_CLOCK_SKEW_S,
    host: data.HOST,
    port: data.PORT,
    logLevel: data.LOG_LEVEL,
    allowedOrigins: data.ALLOWED_ORIGINS,
    shutdownTimeoutMs: data.SHUTDOWN_TIMEOUT_MS,
    wsPath: data.WS_PATH,
    wsMaxPayloadBytes: data.WS_MAX_PAYLOAD_BYTES,
    wsPingIntervalMs: data.WS_PING_INTERVAL_MS,
    wsMaxConnections: data.WS_MAX_CONNECTIONS,
    wsMaxBufferedBytes: data.WS_MAX_BUFFERED_BYTES,
  };
}
