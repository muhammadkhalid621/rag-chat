import cors from 'cors';
import express from 'express';
import helmet from 'helmet';
import pinoHttp from 'pino-http';
import swaggerUi from 'swagger-ui-express';
import { config } from './config/env';
import { logger } from './config/logger';
import { openApiSpec } from './config/openapi';
import { apiKeyAuth } from './middlewares/apiKeyAuth';
import { errorHandler, notFoundHandler } from './middlewares/errorHandler';
import { apiRateLimiter } from './middlewares/rateLimiter';
import { healthRouter } from './routes/health';
import { messagesRouter } from './routes/messages';
import { sessionsRouter } from './routes/sessions';

export const app = express();

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
