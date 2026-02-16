import { z } from 'zod';

const retrievedContextSchema = z.union([z.record(z.unknown()), z.string().min(1)]);

export const createSessionSchema = z
  .object({
    userId: z.string().min(1).max(255),
    title: z.string().min(1).max(255).optional()
  })
  .strict();

export const updateSessionTitleSchema = z
  .object({
    title: z.string().min(1).max(255)
  })
  .strict();

export const updateSessionFavoriteSchema = z
  .object({
    isFavorite: z.boolean()
  })
  .strict();

export const createMessageSchema = z
  .object({
    sender: z.enum(['user', 'assistant', 'system']),
    content: z.string().min(1),
    retrievedContext: retrievedContextSchema.optional()
  })
  .strict();

export const generateChatSchema = z
  .object({
    message: z.string().min(1),
    retrievedContext: retrievedContextSchema.optional()
  })
  .strict();

export const sessionIdParamSchema = z
  .object({
    id: z.string().uuid()
  })
  .strict();

export const paginationQuerySchema = z
  .object({
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(100).default(20)
  })
  .strict();

export const listSessionsQuerySchema = z
  .object({
    userId: z.string().min(1).max(255),
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(100).default(20)
  })
  .strict();
