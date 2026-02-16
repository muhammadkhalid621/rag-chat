import express, { type Request, type Response } from 'express';
import { asyncHandler } from '../utils/asyncHandler';
import {
  createSessionSchema,
  listSessionsQuerySchema,
  sessionIdParamSchema,
  updateSessionFavoriteSchema,
  updateSessionTitleSchema
} from '../utils/validation';
import { createSession, deleteSession, listSessions, renameSession, setFavorite } from '../services/sessionService';

const router = express.Router();

router.post(
  '/',
  asyncHandler(async (req: Request, res: Response) => {
    const payload = createSessionSchema.parse(req.body);
    const session = await createSession(payload);
    res.status(201).json(session);
  })
);

router.get(
  '/',
  asyncHandler(async (req: Request, res: Response) => {
    const { userId, page, limit } = listSessionsQuerySchema.parse(req.query);
    const offset = (page - 1) * limit;

    const data = await listSessions({ userId, limit, offset });

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

router.patch(
  '/:id/rename',
  asyncHandler(async (req: Request, res: Response) => {
    const { id } = sessionIdParamSchema.parse(req.params);
    const { title } = updateSessionTitleSchema.parse(req.body);
    const session = await renameSession(id, title);
    res.status(200).json(session);
  })
);

router.patch(
  '/:id/favorite',
  asyncHandler(async (req: Request, res: Response) => {
    const { id } = sessionIdParamSchema.parse(req.params);
    const { isFavorite } = updateSessionFavoriteSchema.parse(req.body);
    const session = await setFavorite(id, isFavorite);
    res.status(200).json(session);
  })
);

router.delete(
  '/:id',
  asyncHandler(async (req: Request, res: Response) => {
    const { id } = sessionIdParamSchema.parse(req.params);
    await deleteSession(id);
    res.status(204).send();
  })
);

export const sessionsRouter = router;
