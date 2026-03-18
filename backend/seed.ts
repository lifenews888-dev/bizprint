import { DataSource } from 'typeorm';

const ds = new DataSource({
  type: 'postgres',
  host: 'localhost',
  port: 5432,
  username: 'postgres',
  password: 'postgres',
  database: 'bizprint',
});

async function main() {
  await ds.initialize();

  // Categories
  await ds.query(`
    INSERT INTO categories (id, name, name_mn, slug, color, icon, sort_order, is_active)
    VALUES
      (gen_random_uuid(), 'Business Cards', 'Нэрийн хуудас', 'business-cards', '#FF6B35', '📇', 1, true),
      (gen_random_uuid(), 'Flyers', 'Флаер', 'flyers', '#3B82F6', '📄', 2, true),
      (gen_random_uuid(), 'Brochures', 'Брошур', 'brochures', '#10B981', '📋', 3, true),
      (gen_random_uuid(), 'Posters', 'Постер', 'posters', '#8B5CF6', '🖼️', 4, true),
      (gen_random_uuid(), 'Banners', 'Баннер', 'banners', '#F59E0B', '🏳️', 5, true),
      (gen_random_uuid(), 'Stickers', 'Стикер', 'stickers', '#EF4444', '🏷️', 6, true)
    ON CONFLICT (slug) DO NOTHING
  `);

  const cats = await ds.query(`SELECT id, slug FROM categories`);
  const catMap: Record<string, string> = {};
  cats.forEach((c: any) => { catMap[c.slug] = c.id; });

  // Products
  await ds.query(`
    INSERT INTO products (id, name, name_mn, slug, category, base_price, min_quantity, lead_time_days, is_active, sort_order)
    VALUES
      (gen_random_uuid(), 'Standard Business Card', 'Энгийн нэрийн хуудас', 'bc-standard', 'business-cards', 150, 100, 3, true, 1),
      (gen_random_uuid(), 'Premium Business Card', 'Премиум нэрийн хуудас', 'bc-premium', 'business-cards', 280, 100, 5, true, 2),
      (gen_random_uuid(), 'A5 Flyer', 'A5 Флаер', 'flyer-a5', 'flyers', 80, 100, 2, true, 1),
      (gen_random_uuid(), 'A4 Flyer', 'A4 Флаер', 'flyer-a4', 'flyers', 120, 100, 2, true, 2),
      (gen_random_uuid(), 'Tri-fold Brochure', 'Гурван нугалаас брошур', 'brochure-trifold', 'brochures', 350, 50, 5, true, 1),
      (gen_random_uuid(), 'A3 Poster', 'A3 Постер', 'poster-a3', 'posters', 200, 10, 3, true, 1),
      (gen_random_uuid(), 'Roll-up Banner', 'Ролл-ап баннер', 'banner-rollup', 'banners', 45000, 1, 3, true, 1),
      (gen_random_uuid(), 'Custom Sticker', 'Дур зоргоор стикер', 'sticker-custom', 'stickers', 200, 50, 3, true, 1)
    ON CONFLICT (slug) DO NOTHING
  `);

  // Pricing rules for business cards
  const bc = await ds.query(`SELECT id FROM products WHERE slug = 'bc-standard' LIMIT 1`);
  if (bc.length > 0) {
    await ds.query(`
      INSERT INTO pricing_rules (id, product_id, attribute_key, attribute_value, price_multiplier, price_addition, is_active)
      VALUES
        (gen_random_uuid(), '${bc[0].id}', 'finish', 'Мат ламинат', 0.20, 0, true),
        (gen_random_uuid(), '${bc[0].id}', 'finish', 'Гянт ламинат', 0.18, 0, true),
        (gen_random_uuid(), '${bc[0].id}', 'finish', 'Soft touch', 0.35, 0, true),
        (gen_random_uuid(), '${bc[0].id}', 'side', 'Хоёр тал', 0.70, 0, true),
        (gen_random_uuid(), '${bc[0].id}', 'paper_weight', '350gsm', 0.10, 0, true),
        (gen_random_uuid(), '${bc[0].id}', 'paper_weight', '400gsm', 0.20, 0, true)
      ON CONFLICT DO NOTHING
    `);
  }

  // Product attributes for business cards
  if (bc.length > 0) {
    await ds.query(`
      INSERT INTO product_attributes (id, product_id, name, name_mn, type, options, unit, required, sort_order)
      VALUES
        (gen_random_uuid(), '${bc[0].id}', 'finish', 'Өнгөлгөө', 'select', '["Ламинатгүй","Мат ламинат","Гянт ламинат","Soft touch"]', null, false, 1),
        (gen_random_uuid(), '${bc[0].id}', 'side', 'Хэвлэлийн тал', 'select', '["Нэг тал","Хоёр тал"]', null, true, 2),
        (gen_random_uuid(), '${bc[0].id}', 'paper_weight', 'Цаасны грамм', 'select', '["300gsm","350gsm","400gsm"]', null, true, 3)
      ON CONFLICT DO NOTHING
    `);
  }

  console.log('Seed амжилттай!');
  console.log('Categories:', (await ds.query('SELECT count(*) FROM categories'))[0].count);
  console.log('Products:', (await ds.query('SELECT count(*) FROM products'))[0].count);
  console.log('Pricing rules:', (await ds.query('SELECT count(*) FROM pricing_rules'))[0].count);
  console.log('Attributes:', (await ds.query('SELECT count(*) FROM product_attributes'))[0].count);
  await ds.destroy();
}

main().catch(e => { console.error(e); process.exit(1); });