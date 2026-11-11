import { Writable } from 'node:stream';
import { describe, expect, it } from 'vitest';
import { createLogger } from './logger.js';

function capture(): { stream: Writable; lines: () => string[] } {
  const chunks: string[] = [];
  const stream = new Writable({
    write(chunk: Buffer, _encoding, callback) {
      chunks.push(chunk.toString());
      callback();
    },
  });
  return { stream, lines: () => chunks };
}

describe('createLogger', () => {
  it('redacts secrets, signatures and payloads', () => {
    const { stream, lines } = capture();
    const logger = createLogger('info', stream);
    logger.info(
      { secret: 'secret-value', signature: 'sig-value', payload: 'payload-value' },
      'test',
    );
    const output = lines().join('');
    expect(output).toContain('[REDACTED]');
    expect(output).not.toContain('secret-value');
    expect(output).not.toContain('sig-value');
    expect(output).not.toContain('payload-value');
  });

  it('respects the configured level', () => {
    const { stream, lines } = capture();
    const logger = createLogger('warn', stream);
    logger.info('hidden');
    logger.warn('shown');
    const output = lines().join('');
    expect(output).not.toContain('hidden');
    expect(output).toContain('shown');
  });
});
