import { describe, expect, it } from 'vitest';
import { ConfigError, loadConfig } from './config.js';

const validEnv = {
  AUTH_TOKEN_KEYS: 'key1:example-placeholder-secret-0123456789abcdef',
  AUTH_DEPLOYMENT_ID: 'example-deployment',
};

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

  it('applies WebSocket transport defaults', () => {
    const config = loadConfig(validEnv);
    expect(config.wsPath).toBe('/ws');
    expect(config.wsMaxPayloadBytes).toBe(65_536);
    expect(config.wsPingIntervalMs).toBe(30_000);
    expect(config.wsMaxConnections).toBe(10_000);
    expect(config.wsMaxBufferedBytes).toBe(1_048_576);
  });

  it('rejects invalid WebSocket transport settings', () => {
    expect(() => loadConfig({ ...validEnv, WS_PATH: 'ws' })).toThrow(ConfigError);
    expect(() => loadConfig({ ...validEnv, WS_PATH: '/health' })).toThrow(ConfigError);
    expect(() => loadConfig({ ...validEnv, WS_MAX_PAYLOAD_BYTES: '0' })).toThrow(ConfigError);
    expect(() => loadConfig({ ...validEnv, WS_MAX_CONNECTIONS: '0' })).toThrow(ConfigError);
  });

  it('requires the authentication settings', () => {
    expect(() => loadConfig({})).toThrow(ConfigError);
    expect(() => loadConfig({ AUTH_DEPLOYMENT_ID: 'example-deployment' })).toThrow(ConfigError);
    expect(() => loadConfig({ AUTH_TOKEN_KEYS: validEnv.AUTH_TOKEN_KEYS })).toThrow(ConfigError);
  });

  it('parses authentication settings and defaults', () => {
    const config = loadConfig({
      ...validEnv,
      AUTH_TOKEN_KEYS:
        'a:example-placeholder-secret-0123456789abcdef, b:example-placeholder-secret-fedcba9876543210',
    });
    expect([...config.authKeys.keys()]).toEqual(['a', 'b']);
    expect(config.authDeploymentId).toBe('example-deployment');
    expect(config.authMaxLifetimeSeconds).toBe(300);
    expect(config.authClockSkewSeconds).toBe(5);
  });

  it('rejects invalid authentication keys without revealing them', () => {
    const shortSecret = 'too-short-secret';
    const cases = [
      `key1:${shortSecret}`,
      'bad kid:example-placeholder-secret-0123456789abcdef',
      'nocolon',
      '',
      'a:example-placeholder-secret-0123456789abcdef,a:example-placeholder-secret-fedcba9876543210',
    ];
    for (const AUTH_TOKEN_KEYS of cases) {
      try {
        loadConfig({ ...validEnv, AUTH_TOKEN_KEYS });
        expect.unreachable();
      } catch (error) {
        expect(error).toBeInstanceOf(ConfigError);
        const message = (error as ConfigError).message;
        expect(message).toContain('AUTH_TOKEN_KEYS');
        expect(message).not.toContain(shortSecret);
      }
    }
  });

  it('rejects an invalid deployment id', () => {
    expect(() => loadConfig({ ...validEnv, AUTH_DEPLOYMENT_ID: 'has space' })).toThrow(ConfigError);
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
