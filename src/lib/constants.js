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

// ---------- Пресеты брендов и моделей ----------

export const GPU_PRESETS = {
  NVIDIA: [
    "RTX 5090", "RTX 5080", "RTX 5070 Ti", "RTX 5070", "RTX 5060 Ti", "RTX 5060",
    "RTX 4090", "RTX 4080 Super", "RTX 4080", "RTX 4070 Ti Super", "RTX 4070 Ti", "RTX 4070 Super", "RTX 4070", "RTX 4060 Ti", "RTX 4060",
    "RTX 3090 Ti", "RTX 3090", "RTX 3080 Ti", "RTX 3080", "RTX 3070 Ti", "RTX 3070", "RTX 3060 Ti", "RTX 3060", "RTX 3050",
    "RTX 2080 Ti", "RTX 2080 Super", "RTX 2080", "RTX 2070 Super", "RTX 2070", "RTX 2060 Super", "RTX 2060",
    "GTX 1660 Super", "GTX 1660 Ti", "GTX 1660", "GTX 1650"
  ],
  AMD: [
    "RX 9070 XT", "RX 9070", "RX 9060 XT",
    "RX 7900 XTX", "RX 7900 XT", "RX 7900 GRE", "RX 7800 XT", "RX 7700 XT", "RX 7600 XT", "RX 7600",
    "RX 6950 XT", "RX 6900 XT", "RX 6800 XT", "RX 6800", "RX 6750 XT", "RX 6700 XT", "RX 6700", "RX 6650 XT", "RX 6600 XT", "RX 6600", "RX 6500 XT",
    "RX 5700 XT", "RX 5700"
  ],
  Intel: ["Arc B580", "Arc B570", "Arc A770", "Arc A750", "Arc A580", "Arc A380"]
};

export const CPU_PRESETS = {
  Intel: [
    "Core Ultra 9 285K", "Core Ultra 7 265K", "Core Ultra 5 245K",
    "Core i9-14900K", "Core i7-14700K", "Core i5-14600K", "Core i5-14400F",
    "Core i9-13900K", "Core i7-13700K", "Core i5-13600K", "Core i5-13400F",
    "Core i9-12900K", "Core i7-12700K", "Core i5-12600K", "Core i5-12400F", "Core i3-12100F"
  ],
  AMD: [
    "Ryzen 9 9950X3D", "Ryzen 9 9950X", "Ryzen 9 9900X", "Ryzen 7 9800X3D", "Ryzen 7 9700X", "Ryzen 5 9600X",
    "Ryzen 9 7950X3D", "Ryzen 9 7900X", "Ryzen 7 7800X3D", "Ryzen 7 7700X", "Ryzen 5 7600X", "Ryzen 5 7600",
    "Ryzen 9 5950X", "Ryzen 9 5900X", "Ryzen 7 5800X3D", "Ryzen 7 5700X", "Ryzen 5 5600X", "Ryzen 5 5600", "Ryzen 5 5500"
  ]
};

export const RAM_PRESETS = {
  "DDR5": [
    "Kingston Fury Beast DDR5 16GB", "Kingston Fury Beast DDR5 32GB",
    "Corsair Vengeance DDR5 16GB", "Corsair Vengeance DDR5 32GB",
    "G.Skill Trident Z5 DDR5 32GB", "G.Skill Ripjaws S5 DDR5 32GB",
    "ADATA XPG Lancer DDR5 32GB", "Patriot Viper DDR5 32GB",
    "TeamGroup T-Force DDR5 32GB", "Crucial DDR5 32GB"
  ],
  "DDR4": [
    "Kingston Fury Beast DDR4 16GB", "Kingston Fury Beast DDR4 32GB",
    "Corsair Vengeance LPX DDR4 16GB", "Corsair Vengeance LPX DDR4 32GB",
    "G.Skill Ripjaws V DDR4 16GB", "G.Skill Trident Z RGB DDR4 32GB",
    "ADATA XPG Gammix D20 DDR4 16GB", "Patriot Viper Steel DDR4 16GB",
    "Crucial Ballistix DDR4 16GB"
  ]
};

