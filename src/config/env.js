import path from 'node:path';
import { fileURLToPath } from 'node:url';

import dotenv from 'dotenv';

const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');

dotenv.config({ path: path.join(rootDir, '.env'), quiet: true });

function required(key) {
  const value = process.env[key];

  if (!value) {
    throw new Error(`.env faylida "${key}" o'zgaruvchisi topilmadi`);
  }

  return value;
}

function list(key) {
  return (process.env[key] ?? '')
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);
}

const nodeEnv = process.env.NODE_ENV ?? 'development';
const botMode = process.env.BOT_MODE === 'webhook' ? 'webhook' : 'polling';
const webhookPath = process.env.WEBHOOK_PATH || '/telegram/webhook';

const corsOrigin = list('CORS_ORIGIN');
const uploadDir = path.resolve(rootDir, process.env.UPLOAD_DIR || 'uploads');

export const env = {
  rootDir,
  nodeEnv,
  isProduction: nodeEnv === 'production',
  isDevelopment: nodeEnv === 'development',
  port: Number(process.env.PORT ?? 4000),
  corsOrigin: corsOrigin.length > 0 ? corsOrigin : '*',
  mongodbUri: required('MONGODB_URI'),
  bot: {
    token: required('BOT_TOKEN'),
    mode: botMode,
    // O'zi joylashtirilgan Bot API serveri uchun (ixtiyoriy).
    apiRoot: process.env.TELEGRAM_API_ROOT || undefined,
    webhookPath,
    webhookUrl:
      botMode === 'webhook'
        ? new URL(webhookPath, required('WEBHOOK_DOMAIN')).toString()
        : null,
    // Webhook rejimida maxfiy kalit majburiy: Telegram payloadlarini
    // imzolamaydi, faqat shu kalit chaqiruvchini tasdiqlaydi.
    webhookSecret: botMode === 'webhook' ? required('WEBHOOK_SECRET') : null,
    adminIds: list('ADMIN_IDS').map(Number).filter(Number.isInteger),
  },
  admin: {
    login: process.env.ADMIN_LOGIN || 'admin',
    password: process.env.ADMIN_PASSWORD || 'admin123',
  },
  jwt: {
    secret: required('JWT_SECRET'),
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  },
  upload: {
    dir: uploadDir,
    publicUrl: (process.env.PUBLIC_URL || `http://localhost:${process.env.PORT ?? 4000}`).replace(/\/+$/, ''),
    routePath: '/uploads',
  },
};
