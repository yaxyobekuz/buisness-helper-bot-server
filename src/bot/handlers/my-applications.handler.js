import { APPLICATION_STATUSES } from '../../constants.js';
import { clearSession, setSession } from '../../models/user.model.js';
import { getUserApplications } from '../../services/application.service.js';
import { escapeHtml } from '../../utils/html.js';
import { MESSAGES } from '../constants.js';
import { applicationStatusKeyboard } from '../keyboards/index.js';
import { showMainMenu } from './main-menu.handler.js';

export const MY_APPLICATIONS_FLOW = 'myApplications';

const STEP = 'status';

/** "Arizalarim" — holat tugmalarini ko'rsatadi. */
export async function startMyApplications(ctx) {
  const user = ctx.state.user;

  setSession(user, { flow: MY_APPLICATIONS_FLOW, step: STEP, draft: {} });
  await user.save();

  await ctx.reply(MESSAGES.chooseButton, { reply_markup: applicationStatusKeyboard });
}

/** Tanlangan holatdagi arizalarni ro'yxat qilib yuboradi. */
export async function handleMyApplicationsStep(ctx) {
  const user = ctx.state.user;
  const text = ctx.message?.text?.trim();

  if (user.session?.step !== STEP) {
    clearSession(user);
    await user.save();
    return showMainMenu(ctx);
  }

  if (!APPLICATION_STATUSES.includes(text)) {
    await ctx.reply(MESSAGES.chooseButton, { reply_markup: applicationStatusKeyboard });
    return;
  }

  const applications = await getUserApplications(user._id, text);

  if (applications.length === 0) {
    await ctx.reply(MESSAGES.noApplications, { reply_markup: applicationStatusKeyboard });
    return;
  }

  for (const application of applications) {
    await ctx.reply(formatApplication(application), { parse_mode: 'HTML' });
  }
}

function formatApplication(application) {
  return [
    `Murojaat raqami: <b>${application.number}</b>`,
    `Murojaat matni: <b>${escapeHtml(application.content)}</b>`,
  ].join('\n');
}
