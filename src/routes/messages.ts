import express, { type Request, type Response } from 'express';
import { asyncHandler } from '../utils/asyncHandler';
import { createMessageSchema, paginationQuerySchema, sessionIdParamSchema } from '../utils/validation';
import { createMessage, listMessages } from '../services/messageService';

const router = express.Router({ mergeParams: true });

router.post(
  '/',
  asyncHandler(async (req: Request, res: Response) => {
    const { id } = sessionIdParamSchema.parse(req.params);
    const payload = createMessageSchema.parse(req.body);

    const message = await createMessage(id, payload);
    res.status(201).json(message);
  })
);

router.get(
  '/',
  asyncHandler(async (req: Request, res: Response) => {
    const { id } = sessionIdParamSchema.parse(req.params);
    const { page, limit } = paginationQuerySchema.parse(req.query);
    const offset = (page - 1) * limit;

    const data = await listMessages(id, { limit, offset });

    res.status(200).json({
      items: data.items,
      pagination: {
        page,
        limit,
        total: data.total,
        totalPages: Math.ceil(data.total / limit)
      }
    });
  })
);

export const messagesRouter = router;
