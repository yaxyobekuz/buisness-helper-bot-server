import { MIN_INN_LENGTH, MIN_TEXT_LENGTH } from '../constants.js';
import { ACTIVITY_TYPES, activityTypeKeyboard, removeKeyboard } from '../keyboards/index.js';
import { normalizePhone } from '../../utils/phone.js';

/**
 * @typedef {{ ok: true, value: string } | { ok: false }} ValidationResult
 * @typedef {{ name: string, question: string, keyboard: object,
 *             validate: (raw: string) => ValidationResult }} RegistrationStep
 */

/**
 * Berilgan uzunlikdan qisqa bo'lmagan matnni talab qiladigan validator yasaydi.
 *
 * @param {number} minLength
 * @returns {(raw: string) => ValidationResult}
 */
function textOfLength(minLength) {
  return (raw) => {
    const value = raw.trim().replace(/\s+/g, ' ');

    return value.length >= minLength ? { ok: true, value } : { ok: false };
  };
}

const text = textOfLength(MIN_TEXT_LENGTH);
const inn = textOfLength(MIN_INN_LENGTH);

/** @type {(raw: string) => ValidationResult} */
function activityType(raw) {
  const value = raw.trim();

  return ACTIVITY_TYPES.includes(value) ? { ok: true, value } : { ok: false };
}

/** @type {(raw: string) => ValidationResult} */
function phone(raw) {
  const value = normalizePhone(raw);

  return value ? { ok: true, value } : { ok: false };
}

/**
 * Ro'yxatdan o'tish qadamlari — tartib shu massivda belgilanadi.
 * `name` ayni paytda User modelidagi maydon nomi hamdir.
 *
 * @type {RegistrationStep[]}
 */
export const REGISTRATION_STEPS = [
  {
    name: 'organizationName',
    question: 'Tashkilot nomini kiriting!',
    keyboard: removeKeyboard,
    validate: text,
  },
  {
    name: 'activityType',
    question: 'Faoliyat turi (YaTT, MChJ)',
    keyboard: activityTypeKeyboard,
    validate: activityType,
  },
  {
    name: 'directorFullName',
    question: 'Rahbar F.I.Sh.',
    keyboard: removeKeyboard,
    validate: text,
  },
  {
    name: 'address',
    question: 'Manzil',
    keyboard: removeKeyboard,
    validate: text,
  },
  {
    name: 'inn',
    question: 'INN',
    keyboard: removeKeyboard,
    validate: inn,
  },
  {
    name: 'phone',
    question: "Telefon raqamingizni jo'nating",
    keyboard: removeKeyboard,
    validate: phone,
  },
];

export const REGISTRATION_FLOW = 'registration';

export const FIRST_STEP = REGISTRATION_STEPS[0];

/** @param {string | null} name */
export function findStep(name) {
  const index = REGISTRATION_STEPS.findIndex((step) => step.name === name);

  return index === -1 ? null : { index, step: REGISTRATION_STEPS[index] };
}

/** @param {number} index */
export function nextStep(index) {
  return REGISTRATION_STEPS[index + 1] ?? null;
}
