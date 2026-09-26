import { env } from '../config/env.js';
import { Admin, hashPassword } from '../models/admin.model.js';
import { logger } from '../utils/logger.js';

/**
 * Birinchi ishga tushishda .env dagi ma'lumotlar bilan admin yaratadi.
 * Admin allaqachon mavjud bo'lsa hech nima qilmaydi — ya'ni profil
 * bo'limidan o'zgartirilgan login/parol .env bilan qayta yozilmaydi.
 */
export async function ensureAdmin() {
  if (await Admin.countDocuments()) return;

  await Admin.create({
    login: env.admin.login,
    passwordHash: await hashPassword(env.admin.password),
  });

  logger.info(`Admin yaratildi — login: ${env.admin.login}`);
}
