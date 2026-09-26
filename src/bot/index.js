import { Bot } from 'node-telegram-bot-api/node';

import { env } from '../config/env.js';
import { logger } from '../utils/logger.js';
import { cancelAllPendingSaves } from './handlers/application.handler.js';
import { registerHandlers } from './register.js';

export const bot = new Bot(env.bot.token, { apiRoot: env.bot.apiRoot });

/**
 * Handler ichidagi xatolik botni to'xtatmaydi — shu yerga yo'naltiriladi.
 */
bot.catch((error, ctx) => {
  logger.error(`Update #${ctx.update.update_id} xatolik bilan tugadi:`, error);
});

/** @type {Promise<void> | null} */
let pollingLoop = null;

export async function startBot() {
  registerHandlers(bot);

  const me = await bot.api.getMe();

  if (env.bot.mode === 'webhook') {
    await bot.api.setWebhook({
      url: env.bot.webhookUrl,
      secret_token: env.bot.webhookSecret,
      drop_pending_updates: true,
    });

    logger.info(`Bot @${me.username} webhook rejimida: ${env.bot.webhookUrl}`);
    return;
  }

  await bot.api.deleteWebhook({ drop_pending_updates: true });

  // startPolling() sikl to'xtaganda hal bo'ladi — shuning uchun kutib turilmaydi.
  pollingLoop = bot.startPolling().catch((error) => {
    logger.error("Polling to'xtadi:", error);
  });

  logger.info(`Bot @${me.username} polling rejimida ishga tushdi`);
}

export async function stopBot() {
  cancelAllPendingSaves();

  if (env.bot.mode === 'webhook') {
    await bot.api.deleteWebhook();
    return;
  }

  if (!bot.isRunning()) return;

  bot.stop();
  await pollingLoop;
  pollingLoop = null;
}
