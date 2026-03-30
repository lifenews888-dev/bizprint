/**
 * Seed subscription plans for BizPrint Digital Ecosystem
 * Run: node seed-subscription-plans.js
 */
const { Client } = require('pg');

async function seed() {
  const client = new Client({
    host: 'localhost', port: 5432, user: 'postgres', password: 'postgres', database: 'bizprint',
  });
  await client.connect();

  const plans = [
    {
      slug: 'free', name: 'Үнэгүй', description: 'Үндсэн боломжууд',
      tier: 'free', price_monthly: 0, price_yearly: 0,
      max_digital_cards: 1, max_invitations: 1, max_product_qrs: 2, max_qr_codes: 5, max_storage_mb: 50,
      custom_domain: false, remove_branding: false, advanced_analytics: false,
      priority_support: false, ai_content_generation: false, team_members: false, max_team_members: 1,
      is_popular: false, sort_order: 0,
      features_list: JSON.stringify([
        { name: '1 Дижитал карт', included: true },
        { name: '1 Урилга', included: true },
        { name: '2 Бүтээгдэхүүн QR', included: true },
        { name: '50MB хадгалах зай', included: true },
        { name: 'BizPrint брэнд', included: true },
        { name: 'Нарийвчилсан аналитик', included: false },
        { name: 'AI контент', included: false },
        { name: 'Тусгай домэйн', included: false },
      ]),
    },
    {
      slug: 'pro', name: 'Pro', description: 'Мэргэжлийн хэрэгцээнд',
      tier: 'pro', price_monthly: 19900, price_yearly: 199000,
      max_digital_cards: 5, max_invitations: 10, max_product_qrs: 20, max_qr_codes: 50, max_storage_mb: 500,
      custom_domain: false, remove_branding: true, advanced_analytics: true,
      priority_support: false, ai_content_generation: true, team_members: false, max_team_members: 1,
      is_popular: true, sort_order: 1,
      features_list: JSON.stringify([
        { name: '5 Дижитал карт', included: true },
        { name: '10 Урилга', included: true },
        { name: '20 Бүтээгдэхүүн QR', included: true },
        { name: '500MB хадгалах зай', included: true },
        { name: 'Брэнд арилгах', included: true },
        { name: 'Нарийвчилсан аналитик', included: true },
        { name: 'AI контент', included: true },
        { name: 'Тусгай домэйн', included: false },
      ]),
    },
    {
      slug: 'business', name: 'Business', description: 'Байгууллагын хэрэгцээнд',
      tier: 'business', price_monthly: 49900, price_yearly: 499000,
      max_digital_cards: 50, max_invitations: 100, max_product_qrs: 200, max_qr_codes: 500, max_storage_mb: 5000,
      custom_domain: true, remove_branding: true, advanced_analytics: true,
      priority_support: true, ai_content_generation: true, team_members: true, max_team_members: 10,
      is_popular: false, sort_order: 2,
      features_list: JSON.stringify([
        { name: '50 Дижитал карт', included: true },
        { name: '100 Урилга', included: true },
        { name: '200 Бүтээгдэхүүн QR', included: true },
        { name: '5GB хадгалах зай', included: true },
        { name: 'Брэнд арилгах', included: true },
        { name: 'Нарийвчилсан аналитик', included: true },
        { name: 'AI контент', included: true },
        { name: 'Тусгай домэйн', included: true },
      ]),
    },
  ];

  for (const p of plans) {
    await client.query(`
      INSERT INTO subscription_plans (
        id, slug, name, description, tier, price_monthly, price_yearly,
        max_digital_cards, max_invitations, max_product_qrs, max_qr_codes, max_storage_mb,
        custom_domain, remove_branding, advanced_analytics, priority_support,
        ai_content_generation, team_members, max_team_members,
        features_list, is_popular, sort_order, is_active
      ) VALUES (
        gen_random_uuid(), $1, $2, $3, $4, $5, $6,
        $7, $8, $9, $10, $11,
        $12, $13, $14, $15,
        $16, $17, $18,
        $19::jsonb, $20, $21, true
      ) ON CONFLICT (slug) DO UPDATE SET
        name = EXCLUDED.name, price_monthly = EXCLUDED.price_monthly, price_yearly = EXCLUDED.price_yearly,
        features_list = EXCLUDED.features_list, is_popular = EXCLUDED.is_popular
    `, [
      p.slug, p.name, p.description, p.tier, p.price_monthly, p.price_yearly,
      p.max_digital_cards, p.max_invitations, p.max_product_qrs, p.max_qr_codes, p.max_storage_mb,
      p.custom_domain, p.remove_branding, p.advanced_analytics, p.priority_support,
      p.ai_content_generation, p.team_members, p.max_team_members,
      p.features_list, p.is_popular, p.sort_order,
    ]);
    console.log(`✓ ${p.name} plan seeded`);
  }

  // ── Seed Add-ons ──
  const addons = [
    { slug: 'addon-100-qr', name: '+100 QR код', description: 'QR код хязгаар нэмэх', feature_key: 'qr_codes', bonus_amount: 100, price: 4900, sort_order: 0 },
    { slug: 'addon-50-invitations', name: '+50 Урилга', description: 'Урилгын хязгаар нэмэх', feature_key: 'invitations', bonus_amount: 50, price: 9900, sort_order: 1 },
    { slug: 'addon-50-product-qr', name: '+50 Бүтээгдэхүүн QR', description: 'Бүтээгдэхүүн QR хязгаар нэмэх', feature_key: 'product_qrs', bonus_amount: 50, price: 7900, sort_order: 2 },
    { slug: 'addon-10-digital-cards', name: '+10 Дижитал карт', description: 'Дижитал карт хязгаар нэмэх', feature_key: 'digital_cards', bonus_amount: 10, price: 14900, sort_order: 3 },
    { slug: 'addon-1gb-storage', name: '+1GB Хадгалах зай', description: 'Хадгалах зай нэмэх', feature_key: 'storage_mb', bonus_amount: 1024, price: 4900, sort_order: 4 },
  ];

  for (const a of addons) {
    await client.query(`
      INSERT INTO subscription_addons (
        id, slug, name, description, feature_key, bonus_amount, price, sort_order, is_active
      ) VALUES (
        gen_random_uuid(), $1, $2, $3, $4, $5, $6, $7, true
      ) ON CONFLICT (slug) DO UPDATE SET
        name = EXCLUDED.name, price = EXCLUDED.price, bonus_amount = EXCLUDED.bonus_amount
    `, [a.slug, a.name, a.description, a.feature_key, a.bonus_amount, a.price, a.sort_order]);
    console.log(`✓ ${a.name} addon seeded`);
  }

  await client.end();
  console.log('Done!');
}

seed().catch(console.error);
