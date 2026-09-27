import { clearSession, setSession } from '../../models/user.model.js';
import { createApplication } from '../../services/application.service.js';
import { MESSAGES } from '../constants.js';
import { mainMenuKeyboard } from '../keyboards/index.js';
import {
  APPLICATION_FLOW,
  APPLICATION_STEPS,
  FIRST_STEP,
  findStep,
  nextStep,
} from '../scenes/application.js';
import { showMainMenu } from './main-menu.handler.js';

export { APPLICATION_FLOW };

/** "Ariza berish" — oqimni boshlaydi. */
export async function startApplication(ctx) {
  const user = ctx.state.user;

  setSession(user, { flow: APPLICATION_FLOW, step: FIRST_STEP.name, draft: {} });
  await user.save();

  await ctx.reply(FIRST_STEP.question, { reply_markup: FIRST_STEP.keyboard });
}

/** Oqimning joriy qadamiga kelgan javobni qayta ishlaydi. */
export async function handleApplicationStep(ctx) {
  const user = ctx.state.user;
  const current = findStep(user.session?.step);

  if (!current) {
    clearSession(user);
    await user.save();
    return showMainMenu(ctx);
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

  const draft = { ...(user.session.draft ?? {}), [step.name]: result.value };
  const following = nextStep(index);

  if (following) {
    setSession(user, { step: following.name, draft });
    await user.save();

    await ctx.reply(following.question, { reply_markup: following.keyboard });
    return;
  }

  // Servis arizani yaratadi va tadbirkor kartochkasini ham yangilaydi.
  await createApplication({ user: user._id, ...draft });

  clearSession(user);
  await user.save();

  await ctx.reply(MESSAGES.applicationSent, { reply_markup: mainMenuKeyboard });
}

export { APPLICATION_STEPS };
