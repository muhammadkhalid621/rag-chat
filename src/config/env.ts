import dotenv from 'dotenv';
import { z } from 'zod';

dotenv.config();

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().int().min(1).max(65535),
  DATABASE_URL: z
    .string()
    .url()
    .refine((value) => value.startsWith('postgres://') || value.startsWith('postgresql://'), {
      message: 'DATABASE_URL must start with postgres:// or postgresql://'
    }),
  API_KEY: z.string().min(16),
  OPENAI_API_KEY: z.string().min(16).optional(),
  OPENAI_MODEL: z.string().min(1).default('gpt-4o-mini'),
  OPENAI_BASE_URL: z.string().url().default('https://api.openai.com/v1'),
  OPENAI_TIMEOUT_MS: z.coerce.number().int().min(1000).max(120000).default(20000),
  DB_POOL_MAX: z.coerce.number().int().min(1).max(100).default(20),
  DB_POOL_IDLE_TIMEOUT_MS: z.coerce.number().int().min(1000).max(600000).default(30000),
  DB_POOL_CONNECTION_TIMEOUT_MS: z.coerce.number().int().min(1000).max(60000).default(5000),
  RATE_LIMIT_WINDOW_MS: z.coerce.number().int().min(1000).default(60000),
  RATE_LIMIT_MAX_REQUESTS: z.coerce.number().int().min(1).max(10000).default(120),
  LOG_LEVEL: z.enum(['fatal', 'error', 'warn', 'info', 'debug', 'trace', 'silent']).default('info'),
  CORS_ORIGIN: z.string().min(1).default('*')
});

const parsedEnv = envSchema.safeParse(process.env);

if (!parsedEnv.success) {
  const message = parsedEnv.error.issues
    .map((issue) => `${issue.path.join('.') || 'env'}: ${issue.message}`)
    .join('; ');
  throw new Error(`Invalid environment configuration: ${message}`);
}

export const config = {
  env: parsedEnv.data.NODE_ENV,
  port: parsedEnv.data.PORT,
  databaseUrl: parsedEnv.data.DATABASE_URL,
  apiKey: parsedEnv.data.API_KEY,
  openAiApiKey: parsedEnv.data.OPENAI_API_KEY,
  openAiModel: parsedEnv.data.OPENAI_MODEL,
  openAiBaseUrl: parsedEnv.data.OPENAI_BASE_URL,
  openAiTimeoutMs: parsedEnv.data.OPENAI_TIMEOUT_MS,
  dbPoolMax: parsedEnv.data.DB_POOL_MAX,
  dbPoolIdleTimeoutMs: parsedEnv.data.DB_POOL_IDLE_TIMEOUT_MS,
  dbPoolConnectionTimeoutMs: parsedEnv.data.DB_POOL_CONNECTION_TIMEOUT_MS,
  rateLimitWindowMs: parsedEnv.data.RATE_LIMIT_WINDOW_MS,
  rateLimitMaxRequests: parsedEnv.data.RATE_LIMIT_MAX_REQUESTS,
  logLevel: parsedEnv.data.LOG_LEVEL,
  corsOrigin: parsedEnv.data.CORS_ORIGIN
};
