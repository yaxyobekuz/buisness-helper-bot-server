import { ApiError } from '../utils/api-error.js';

export function notFound(req, res, next) {
  next(ApiError.notFound(`Manzil topilmadi: ${req.method} ${req.originalUrl}`));
}
