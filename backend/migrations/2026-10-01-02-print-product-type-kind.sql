-- Хэвлэлийн төрөл (print) ба үйлчилгээ (service, жишээ нь дизайн) ялгах.
-- service төрөл принтерт чиглүүлэгдэхгүй, зөвхөн сагсанд үнэтэй мөр болж орно.
ALTER TABLE print_product_types ADD COLUMN IF NOT EXISTS kind varchar(16) NOT NULL DEFAULT 'print';

-- Дизайн үйлчилгээ: үнэ нь сайтын бүтээгдэхүүнээс (product_id-г админ холбоно)
INSERT INTO print_product_types (key, name, kind, media, sort_order)
VALUES ('design_service', 'Дизайн үйлчилгээ', 'service', '[]', 900)
ON CONFLICT (key) DO NOTHING;
