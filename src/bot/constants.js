export const MESSAGES = {
  welcome:
    "Assalomu alaykum, botga xush kelibsiz!\nBotdan foydalanish uchun ro'yxatdan o'ting!",
  invalidInput: "Ma'lumot noto'g'ri",
  registrationCompleted: "Muvaffaqiyatli ro'yxatdan o'tdingiz!",
  mainMenu: 'Bosh sahifa',

  chooseDirection:
    "Murojaat yo'nalishini tanlang!\nAgar siz izlagan yo'nalish yo'q bo'lsa kiriting!",
  enterContent: 'Murojaat mazmunini kiriting!',
  attachFiles:
    "Murojaat faylini kiriting!\nAgar yo'q bo'lsa o'tkazib yuborish tugmasini bosing!",
  applicationSent: "Arizangiz muvaffaqiyatli jo'natildi!",

  chooseButton: 'Tugmalardan birini tanlang!',
  noApplications: "Bu holatda arizalar yo'q.",

  fileTooLarge: 'Fayl hajmi juda katta.',
  fileFailed: "Faylni yuklab bo'lmadi, qaytadan urinib ko'ring.",
};

/** Matnli qadamlar uchun eng kam uzunlik. */
export const MIN_TEXT_LENGTH = 3;

/** INN — aynan shuncha raqamdan iborat bo'lishi shart. */
export const INN_LENGTH = 9;

/** Yo'nalish nomi uchun eng katta uzunlik (Telegram tugmasiga sig'ishi uchun). */
export const MAX_DIRECTION_LENGTH = 64;

/**
 * Albom yoki ketma-ket yuborilgan fayllarni kutish oynasi (ms).
 * Shu vaqt ichida yangi fayl kelmasa ariza saqlanadi.
 */
export const FILE_COLLECT_WINDOW_MS = 2000;
