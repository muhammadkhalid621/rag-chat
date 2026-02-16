const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const pinoHttp = require('pino-http');
const swaggerUi = require('swagger-ui-express');

const { logger } = require('./config/logger');
const { config } = require('./config/env');
const { apiRateLimiter } = require('./middlewares/rateLimiter');
const { apiKeyAuth } = require('./middlewares/apiKeyAuth');
const { errorHandler, notFoundHandler } = require('./middlewares/errorHandler');
const { healthRouter } = require('./routes/health');
const { sessionsRouter } = require('./routes/sessions');
const { messagesRouter } = require('./routes/messages');
const { openApiSpec } = require('./config/openapi');

const app = express();

app.use(
  pinoHttp({
    logger
  })
);
app.use(helmet());
app.use(
  cors({
    origin: config.corsOrigin === '*' ? true : config.corsOrigin.split(',').map((origin) => origin.trim())
  })
);
app.use(express.json({ limit: '1mb' }));

app.use('/docs', swaggerUi.serve, swaggerUi.setup(openApiSpec));
app.use('/health', healthRouter);

app.use('/api', apiRateLimiter);
app.use('/api', apiKeyAuth);

app.use('/api/v1/sessions', sessionsRouter);
app.use('/api/v1/sessions/:id/messages', messagesRouter);

app.use(notFoundHandler);
app.use(errorHandler);

module.exports = { app };
