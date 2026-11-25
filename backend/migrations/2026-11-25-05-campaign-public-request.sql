-- Байгууллагын түргэн хүсэлт (/campaign/request) нэвтрэлтгүй ирж болно → customer_id заавал биш.
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns
             WHERE table_name = 'campaigns' AND column_name = 'customer_id' AND is_nullable = 'NO') THEN
    ALTER TABLE campaigns ALTER COLUMN customer_id DROP NOT NULL;
  END IF;
END $$;
