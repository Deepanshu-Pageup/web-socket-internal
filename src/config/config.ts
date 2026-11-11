import { z } from 'zod';

const logLevels = ['fatal', 'error', 'warn', 'info', 'debug', 'trace', 'silent'] as const;

const configSchema = z.object({
  APP_ID: z.string().min(1),
  APP_KEY: z.string().min(1),
  APP_SECRET: z.string().min(16),
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
});

export type Config = Readonly<{
  appId: string;
  appKey: string;
  appSecret: string;
  host: string;
  port: number;
  logLevel: (typeof logLevels)[number];
  allowedOrigins: readonly string[];
  shutdownTimeoutMs: number;
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
 * (which may include the application secret) are never included.
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
    appId: data.APP_ID,
    appKey: data.APP_KEY,
    appSecret: data.APP_SECRET,
    host: data.HOST,
    port: data.PORT,
    logLevel: data.LOG_LEVEL,
    allowedOrigins: data.ALLOWED_ORIGINS,
    shutdownTimeoutMs: data.SHUTDOWN_TIMEOUT_MS,
  };
}
