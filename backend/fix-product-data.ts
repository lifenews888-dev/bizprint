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

  // Bug 2: Check and delete corrupted products
  const before = await ds.query(`
    SELECT id, name, category FROM products
    WHERE name IN ('Promotional Products', 'Invitations, Gifts & Stationery')
       OR (name = 'туг далбаа' AND category = 'signage')
    ORDER BY name
  `);
  console.log('Corrupted products found:', before.length);
  before.forEach((p: any) => console.log(' -', p.id, '|', p.name, '| cat:', p.category));

  if (before.length > 0) {
    const ids = before.map((p: any) => `'${p.id}'`).join(', ');
    const del = await ds.query(`DELETE FROM products WHERE id IN (${ids})`);
    console.log(`Deleted ${del[1]} corrupted product(s).`);
  }

  // Bug 3: Strip "N-" numeric prefixes from category names and slugs
  const prefixedCats = await ds.query(`
    SELECT id, name, slug FROM categories
    WHERE name ~ '^\\d+-' OR slug ~ '^\\d+-'
    ORDER BY sort_order
  `);
  console.log('\nCategories with numeric prefixes:', prefixedCats.length);
  prefixedCats.forEach((c: any) => console.log(' -', c.id, '|', c.name, '| slug:', c.slug));

  if (prefixedCats.length > 0) {
    // Fix names
    await ds.query(`
      UPDATE categories SET name = regexp_replace(name, '^\\d+-', '')
      WHERE name ~ '^\\d+-'
    `);
    // Fix slugs
    await ds.query(`
      UPDATE categories SET slug = regexp_replace(slug, '^\\d+-', '')
      WHERE slug ~ '^\\d+-'
    `);
    // Fix product.category references that used prefixed slugs
    await ds.query(`
      UPDATE products SET category = regexp_replace(category, '^\\d+-', '')
      WHERE category ~ '^\\d+-'
    `);
    console.log('Category prefixes stripped.');
  }

  // Verify
  const remaining = await ds.query(`
    SELECT id, name, category FROM products
    WHERE name IN ('Promotional Products', 'Invitations, Gifts & Stationery', 'туг далбаа')
  `);
  console.log('\nCorrupted products remaining:', remaining.length);

  const stillPrefixed = await ds.query(`
    SELECT name, slug FROM categories WHERE name ~ '^\\d+-' OR slug ~ '^\\d+-'
  `);
  console.log('Categories still prefixed:', stillPrefixed.length);

  const total = await ds.query(`SELECT COUNT(*) FROM products WHERE is_active = true`);
  console.log('Active products total:', total[0].count);

  await ds.destroy();
}

main().catch(e => { console.error(e); process.exit(1); });
