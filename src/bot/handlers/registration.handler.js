import { clearSession, setSession } from '../../models/user.model.js';
import { MESSAGES } from '../constants.js';
import { removeKeyboard } from '../keyboards/index.js';
import { findStep, nextStep } from '../scenes/registration.js';
import { handleStart } from './start.handler.js';
import { showMainMenu } from './main-menu.handler.js';

/**
 * Ro'yxatdan o'tish oqimining joriy qadamiga kelgan javobni qayta ishlaydi.
 *
 * @param {import('node-telegram-bot-api').Context} ctx
 */
export async function handleRegistration(ctx) {
  const user = ctx.state.user;

  // Hali /start bosilmagan bo'lsa, oqim shu yerdan boshlanadi.
  const current = findStep(user.session?.step);

  if (!current) {
    await handleStart(ctx);
    return;
  }

  const { index, step } = current;
  const raw = ctx.message?.text;

  if (typeof raw !== 'string') {
    await ctx.reply(MESSAGES.invalidInput, { reply_markup: step.keyboard });
    return;
  }

  const result = step.validate(raw);

  if (!result.ok) {
    await ctx.reply(MESSAGES.invalidInput, { reply_markup: step.keyboard });
    return;
  }

  user.set(step.name, result.value);

  const following = nextStep(index);

  if (following) {
    setSession(user, { step: following.name });
    await user.save();

    await ctx.reply(following.question, { reply_markup: following.keyboard });
    return;
  }

  clearSession(user);
  user.isRegistered = true;
  await user.save();

  await ctx.reply(MESSAGES.registrationCompleted, { reply_markup: removeKeyboard });
  await showMainMenu(ctx);
}
