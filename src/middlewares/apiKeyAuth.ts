import type { NextFunction, Request, Response } from 'express';
import { config } from '../config/env';
import { AppError } from '../utils/errors';

export function apiKeyAuth(req: Request, _res: Response, next: NextFunction): void {
  const providedApiKey = req.header('x-api-key');

  if (!providedApiKey || providedApiKey !== config.apiKey) {
    next(new AppError(401, 'Unauthorized: invalid or missing API key'));
    return;
  }

  next();
}
