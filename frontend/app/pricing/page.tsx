import { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Үнийн мэдээлэл | BizPrint',
  description: 'BizPrint-ийн үйлчилгээний үнэ, subscription төлөвлөгөө.',
}

const PLANS = [
  {
    id: 'free',
    name: 'Үнэгүй',
    price: 0,
    desc: 'Туршиж үзэх',
    features: [
      'Дэлгүүр үзэх',
      'Үнэ тооцоолох',
      'Захиалгын хүсэлт илгээх',
      'Чатаар холбогдох',
      '3 захиалга/сар',
    ],
    cta: 'Үнэгүй эхлэх',
    ctaUrl: '/register',
    highlighted: false,
  },
  {
    id: 'basic',
    name: 'Basic',
    price: 29900,
    desc: 'Жижиг бизнест',
    features: [
      'Бүх үнэгүй боломж',
      'Нэрийн хуудас editor',
      'Design editor',
      'Захиалгын түүх',
      'Урьдчилгаа хэтэвч',
      'Үнэ харьцуулах',
      '20 захиалга/сар',
    ],
    cta: 'Basic авах',
    ctaUrl: '/register?plan=basic',
    highlighted: false,
  },
  {
    id: 'pro',
    name: 'Pro',
    price: 79900,
    desc: 'Өсөж буй бизнест',
    features: [
      'Бүх Basic боломж',
      'AI дизайн зөвлөмж',
      'Loyalty хөтөлбөр',
      'Дижитал нэрийн хуудас',
      'Аналитик тайлан',
      'Кампани удирдах',
      'B2B данс',
      'Хязгааргүй захиалга',
    ],
    cta: 'Pro авах',
    ctaUrl: '/register?plan=pro',
    highlighted: true,
  },
  {
    id: 'business',
    name: 'Байгууллага',
    price: 0,
    priceLabel: 'Тохиролцооны',
    desc: 'Том байгууллагад',
    features: [
      'Бүх Pro боломж',
      'White-label платформ',
      'Custom үнийн тохиргоо',
      'Тусгай account менежер',
      'API нэвтрэлт',
      'SLA баталгаа',
    ],
    cta: 'Холбогдох',
    ctaUrl: '/contact',
    highlighted: false,
  },
]

const COMPARE: Array<[string, boolean, boolean, boolean, boolean]> = [
  ['Дэлгүүр үзэх', true, true, true, true],
  ['Үнэ тооцоолох', true, true, true, true],
  ['Захиалга өгөх', true, true, true, true],
  ['Нэрийн хуудас editor', false, true, true, true],
  ['Design editor', false, true, true, true],
  ['Loyalty хөтөлбөр', false, false, true, true],
  ['Аналитик тайлан', false, false, true, true],
  ['B2B данс', false, false, true, true],
  ['Дижитал нэрийн хуудас', false, false, true, true],
  ['White-label', false, false, false, true],
  ['API нэвтрэлт', false, false, false, true],
]

const FAQ: Array<[string, string]> = [
  ['Subscription цуцлах боломжтой юу?', 'Тийм, дурын үед цуцлах боломжтой. Дараагийн тооцооллын өдрөөс хойш автоматаар дуусна.'],
  ['Үнэгүй туршиж үзэх боломж байна уу?', '14 хоногийн Pro trial үнэгүй олгоно. Карт мэдээлэл шаардахгүй.'],
  ['B2B захиалгад хямдрал байна уу?', 'Тийм. Тогтмол захиалагчдад 5-25% хямдрал олгоно. /b2b хуудсаас дэлгэрэнгүй мэдээлэл авна уу.'],
]

