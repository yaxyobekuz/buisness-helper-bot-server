import mongoose from 'mongoose';

import { env } from '../config/env.js';
import { ApiError } from '../utils/api-error.js';
import { logger } from '../utils/logger.js';

function normalize(error) {
  if (error instanceof ApiError) {
    return error;
  }

  if (error instanceof mongoose.Error.ValidationError) {
    const details = Object.fromEntries(
      Object.entries(error.errors).map(([field, item]) => [field, item.message]),
    );

    return ApiError.badRequest("Ma'lumotlar validatsiyadan o'tmadi", details);
  }

  if (error instanceof mongoose.Error.CastError) {
    return ApiError.badRequest(`Noto'g'ri qiymat: ${error.path}`);
  }

  if (error?.code === 11000) {
    return ApiError.conflict('Bunday yozuv allaqachon mavjud', error.keyValue);
  }

  return ApiError.internal(error?.message);
}

// eslint-disable-next-line no-unused-vars
export function errorHandler(error, req, res, next) {
  const apiError = normalize(error);

  if (apiError.statusCode >= 500) {
    logger.error(`${req.method} ${req.originalUrl}`, error);
  }

  res.status(apiError.statusCode).json({
    success: false,
    message: apiError.message,
    ...(apiError.details ? { details: apiError.details } : {}),
    ...(env.isProduction ? {} : { stack: error?.stack }),
  });
}
