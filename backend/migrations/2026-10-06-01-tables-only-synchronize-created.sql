-- ─────────────────────────────────────────────────────────────────────────────
-- BizPrint — synchronize л үүсгэж байсан хүснэгтүүдийг migration болгох
--
-- ЯАГААД:
-- Эдгээр 6 хүснэгт production-д хэзээ ч байгаагүй. TypeORM `synchronize` нь
-- backend асах бүрт тэднийг чимээгүй үүсгэж, унтрахад нь алга болдог байв —
-- өөрөөр хэлбэл эхлэл бүрт шинээр үүсч, өгөгдөл нь хадгалагддаггүй байсан.
--
-- 2026-10-01-нд `DB_SYNCHRONIZE=false` тавихад эдгээр хүснэгт үүсэхгүй болж,
-- boot дээр тэднийг хайдаг үйлчилгээ уначихсанаар production backend 5 хоног
-- унтарсан.
--
-- SQL нь TypeORM-ийн өөрийнх нь schema builder-ээс (createSchemaBuilder().log())
-- production схемтэй харьцуулан гаргасан — өөрөөр хэлбэл synchronize яг юу
-- ажиллуулдаг байсныг хуулбарлав.
--
-- Эдгээр модулиуд одоогоор `app.module.ts`-д импорт хийгдээгүй ч entity нь
-- entity glob-д ордог тул хүснэгт нь байх шаардлагатай.
--
-- Idempotent — дахин ажиллуулахад хоргүй.
-- ─────────────────────────────────────────────────────────────────────────────

BEGIN;

-- synchronize-ийн үүсгэдэг тодорхойлолт uuid_generate_v4() ашигладаг
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ── 1. pricing_engine_rules-ийн enum төрлүүд ────────────────────────────────
DO $$ BEGIN
  CREATE TYPE "public"."pricing_engine_rules_rule_type_enum"
    AS ENUM('QUANTITY_DISCOUNT', 'RUSH_FEE', 'SIZE_FACTOR', 'MATERIAL_FACTOR', 'COMPETITOR_TACTIC');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE "public"."pricing_engine_rules_condition_operator_enum"
    AS ENUM('GTE', 'LTE', 'EQ', 'BETWEEN');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE "public"."pricing_engine_rules_effect_type_enum"
    AS ENUM('MULTIPLY', 'ADD', 'SUBTRACT', 'SET_MAX', 'SET_MIN');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ── 2. Үнийн хөдөлгүүрийн хүснэгтүүд ────────────────────────────────────────
