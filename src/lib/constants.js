// ---------- Города ----------
export const CITIES = [
  "Актау",
  "Алматы",
  "Астана",
  "Шымкент",
  "Актобе",
  "Атырау",
  "Караганда",
  "Костанай",
  "Кызылорда",
  "Павлодар",
  "Петропавловск",
  "Семей",
  "Талдыкорган",
  "Тараз",
  "Уральск",
  "Усть-Каменогорск",
  "Жанаозен",
];

// ---------- Категории ----------
export const CATS = [
  "Видеокарты",
  "Процессоры",
  "Оперативная память",
  "Накопители (SSD/HDD)",
  "Материнские платы",
  "Блоки питания",
  "Корпуса",
  "Готовые ПК",
  "Ноутбуки",
  "Мониторы",
  "Периферия",
  "Другое",
];

// ---------- Типы тестов ----------
// Формат: [ключ ComponentType, название категории, подсказка для поля testTitle]
export const TYPES = [
  ["GPU", "Видеокарты", "FurMark / Superposition, температуры GPU и HotSpot, майнинг не использовалась"],
  ["CPU", "Процессоры", "AIDA64 / OCCT"],
  ["RAM", "Оперативная память", "TestMem5 / OCCT"],
  ["STORAGE", "Накопители (SSD/HDD)", "CrystalDiskInfo: здоровье, часы наработки"],
  ["MOTHERBOARD", "Материнские платы", "AIDA64"],
];

// Маппинг: название категории → ключ ComponentType
export const CAT_TO_TYPE = Object.fromEntries(TYPES.map(([key, cat]) => [cat, key]));

// Массив ключей ComponentType — для итерации в actions.js
export const COMPONENT_KEYS = TYPES.map(([k]) => k);

// ---------- Лимиты ----------
export const MAX_PRICE = 2_000_000_000;
export const MAX_FILE_SIZE = 5 * 1024 * 1024;
export const MAX_PHOTOS = 6;
export const MAX_TITLE = 120;
export const MAX_DESCRIPTION = 5000;
export const MAX_BIO = 500;
export const MAX_MESSAGE = 2000;
export const MAX_REVIEW_TEXT = 500;