export const MOTHERBOARD_PRESETS = {
  "AMD AM5": [
    "ASUS ROG Strix X670E-E", "ASUS TUF Gaming B650-Plus", "ASUS Prime B650M-A",
    "MSI MPG X670E Carbon", "MSI MAG B650 Tomahawk", "MSI PRO B650M-A",
    "Gigabyte X670E Aorus Master", "Gigabyte B650 Aorus Elite", "Gigabyte B650M DS3H",
    "ASRock X670E Taichi", "ASRock B650 Pro RS"
  ],
  "AMD AM4": [
    "ASUS ROG Strix B550-F", "ASUS TUF Gaming B550-Plus", "ASUS Prime B450M-A",
    "MSI MAG B550 Tomahawk", "MSI B450 Tomahawk Max",
    "Gigabyte B550 Aorus Elite", "Gigabyte B450M DS3H"
  ],
  "Intel LGA1700": [
    "ASUS ROG Strix Z790-A", "ASUS TUF Gaming Z790-Plus", "ASUS Prime B760M-A",
    "MSI MPG Z790 Carbon", "MSI MAG B760 Tomahawk",
    "Gigabyte Z790 Aorus Elite", "Gigabyte B760M DS3H"
  ],
  "Intel LGA1851": [
    "ASUS ROG Strix Z890-A", "ASUS TUF Gaming Z890-Plus",
    "MSI MPG Z890 Carbon", "Gigabyte Z890 Aorus Elite"
  ]
};

export const PSU_PRESETS = {
  "до 600W": [
    "Corsair CV550 550W", "Cooler Master MWE 550W", "be quiet! System Power 10 550W",
    "Deepcool PF600 600W", "Aerocool VX Plus 600W"
  ],
  "600-750W": [
    "Corsair RM650e 650W", "Corsair RM750e 750W", "be quiet! Pure Power 12 M 650W",
    "Seasonic Focus GX-650 650W", "Cooler Master MWE Gold 650W",
    "Deepcool PQ750M 750W", "MSI MAG A650BN 650W"
  ],
  "750-850W": [
    "Corsair RM850e 850W", "Corsair RM850x 850W", "be quiet! Straight Power 12 850W",
    "Seasonic Focus GX-850 850W", "MSI MPG A850G PCIE5 850W",
    "Deepcool PX850G 850W", "Cooler Master MWE Gold 850W"
  ],
  "1000W+": [
    "Corsair HX1000i 1000W", "Corsair RM1000e 1000W", "Corsair AX1600i 1600W",
    "be quiet! Dark Power 13 1000W", "Seasonic Prime TX-1000 1000W",
    "MSI MEG Ai1300P PCIE5 1300W", "Deepcool PX1000G 1000W"
  ]
};

// ---------- Маппинг категории → компонент для формы ----------
export const CATEGORY_TO_COMPONENT = {
  "Видеокарты": "GPU",
  "Процессоры": "CPU",
  "Оперативная память": "RAM",
  "Материнские платы": "MOTHERBOARD",
  "Блоки питания": "PSU",
  "Накопители (SSD/HDD)": "STORAGE",
};

export const PC_BUILD_COMPONENTS = ["GPU", "CPU", "RAM", "MOTHERBOARD", "PSU"];

export const COMPONENT_LABELS = {
  GPU: "Видеокарта",
  CPU: "Процессор",
  RAM: "Оперативная память",
  MOTHERBOARD: "Материнская плата",
  PSU: "Блок питания",
  STORAGE: "Накопитель",
};

export const COMPONENT_PRESETS = {
  GPU: GPU_PRESETS,
  CPU: CPU_PRESETS,
  RAM: RAM_PRESETS,
  MOTHERBOARD: MOTHERBOARD_PRESETS,
  PSU: PSU_PRESETS,
};

// Хелперы (опционально, для будущего)
export const findBrandByModel = (presets, model) => {
  for (const brand of Object.keys(presets)) {
    if (presets[brand].includes(model)) return brand;
  }
  return null;
};

// ---------- Типы тестов ----------
export const TYPES = [
  ["GPU", "Видеокарты", "FurMark / Superposition, температуры GPU и HotSpot, майнинг не использовалась"],
  ["CPU", "Процессоры", "AIDA64 / OCCT"],
  ["RAM", "Оперативная память", "TestMem5 / OCCT"],
  ["STORAGE", "Накопители (SSD/HDD)", "CrystalDiskInfo: здоровье, часы наработки"],
  ["MOTHERBOARD", "Материнские платы", "AIDA64"],
];

export const CAT_TO_TYPE = Object.fromEntries(TYPES.map(([key, cat]) => [cat, key]));
export const COMPONENT_KEYS = TYPES.map(([k]) => k);

export const MAX_PRICE = 2_000_000_000;
export const MAX_FILE_SIZE = 5 * 1024 * 1024;
export const MAX_PHOTOS = 6;
export const MAX_TITLE = 120;
export const MAX_DESCRIPTION = 5000;
export const MAX_BIO = 500;
export const MAX_MESSAGE = 2000;
export const MAX_REVIEW_TEXT = 500;