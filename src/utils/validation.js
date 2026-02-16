const { z } = require('zod');

const createSessionSchema = z.object({
  userId: z.string().min(1).max(255),
  title: z.string().min(1).max(255).optional()
}).strict();

const updateSessionTitleSchema = z.object({
  title: z.string().min(1).max(255)
}).strict();

const updateSessionFavoriteSchema = z.object({
  isFavorite: z.boolean()
}).strict();

const createMessageSchema = z.object({
  sender: z.enum(['user', 'assistant', 'system']),
  content: z.string().min(1),
  retrievedContext: z.record(z.unknown()).optional()
}).strict();

const sessionIdParamSchema = z.object({
  id: z.string().uuid()
}).strict();

const paginationQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20)
}).strict();

const listSessionsQuerySchema = z.object({
  userId: z.string().min(1).max(255),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20)
}).strict();

module.exports = {
  createSessionSchema,
  updateSessionTitleSchema,
  updateSessionFavoriteSchema,
  createMessageSchema,
  sessionIdParamSchema,
  paginationQuerySchema,
  listSessionsQuerySchema
};
