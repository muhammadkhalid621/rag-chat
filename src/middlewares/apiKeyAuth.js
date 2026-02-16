const { config } = require('../config/env');
const { AppError } = require('../utils/errors');

function apiKeyAuth(req, _res, next) {
  const providedApiKey = req.header('x-api-key');

  if (!providedApiKey || providedApiKey !== config.apiKey) {
    return next(new AppError(401, 'Unauthorized: invalid or missing API key'));
  }

  return next();
}

module.exports = { apiKeyAuth };