export default function PricingPage() {
  return (
    <div style={{ maxWidth: 1100, margin: '0 auto', padding: '48px 20px' }}>
      <div style={{ textAlign: 'center', marginBottom: 48 }}>
        <h1 style={{ fontSize: 32, fontWeight: 800, color: 'var(--text)', marginBottom: 12 }}>Үнийн мэдээлэл</h1>
        <p style={{ fontSize: 15, color: 'var(--text3)', maxWidth: 520, margin: '0 auto' }}>
          Бизнесдээ тохирсон төлөвлөгөө сонгоно уу
        </p>
      </div>

      {/* Plans grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: 16, marginBottom: 48 }}>
        {PLANS.map(plan => (
          <div key={plan.id} style={{
            position: 'relative',
            border: plan.highlighted ? '2px solid #FF6B00' : '1px solid var(--border)',
            borderRadius: 20,
            padding: 24,
            background: 'var(--surface)',
            display: 'flex',
            flexDirection: 'column',
          }}>
            {plan.highlighted && (
              <div style={{ position: 'absolute', top: -12, left: '50%', transform: 'translateX(-50%)' }}>
                <span style={{ background: '#FF6B00', color: '#fff', fontSize: 11, padding: '4px 14px', borderRadius: 20, fontWeight: 600 }}>Түгээмэл</span>
              </div>
            )}

            <div style={{ marginBottom: 16 }}>
              <h2 style={{ fontSize: 18, fontWeight: 700, color: 'var(--text)', marginBottom: 2 }}>{plan.name}</h2>
              <p style={{ fontSize: 12, color: 'var(--text3)' }}>{plan.desc}</p>
            </div>

            <div style={{ marginBottom: 20 }}>
              {plan.priceLabel ? (
                <p style={{ fontSize: 22, fontWeight: 700, color: 'var(--text)' }}>{plan.priceLabel}</p>
              ) : plan.price === 0 ? (
                <p style={{ fontSize: 22, fontWeight: 700, color: 'var(--text)' }}>Үнэгүй</p>
              ) : (
                <div>
                  <span style={{ fontSize: 26, fontWeight: 800, color: 'var(--text)' }}>{plan.price.toLocaleString()}₮</span>
                  <span style={{ fontSize: 13, color: 'var(--text3)' }}>/сар</span>
                </div>
              )}
            </div>

            <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 20px', flex: 1 }}>
              {plan.features.map(f => (
                <li key={f} style={{ display: 'flex', alignItems: 'flex-start', gap: 8, fontSize: 13, color: 'var(--text2)', marginBottom: 8 }}>
                  <span style={{ color: '#10B981', flexShrink: 0, marginTop: 1 }}>✓</span>
                  {f}
                </li>
              ))}
            </ul>

            <Link href={plan.ctaUrl} style={{
              display: 'block',
              width: '100%',
              padding: '10px 0',
              textAlign: 'center',
              borderRadius: 12,
              fontSize: 13,
              fontWeight: 600,
              textDecoration: 'none',
              background: plan.highlighted ? '#FF6B00' : 'var(--surface2)',
              color: plan.highlighted ? '#fff' : 'var(--text2)',
              border: plan.highlighted ? 'none' : '1px solid var(--border)',
            }}>
              {plan.cta}
            </Link>
          </div>
        ))}
      </div>

      {/* Comparison table */}
      <div style={{ border: '1px solid var(--border)', borderRadius: 20, overflow: 'hidden', marginBottom: 48 }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ background: 'var(--surface2)' }}>
              <th style={{ textAlign: 'left', padding: 16, fontSize: 13, fontWeight: 600, color: 'var(--text2)' }}>Боломж</th>
              {PLANS.map(p => (
                <th key={p.id} style={{ padding: 16, textAlign: 'center', fontSize: 13, fontWeight: 600, color: 'var(--text2)' }}>{p.name}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {COMPARE.map(([feature, ...vals]) => (
              <tr key={feature as string} style={{ borderTop: '1px solid var(--border)' }}>
                <td style={{ padding: 14, fontSize: 13, color: 'var(--text3)' }}>{feature}</td>
                {(vals as boolean[]).map((v, i) => (
                  <td key={i} style={{ padding: 14, textAlign: 'center' }}>
                    {v ? <span style={{ color: '#10B981', fontSize: 15 }}>✓</span> : <span style={{ color: 'var(--text4)' }}>—</span>}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* FAQ */}
      <div style={{ maxWidth: 640, margin: '0 auto' }}>
        <h2 style={{ fontSize: 20, fontWeight: 700, color: 'var(--text)', marginBottom: 24, textAlign: 'center' }}>Түгээмэл асуулт</h2>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {FAQ.map(([q, a]) => (
            <div key={q} style={{ border: '1px solid var(--border)', borderRadius: 16, padding: 20, background: 'var(--surface)' }}>
              <p style={{ fontSize: 14, fontWeight: 600, color: 'var(--text)', marginBottom: 6 }}>{q}</p>
              <p style={{ fontSize: 13, color: 'var(--text3)' }}>{a}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
