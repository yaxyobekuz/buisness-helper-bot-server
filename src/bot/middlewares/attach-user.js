import { Application } from '../../models/application.model.js';
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

  const user = await User.findOneAndUpdate(
    { telegramId: ctx.from.id },
    {
      $setOnInsert: { telegramId: ctx.from.id },
      $set: {
        username: ctx.from.username ?? null,
        firstName: ctx.from.first_name ?? null,
        lastName: ctx.from.last_name ?? null,
      },
    },
    { new: false, upsert: true, setDefaultsOnInsert: true },
  );

  // O'chirilgan tadbirkor botga qaytsa — u va u bilan birga o'chirilgan
  // arizalari tiklanadi, aks holda bot u uchun ishlamay qolardi.
  if (user?.deletedAt) {
    await Promise.all([
      User.updateOne({ _id: user._id }, { $set: { deletedAt: null } }),
      Application.updateMany(
        { user: user._id, deletedWithUser: true },
        { $set: { deletedAt: null, deletedWithUser: false } },
      ),
    ]);
  }

  ctx.state.user = await User.findOne({ telegramId: ctx.from.id });

  await next();
}
