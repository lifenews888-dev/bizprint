-- ─────────────────────────────────────────────────────────────────────────────
-- BizPrint production schema sync — 2026-04-23
--
-- Run ONCE on the Railway Postgres console after deploying commits up to
-- 9562aa3 (B2B campaign system). Idempotent — safe to re-run.
--
-- What this adds:
--   • New columns on existing tables: users.referred_by_sales_id,
--     users.referral_code_used, orders.sales_agent_id,
--     products.created_by_user_id, carts.created_at, carts.updated_at
--   • New tables: sales_products, sales_commissions, designer_royalties,
--     campaigns, campaign_orders, campaign_recipients, campaign_milestones
--
-- HOW TO RUN ON RAILWAY:
--   1. Open Railway dashboard → bizprint project → Postgres service
--   2. Click "Data" or "Query" tab
--   3. Paste the entire contents of this file
--   4. Click "Run"
--   5. Backend will redeploy automatically and start working
-- ─────────────────────────────────────────────────────────────────────────────

BEGIN;

-- ── 1. New columns on existing tables ────────────────────────────────────────
ALTER TABLE users ADD COLUMN IF NOT EXISTS referred_by_sales_id varchar;
ALTER TABLE users ADD COLUMN IF NOT EXISTS referral_code_used    varchar;

ALTER TABLE orders ADD COLUMN IF NOT EXISTS sales_agent_id varchar;

ALTER TABLE products ADD COLUMN IF NOT EXISTS created_by_user_id varchar;

ALTER TABLE carts ADD COLUMN IF NOT EXISTS created_at timestamp NOT NULL DEFAULT NOW();
ALTER TABLE carts ADD COLUMN IF NOT EXISTS updated_at timestamp NOT NULL DEFAULT NOW();

-- ── 2. Sales storefront — agent's adopted product catalog ────────────────────
CREATE TABLE IF NOT EXISTS sales_products (
  id                       uuid          PRIMARY KEY DEFAULT gen_random_uuid(),
  sales_user_id            varchar       NOT NULL,
  product_id               varchar       NOT NULL,
  commission_rate_override decimal(5,2),
  sort_order               integer       NOT NULL DEFAULT 0,
  is_active                boolean       NOT NULL DEFAULT true,
  agent_note               text,
  created_at               timestamp     NOT NULL DEFAULT NOW(),
  CONSTRAINT uk_sales_products UNIQUE (sales_user_id, product_id)
);
CREATE INDEX IF NOT EXISTS idx_sales_products_active
  ON sales_products (sales_user_id, is_active);

-- ── 3. Sales commission ──────────────────────────────────────────────────────
-- Reuse the existing commission_status_enum if it exists, otherwise create.
DO $$ BEGIN
  CREATE TYPE commission_status_enum AS ENUM ('pending', 'approved', 'paid', 'cancelled');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE TABLE IF NOT EXISTS sales_commissions (
  id                 uuid          PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id           varchar,
  sales_user_id      varchar       NOT NULL,
  sales_user_name    varchar,
  order_total        decimal(14,2) NOT NULL DEFAULT 0,
  margin_amount      decimal(14,2) NOT NULL DEFAULT 0,
  commission_rate    decimal(5,2)  NOT NULL DEFAULT 10,
  commission_amount  decimal(14,2) NOT NULL DEFAULT 0,
  status             commission_status_enum NOT NULL DEFAULT 'pending',
  paid_at            timestamp,
  payout_batch_id    varchar,
  notes              text,
  created_at         timestamp     NOT NULL DEFAULT NOW()
);

-- ── 4. Designer royalty ──────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS designer_royalties (
  id                uuid          PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id          varchar,
  designer_user_id  varchar       NOT NULL,
  template_id       varchar,
  template_name     varchar,
  order_total       decimal(14,2) NOT NULL DEFAULT 0,
  royalty_rate      decimal(5,2)  NOT NULL DEFAULT 5,
  royalty_amount    decimal(14,2) NOT NULL DEFAULT 0,
  status            commission_status_enum NOT NULL DEFAULT 'pending',
  paid_at           timestamp,
  payout_batch_id   varchar,
  created_at        timestamp     NOT NULL DEFAULT NOW()
);

