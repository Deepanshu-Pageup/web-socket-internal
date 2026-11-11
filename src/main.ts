import { ConfigError, loadConfig } from './config/config.js';
import { createHttpServer } from './http/http-server.js';
import { createLogger } from './logging/logger.js';

function main(): void {
  let config;
  try {
    config = loadConfig(process.env);
  } catch (error) {
    if (error instanceof ConfigError) {
      // Names invalid keys only; never prints values.
      console.error(error.message);
    } else {
      console.error('Failed to load configuration');
    }
    process.exit(1);
  }

  const logger = createLogger(config.logLevel);
  let ready = false;
  const server = createHttpServer(() => ready);

  server.listen(config.port, config.host, () => {
    ready = true;
    logger.info({ host: config.host, port: config.port }, 'server listening');
  });

  let shuttingDown = false;
  const shutdown = (signal: string): void => {
    if (shuttingDown) return;
    shuttingDown = true;
    ready = false;
    logger.info({ signal }, 'shutdown started');
    const timer = setTimeout(() => {
      logger.error('shutdown timed out; forcing exit');
      process.exit(1);
    }, config.shutdownTimeoutMs);
    timer.unref();
    server.close((error) => {
      if (error) {
        logger.error('error while closing server');
        process.exit(1);
      }
      logger.info('shutdown complete');
      process.exit(0);
    });
    server.closeAllConnections();
  };

  process.on('SIGTERM', () => {
    shutdown('SIGTERM');
  });
  process.on('SIGINT', () => {
    shutdown('SIGINT');
  });
}

main();
