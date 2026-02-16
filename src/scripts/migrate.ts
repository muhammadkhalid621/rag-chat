import { logger } from '../config/logger';
import { migrate } from '../db/migrate';
import { pool } from '../db/pool';

const MAX_RETRIES = 10;
const RETRY_DELAY_MS = 2000;

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function run(): Promise<void> {
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

void run();
