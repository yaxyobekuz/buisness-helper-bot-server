import { ReplyKeyboardBuilder } from 'node-telegram-bot-api';

import { ACTIVITY_TYPES, APPLICATION_STATUSES } from '../../constants.js';

export { ACTIVITY_TYPES };

export const MAIN_MENU_BUTTONS = {
  createApplication: 'Ariza berish',
  myApplications: 'Arizalarim',
};

export const BUTTONS = {
  skip: "O'tkazib yuborish",
  mainMenu: 'Bosh menu',
};

export const activityTypeKeyboard = new ReplyKeyboardBuilder()
  .text(ACTIVITY_TYPES[0])
  .text(ACTIVITY_TYPES[1])
  .build({ resize_keyboard: true, one_time_keyboard: true });

export const mainMenuKeyboard = new ReplyKeyboardBuilder()
  .text(MAIN_MENU_BUTTONS.createApplication)
  .text(MAIN_MENU_BUTTONS.myApplications)
  .build({ resize_keyboard: true, is_persistent: true });

/** Har bir yo'nalish alohida qatorda, oxirida "Bosh menu". */
export function directionsKeyboard(names) {
  const builder = new ReplyKeyboardBuilder();

  for (const name of names) {
    builder.text(name).row();
  }

  builder.text(BUTTONS.mainMenu);

  return builder.build({ resize_keyboard: true });
}

export const skipKeyboard = new ReplyKeyboardBuilder()
  .text(BUTTONS.skip)
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
