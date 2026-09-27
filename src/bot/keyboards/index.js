import { ReplyKeyboardBuilder } from 'node-telegram-bot-api';

import { APPLICATION_STATUSES } from '../../constants.js';

export const MAIN_MENU_BUTTONS = {
  createApplication: 'Ariza berish',
  myApplications: 'Arizalarim',
};

export const BUTTONS = {
  mainMenu: 'Bosh menu',
};

export const mainMenuKeyboard = new ReplyKeyboardBuilder()
  .text(MAIN_MENU_BUTTONS.createApplication)
  .text(MAIN_MENU_BUTTONS.myApplications)
  .build({ resize_keyboard: true, is_persistent: true });

/** Ariza qadamlarida — oqimdan chiqish uchun. */
export const cancelKeyboard = new ReplyKeyboardBuilder()
  .text(BUTTONS.mainMenu)
  .build({ resize_keyboard: true });

/** Ariza holatlari + bosh menuga qaytish. */
export const applicationStatusKeyboard = new ReplyKeyboardBuilder()
  .text(APPLICATION_STATUSES[0])
  .text(APPLICATION_STATUSES[1])
  .text(APPLICATION_STATUSES[2])
  .row()
  .text(BUTTONS.mainMenu)
  .build({ resize_keyboard: true });

/** Oldingi reply-klaviaturani olib tashlaydi. */
export const removeKeyboard = { remove_keyboard: true };
