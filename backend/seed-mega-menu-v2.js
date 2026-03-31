/**
 * Seed Mega Menu V2 — Production data for BizPrint
 * Run: node seed-mega-menu-v2.js
 */
const { Client } = require('pg');

async function seed() {
  const c = new Client({ host: 'localhost', port: 5432, user: 'postgres', password: 'postgres', database: 'bizprint' });
  await c.connect();

  // ── Menu ──
  const menuRes = await c.query(`
    INSERT INTO mega_menus (id, name, is_active, version)
    VALUES (gen_random_uuid(), 'BizPrint Main Menu', true, 1)
    RETURNING id
  `);
  const menuId = menuRes.rows[0].id;
  console.log('✓ Menu created:', menuId);

  // ── Columns ──
  const columns = [
    { title: 'ОФСЕТ ХЭВЛЭЛ', icon: '🖨️', color: '#3B82F6', order: 0 },
    { title: 'ДИЖИТАЛ ХЭВЛЭЛ', icon: '🏷️', color: '#10B981', order: 1 },
    { title: 'ӨРГӨН ФОРМАТ', icon: '🪧', color: '#F59E0B', order: 2 },
    { title: 'ПРОМО & БЭЛЭГ', icon: '👕', color: '#8B5CF6', order: 3 },
    { title: 'ДИЗАЙН ҮЙЛЧИЛГЭЭ', icon: '🎨', color: '#EC4899', order: 4 },
  ];

  const colIds = [];
  for (const col of columns) {
    const r = await c.query(`
      INSERT INTO menu_columns (id, menu_id, title, icon, color, "order", is_active)
      VALUES (gen_random_uuid(), $1, $2, $3, $4, $5, true) RETURNING id
    `, [menuId, col.title, col.icon, col.color, col.order]);
    colIds.push(r.rows[0].id);
    console.log(`  ✓ Column: ${col.title}`);
  }

  // ── Categories + Items ──
  const data = [
    // ОФСЕТ ХЭВЛЭЛ
    { colIdx: 0, categories: [
      { name: 'Нэрийн хуудас', slug: 'business-card', items: [
        { name: 'Стандарт 90×50мм', link: '/shop?cat=business-card', badge: null, desc: '250-400gsm, 1-2 тал' },
        { name: 'Premium нэрийн хуудас', link: '/shop?cat=business-card-premium', badge: 'HOT', desc: 'Фойл, тусгай цаас' },
        { name: 'Дижитал нэрийн хуудас', link: '/digital-card', badge: 'AI', desc: 'NFC + QR код' },
      ]},
      { name: 'Ном & Каталог', slug: 'book', items: [
        { name: 'Каталог', link: '/shop?cat=catalog', badge: null, desc: '8-100+ хуудас' },
        { name: 'Брошур', link: '/shop?cat=brochure', badge: null, desc: 'Гурвалсан нугалалт' },
        { name: 'Ном хэвлэл', link: '/shop?cat=book', badge: null, desc: 'Хавтас + дотор' },
      ]},
      { name: 'Хайрцаг & Савлагаа', slug: 'packaging', items: [
        { name: 'Бүтээгдэхүүний хайрцаг', link: '/shop?cat=packaging', badge: null, desc: 'Custom хэмжээ' },
        { name: 'Бэлэг хайрцаг', link: '/shop?cat=gift-box', badge: 'NEW', desc: 'Лого хэвлэлтэй' },
      ]},
    ]},
    // ДИЖИТАЛ ХЭВЛЭЛ
    { colIdx: 1, categories: [
      { name: 'Флаер & Хуудас', slug: 'flyer', items: [
        { name: 'Флаер (A4, A5, A6)', link: '/shop?cat=flyer', badge: null, desc: '1-2 тал' },
        { name: 'Постер', link: '/shop?cat=poster', badge: null, desc: 'A3, A2, A1' },
        { name: 'Мэнд хүргэх', link: '/shop?cat=greeting', badge: 'NEW', desc: 'Баяр ёслол' },
      ]},
      { name: 'Стикер & Шошго', slug: 'sticker', items: [
        { name: 'Наалт стикер', link: '/shop?cat=sticker', badge: 'HOT', desc: 'Өнгөт, хайчилсан' },
        { name: 'Бүтээгдэхүүний шошго', link: '/shop?cat=label', badge: null, desc: 'Рулон, хуудас' },
        { name: 'DTF хэвлэл', link: '/shop?cat=dtf', badge: null, desc: 'Даавуун хэвлэл' },
      ]},
    ]},
    // ӨРГӨН ФОРМАТ
    { colIdx: 2, categories: [
      { name: 'Баннер', slug: 'banner', items: [
        { name: 'Гадна баннер', link: '/shop?cat=banner', badge: null, desc: 'PVC, Mesh' },
        { name: 'Дотор баннер', link: '/shop?cat=indoor-banner', badge: null, desc: 'Backlit, ханын' },
        { name: 'Роллап стенд', link: '/shop?cat=rollup', badge: null, desc: '80×200, 100×200' },
      ]},
      { name: 'Хаяг & Тэмдэг', slug: 'signage', items: [
        { name: '3D үсэг', link: '/shop?cat=3d-letters', badge: 'HOT', desc: 'Нерж, Акрил, LED' },
        { name: 'Лайтбокс', link: '/shop?cat=lightbox', badge: null, desc: 'Гэрэлтүүлэгтэй' },
        { name: 'Чиглүүлэх тэмдэг', link: '/shop?cat=wayfinding', badge: null, desc: 'Оффис, дотор' },
      ]},
    ]},
    // ПРОМО & БЭЛЭГ
    { colIdx: 3, categories: [
      { name: 'Хувцас хэвлэл', slug: 'apparel', items: [
        { name: 'Футболк', link: '/shop?cat=tshirt', badge: null, desc: 'DTF, Screen print' },
        { name: 'Малгай & Хүзүүвч', link: '/shop?cat=cap', badge: null, desc: 'Хатгамал, хэвлэл' },
      ]},
      { name: 'Промо бүтээгдэхүүн', slug: 'promo', items: [
        { name: 'Аяга & Сав', link: '/shop?cat=mug', badge: null, desc: 'Лого хэвлэлтэй' },
        { name: 'Дэвтэр & Бал', link: '/shop?cat=notebook', badge: null, desc: 'Брэнд бэлэг' },
        { name: 'Гэрчилгээ & Диплом', link: '/shop?cat=certificate', badge: 'NEW', desc: 'Фойл хэвлэл' },
      ]},
    ]},
    // ДИЗАЙН ҮЙЛЧИЛГЭЭ
    { colIdx: 4, categories: [
      { name: 'Дизайн захиалга', slug: 'design', items: [
        { name: 'Лого дизайн', link: '/services/logo', badge: null, desc: 'Мэргэжлийн дизайнер' },
        { name: 'Сошиал медиа', link: '/services/social', badge: 'HOT', desc: 'FB, IG постер' },
        { name: 'Брошур дизайн', link: '/services/brochure', badge: null, desc: 'Каталог, флаер' },
      ]},
      { name: 'AI үйлчилгээ', slug: 'ai-services', items: [
        { name: 'AI Үнийн тооцоо', link: '/smart-quote', badge: 'AI', desc: 'PDF оруулаад секундэд үнэ', type: 'action' },
        { name: 'AI Дизайн санал', link: '/ai-design', badge: 'AI', desc: 'Автомат загвар үүсгэгч' },
      ]},
    ]},
  ];

  for (const colData of data) {
    const colId = colIds[colData.colIdx];
    for (let ci = 0; ci < colData.categories.length; ci++) {
      const cat = colData.categories[ci];
      const catRes = await c.query(`
        INSERT INTO menu_categories (id, column_id, name, slug, "order", is_featured)
        VALUES (gen_random_uuid(), $1, $2, $3, $4, $5) RETURNING id
      `, [colId, cat.name, cat.slug, ci, ci === 0]);
      const catId = catRes.rows[0].id;

      for (let ii = 0; ii < cat.items.length; ii++) {
        const item = cat.items[ii];
        await c.query(`
          INSERT INTO menu_items (id, category_id, name, type, link, badge, description, "order")
          VALUES (gen_random_uuid(), $1, $2, $3, $4, $5, $6, $7)
        `, [catId, item.name, item.type || 'product', item.link, item.badge, item.desc, ii]);
      }
    }
    console.log(`  ✓ Data for column ${colData.colIdx}`);
  }

  // ── Promos ──
  await c.query(`
    INSERT INTO promo_blocks (id, menu_id, title, description, type, link, cta_text, bg_color, priority, is_active)
    VALUES
      (gen_random_uuid(), $1, 'AI Үнийн Тооцоолуур', 'PDF файлаа оруулаад секундэд үнэ авах — AI хүчээр', 'AI_QUOTE', '/smart-quote', 'Тооцоолох →', '#0f172a', 0, true),
      (gen_random_uuid(), $1, 'Партнер хөтөлбөр', 'Vendor болж орлого олох', 'CAMPAIGN', '/partner', 'Бүртгүүлэх →', '#1e1b4b', 1, true)
  `, [menuId]);
  console.log('  ✓ Promos created');

  await c.end();
  console.log('\n✅ Mega Menu V2 seeded!');
}

seed().catch(console.error);
