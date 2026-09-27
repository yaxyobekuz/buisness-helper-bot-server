import { MIN_TEXT_LENGTH } from '../constants.js';
import { cancelKeyboard } from '../keyboards/index.js';
import { normalizePhone } from '../../utils/phone.js';

/**
 * @typedef {{ ok: true, value: string } | { ok: false }} ValidationResult
 * @typedef {{ name: string, question: string, keyboard: object,
 *             validate: (raw: string) => ValidationResult }} ApplicationStep
 */

/** @type {(raw: string) => ValidationResult} */
function text(raw) {
  const value = raw.trim().replace(/\s+/g, ' ');

  return value.length >= MIN_TEXT_LENGTH ? { ok: true, value } : { ok: false };
}

/** @type {(raw: string) => ValidationResult} */
function phone(raw) {
  const value = normalizePhone(raw);

  return value ? { ok: true, value } : { ok: false };
}

/**
 * Ariza qadamlari — tartib shu massivda belgilanadi.
 * `name` ayni paytda Application modelidagi maydon nomi hamdir.
 *
 * @type {ApplicationStep[]}
 */
export const APPLICATION_STEPS = [
  {
    name: 'fullName',
    question: 'F.I.Sh. kiriting!',
    keyboard: cancelKeyboard,
    validate: text,
  },
  {
    name: 'address',
    question: 'Manzilni kiriting!',
    keyboard: cancelKeyboard,
    validate: text,
  },
  {
    name: 'phone',
    question: "Telefon raqamingizni jo'nating!",
    keyboard: cancelKeyboard,
    validate: phone,
  },
  {
    name: 'content',
    question: 'Murojaat mazmunini kiriting!',
    keyboard: cancelKeyboard,
    validate: text,
  },
];

export const APPLICATION_FLOW = 'application';

export const FIRST_STEP = APPLICATION_STEPS[0];

/** @param {string | null | undefined} name */
export function findStep(name) {
  const index = APPLICATION_STEPS.findIndex((step) => step.name === name);

  return index === -1 ? null : { index, step: APPLICATION_STEPS[index] };
}

/** @param {number} index */
export function nextStep(index) {
  return APPLICATION_STEPS[index + 1] ?? null;
}
