const { migrate } = require('../db/migrate');
const { pool } = require('../db/pool');
const { logger } = require('../config/logger');

const MAX_RETRIES = 10;
const RETRY_DELAY_MS = 2000;

async function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function run() {
  let attempt = 0;

  while (attempt < MAX_RETRIES) {
    try {
      attempt += 1;
      await migrate();
      logger.info({ attempt }, 'Database migration completed');
      await pool.end();
      process.exit(0);
    } catch (error) {
      logger.error({ err: error, attempt }, 'Database migration failed');
      if (attempt >= MAX_RETRIES) {
        await pool.end();
        process.exit(1);
      }
      await sleep(RETRY_DELAY_MS);
    }
  }
}

run();
