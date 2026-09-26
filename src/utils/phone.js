/**
 * O'zbekiston raqamining milliy qismi: operator/hudud kodi + 7 raqam.
 * Masalan 93 123 45 67 -> 931234567
 */
const UZ_PHONE_RE = /^(?:20|33|5[015]|6[0-9]|7[0-9]|88|9[0-9])[0-9]{7}$/;

/**
 * Turli ko'rinishda kiritilgan raqamni +998XXXXXXXXX formatiga keltiradi.
 * Qabul qilinadi: 998931234567, +998 93 123 45 67, 931234567, 93 1234567,
 * +93 123 45 67, 00998931234567, 0931234567.
 *
 * @param {string} input
 * @returns {string | null} Formatlangan raqam yoki noto'g'ri bo'lsa null.
 */
export function normalizePhone(input) {
  let digits = String(input ?? '').replace(/\D/g, '');

  if (digits.startsWith('00')) {
    digits = digits.slice(2);
  }

  if (digits.length === 12 && digits.startsWith('998')) {
    digits = digits.slice(3);
  } else if (digits.length === 10 && digits.startsWith('0')) {
    digits = digits.slice(1);
  }

  return UZ_PHONE_RE.test(digits) ? `+998${digits}` : null;
}
