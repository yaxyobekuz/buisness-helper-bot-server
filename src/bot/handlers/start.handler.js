import { clearSession } from '../../models/user.model.js';
import { MESSAGES } from '../constants.js';
import { removeKeyboard } from '../keyboards/index.js';
import { showMainMenu } from './main-menu.handler.js';

/**
 * /start — tadbirkor allaqachon attachUser orqali saqlangan,
 * shuning uchun faqat salomlashib bosh sahifani ko'rsatadi.
 *
 * @param {import('node-telegram-bot-api').Context} ctx
 */
export async function handleStart(ctx) {
  const user = ctx.state.user;

  clearSession(user);
  await user.save();

  await ctx.reply(MESSAGES.welcome, { reply_markup: removeKeyboard });
  await showMainMenu(ctx);
}
