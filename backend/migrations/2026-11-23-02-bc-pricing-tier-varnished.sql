-- Лактай нэрийн хуудасны нэгж үнэ (standard / laminated / embossed-ийн хажууд).
-- bc_pricing_tiers нь өмнө synchronize-аар үүссэн тул зарим орчинд байхгүй байж болно —
-- хүснэгт байгаа үед л багана нэмнэ, үгүй бол deploy-г унагаахгүй.
DO $$
BEGIN
  IF to_regclass('public.bc_pricing_tiers') IS NOT NULL THEN
    ALTER TABLE bc_pricing_tiers ADD COLUMN IF NOT EXISTS varnished numeric(14,2) NOT NULL DEFAULT 0;
  END IF;
END $$;
