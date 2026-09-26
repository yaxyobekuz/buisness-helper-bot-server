import jwt from 'jsonwebtoken';

import { env } from '../config/env.js';
import { Admin } from '../models/admin.model.js';
import { ApiError } from '../utils/api-error.js';

/** @param {import('mongoose').HydratedDocument<any>} admin */
export function signToken(admin) {
  return jwt.sign({ sub: String(admin._id) }, env.jwt.secret, {
    expiresIn: env.jwt.expiresIn,
  });
}

/** Bearer token talab qiladigan oraliq qatlam. */
export async function requireAuth(req, res, next) {
  const header = req.get('authorization') ?? '';
  const [scheme, token] = header.split(' ');

  if (scheme !== 'Bearer' || !token) {
    return next(ApiError.unauthorized());
  }

  let payload;

  try {
    payload = jwt.verify(token, env.jwt.secret);
  } catch {
    return next(ApiError.unauthorized('Sessiya muddati tugagan'));
  }

  const admin = await Admin.findById(payload.sub);

  if (!admin) {
    return next(ApiError.unauthorized());
  }

  req.admin = admin;
  next();
}
