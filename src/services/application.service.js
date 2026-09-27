import { Application } from '../models/application.model.js';
import { nextSequence } from '../models/counter.model.js';
import { User } from '../models/user.model.js';

/**
 * Yangi ariza yaratadi va ketma-ket raqam beradi.
 *
 * Ariza ma'lumotlari tadbirkor kartochkasiga ham ko'chiriladi —
 * panelda tadbirkorni F.I.Sh. va telefoni bilan ko'rish uchun.
 *
 * @param {{ user: unknown, fullName: string, address: string, phone: string, content: string }} data
 */
export async function createApplication({ user, fullName, address, phone, content }) {
  const number = await nextSequence('application');

  const application = await Application.create({
    number,
    user,
    fullName,
    address,
    phone,
    content,
  });

  await User.findByIdAndUpdate(user, { $set: { fullName, address, phone } });

  return application;
}

/**
 * Tadbirkorning berilgan holatdagi arizalari.
 *
 * @param {unknown} userId
 * @param {string} status
 */
export function getUserApplications(userId, status) {
  return Application.find({ user: userId, status, deletedAt: null })
    .sort({ number: -1 })
    .lean();
}
