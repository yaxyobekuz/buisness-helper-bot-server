import cors from 'cors';
import express from 'express';
import { registerExpressWebhook } from 'node-telegram-bot-api';

import { bot } from './bot/index.js';
import { env } from './config/env.js';
import { errorHandler } from './middlewares/error-handler.js';
import { notFound } from './middlewares/not-found.js';
import apiRouter from './routes/index.js';

export function createApp() {
  const app = express();

  app.set('trust proxy', 1);
  app.disable('x-powered-by');

  app.use(cors({ origin: env.corsOrigin, credentials: true }));
  app.use(express.json({ limit: '1mb' }));
  app.use(express.urlencoded({ extended: true }));

  if (env.bot.mode === 'webhook') {
    registerExpressWebhook(bot, app, {
      path: env.bot.webhookPath,
      secretToken: env.bot.webhookSecret,
    });
  }

  app.use('/api', apiRouter);

  app.use(notFound);
  app.use(errorHandler);

  return app;
}
