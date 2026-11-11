import { pino, type DestinationStream, type Logger } from 'pino';

export type { Logger };

/** Paths whose values must never appear in logs. */
export const redactPaths: readonly string[] = [
  'secret',
  'signature',
  'auth',
  'authorization',
  'payload',
  'data',
  '*.secret',
  '*.signature',
  '*.auth',
  '*.authorization',
  '*.payload',
  '*.data',
  'req.headers.authorization',
  'req.headers.cookie',
];

export function createLogger(level: string, destination?: DestinationStream): Logger {
  return pino(
    {
      level,
      redact: { paths: [...redactPaths], censor: '[REDACTED]' },
    },
    destination,
  );
}
