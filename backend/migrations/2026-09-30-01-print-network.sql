-- Хэвлэлийн сүлжээ: өнгөний код каталог, принтер, калибровк (ΔE00),
-- цехийн агент, принтер рүү илгээх ажлын тасалбар (JDF).

CREATE TABLE IF NOT EXISTS color_codes (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code        varchar(32)  NOT NULL UNIQUE,
  name        varchar(120) NOT NULL,
  family      varchar(40),
  lab_l       numeric(6,2) NOT NULL,
  lab_a       numeric(6,2) NOT NULL,
  lab_b       numeric(6,2) NOT NULL,
  hex         varchar(7),
  is_active   boolean      NOT NULL DEFAULT true,
  sort_order  int          NOT NULL DEFAULT 0,
  created_at  timestamptz  NOT NULL DEFAULT now(),
  updated_at  timestamptz  NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS print_agents (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name          varchar(120) NOT NULL,
  vendor_id     uuid,
  token_hash    varchar(64)  NOT NULL UNIQUE,
  last_seen_at  timestamptz,
  version       varchar(40),
  hostname      varchar(120),
  is_active     boolean      NOT NULL DEFAULT true,
  created_at    timestamptz  NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS print_devices (
  id                 uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name               varchar(120) NOT NULL,
  technology         varchar(32)  NOT NULL,
  vendor_id          uuid,
  agent_id           uuid REFERENCES print_agents(id) ON DELETE SET NULL,
  product_types      jsonb        NOT NULL DEFAULT '[]',
  media              jsonb        NOT NULL DEFAULT '[]',
  max_width_mm       int,
  hotfolder_key      varchar(120),
  delta_e_tolerance  numeric(4,2) NOT NULL DEFAULT 3,
  status             varchar(16)  NOT NULL DEFAULT 'active',
  notes              text,
  created_at         timestamptz  NOT NULL DEFAULT now(),
  updated_at         timestamptz  NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS device_color_profiles (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  device_id      uuid NOT NULL REFERENCES print_devices(id) ON DELETE CASCADE,
  color_code_id  uuid NOT NULL REFERENCES color_codes(id) ON DELETE CASCADE,
  media          varchar(80)  NOT NULL DEFAULT '',
  measured_l     numeric(6,2) NOT NULL,
  measured_a     numeric(6,2) NOT NULL,
  measured_b     numeric(6,2) NOT NULL,
  delta_e        numeric(6,2) NOT NULL,
  recipe         jsonb,
  measured_at    timestamptz  NOT NULL DEFAULT now(),
  CONSTRAINT uq_device_color_media UNIQUE (device_id, color_code_id, media)
);
CREATE INDEX IF NOT EXISTS idx_device_color_profiles_device ON device_color_profiles (device_id);

CREATE TABLE IF NOT EXISTS print_tickets (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id       uuid NOT NULL,
  order_item_id  uuid,
  order_number   varchar(64),
  device_id      uuid NOT NULL REFERENCES print_devices(id),
  agent_id       uuid REFERENCES print_agents(id) ON DELETE SET NULL,
  status         varchar(16) NOT NULL DEFAULT 'queued',
  file_url       text  NOT NULL,
  payload        jsonb NOT NULL,
  jdf            text  NOT NULL,
  attempts       int   NOT NULL DEFAULT 0,
  error          text,
  claimed_at     timestamptz,
  finished_at    timestamptz,
  created_at     timestamptz NOT NULL DEFAULT now(),
  updated_at     timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_print_tickets_device_status ON print_tickets (device_id, status);
CREATE INDEX IF NOT EXISTS idx_print_tickets_order ON print_tickets (order_id);

-- Эхний каталог. Lab утгыг sRGB hex-ээс (D50) тооцоолсон — ОЙРОЛЦОО.
-- Эталон дээж хэвлэж спектрофотометрээр хэмжсний дараа admin API-аар шинэчилнэ.
INSERT INTO color_codes (code, name, family, lab_l, lab_a, lab_b, hex, sort_order) VALUES
  ('BP-R101', 'Улаан', 'red', 48.11, 73.05, 63.6, '#E10600', 10),
  ('BP-R102', 'Час улаан', 'red', 43.34, 66.31, 37.52, '#C8102E', 20),
  ('BP-R103', 'Бордо', 'red', 28, 40.12, 16.77, '#7A1F2B', 30),
  ('BP-R104', 'Шүрэн', 'red', 65.26, 55.28, 36.48, '#FF6F61', 40),
  ('BP-O101', 'BizPrint улбар шар', 'orange', 63.99, 54.94, 73.01, '#FF6B00', 50),
  ('BP-O102', 'Тод улбар шар', 'orange', 70.88, 38.55, 71.82, '#FF8F1C', 60),
  ('BP-O103', 'Тоосгон', 'orange', 45.9, 45.11, 41.02, '#B7472A', 70),
  ('BP-Y101', 'Шар', 'yellow', 85.99, 5.81, 85.58, '#FFD100', 80),
  ('BP-Y102', 'Нимбэгэн шар', 'yellow', 90.39, -8.03, 83.56, '#F5E625', 90),
  ('BP-Y103', 'Алтлаг шар', 'yellow', 72.01, 14.89, 67.92, '#E0A526', 100),
  ('BP-Y104', 'Цөцгий', 'yellow', 91.04, -1.4, 30.2, '#F3E5AB', 110),
  ('BP-G101', 'Ногоон', 'green', 59.73, -52.63, 33.51, '#00A650', 120),
  ('BP-G102', 'Хар ногоон', 'green', 34.37, -30.82, 12.78, '#0B5D3B', 130),
  ('BP-G103', 'Шинэ навч', 'green', 70.3, -40, 63.98, '#78BE20', 140),
  ('BP-G104', 'Оливын', 'green', 51.66, -15.6, 36.99, '#708238', 150),
  ('BP-G105', 'Мятан', 'green', 81.28, -24.19, 3.64, '#98D7C2', 160),
  ('BP-B101', 'Цэнхэр', 'blue', 37.37, 8.95, -58.48, '#0057B8', 170),
  ('BP-B102', 'Хар хөх', 'blue', 17.08, 2.37, -22.2, '#1B2A4A', 180),
  ('BP-B103', 'Тэнгэрийн цэнхэр', 'blue', 63.62, -13.05, -37.19, '#4FA3DC', 190),
  ('BP-B104', 'Цайвар цэнхэр', 'blue', 78.59, -4.1, -23.04, '#A7C6ED', 200),
  ('BP-B105', 'Оюу', 'blue', 60.59, -33.77, -15.88, '#00A3AD', 210),
  ('BP-P101', 'Нил ягаан', 'purple', 50.69, 45.86, -71.8, '#8B5CF6', 220),
  ('BP-P102', 'Бараан нил', 'purple', 26.45, 29.21, -43.94, '#4B2E83', 230),
  ('BP-P103', 'Ягаан', 'purple', 50.08, 77.59, -0.55, '#E4007C', 240),
  ('BP-P104', 'Цайвар ягаан', 'purple', 76.61, 32.87, -4.08, '#F4A6C6', 250),
  ('BP-N101', 'Бор', 'neutral', 32.47, 16.09, 24.57, '#6B4226', 260),
  ('BP-N102', 'Шаргал бор', 'neutral', 69.42, 10.47, 26.41, '#C8A27A', 270),
  ('BP-N103', 'Саарал', 'neutral', 58.43, -0.84, -1.47, '#8A8D8F', 280),
  ('BP-N104', 'Цайвар саарал', 'neutral', 84.34, -0.92, -0.87, '#D0D3D4', 290),
  ('BP-N105', 'Бараан саарал', 'neutral', 26.86, -0.95, -1.69, '#3D4042', 300),
  ('BP-K100', 'Хар', 'neutral', 9.26, 0, 0, '#1A1A1A', 310),
  ('BP-W100', 'Цагаан', 'neutral', 100, 0, 0, '#FFFFFF', 320)
ON CONFLICT (code) DO NOTHING;

-- Хэвлэлийн төрөл → дэлгүүрийн бүтээгдэхүүн (үнэ). product_id-г админ холбоно;
-- холбоогүй төрлийг desktop апп "захиалах боломжгүй" гэж харуулна.
CREATE TABLE IF NOT EXISTS print_product_types (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  key         varchar(40)  NOT NULL UNIQUE,
  name        varchar(120) NOT NULL,
  product_id  uuid,
  media       jsonb        NOT NULL DEFAULT '[]',
  is_active   boolean      NOT NULL DEFAULT true,
  sort_order  int          NOT NULL DEFAULT 0,
  created_at  timestamptz  NOT NULL DEFAULT now()
);

INSERT INTO print_product_types (key, name, media, sort_order) VALUES
  ('dtf_transfer', 'DTF хэвлэл (хувцас)', '[{"key":"pet_film","name":"PET хальс"}]', 10),
  ('banner',       'Баннер',              '[{"key":"frontlit_440","name":"Frontlit 440г"},{"key":"backlit","name":"Backlit"},{"key":"mesh","name":"Mesh тор"}]', 20),
  ('sticker',      'Наалт',               '[{"key":"vinyl_gloss","name":"Винил гялгар"},{"key":"vinyl_matte","name":"Винил царцсан"},{"key":"transparent","name":"Тунгалаг"}]', 30),
  ('sublimation',  'Сублимац хэвлэл',     '[{"key":"polyester","name":"Полиэстер даавуу"},{"key":"sub_paper","name":"Сублимац цаас"}]', 40),
  ('uv_print',     'UV хэвлэл',           '[{"key":"acrylic","name":"Акрил"},{"key":"wood","name":"Мод"},{"key":"metal","name":"Металл"}]', 50)
ON CONFLICT (key) DO NOTHING;
