const { ZodError } = require('zod');
const { logger } = require('../config/logger');

function notFoundHandler(_req, _res, next) {
  const error = new Error('Route not found');
  error.statusCode = 404;
  next(error);
}

function errorHandler(err, req, res, _next) {
  if (err instanceof ZodError) {
    return res.status(400).json({
      error: 'Validation failed',
      details: err.errors.map((issue) => ({
        path: issue.path.join('.'),
        message: issue.message
      }))
    });
  }

  const statusCode = err.statusCode || 500;

  if (statusCode >= 500) {
    logger.error({ err, path: req.path, method: req.method }, 'Unhandled server error');
  }

  return res.status(statusCode).json({
    error: err.message || 'Internal server error',
    ...(err.details ? { details: err.details } : {})
  });
}

module.exports = { errorHandler, notFoundHandler };
