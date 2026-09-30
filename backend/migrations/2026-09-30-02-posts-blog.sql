-- ─────────────────────────────────────────────────────────────────────────────
-- BizPrint — мэдээ / блог булан (posts)
--
-- `posts` хүснэгт өмнө нь ямар ч migration-д ороогүй байсан: dev дээр
-- TypeORM synchronize үүсгэж байсан ч production дээр synchronize=false тул
-- хүснэгт бүрэн байхгүй байж мэднэ. Тиймээс CREATE TABLE IF NOT EXISTS-ээр
-- бүрэн тодорхойлолтыг нь бичээд, дараа нь блогийн шинэ баганууд нэмнэ.
--
-- Idempotent — дахин ажиллуулахад хоргүй.
-- ─────────────────────────────────────────────────────────────────────────────

BEGIN;

-- ── 1. Үндсэн хүснэгт ────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS posts (
  id           uuid      PRIMARY KEY DEFAULT gen_random_uuid(),
  title        varchar   NOT NULL,
  slug         varchar   NOT NULL UNIQUE,
  content      text,
  excerpt      varchar,
  thumbnail    varchar,
  category     varchar,
  tags         text[]    NOT NULL DEFAULT '{}',
  author_id    varchar,
  is_published boolean   NOT NULL DEFAULT false,
  view_count   integer   NOT NULL DEFAULT 0,
  created_at   timestamp NOT NULL DEFAULT NOW(),
  updated_at   timestamp NOT NULL DEFAULT NOW()
);

-- ── 2. Блогийн шинэ баганууд ─────────────────────────────────────────────────
-- author_name      — нийтлэгчийн харагдах нэр (author_id нь дотоод холбоос)
-- published_at     — нийтэлсэн цаг; эрэмбэлэлт ба харуулах огноо нь үүнээс
-- is_featured      — нүүр хуудсанд онцлох
-- reading_minutes  — уншихад шаардах хугацаа (агуулгаас автоматаар)
-- seo_title/desc   — <title> ба meta description override
ALTER TABLE posts ADD COLUMN IF NOT EXISTS author_name     varchar;
ALTER TABLE posts ADD COLUMN IF NOT EXISTS published_at    timestamp;
ALTER TABLE posts ADD COLUMN IF NOT EXISTS is_featured     boolean NOT NULL DEFAULT false;
ALTER TABLE posts ADD COLUMN IF NOT EXISTS reading_minutes integer;
ALTER TABLE posts ADD COLUMN IF NOT EXISTS seo_title       varchar;
ALTER TABLE posts ADD COLUMN IF NOT EXISTS seo_description varchar;

-- Аль хэдийн нийтлэгдсэн мөрүүдэд published_at-г created_at-аар нөхнө,
-- ингэснээр эрэмбэлэлт хоосон огноогоор эвдрэхгүй.
UPDATE posts SET published_at = created_at
 WHERE is_published = true AND published_at IS NULL;

-- ── 3. Индексүүд ─────────────────────────────────────────────────────────────
-- Нийтийн жагсаалт нь үргэлж is_published=true + published_at DESC-ээр явна.
CREATE INDEX IF NOT EXISTS idx_posts_published_at
  ON posts (is_published, published_at DESC);

CREATE INDEX IF NOT EXISTS idx_posts_category
  ON posts (category)
  WHERE category IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_posts_featured
  ON posts (is_featured, published_at DESC)
  WHERE is_featured = true;

-- Таг хайлт (tags @> ARRAY['x']) GIN индексээр явна.
CREATE INDEX IF NOT EXISTS idx_posts_tags
  ON posts USING GIN (tags);

COMMIT;
