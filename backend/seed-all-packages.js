// Seed packages for ALL services (run: node seed-all-packages.js)
const fetch = (...args) => import('node-fetch').then(({default: f}) => f(...args));
const API = 'http://localhost:4000';

async function main() {
  // Login
  const loginRes = await fetch(`${API}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'admin@bizprint.mn', password: 'Admin@2026' }),
  });
  const { access_token: token } = await loginRes.json();
  if (!token) { console.error('Login failed'); return; }
  console.log('Logged in');

  // First update existing UGC packages with service_type
  const existing = await fetch(`${API}/creator/packages?all=true`, {
    headers: { Authorization: `Bearer ${token}` }
  }).then(r => r.json());

  if (Array.isArray(existing)) {
    for (const pkg of existing) {
      if (!pkg.service_type || pkg.service_type === 'ugc') {
        // Already UGC, skip (or update)
      }
    }
    console.log(`${existing.length} existing packages found`);
  }

  const packages = [
    // ═══ SOCIAL ═══
    { name: 'Social Starter', slug: 'social-starter-1m', service_type: 'social', description: 'Сошиал контентоо эхлүүлэхэд тохиромжтой.', duration_months: 1, price: 150000, content_count: 3,
      features: ['3 Instagram/Facebook пост', 'Caption + Hashtag', 'Брэнд стиль тохируулга'], is_active: true, sort_order: 1 },
    { name: 'Social Business', slug: 'social-business-1m', service_type: 'social', description: 'Тогтмол контентоор хэрэглэгчдийн анхаарлыг татна.', duration_months: 1, price: 350000, content_count: 8,
      features: ['8 пост + 4 story', 'Reel бүтээх', 'Контент календарь'], is_popular: true, is_active: true, sort_order: 2 },
    { name: 'Social Pro', slug: 'social-pro-1m', service_type: 'social', description: 'Бүрэн сошиал менежмент + контент.', duration_months: 1, price: 650000, content_count: 20,
      features: ['20 пост + 10 story + 5 reel', 'Брэнд удирдамж', 'Хэмжилт тайлан'], is_active: true, sort_order: 3 },

    // ═══ PREPRESS (DESIGN) ═══
    { name: 'Design Starter', slug: 'design-starter', service_type: 'prepress', description: 'Нэг удаагийн дизайн ажилд.', duration_months: 1, price: 50000, content_count: 1,
      features: ['1 дизайн', '1 засвар', 'Print-ready PDF'], is_active: true, sort_order: 1 },
    { name: 'Design Business', slug: 'design-business', service_type: 'prepress', description: 'Олон материалын дизайн багц.', duration_months: 1, price: 120000, content_count: 3,
      features: ['3 дизайн', '3 засвар', 'Zoom хамтрал', 'Source файл'], is_popular: true, is_active: true, sort_order: 2 },
    { name: 'Design Premium', slug: 'design-premium', service_type: 'prepress', description: 'Брэндийн бүх материалыг хамарсан.', duration_months: 1, price: 280000, content_count: 8,
      features: ['8 дизайн', '5 засвар', 'Priority хүргэлт', 'Брэнд стиль гайд'], is_active: true, sort_order: 3 },

    // ═══ LIVE ═══
    { name: 'Live Starter', slug: 'live-starter', service_type: 'live', description: 'Эхний Live туршилтанд.', duration_months: 1, price: 80000, content_count: 1,
      features: ['30 минут Live', 'Basic setup', '1 бүтээгдэхүүн танилцуулга'], is_active: true, sort_order: 1 },
    { name: 'Live Business', slug: 'live-business', service_type: 'live', description: 'Мэргэжлийн Live борлуулалт.', duration_months: 1, price: 200000, content_count: 1,
      features: ['1 цаг Live', 'Script бэлтгэл', '3-5 бүтээгдэхүүн', 'Audience engagement'], is_popular: true, is_active: true, sort_order: 2 },
    { name: 'Live Pro', slug: 'live-pro', service_type: 'live', description: 'Тогтмол Live борлуулалтын багц.', duration_months: 1, price: 500000, content_count: 4,
      features: ['4 удаагийн Live (сарын 1/долоо хоног)', 'Тус бүр 1 цаг', 'Мэргэжлийн script', 'Тайлан + дүн шинжилгээ'], is_active: true, sort_order: 3 },

    // ═══ AI ═══
    { name: 'AI Starter', slug: 'ai-starter', service_type: 'ai', description: 'AI контентоор туршилт хийх.', duration_months: 1, price: 40000, content_count: 5,
      features: ['5 AI зураг', 'Basic стиль', '2 засвар'], is_active: true, sort_order: 1 },
    { name: 'AI Business', slug: 'ai-business', service_type: 'ai', description: 'Брэндийн AI контент багц.', duration_months: 1, price: 120000, content_count: 20,
      features: ['20 AI зураг', 'HD чанар', 'Custom стиль', '3 засвар'], is_popular: true, is_active: true, sort_order: 2 },
    { name: 'AI Pro', slug: 'ai-pro', service_type: 'ai', description: 'AI видео + зураг бүрэн багц.', duration_months: 1, price: 300000, content_count: 10,
      features: ['5 AI видео + 20 AI зураг', 'Аватар / Influencer', 'Дурсамж зураг', 'Source файл'], is_active: true, sort_order: 3 },
  ];

  let created = 0;
  for (const pkg of packages) {
    try {
      const res = await fetch(`${API}/creator/packages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(pkg),
      });
      if (res.ok) {
        created++;
        console.log(`✅ ${pkg.service_type.padEnd(8)} | ${pkg.name.padEnd(20)} | ₮${pkg.price.toLocaleString()}`);
      } else {
        const err = await res.json();
        console.error(`❌ ${pkg.name}: ${err.message || JSON.stringify(err)}`);
      }
    } catch (err) {
      console.error(`❌ ${pkg.name}: ${err.message}`);
    }
  }
  console.log(`\nDone! ${created}/${packages.length} packages created.`);
}

main();
