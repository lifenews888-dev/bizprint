-- flow_orders: албан үнийн жагсаалтын бараа (туг, даавуун хэвлэл гэх мэт) захиалах боломж.
ALTER TABLE flow_orders ADD COLUMN IF NOT EXISTS product_slug varchar(64);
ALTER TABLE flow_orders ADD COLUMN IF NOT EXISTS catalog_line jsonb;
ALTER TABLE flow_orders ADD COLUMN IF NOT EXISTS spec jsonb;
