import { describe, expect, it } from 'vitest';
import { ConfigError, loadConfig } from './config.js';

const validEnv = {};

describe('loadConfig', () => {
  it('applies defaults', () => {
    const config = loadConfig(validEnv);
    expect(config.port).toBe(6001);
    expect(config.host).toBe('0.0.0.0');
    expect(config.logLevel).toBe('info');
    expect(config.allowedOrigins).toEqual([]);
  });

  it('parses overrides and origin lists', () => {
    const config = loadConfig({
      ...validEnv,
      PORT: '7000',
      LOG_LEVEL: 'debug',
      ALLOWED_ORIGINS: 'https://a.example, https://b.example',
    });
    expect(config.port).toBe(7000);
    expect(config.logLevel).toBe('debug');
    expect(config.allowedOrigins).toEqual(['https://a.example', 'https://b.example']);
  });

  it('rejects an invalid port', () => {
    expect(() => loadConfig({ ...validEnv, PORT: '70000' })).toThrow(ConfigError);
  });

  it('never includes values in the error message', () => {
    const invalidValue = 'not-a-number-value';
    try {
      loadConfig({ ...validEnv, PORT: invalidValue });
      expect.unreachable();
    } catch (error) {
      expect(error).toBeInstanceOf(ConfigError);
      const message = (error as ConfigError).message;
      expect(message).toContain('PORT');
      expect(message).not.toContain(invalidValue);
    }
  });
});
