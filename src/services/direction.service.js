import { DIRECTION_STATUS } from '../constants.js';
import { Direction } from '../models/direction.model.js';

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/** Botda ko'rsatiladigan yo'nalishlar — faqat "Faol". */
export function getActiveDirections() {
  return Direction.find({ status: DIRECTION_STATUS.active }).sort({ name: 1 }).lean();
}

/**
 * Nom bo'yicha yo'nalishni topadi (katta-kichik harf farqsiz).
 * Topilmasa "Yangi" holatda yaratadi — bunday yo'nalish botda
 * admin uni faollashtirmaguncha ko'rinmaydi.
 *
 * @param {string} name
 */
export async function findOrCreateDirection(name) {
  const trimmed = name.trim().replace(/\s+/g, ' ');
  const existing = await Direction.findOne({
    name: new RegExp(`^${escapeRegExp(trimmed)}$`, 'i'),
  });

  if (existing) return existing;

  return Direction.create({ name: trimmed, status: DIRECTION_STATUS.new });
}
