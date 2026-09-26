import { createApp } from './app.js';
import { startBot, stopBot } from './bot/index.js';
import { connectDatabase, disconnectDatabase } from './config/database.js';
import { ensureAdmin } from './services/admin.service.js';
import { env } from './config/env.js';
import { logger } from './utils/logger.js';

async function bootstrap() {
  await connectDatabase();
  await ensureAdmin();

  const app = createApp();

  const server = await new Promise((resolve, reject) => {
    const instance = app.listen(env.port);
    instance.once('listening', () => resolve(instance));
    instance.once('error', reject);
  });

  logger.info(`Server ishga tushdi: http://localhost:${env.port} (${env.nodeEnv})`);

  await startBot();

  let shuttingDown = false;

  async function shutdown(signal) {
    if (shuttingDown) return;
    shuttingDown = true;

    logger.info(`${signal} qabul qilindi, server to'xtatilmoqda...`);

    const timer = setTimeout(() => {
      logger.error("Server belgilangan vaqtda to'xtamadi, majburiy yopilmoqda");
      process.exit(1);
    }, 10_000).unref();

    try {
      await stopBot();
      await new Promise((resolve) => server.close(resolve));
      await disconnectDatabase();
      clearTimeout(timer);
      process.exit(0);
    } catch (error) {
      logger.error("To'xtatishda xatolik:", error);
      process.exit(1);
    }
  }

  process.on('SIGINT', () => shutdown('SIGINT'));
  process.on('SIGTERM', () => shutdown('SIGTERM'));

  process.on('unhandledRejection', (reason) => {
    logger.error('Ushlanmagan promise rad etildi:', reason);
  });

  process.on('uncaughtException', (error) => {
    logger.error('Ushlanmagan xatolik:', error);
    shutdown('uncaughtException');
  });
}

bootstrap().catch((error) => {
  logger.error('Server ishga tushmadi:', error.message);
  process.exit(1);
});
