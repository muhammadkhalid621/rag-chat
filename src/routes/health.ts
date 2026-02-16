import express, { type Request, type Response } from 'express';
import { pool } from '../db/pool';
import { asyncHandler } from '../utils/asyncHandler';

const router = express.Router();

router.get('/live', (_req: Request, res: Response) => {
  res.status(200).json({ status: 'ok' });
});

router.get(
  '/ready',
  asyncHandler(async (_req: Request, res: Response) => {
    await pool.query('SELECT 1');
    res.status(200).json({ status: 'ready' });
  })
);

export const healthRouter = router;
