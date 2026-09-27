import mongoose from 'mongoose';

const sessionSchema = new mongoose.Schema(
  {
    /** Joriy oqim: 'application' | 'myApplications' */
    flow: { type: String, default: null },
    /** Oqim ichidagi joriy qadam. */
    step: { type: String, default: null },
    /** Oqim tugaguncha to'planadigan vaqtinchalik ma'lumot. */
    draft: { type: mongoose.Schema.Types.Mixed, default: () => ({}) },
  },
  { _id: false },
);

/**
 * Tadbirkor. Botga /start bosilishi bilan avtomatik yaratiladi —
 * alohida ro'yxatdan o'tish talab qilinmaydi.
 */
const userSchema = new mongoose.Schema(
  {
    telegramId: { type: Number, required: true, unique: true, index: true },
    username: { type: String, default: null },
    firstName: { type: String, default: null },
    lastName: { type: String, default: null },

    /** Oxirgi arizada ko'rsatilgan ma'lumotlar — panelda ko'rsatish uchun. */
    fullName: { type: String, default: null },
    address: { type: String, default: null },
    phone: { type: String, default: null },

    session: { type: sessionSchema, default: () => ({}) },

    /** Soft delete — to'ldirilgan bo'lsa tadbirkor ro'yxatlarda ko'rinmaydi. */
    deletedAt: { type: Date, default: null, index: true },
  },
  { timestamps: true },
);

export const User = mongoose.model('User', userSchema);

/**
 * Sessiyani tozalaydi (oqimdan chiqish).
 *
 * @param {import('mongoose').HydratedDocument<any>} user
 */
export function clearSession(user) {
  user.session = { flow: null, step: null, draft: {} };
}

/**
 * Sessiyani yangi qiymatlar bilan almashtiradi. Mixed maydon to'liq
 * qayta tayinlanadi — shuning uchun markModified() kerak emas.
 *
 * @param {import('mongoose').HydratedDocument<any>} user
 * @param {{ flow?: string | null, step?: string | null, draft?: object }} patch
 */
export function setSession(user, patch) {
  const current = user.session ?? {};

  user.session = {
    flow: patch.flow !== undefined ? patch.flow : current.flow,
    step: patch.step !== undefined ? patch.step : current.step,
    draft: patch.draft !== undefined ? patch.draft : { ...(current.draft ?? {}) },
  };
}
