// Seed script: Create a Business Card product with 20 layouts + pricing
const http = require('http');

const API = 'http://localhost:4000';

function post(path, body) {
  return new Promise((resolve, reject) => {
    const data = JSON.stringify(body);
    const req = http.request(`${API}${path}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(data) },
    }, (res) => {
      let chunks = '';
      res.on('data', c => chunks += c);
      res.on('end', () => {
        try { resolve(JSON.parse(chunks)); } catch { resolve(chunks); }
      });
    });
    req.on('error', reject);
    req.write(data);
    req.end();
  });
}

function patch(path, body) {
  return new Promise((resolve, reject) => {
    const data = JSON.stringify(body);
    const req = http.request(`${API}${path}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(data) },
    }, (res) => {
      let chunks = '';
      res.on('data', c => chunks += c);
      res.on('end', () => {
        try { resolve(JSON.parse(chunks)); } catch { resolve(chunks); }
      });
    });
    req.on('error', reject);
    req.write(data);
    req.end();
  });
}

const LAYOUTS = [
  { name: 'Классик цагаан', type: 'minimal',
    front: [{ type:'name', position:'top-left', size:'lg' }, { type:'title', position:'top-left', size:'sm' }, { type:'phone', position:'bottom-left', size:'sm' }, { type:'email', position:'bottom-left', size:'sm' }, { type:'qr', position:'right-center', size:'md' }],
    back: [{ type:'logo', position:'center', size:'lg' }, { type:'company', position:'center', size:'md' }, { type:'website', position:'bottom', size:'sm' }] },
  { name: 'Харанхуй элегант', type: 'business',
    front: [{ type:'name', position:'top-left', size:'lg', bg:'#111', text:'#fff' }, { type:'title', position:'top-left', size:'sm' }, { type:'phone', position:'bottom-left', size:'sm' }, { type:'email', position:'bottom-left', size:'sm' }, { type:'qr', position:'right-center', size:'md' }],
    back: [{ type:'logo', position:'center', size:'lg', bg:'#111', text:'#fff' }, { type:'social', position:'bottom', size:'sm' }] },
  { name: 'BizPrint брэнд', type: 'creative',
    front: [{ type:'name', position:'top-center', size:'lg', bg:'#FF6B00', text:'#fff' }, { type:'title', position:'top-center', size:'sm' }, { type:'phone', position:'bottom', size:'sm' }, { type:'email', position:'bottom', size:'sm' }],
    back: [{ type:'logo', position:'center', size:'lg', bg:'#FF6B00', text:'#fff' }, { type:'qr', position:'bottom-right', size:'md' }] },
  { name: 'Албан ёсны хөх', type: 'business',
    front: [{ type:'company', position:'top-left', size:'sm', accent:'#3B82F6' }, { type:'name', position:'top-left', size:'lg' }, { type:'title', position:'top-left', size:'sm' }, { type:'phone', position:'bottom-left', size:'sm' }, { type:'email', position:'bottom-left', size:'sm' }],
    back: [{ type:'logo', position:'center', size:'lg', bg:'#1A1A2E', text:'#fff' }, { type:'address', position:'bottom', size:'sm' }] },
  { name: 'Минимал цэвэр', type: 'minimal',
    front: [{ type:'name', position:'top-left', size:'lg' }, { type:'title', position:'top-left', size:'sm' }, { type:'phone', position:'bottom-left', size:'sm' }, { type:'website', position:'bottom-right', size:'sm' }],
    back: [{ type:'company', position:'center', size:'lg' }] },
  { name: 'Градиент нил ягаан', type: 'creative',
    front: [{ type:'name', position:'top-left', size:'lg', bg:'#6D28D9', text:'#fff' }, { type:'title', position:'top-left', size:'sm' }, { type:'phone', position:'bottom-left', size:'sm' }, { type:'qr', position:'right-center', size:'md' }],
    back: [{ type:'logo', position:'center', size:'lg', bg:'#6D28D9', text:'#fff' }, { type:'social', position:'bottom', size:'sm' }] },
  { name: 'Ногоон байгаль', type: 'creative',
    front: [{ type:'name', position:'top-left', size:'lg', accent:'#059669' }, { type:'title', position:'top-left', size:'sm' }, { type:'phone', position:'bottom-left', size:'sm' }, { type:'email', position:'bottom-left', size:'sm' }],
    back: [{ type:'logo', position:'center', size:'lg', bg:'#059669', text:'#fff' }] },
  { name: 'Улаан идэвхтэй', type: 'full',
    front: [{ type:'name', position:'top-left', size:'lg', accent:'#DC2626' }, { type:'title', position:'top-left', size:'sm' }, { type:'phone', position:'bottom-left', size:'sm' }, { type:'email', position:'bottom-left', size:'sm' }, { type:'qr', position:'right-center', size:'md' }],
    back: [{ type:'logo', position:'center', size:'lg', bg:'#DC2626', text:'#fff' }, { type:'social', position:'bottom', size:'sm' }] },
  { name: 'Алтан дээд зэрэг', type: 'business',
    front: [{ type:'name', position:'top-left', size:'lg', accent:'#D4AF37' }, { type:'title', position:'top-left', size:'sm' }, { type:'phone', position:'bottom-left', size:'sm' }, { type:'email', position:'bottom-right', size:'sm' }],
    back: [{ type:'logo', position:'center', size:'lg', bg:'#1A1A1A', text:'#D4AF37' }, { type:'website', position:'bottom', size:'sm' }] },
  { name: 'Хөнгөн саарал', type: 'minimal',
    front: [{ type:'name', position:'top-left', size:'lg' }, { type:'title', position:'top-left', size:'sm' }, { type:'phone', position:'bottom-left', size:'sm' }],
    back: [{ type:'company', position:'center', size:'lg', bg:'#F3F4F6', text:'#333' }] },
  { name: 'Хос зурвас', type: 'full',
    front: [{ type:'company', position:'top-left', size:'sm' }, { type:'name', position:'top-left', size:'lg' }, { type:'title', position:'top-left', size:'sm' }, { type:'phone', position:'bottom-left', size:'sm' }, { type:'email', position:'bottom-left', size:'sm' }, { type:'qr', position:'right-center', size:'md' }],
    back: [{ type:'logo', position:'center', size:'lg' }, { type:'address', position:'bottom', size:'sm' }, { type:'social', position:'bottom', size:'sm' }] },
  { name: 'Японы минимал', type: 'minimal',
    front: [{ type:'name', position:'top-center', size:'lg' }, { type:'title', position:'top-center', size:'sm' }, { type:'phone', position:'bottom', size:'sm' }],
    back: [{ type:'company', position:'center', size:'md' }, { type:'website', position:'bottom', size:'sm' }] },
  { name: 'Технологи хөх', type: 'business',
    front: [{ type:'name', position:'top-left', size:'lg', accent:'#2563EB' }, { type:'title', position:'top-left', size:'sm' }, { type:'phone', position:'bottom-left', size:'sm' }, { type:'email', position:'bottom-left', size:'sm' }, { type:'qr', position:'right-center', size:'md' }],
    back: [{ type:'logo', position:'center', size:'lg', bg:'#1E3A5F', text:'#fff' }, { type:'social', position:'bottom', size:'sm' }] },
  { name: 'Загварлаг ягаан', type: 'creative',
    front: [{ type:'name', position:'top-center', size:'lg', accent:'#EC4899' }, { type:'title', position:'top-center', size:'sm' }, { type:'phone', position:'bottom', size:'sm' }],
    back: [{ type:'logo', position:'center', size:'lg', bg:'#EC4899', text:'#fff' }, { type:'qr', position:'bottom-right', size:'md' }] },
  { name: 'Корпорэйт саарал', type: 'business',
    front: [{ type:'company', position:'top-left', size:'sm' }, { type:'name', position:'top-left', size:'lg' }, { type:'title', position:'top-left', size:'sm' }, { type:'phone', position:'bottom-left', size:'sm' }, { type:'email', position:'bottom-left', size:'sm' }],
    back: [{ type:'logo', position:'center', size:'lg', bg:'#374151', text:'#fff' }, { type:'address', position:'bottom', size:'sm' }] },
  { name: 'Хар алтан', type: 'full',
    front: [{ type:'name', position:'top-left', size:'lg', bg:'#0A0A0A', text:'#D4AF37' }, { type:'title', position:'top-left', size:'sm' }, { type:'phone', position:'bottom-left', size:'sm' }, { type:'email', position:'bottom-left', size:'sm' }, { type:'qr', position:'right-center', size:'md' }],
    back: [{ type:'logo', position:'center', size:'lg', bg:'#0A0A0A', text:'#D4AF37' }] },
  { name: 'Цэнхэр далай', type: 'creative',
    front: [{ type:'name', position:'top-left', size:'lg', accent:'#0891B2' }, { type:'title', position:'top-left', size:'sm' }, { type:'phone', position:'bottom-left', size:'sm' }, { type:'email', position:'bottom-left', size:'sm' }],
    back: [{ type:'logo', position:'center', size:'lg', bg:'#0891B2', text:'#fff' }, { type:'social', position:'bottom', size:'sm' }] },
  { name: 'Энгийн цагаан', type: 'minimal',
    front: [{ type:'name', position:'top-left', size:'lg' }, { type:'phone', position:'bottom-left', size:'sm' }, { type:'email', position:'bottom-left', size:'sm' }],
    back: [{ type:'company', position:'center', size:'lg' }] },
  { name: 'Бүрэн мэдээлэл', type: 'full',
    front: [{ type:'company', position:'top-left', size:'sm' }, { type:'name', position:'top-left', size:'lg' }, { type:'title', position:'top-left', size:'sm' }, { type:'phone', position:'bottom-left', size:'sm' }, { type:'email', position:'bottom-left', size:'sm' }, { type:'website', position:'bottom-right', size:'sm' }, { type:'qr', position:'right-center', size:'md' }],
    back: [{ type:'logo', position:'center', size:'lg' }, { type:'address', position:'bottom-left', size:'sm' }, { type:'social', position:'bottom-right', size:'sm' }] },
  { name: 'Премиум хар', type: 'business',
    front: [{ type:'name', position:'top-left', size:'lg', bg:'#111', text:'#fff', accent:'#FF6B00' }, { type:'title', position:'top-left', size:'sm' }, { type:'phone', position:'bottom-left', size:'sm' }, { type:'email', position:'bottom-left', size:'sm' }, { type:'qr', position:'right-center', size:'md' }],
    back: [{ type:'logo', position:'center', size:'lg', bg:'#111', text:'#FF6B00' }, { type:'social', position:'bottom', size:'sm' }] },
];