CREATE TABLE IF NOT EXISTS "pricing_tiers" (
  "id"               uuid          NOT NULL DEFAULT uuid_generate_v4(),
  "code"             varchar       NOT NULL,
  "name_mn"          varchar       NOT NULL,
  "margin_rate"      numeric(5,2)  NOT NULL,
  "min_order_amount" numeric(14,2) NOT NULL DEFAULT '0',
  "description"      text,
  "is_active"        boolean       NOT NULL DEFAULT true,
  CONSTRAINT "UQ_4113c7ac13ecb66ef1bc707c9e0" UNIQUE ("code"),
  CONSTRAINT "PK_f5f75ade45fc37142b2cdbaa2f5" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "pricing_engine_rules" (
  "id"                 uuid          NOT NULL DEFAULT uuid_generate_v4(),
  "name"               varchar       NOT NULL,
  "product_code"       varchar,
  "rule_type"          "public"."pricing_engine_rules_rule_type_enum"          NOT NULL,
  "condition_field"    varchar       NOT NULL,
  "condition_operator" "public"."pricing_engine_rules_condition_operator_enum" NOT NULL,
  "condition_value"    numeric(14,2) NOT NULL,
  "condition_value2"   numeric(14,2),
  "effect_type"        "public"."pricing_engine_rules_effect_type_enum"        NOT NULL,
  "effect_value"       numeric(14,4) NOT NULL,
  "priority"           integer       NOT NULL DEFAULT '100',
  "is_active"          boolean       NOT NULL DEFAULT true,
  "description"        text,
  "created_at"         TIMESTAMP     NOT NULL DEFAULT now(),
  CONSTRAINT "PK_245a0b592795f8c4975993207e4" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "competitor_prices" (
  "id"              uuid          NOT NULL DEFAULT uuid_generate_v4(),
  "factory_name"    varchar       NOT NULL,
  "product_type"    varchar       NOT NULL DEFAULT 'offset',
  "product_subtype" varchar,
  "size"            varchar,
  "gsm"             integer,
  "quantity_min"    integer       NOT NULL DEFAULT '1',
  "quantity_max"    integer,
  "unit_price"      numeric(14,2) NOT NULL,
  "total_price"     numeric(14,2),
  "date_collected"  date,
  "notes"           varchar,
  "is_active"       boolean       NOT NULL DEFAULT true,
  "competitor_name" varchar,
  "product_code"    varchar,
  "price"           numeric(14,2),
  "created_at"      TIMESTAMP     NOT NULL DEFAULT now(),
  "updated_at"      TIMESTAMP     NOT NULL DEFAULT now(),
  CONSTRAINT "PK_bc533b625afbd864d68f9cf8136" PRIMARY KEY ("id")
);

-- ── 3. Үнийн саналын хүргэлт ба гэрээ ───────────────────────────────────────
CREATE TABLE IF NOT EXISTS "quote_deliveries" (
  "id"                uuid        NOT NULL DEFAULT uuid_generate_v4(),
  "quote_id"          varchar     NOT NULL,
  "recipient_email"   varchar,
  "recipient_phone"   varchar,
  "delivery_channel"  varchar     NOT NULL DEFAULT 'EMAIL',
  "status"            varchar     NOT NULL DEFAULT 'DRAFT',
  "public_token_hash" varchar     NOT NULL,
  "sent_at"           TIMESTAMP WITH TIME ZONE,
  "opened_at"         TIMESTAMP WITH TIME ZONE,
  "accepted_at"       TIMESTAMP WITH TIME ZONE,
  "expires_at"        TIMESTAMP WITH TIME ZONE NOT NULL,
  "created_at"        TIMESTAMP   NOT NULL DEFAULT now(),
  "updated_at"        TIMESTAMP   NOT NULL DEFAULT now(),
  CONSTRAINT "UQ_f2a8146fb31d707ce21ddcabd36" UNIQUE ("public_token_hash"),
  CONSTRAINT "PK_716b82577448a80f09f7eb36187" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "contracts" (
  "id"                      uuid      NOT NULL DEFAULT uuid_generate_v4(),
  "quote_id"                varchar   NOT NULL,
  "order_id"                varchar,
  "customer_id"             varchar,
  "contract_number"         varchar   NOT NULL,
  "status"                  varchar   NOT NULL DEFAULT 'DRAFT',
  "template_version"        varchar,
  "terms_json"              jsonb,
  "pdf_url"                 varchar,
  "signed_pdf_url"          varchar,
  "company_stamp_url"       varchar,
  "company_signature_url"   varchar,
  "customer_signature_data" jsonb,
  "customer_ip"             varchar,
  "customer_user_agent"     varchar,
  "signed_at"               TIMESTAMP WITH TIME ZONE,
  "expires_at"              TIMESTAMP WITH TIME ZONE,
  "created_at"              TIMESTAMP NOT NULL DEFAULT now(),
  "updated_at"              TIMESTAMP NOT NULL DEFAULT now(),
  CONSTRAINT "UQ_db84c172dc74e6271e614b68fbd" UNIQUE ("contract_number"),
  CONSTRAINT "PK_2c7b8f3a7b1acdd49497d83d0fb" PRIMARY KEY ("id")
);

-- ── 4. Үйлдвэрийн хуваарилалтын туршилтын хүснэгт ───────────────────────────
CREATE TABLE IF NOT EXISTS "factory" (
  "id"             SERIAL  NOT NULL,
  "name"           varchar NOT NULL,
  "city"           varchar NOT NULL,
  "machine_type"   varchar NOT NULL,
  "speed_per_hour" integer NOT NULL,
  "setup_cost"     integer NOT NULL,
  "run_cost"       integer NOT NULL,
  "current_load"   integer NOT NULL DEFAULT '0',
  CONSTRAINT "PK_1372e5a7d114a3fa80736ba66bb" PRIMARY KEY ("id")
);

COMMIT;
