import { User } from '../../models/user.model.js';

/**
 * Har bir update uchun tadbirkorni bazadan oladi. Topilmasa — yaratadi,
 * ya'ni botga birinchi murojaat qilgan foydalanuvchi avtomatik
 * tadbirkor sifatida saqlanadi.
 *
 * @type {import('node-telegram-bot-api').Middleware<import('node-telegram-bot-api').Context>}
 */
export async function attachUser(ctx, next) {
  if (!ctx.from || ctx.from.is_bot) return;

  ctx.state.user = await User.findOneAndUpdate(
    { telegramId: ctx.from.id },
    {
      $setOnInsert: { telegramId: ctx.from.id },
      $set: {
        username: ctx.from.username ?? null,
        firstName: ctx.from.first_name ?? null,
        lastName: ctx.from.last_name ?? null,
      },
    },
    { new: true, upsert: true, setDefaultsOnInsert: true },
  );

  await next();
}
