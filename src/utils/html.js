const ESCAPES = { '&': '&amp;', '<': '&lt;', '>': '&gt;' };

/**
 * Telegram HTML parse_mode uchun matnni xavfsizlantiradi.
 *
 * @param {unknown} value
 */
export function escapeHtml(value) {
  return String(value ?? '').replace(/[&<>]/g, (char) => ESCAPES[char]);
}
