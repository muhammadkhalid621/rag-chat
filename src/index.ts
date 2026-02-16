import { app } from './app';
import { config } from './config/env';
import { logger } from './config/logger';
import { migrate } from './db/migrate';
import { pool } from './db/pool';

async function bootstrap(): Promise<void> {
  await migrate();

  const server = app.listen(config.port, () => {
    logger.info({ port: config.port, env: config.env }, 'Server started');
  });

  const shutdown = async (): Promise<void> => {
    logger.info('Graceful shutdown started');
    server.close(async () => {
      await pool.end();
      process.exit(0);
    });
  };

  process.on('SIGINT', () => {
    void shutdown();
  });
  process.on('SIGTERM', () => {
    void shutdown();
  });
}

void bootstrap().catch((error: unknown) => {
  logger.error({ err: error }, 'Failed to start server');
  process.exit(1);
});
