-- ─────────────────────────────────────────────────────────────────────────────
-- BizPrint — имэйл маркетингийн хүснэгтүүд
--
-- `marketing_email_*` entity-ууд 2026-06-27-ны "email marketing foundation"
-- commit-оор нэмэгдсэн боловч migration бичигдээгүй байсан. Production дээр
-- synchronize=false тул гурван хүснэгт хоёулаа байхгүй — үүнийг
-- production DB-ээс information_schema-аар шалгаж баталгаажуулсан.
--
-- Migration байхгүйгээр backend-ийг deploy хийвэл /marketing/email/* бүх
-- эндпойнт 500 буцаана (админы "Имэйл маркетинг" хуудас бүхэлдээ ажиллахгүй).
--
-- Схем нь дараах entity-үүдээс гаралтай:
--   backend/src/marketing/email-contact.entity.ts
--   backend/src/marketing/email-campaign.entity.ts
--   backend/src/marketing/email-send-log.entity.ts
--
-- Idempotent — дахин ажиллуулахад хоргүй.
-- ─────────────────────────────────────────────────────────────────────────────

BEGIN;

-- ── 1. Харилцагчийн имэйл сан ────────────────────────────────────────────────
-- tags нь TypeORM-ын 'simple-array' тул text (таслалаар холбосон), массив биш.
CREATE TABLE IF NOT EXISTS marketing_email_contacts (
  id              uuid      PRIMARY KEY DEFAULT gen_random_uuid(),
  email           varchar   NOT NULL UNIQUE,
  name            varchar,
  company         varchar,
  phone           varchar,
  user_id         varchar,
  source          varchar   NOT NULL DEFAULT 'manual',
  status          varchar   NOT NULL DEFAULT 'subscribed',
  tags            text,
  metadata        jsonb,
  unsubscribed_at timestamp,
  last_synced_at  timestamp,
  created_at      timestamp NOT NULL DEFAULT NOW(),
  updated_at      timestamp NOT NULL DEFAULT NOW()
);

-- ── 2. Кампанит ажил ─────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS marketing_email_campaigns (
  id               uuid      PRIMARY KEY DEFAULT gen_random_uuid(),
  name             varchar   NOT NULL,
  subject          varchar   NOT NULL,
  preheader        varchar,
  html             text      NOT NULL,
  segment          varchar   NOT NULL DEFAULT 'all',
  status           varchar   NOT NULL DEFAULT 'draft',
  sender_name      varchar,
  sender_email     varchar,
  batch_size       integer   NOT NULL DEFAULT 40,
  delay_ms         integer   NOT NULL DEFAULT 2000,
  total_recipients integer   NOT NULL DEFAULT 0,
  sent_count       integer   NOT NULL DEFAULT 0,
  failed_count     integer   NOT NULL DEFAULT 0,
  dry_run_count    integer   NOT NULL DEFAULT 0,
  last_sent_at     timestamp,
  created_at       timestamp NOT NULL DEFAULT NOW(),
  updated_at       timestamp NOT NULL DEFAULT NOW()
);

-- ── 3. Илгээлтийн лог ────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS marketing_email_send_logs (
  id          uuid      PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id varchar   NOT NULL,
  contact_id  varchar,
  email       varchar   NOT NULL,
  status      varchar   NOT NULL,
  message_id  varchar,
  error       text,
  created_at  timestamp NOT NULL DEFAULT NOW()
);

-- ── 4. Индексүүд ─────────────────────────────────────────────────────────────
-- Сегментчилсэн хүлээн авагчийн тоо status-аар шүүгддэг.
CREATE INDEX IF NOT EXISTS idx_marketing_email_contacts_status
  ON marketing_email_contacts (status);

-- Хэрэглэгчээс sync хийхэд user_id-аар тааруулна.
CREATE INDEX IF NOT EXISTS idx_marketing_email_contacts_user
  ON marketing_email_contacts (user_id)
  WHERE user_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_marketing_email_campaigns_status
  ON marketing_email_campaigns (status, created_at DESC);

-- Кампанит ажлын илгээлтийн тайлан campaign_id-аар уншигдана.
CREATE INDEX IF NOT EXISTS idx_marketing_email_send_logs_campaign
  ON marketing_email_send_logs (campaign_id, created_at DESC);

COMMIT;
