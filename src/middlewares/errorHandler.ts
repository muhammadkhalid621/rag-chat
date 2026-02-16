import type { ErrorRequestHandler, NextFunction, Request, Response } from 'express';
import { ZodError } from 'zod';
import { logger } from '../config/logger';

export function notFoundHandler(_req: Request, _res: Response, next: NextFunction): void {
  const error = new Error('Route not found') as Error & { statusCode?: number };
  error.statusCode = 404;
  next(error);
}

export const errorHandler: ErrorRequestHandler = (err, req, res, _next) => {
  const requestId = (req as Request & { id?: string }).id || req.header('x-request-id') || undefined;

  if (err instanceof ZodError) {
    res.status(400).json({
      error: 'Validation failed',
      requestId,
      details: err.errors.map((issue) => ({
        path: issue.path.join('.'),
        message: issue.message
      }))
    });
    return;
  }

  const errorWithStatus = err as Error & { statusCode?: number; details?: unknown; errorCode?: string };
  const statusCode = errorWithStatus.statusCode ?? 500;

  if (statusCode >= 500) {
    logger.error({ err, path: req.path, method: req.method }, 'Unhandled server error');
  }

  res.status(statusCode).json({
    error: errorWithStatus.message || 'Internal server error',
    requestId,
    ...(errorWithStatus.errorCode ? { code: errorWithStatus.errorCode } : {}),
    ...(errorWithStatus.details ? { details: errorWithStatus.details } : {})
  });
};
