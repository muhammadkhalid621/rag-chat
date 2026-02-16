import pino from 'pino';
import { config } from './env';

export const logger = pino({
  level: config.logLevel,
  base: undefined,
  redact: {
    paths: ['req.headers["x-api-key"]'],
    remove: true
  }
});
