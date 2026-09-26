import { User } from '../../models/user.model.js';

/**
 * Har bir update uchun foydalanuvchini bazadan oladi (bo'lmasa yaratadi)
 * va uni `ctx.state.user` ga joylaydi.
 *
 * @type {import('node-telegram-bot-api').Middleware<import('node-telegram-bot-api').Context>}
 */
export async function attachUser(ctx, next) {
  if (!ctx.from || ctx.from.is_bot) return;

  ctx.state.user = await User.findOneAndUpdate(
    { telegramId: ctx.from.id },
    {
      $setOnInsert: { telegramId: ctx.from.id },
      $set: { username: ctx.from.username ?? null },
    },
    { new: true, upsert: true, setDefaultsOnInsert: true },
  );

  await next();
}
