/**
 * Эхний каталог — migrations/2026-09-30-01-print-network.sql-тэй ижил утгатай.
 * Production image migrations хавтсыг агуулдаггүй тул PrintNetworkSeedService
 * хүснэгт хоосон үед эндээс дүүргэнэ. Lab нь hex-ээс тооцоолсон ОЙРОЛЦОО утга.
 */
export const SEED_COLORS = [
  { code: 'BP-R101', name: 'Улаан', family: 'red', labL: 48.11, labA: 73.05, labB: 63.6, hex: '#E10600', sortOrder: 10 },
  { code: 'BP-R102', name: 'Час улаан', family: 'red', labL: 43.34, labA: 66.31, labB: 37.52, hex: '#C8102E', sortOrder: 20 },
  { code: 'BP-R103', name: 'Бордо', family: 'red', labL: 28, labA: 40.12, labB: 16.77, hex: '#7A1F2B', sortOrder: 30 },
  { code: 'BP-R104', name: 'Шүрэн', family: 'red', labL: 65.26, labA: 55.28, labB: 36.48, hex: '#FF6F61', sortOrder: 40 },
  { code: 'BP-O101', name: 'BizPrint улбар шар', family: 'orange', labL: 63.99, labA: 54.94, labB: 73.01, hex: '#FF6B00', sortOrder: 50 },
  { code: 'BP-O102', name: 'Тод улбар шар', family: 'orange', labL: 70.88, labA: 38.55, labB: 71.82, hex: '#FF8F1C', sortOrder: 60 },
  { code: 'BP-O103', name: 'Тоосгон', family: 'orange', labL: 45.9, labA: 45.11, labB: 41.02, hex: '#B7472A', sortOrder: 70 },
  { code: 'BP-Y101', name: 'Шар', family: 'yellow', labL: 85.99, labA: 5.81, labB: 85.58, hex: '#FFD100', sortOrder: 80 },
  { code: 'BP-Y102', name: 'Нимбэгэн шар', family: 'yellow', labL: 90.39, labA: -8.03, labB: 83.56, hex: '#F5E625', sortOrder: 90 },
  { code: 'BP-Y103', name: 'Алтлаг шар', family: 'yellow', labL: 72.01, labA: 14.89, labB: 67.92, hex: '#E0A526', sortOrder: 100 },
  { code: 'BP-Y104', name: 'Цөцгий', family: 'yellow', labL: 91.04, labA: -1.4, labB: 30.2, hex: '#F3E5AB', sortOrder: 110 },
  { code: 'BP-G101', name: 'Ногоон', family: 'green', labL: 59.73, labA: -52.63, labB: 33.51, hex: '#00A650', sortOrder: 120 },
  { code: 'BP-G102', name: 'Хар ногоон', family: 'green', labL: 34.37, labA: -30.82, labB: 12.78, hex: '#0B5D3B', sortOrder: 130 },
  { code: 'BP-G103', name: 'Шинэ навч', family: 'green', labL: 70.3, labA: -40, labB: 63.98, hex: '#78BE20', sortOrder: 140 },
  { code: 'BP-G104', name: 'Оливын', family: 'green', labL: 51.66, labA: -15.6, labB: 36.99, hex: '#708238', sortOrder: 150 },
  { code: 'BP-G105', name: 'Мятан', family: 'green', labL: 81.28, labA: -24.19, labB: 3.64, hex: '#98D7C2', sortOrder: 160 },
  { code: 'BP-B101', name: 'Цэнхэр', family: 'blue', labL: 37.37, labA: 8.95, labB: -58.48, hex: '#0057B8', sortOrder: 170 },
  { code: 'BP-B102', name: 'Хар хөх', family: 'blue', labL: 17.08, labA: 2.37, labB: -22.2, hex: '#1B2A4A', sortOrder: 180 },
  { code: 'BP-B103', name: 'Тэнгэрийн цэнхэр', family: 'blue', labL: 63.62, labA: -13.05, labB: -37.19, hex: '#4FA3DC', sortOrder: 190 },
  { code: 'BP-B104', name: 'Цайвар цэнхэр', family: 'blue', labL: 78.59, labA: -4.1, labB: -23.04, hex: '#A7C6ED', sortOrder: 200 },
  { code: 'BP-B105', name: 'Оюу', family: 'blue', labL: 60.59, labA: -33.77, labB: -15.88, hex: '#00A3AD', sortOrder: 210 },
  { code: 'BP-P101', name: 'Нил ягаан', family: 'purple', labL: 50.69, labA: 45.86, labB: -71.8, hex: '#8B5CF6', sortOrder: 220 },
  { code: 'BP-P102', name: 'Бараан нил', family: 'purple', labL: 26.45, labA: 29.21, labB: -43.94, hex: '#4B2E83', sortOrder: 230 },
  { code: 'BP-P103', name: 'Ягаан', family: 'purple', labL: 50.08, labA: 77.59, labB: -0.55, hex: '#E4007C', sortOrder: 240 },
  { code: 'BP-P104', name: 'Цайвар ягаан', family: 'purple', labL: 76.61, labA: 32.87, labB: -4.08, hex: '#F4A6C6', sortOrder: 250 },
  { code: 'BP-N101', name: 'Бор', family: 'neutral', labL: 32.47, labA: 16.09, labB: 24.57, hex: '#6B4226', sortOrder: 260 },
  { code: 'BP-N102', name: 'Шаргал бор', family: 'neutral', labL: 69.42, labA: 10.47, labB: 26.41, hex: '#C8A27A', sortOrder: 270 },
  { code: 'BP-N103', name: 'Саарал', family: 'neutral', labL: 58.43, labA: -0.84, labB: -1.47, hex: '#8A8D8F', sortOrder: 280 },
  { code: 'BP-N104', name: 'Цайвар саарал', family: 'neutral', labL: 84.34, labA: -0.92, labB: -0.87, hex: '#D0D3D4', sortOrder: 290 },
  { code: 'BP-N105', name: 'Бараан саарал', family: 'neutral', labL: 26.86, labA: -0.95, labB: -1.69, hex: '#3D4042', sortOrder: 300 },
  { code: 'BP-K100', name: 'Хар', family: 'neutral', labL: 9.26, labA: 0, labB: 0, hex: '#1A1A1A', sortOrder: 310 },
  { code: 'BP-W100', name: 'Цагаан', family: 'neutral', labL: 100, labA: 0, labB: 0, hex: '#FFFFFF', sortOrder: 320 },
]

export const SEED_PRODUCT_TYPES: { key: string; name: string; media: { key: string; name: string }[]; sortOrder: number }[] = [
  { key: 'dtf_transfer', name: 'DTF хэвлэл (хувцас)', media: [{"key":"pet_film","name":"PET хальс"}], sortOrder: 10 },
  { key: 'banner', name: 'Баннер', media: [{"key":"frontlit_440","name":"Frontlit 440г"},{"key":"backlit","name":"Backlit"},{"key":"mesh","name":"Mesh тор"}], sortOrder: 20 },
  { key: 'sticker', name: 'Наалт', media: [{"key":"vinyl_gloss","name":"Винил гялгар"},{"key":"vinyl_matte","name":"Винил царцсан"},{"key":"transparent","name":"Тунгалаг"}], sortOrder: 30 },
  { key: 'sublimation', name: 'Сублимац хэвлэл', media: [{"key":"polyester","name":"Полиэстер даавуу"},{"key":"sub_paper","name":"Сублимац цаас"}], sortOrder: 40 },
  { key: 'uv_print', name: 'UV хэвлэл', media: [{"key":"acrylic","name":"Акрил"},{"key":"wood","name":"Мод"},{"key":"metal","name":"Металл"}], sortOrder: 50 },
]