async function seed() {
  console.log('Creating product...');
  const product = await post('/admin/business-cards', {
    name: 'Business Card',
    name_mn: 'Нэрийн хуудас',
    slug: 'business-card-standard',
    description: 'Стандарт нэрийн хуудас 90x55мм, 300gsm, өндөр чанарын хэвлэл',
    base_price: 3000,
    vat_enabled: true,
    vat_rate: 10,
    is_active: true,
  });
  console.log('Product:', product.id, product.name);

  console.log('Setting pricing tiers...');
  await post(`/admin/business-cards/${product.id}/pricing`, {
    tiers: [
      { quantity: 100, unit_price: 30 },
      { quantity: 200, unit_price: 27.5 },
      { quantity: 500, unit_price: 24 },
      { quantity: 1000, unit_price: 20 },
    ]
  });
  console.log('Pricing set: 100=₮3000, 200=₮5500, 500=₮12000, 1000=₮20000');

  console.log('Creating 20 layouts...');
  for (let i = 0; i < LAYOUTS.length; i++) {
    const l = LAYOUTS[i];
    const result = await post(`/admin/business-cards/${product.id}/layouts`, {
      name: l.name,
      name_mn: l.name,
      type: l.type,
      front_json: l.front,
      back_json: l.back,
      sort_order: i,
    });
    console.log(`  [${i+1}/20] ${l.name} (${l.type}) → ${result.id}`);
  }

  console.log('Publishing product...');
  await patch(`/admin/business-cards/${product.id}/publish`, {});

  console.log('\n✅ Done! Product published with 20 layouts + 4 pricing tiers');
  console.log(`   View: http://localhost:4000/business-cards`);
  console.log(`   Admin: http://localhost:3000/admin/business-cards`);
}

seed().catch(e => console.error('Error:', e.message));
