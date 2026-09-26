import { MIN_TEXT_LENGTH } from '../constants.js';
import { FILE_COLLECT_WINDOW_MS, MAX_DIRECTION_LENGTH, MESSAGES } from '../constants.js';
import { BUTTONS, directionsKeyboard, mainMenuKeyboard, removeKeyboard, skipKeyboard } from '../keyboards/index.js';
import { clearSession, setSession, User } from '../../models/user.model.js';
import { createApplication } from '../../services/application.service.js';
import { findOrCreateDirection, getActiveDirections } from '../../services/direction.service.js';
import { downloadTelegramFile, extractFile } from '../../services/file.service.js';
import { logger } from '../../utils/logger.js';
import { showMainMenu } from './main-menu.handler.js';

export const APPLICATION_FLOW = 'application';

const STEPS = { direction: 'direction', content: 'content', files: 'files' };

/**
 * Ketma-ket (yoki albom bo'lib) kelgan fayllarni kutish taymerlari.
 * Kalit — telegramId.
 *
 * @type {Map<number, NodeJS.Timeout>}
 */
const pendingSaves = new Map();

function cancelPending(telegramId) {
  const timer = pendingSaves.get(telegramId);

  if (timer) {
    clearTimeout(timer);
    pendingSaves.delete(telegramId);
  }
}

/** "Ariza berish" — oqimni boshlaydi. */
export async function startApplication(ctx) {
  const user = ctx.state.user;
  const directions = await getActiveDirections();

  cancelPending(user.telegramId);
  setSession(user, { flow: APPLICATION_FLOW, step: STEPS.direction, draft: {} });
  await user.save();

  await ctx.reply(MESSAGES.chooseDirection, {
    reply_markup: directionsKeyboard(directions.map((item) => item.name)),
  });
}

/** Oqimning joriy qadamiga kelgan javobni yo'naltiradi. */
export async function handleApplicationStep(ctx) {
  const user = ctx.state.user;

  switch (user.session?.step) {
    case STEPS.direction:
      return handleDirection(ctx, user);
    case STEPS.content:
      return handleContent(ctx, user);
    case STEPS.files:
      return handleFiles(ctx, user);
    default:
      clearSession(user);
      await user.save();
      return showMainMenu(ctx);
  }
}

async function handleDirection(ctx, user) {
  const raw = ctx.message?.text?.trim();

  if (!raw || raw.length < MIN_TEXT_LENGTH || raw.length > MAX_DIRECTION_LENGTH) {
    await ctx.reply(MESSAGES.invalidInput);
    return;
  }

  // Ro'yxatda yo'q nom kiritilsa, "Yangi" holatda yangi yo'nalish yaratiladi.
  const direction = await findOrCreateDirection(raw);

  setSession(user, {
    step: STEPS.content,
    draft: { directionId: String(direction._id) },
  });
  await user.save();

  await ctx.reply(MESSAGES.enterContent, { reply_markup: removeKeyboard });
}

async function handleContent(ctx, user) {
  const raw = ctx.message?.text?.trim();

  if (!raw || raw.length < MIN_TEXT_LENGTH) {
    await ctx.reply(MESSAGES.invalidInput);
    return;
  }

  setSession(user, {
    step: STEPS.files,
    draft: { ...user.session.draft, content: raw, files: [] },
  });
  await user.save();

  await ctx.reply(MESSAGES.attachFiles, { reply_markup: skipKeyboard });
}

async function handleFiles(ctx, user) {
  if (ctx.message?.text?.trim() === BUTTONS.skip) {
    await saveApplication(ctx, user);
    return;
  }

  const source = extractFile(ctx.message ?? {});

  if (!source) {
    await ctx.reply(MESSAGES.invalidInput, { reply_markup: skipKeyboard });
    return;
  }

  let stored;

  try {
    stored = await downloadTelegramFile(ctx.api, source);
  } catch (error) {
    logger.error('Fayl yuklab olinmadi:', error);
    await ctx.reply(MESSAGES.fileFailed, { reply_markup: skipKeyboard });
    return;
  }

  setSession(user, {
    draft: { ...user.session.draft, files: [...(user.session.draft.files ?? []), stored] },
  });
  await user.save();

  // Albomdagi qolgan fayllar kelishi uchun biroz kutiladi.
  scheduleSave(ctx, user);
}

function scheduleSave(ctx, user) {
  const telegramId = user.telegramId;

  cancelPending(telegramId);

  const timer = setTimeout(async () => {
    pendingSaves.delete(telegramId);

    try {
      const fresh = await User.findById(user._id);

      if (fresh?.session?.flow === APPLICATION_FLOW && fresh.session.step === STEPS.files) {
        await saveApplication(ctx, fresh);
      }
    } catch (error) {
      logger.error('Arizani saqlashda xatolik:', error);
    }
  }, FILE_COLLECT_WINDOW_MS);

  pendingSaves.set(telegramId, timer);
}

async function saveApplication(ctx, user) {
  cancelPending(user.telegramId);

  const draft = user.session?.draft ?? {};

  if (!draft.directionId || !draft.content) {
    clearSession(user);
    await user.save();
    await showMainMenu(ctx);
    return;
  }

  await createApplication({
    user: user._id,
    direction: draft.directionId,
    content: draft.content,
    files: draft.files ?? [],
  });

  clearSession(user);
  await user.save();

  await ctx.reply(MESSAGES.applicationSent, { reply_markup: mainMenuKeyboard });
}

/** Server to'xtaganda kutilayotgan taymerlarni bekor qiladi. */
export function cancelAllPendingSaves() {
  for (const timer of pendingSaves.values()) {
    clearTimeout(timer);
  }

  pendingSaves.clear();
}
