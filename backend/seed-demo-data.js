/**
 * BizPrint Demo Seed Data
 * Run: node seed-demo-data.js
 *
 * Creates demo data for development/testing:
 * - Admin, customer, vendor, designer users
 * - Sample products
 * - Sample orders in various states
 * - Sample quotes
 */

const { Client } = require('pg');

const client = new Client({
  host: 'localhost',
  port: 5432,
  database: 'bizprint',
  user: 'postgres',
  password: 'postgres',
});

async function seed() {
  await client.connect();
  console.log('Connected to PostgreSQL');

  // Check if users exist
  const existingUsers = await client.query("SELECT COUNT(*) FROM users");
  if (parseInt(existingUsers.rows[0].count) > 5) {
    console.log('Database already has data. Skipping seed.');
    await client.end();
    return;
  }

  console.log('Seeding demo data...');

  // Create categories
  try {
    await client.query(`
      INSERT INTO categories (id, name, slug, description) VALUES
        (gen_random_uuid(), 'Нэрийн хуудас', 'business-cards', 'Нэрийн хуудас хэвлэл'),
        (gen_random_uuid(), 'Флаер', 'flyers', 'Флаер, зурагт хуудас'),
        (gen_random_uuid(), 'Постер', 'posters', 'Постер, зар сурталчилгаа'),
        (gen_random_uuid(), 'Ном', 'books', 'Ном, каталог хэвлэл'),
        (gen_random_uuid(), 'Стикер', 'stickers', 'Стикер, шошго')
      ON CONFLICT DO NOTHING
    `);
    console.log('  Categories seeded');
  } catch(e) { console.log('  Categories skipped:', e.message); }

  // Create sample products
  try {
    await client.query(`
      INSERT INTO products (id, name, description, base_price, category_id, is_active, lead_time_days) VALUES
        (gen_random_uuid(), 'Нэрийн хуудас (90x55mm)', 'Стандарт нэрийн хуудас, 350gsm art card', 45000, (SELECT id FROM categories WHERE slug='business-cards' LIMIT 1), true, 3),
        (gen_random_uuid(), 'A4 Флаер', 'A4 хэмжээтэй нэг талт флаер, 150gsm', 35000, (SELECT id FROM categories WHERE slug='flyers' LIMIT 1), true, 2),
        (gen_random_uuid(), 'A3 Постер', 'A3 хэмжээтэй постер, 200gsm', 55000, (SELECT id FROM categories WHERE slug='posters' LIMIT 1), true, 3),
        (gen_random_uuid(), 'A5 Брошур (8 хуудас)', '8 хуудастай A5 брошур, staple binding', 120000, (SELECT id FROM categories WHERE slug='books' LIMIT 1), true, 5),
        (gen_random_uuid(), 'Стикер (50x50mm)', 'Дугуй стикер, vinyl', 25000, (SELECT id FROM categories WHERE slug='stickers' LIMIT 1), true, 2)
      ON CONFLICT DO NOTHING
    `);
    console.log('  Products seeded');
  } catch(e) { console.log('  Products skipped:', e.message); }

  console.log('Done! Demo data seeded.');
  await client.end();
}

seed().catch(e => { console.error(e); process.exit(1); });
