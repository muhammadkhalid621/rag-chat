import express, { type Request, type Response } from 'express';
import { asyncHandler } from '../utils/asyncHandler';
import {
  createMessageSchema,
  generateChatSchema,
  paginationQuerySchema,
  sessionIdParamSchema
} from '../utils/validation';
import { generateAssistantReply } from '../services/aiChatService';
import { createMessage, getRecentMessages, listMessages } from '../services/messageService';

const router = express.Router({ mergeParams: true });

router.post(
  '/chat',
  asyncHandler(async (req: Request, res: Response) => {
    const { id } = sessionIdParamSchema.parse(req.params);
    const { message, retrievedContext } = generateChatSchema.parse(req.body);

    const userMessage = await createMessage(id, {
      sender: 'user',
      content: message,
      retrievedContext
    });

    const history = await getRecentMessages(id, 20);
    const historyWithoutCurrentUser = history
      .filter((item) => item.id !== userMessage.id)
      .map((item) => ({ role: item.sender, content: item.content }));

    const assistantContent = await generateAssistantReply({
      history: historyWithoutCurrentUser,
      userMessage: message,
      retrievedContext
    });

    const assistantMessage = await createMessage(id, {
      sender: 'assistant',
      content: assistantContent,
      retrievedContext
    });

    res.status(201).json({
      userMessage,
      assistantMessage
    });
  })
);

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
