import { clearSession } from '../../models/user.model.js';
import { BUTTONS, MAIN_MENU_BUTTONS } from '../keyboards/index.js';
import { APPLICATION_FLOW, handleApplicationStep, startApplication } from './application.handler.js';
import {
  MY_APPLICATIONS_FLOW,
  handleMyApplicationsStep,
  startMyApplications,
} from './my-applications.handler.js';
import { showMainMenu } from './main-menu.handler.js';

/**
 * Barcha xabarlarni tegishli oqimga yo'naltiradi.
 *
 * @param {import('node-telegram-bot-api').Context} ctx
 */
export async function handleMessage(ctx) {
  const user = ctx.state.user;
  const text = ctx.message?.text?.trim();

  // "Bosh menu" har qanday oqimdan chiqaradi.
  if (text === BUTTONS.mainMenu) {
    clearSession(user);
    await user.save();
    return showMainMenu(ctx);
  }

  if (text === MAIN_MENU_BUTTONS.createApplication) {
    return startApplication(ctx);
  }

  if (text === MAIN_MENU_BUTTONS.myApplications) {
    return startMyApplications(ctx);
  }

  switch (user.session?.flow) {
    case APPLICATION_FLOW:
      return handleApplicationStep(ctx);
    case MY_APPLICATIONS_FLOW:
      return handleMyApplicationsStep(ctx);
    default:
      return showMainMenu(ctx);
  }
}
