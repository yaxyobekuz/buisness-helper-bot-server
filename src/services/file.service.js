import { randomUUID } from 'node:crypto';
import { createWriteStream } from 'node:fs';
import { mkdir } from 'node:fs/promises';
import path from 'node:path';
import { Readable } from 'node:stream';
import { pipeline } from 'node:stream/promises';

import { env } from '../config/env.js';

const API_ROOT = env.bot.apiRoot ?? 'https://api.telegram.org';

/**
 * Xabardan yuklanadigan faylni ajratib oladi.
 * Rasm uchun eng katta o'lchamdagi nusxa olinadi.
 *
 * @param {import('node-telegram-bot-api').Message} message
 * @returns {{ fileId: string, originalName: string | null, mimeType: string | null, size: number } | null}
 */
export function extractFile(message) {
  if (message.document) {
    const { file_id, file_name, mime_type, file_size } = message.document;
    return { fileId: file_id, originalName: file_name ?? null, mimeType: mime_type ?? null, size: file_size ?? 0 };
  }

  if (message.photo?.length) {
    const largest = message.photo[message.photo.length - 1];
    return { fileId: largest.file_id, originalName: null, mimeType: 'image/jpeg', size: largest.file_size ?? 0 };
  }

  for (const key of ['video', 'audio', 'voice', 'animation', 'video_note']) {
    const media = message[key];

    if (media) {
      return {
        fileId: media.file_id,
        originalName: media.file_name ?? null,
        mimeType: media.mime_type ?? null,
        size: media.file_size ?? 0,
      };
    }
  }

  return null;
}

/**
 * Telegram serveridan faylni yuklab olib, UPLOAD_DIR ga saqlaydi.
 *
 * @param {import('node-telegram-bot-api').Api} api
 * @param {{ fileId: string, originalName: string | null, mimeType: string | null, size: number }} source
 */
export async function downloadTelegramFile(api, source) {
  const file = await api.getFile({ file_id: source.fileId });

  if (!file.file_path) {
    throw new Error('Telegram fayl manzilini qaytarmadi');
  }

  const response = await fetch(`${API_ROOT}/file/bot${env.bot.token}/${file.file_path}`);

  if (!response.ok || !response.body) {
    throw new Error(`Faylni yuklab bo'lmadi: ${response.status}`);
  }

  const extension = path.extname(file.file_path) || path.extname(source.originalName ?? '') || '';
  const fileName = `${Date.now()}-${randomUUID()}${extension}`;

  await mkdir(env.upload.dir, { recursive: true });
  await pipeline(Readable.fromWeb(response.body), createWriteStream(path.join(env.upload.dir, fileName)));

  return {
    fileName,
    originalName: source.originalName,
    mimeType: source.mimeType,
    size: source.size || file.file_size || 0,
  };
}
