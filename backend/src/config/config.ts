import { z } from 'zod';

const logLevels = ['fatal', 'error', 'warn', 'info', 'debug', 'trace', 'silent'] as const;

const configSchema = z.object({
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
