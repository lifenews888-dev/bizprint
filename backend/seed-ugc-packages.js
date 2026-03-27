// Seed 6 UGC packages (run: node seed-ugc-packages.js)
const fetch = (...args) => import('node-fetch').then(({default: f}) => f(...args));

const API = 'http://localhost:4000';

// First login as admin to get token
async function main() {
  const loginRes = await fetch(`${API}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'admin@bizprint.mn', password: 'Admin@2026' }),
  });
  const loginData = await loginRes.json();
  const token = loginData.access_token;
  if (!token) {
    console.error('Login failed:', loginData);
    return;
  }
  console.log('Logged in as admin');

  const packages = [
    // 1-month plans
    {
      name: 'Starter',
      slug: 'starter-1m',
      description: 'Эхлэж буй бизнес хэрэглэгчдэд зориулав.',
      target_audience: 'Жижиг бизнес, хувь хүн',
      duration_months: 1,
      price: 720000,
      discount_price: 0,
      discount_label: '',
      content_count: 4,
      features: ['UGC Маркетингийн гарын авлага', 'Брэндүүдийн хаалттай community'],
      content_types: ['reel', 'post'],
      has_brand_boost: false,
      is_active: true,
      is_popular: false,
      sort_order: 1,
    },
    {
      name: 'Business',
      slug: 'business-1m',
      description: 'Маркетингаа тогтвортой болгох өсөлтөө нэмэгдүүлэхэд зориулав.',
      target_audience: 'Дунд бизнес',
      duration_months: 1,
      price: 1500000,
      discount_price: 0,
      discount_label: '',
      content_count: 8,
      features: ['UGC Маркетингийн гарын авлага', 'Брэндүүдийн хаалттай community'],
      content_types: ['reel', 'post', 'story'],
      has_brand_boost: false,
      is_active: true,
      is_popular: true,
      sort_order: 2,
    },
    {
      name: 'Pro Business',
      slug: 'pro-business-1m',
      description: 'Хэрэглэгчидтэйгээ итгэлцэл үүсгэж бизнесээ дараагийн түвшинд гаргахад зориулав.',
      target_audience: 'Том бизнес, брэнд',
      duration_months: 1,
      price: 2500000,
      discount_price: 0,
      discount_label: '',
      content_count: 12,
      features: ['UGC Маркетингийн гарын авлага', 'Брэндүүдийн хаалттай community'],
      content_types: ['reel', 'post', 'story', 'review'],
      has_brand_boost: false,
      is_active: true,
      is_popular: false,
      sort_order: 3,
    },
    // 3-month plans (5% discount)
    {
      name: 'Starter',
      slug: 'starter-3m',
      description: 'Эхлэж буй бизнес хэрэглэгчдэд зориулав.',
      target_audience: 'Жижиг бизнес, хувь хүн',
      duration_months: 3,
      price: 2160000,
      discount_price: 2052000,
      discount_label: '5% OFF',
      content_count: 12,
      features: ['UGC Маркетингийн гарын авлага', 'Брэндүүдийн хаалттай community'],
      content_types: ['reel', 'post'],
      has_brand_boost: true,
      brand_boost_description: 'Онцлох Брэнд нийтлэл, Вэбсайт баннер, Онцгой Брэнд пост',
      brand_boost_price: 1200000,
      is_active: true,
      is_popular: false,
      sort_order: 4,
    },
    {
      name: 'Business',
      slug: 'business-3m',
      description: 'Маркетингаа тогтвортой болгох өсөлтөө нэмэгдүүлэхэд зориулав.',
      target_audience: 'Дунд бизнес',
      duration_months: 3,
      price: 4500000,
      discount_price: 4275000,
      discount_label: '5% OFF',
      content_count: 24,
      features: ['UGC Маркетингийн гарын авлага', 'Брэндүүдийн хаалттай community'],
      content_types: ['reel', 'post', 'story'],
      has_brand_boost: true,
      brand_boost_description: 'Онцлох Брэнд нийтлэл, Вэбсайт баннер, Онцгой Брэнд пост',
      brand_boost_price: 1200000,
      is_active: true,
      is_popular: true,
      sort_order: 5,
    },
    {
      name: 'Pro Business',
      slug: 'pro-business-3m',
      description: 'Хэрэглэгчидтэйгээ итгэлцэл үүсгэж бизнесээ дараагийн түвшинд гаргахад зориулав.',
      target_audience: 'Том бизнес, брэнд',
      duration_months: 3,
      price: 7500000,
      discount_price: 7125000,
      discount_label: '5% OFF',
      content_count: 36,
      features: ['UGC Маркетингийн гарын авлага', 'Брэндүүдийн хаалттай community'],
      content_types: ['reel', 'post', 'story', 'review'],
      has_brand_boost: true,
      brand_boost_description: 'Онцлох Брэнд нийтлэл, Вэбсайт баннер, Онцгой Брэнд пост',
      brand_boost_price: 1200000,
      is_active: true,
      is_popular: false,
      sort_order: 6,
    },
  ];

  for (const pkg of packages) {
    try {
      const res = await fetch(`${API}/creator/packages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify(pkg),
      });
      const data = await res.json();
      if (res.ok) {
        console.log(`Created: ${pkg.name} (${pkg.duration_months}m) -- MNT ${pkg.price.toLocaleString()}`);
      } else {
        console.error(`Failed: ${pkg.name}`, data.message || data);
      }
    } catch (err) {
      console.error(`Error: ${pkg.name}`, err.message);
    }
  }
  console.log('\nDone! 6 packages seeded.');
}

main();