-- ── 5. Campaign tables (B2B) ─────────────────────────────────────────────────
DO $$ BEGIN
  CREATE TYPE campaign_status_enum AS ENUM (
    'draft','submitted','quoted','approved','in_production',
    'partially_delivered','completed','cancelled'
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE campaign_order_type_enum AS ENUM ('personalised','bulk');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE campaign_order_status_enum AS ENUM (
    'planned','quoted','approved','in_production','dispatched','delivered','cancelled'
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE milestone_type_enum AS ENUM ('deliverable','payment','review','custom');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE milestone_status_enum AS ENUM (
    'upcoming','in_progress','completed','overdue','skipped'
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE TABLE IF NOT EXISTS campaigns (
  id                      uuid          PRIMARY KEY DEFAULT gen_random_uuid(),
  code                    varchar       NOT NULL UNIQUE,
  customer_id             varchar       NOT NULL,
  customer_company        varchar,
  customer_contact_name   varchar,
  customer_contact_phone  varchar,
  customer_contact_email  varchar,
  title                   varchar       NOT NULL,
  description             text,
  sales_agent_id          varchar,
  brand_kit               jsonb,
  status                  campaign_status_enum NOT NULL DEFAULT 'draft',
  recipient_count         integer       NOT NULL DEFAULT 0,
  estimated_budget        decimal(14,2) NOT NULL DEFAULT 0,
  total_amount            decimal(14,2) NOT NULL DEFAULT 0,
  start_date              date,
  deadline                date,
  admin_notes             text,
  created_at              timestamp     NOT NULL DEFAULT NOW(),
  updated_at              timestamp     NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS campaign_orders (
  id                  uuid          PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id         uuid          NOT NULL REFERENCES campaigns(id) ON DELETE CASCADE,
  product_id          varchar,
  product_name        varchar,
  product_category    varchar,
  type                campaign_order_type_enum NOT NULL DEFAULT 'bulk',
  quantity            integer       NOT NULL DEFAULT 0,
  per_recipient_qty   integer,
  unit_price          decimal(14,2) NOT NULL DEFAULT 0,
  total_price         decimal(14,2) NOT NULL DEFAULT 0,
  specs               jsonb,
  design_overrides    jsonb,
  status              campaign_order_status_enum NOT NULL DEFAULT 'planned',
  scheduled_start     date,
  scheduled_delivery  date,
  spawned_order_id    varchar,
  created_at          timestamp     NOT NULL DEFAULT NOW(),
  updated_at          timestamp     NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS campaign_recipients (
  id                uuid       PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id       uuid       NOT NULL REFERENCES campaigns(id) ON DELETE CASCADE,
  row_number        integer    NOT NULL,
  full_name         varchar,
  job_title         varchar,
  department        varchar,
  phone             varchar,
  email             varchar,
  delivery_address  varchar,
  delivery_city     varchar,
  data              jsonb,
  generated_assets  jsonb,
  status            varchar    NOT NULL DEFAULT 'pending',
  created_at        timestamp  NOT NULL DEFAULT NOW(),
  updated_at        timestamp  NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_campaign_recipients
  ON campaign_recipients (campaign_id, row_number);

CREATE TABLE IF NOT EXISTS campaign_milestones (
  id                  uuid          PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id         uuid          NOT NULL REFERENCES campaigns(id) ON DELETE CASCADE,
  campaign_order_id   varchar,
  title               varchar       NOT NULL,
  description         text,
  type                milestone_type_enum   NOT NULL DEFAULT 'deliverable',
  status              milestone_status_enum NOT NULL DEFAULT 'upcoming',
  due_date            date          NOT NULL,
  completed_at        date,
  sort_order          integer       NOT NULL DEFAULT 0,
  amount              decimal(14,2),
  created_at          timestamp     NOT NULL DEFAULT NOW()
);

COMMIT;

-- ── Sanity check ─────────────────────────────────────────────────────────────
-- After running, you should see all of these return non-zero:
--   SELECT COUNT(*) FROM information_schema.columns
--     WHERE table_name='users' AND column_name='referred_by_sales_id';      -- 1
--   SELECT COUNT(*) FROM information_schema.columns
--     WHERE table_name='orders' AND column_name='sales_agent_id';           -- 1
--   SELECT to_regclass('sales_products')      IS NOT NULL;                  -- t
--   SELECT to_regclass('sales_commissions')   IS NOT NULL;                  -- t
--   SELECT to_regclass('designer_royalties')  IS NOT NULL;                  -- t
--   SELECT to_regclass('campaigns')           IS NOT NULL;                  -- t
--   SELECT to_regclass('campaign_orders')     IS NOT NULL;                  -- t
--   SELECT to_regclass('campaign_recipients') IS NOT NULL;                  -- t
--   SELECT to_regclass('campaign_milestones') IS NOT NULL;                  -- t
