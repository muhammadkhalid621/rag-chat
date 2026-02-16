const { app } = require('./app');
const { config } = require('./config/env');
const { logger } = require('./config/logger');
const { migrate } = require('./db/migrate');
const { pool } = require('./db/pool');

async function bootstrap() {
  await migrate();

  const server = app.listen(config.port, () => {
    logger.info({ port: config.port, env: config.env }, 'Server started');
  });

  const shutdown = async () => {
    logger.info('Graceful shutdown started');
    server.close(async () => {
      await pool.end();
      process.exit(0);
    });
  };

  process.on('SIGINT', shutdown);
  process.on('SIGTERM', shutdown);
}

bootstrap().catch((error) => {
  logger.error({ err: error }, 'Failed to start server');
  process.exit(1);
});
