const pino = require('pino');
const { config } = require('./env');

const logger = pino({
  level: config.logLevel,
  base: undefined,
  redact: {
    paths: ['req.headers["x-api-key"]'],
    remove: true
  }
});

module.exports = { logger };
