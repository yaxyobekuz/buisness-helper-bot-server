import { handleMessage } from './handlers/message.handler.js';
import { handleStart } from './handlers/start.handler.js';
import { attachUser } from './middlewares/attach-user.js';

/**
 * Bot handlerlari shu yerda ro'yxatdan o'tkaziladi.
 * Tartib muhim: bot.use() / bot.command() / bot.hears() / bot.on()
 * bitta middleware zanjirida bo'lib, qaysi biri oldin yozilsa o'sha oldin ishlaydi.
 *
 * @param {import('node-telegram-bot-api').Bot} bot
 */
export function registerHandlers(bot) {
  bot.use(attachUser);

  bot.command('start', handleStart);

  bot.on('message', handleMessage);
}
