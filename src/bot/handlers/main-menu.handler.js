import { MESSAGES } from '../constants.js';
import { mainMenuKeyboard } from '../keyboards/index.js';

/**
 * Bosh sahifani klaviaturasi bilan ko'rsatadi.
 *
 * @param {import('node-telegram-bot-api').Context} ctx
 */
export function showMainMenu(ctx) {
  return ctx.reply(MESSAGES.mainMenu, { reply_markup: mainMenuKeyboard });
}
