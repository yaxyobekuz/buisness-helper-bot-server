import { Application } from '../models/application.model.js';
import { nextSequence } from '../models/counter.model.js';

/**
 * Yangi ariza yaratadi va ketma-ket raqam beradi.
 *
 * @param {{ user: unknown, direction: unknown, content: string, files?: unknown[] }} data
 */
export async function createApplication({ user, direction, content, files = [] }) {
  const number = await nextSequence('application');

  return Application.create({ number, user, direction, content, files });
}

/**
 * Foydalanuvchining berilgan holatdagi arizalari.
 *
 * @param {unknown} userId
 * @param {string} status
 */
export function getUserApplications(userId, status) {
  return Application.find({ user: userId, status })
    .populate('direction', 'name')
    .sort({ number: -1 })
    .lean();
}
