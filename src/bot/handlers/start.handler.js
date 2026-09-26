import { setSession } from '../../models/user.model.js';
import { MESSAGES } from '../constants.js';
import { FIRST_STEP, REGISTRATION_FLOW, REGISTRATION_STEPS } from '../scenes/registration.js';
import { showMainMenu } from './main-menu.handler.js';

/**
 * /start — ro'yxatdan o'tgan foydalanuvchini bosh sahifaga,
 * qolganini ro'yxatdan o'tkazish oqimining birinchi qadamiga yo'naltiradi.
 *
 * @param {import('node-telegram-bot-api').Context} ctx
 */
export async function handleStart(ctx) {
  const user = ctx.state.user;

  if (user.isRegistered) {
    await showMainMenu(ctx);
    return;
  }

  // Tugallanmagan ro'yxatdan o'tish qaytadan boshlanadi.
  for (const step of REGISTRATION_STEPS) {
    user.set(step.name, null);
  }

  setSession(user, { flow: REGISTRATION_FLOW, step: FIRST_STEP.name, draft: {} });
  await user.save();

  await ctx.reply(MESSAGES.welcome, { reply_markup: FIRST_STEP.keyboard });
  await ctx.reply(FIRST_STEP.question);
}
