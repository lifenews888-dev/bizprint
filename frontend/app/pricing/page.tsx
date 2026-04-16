'use client'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import { apiFetch } from '@/lib/api'

const FALLBACK_PLANS = [
  { id: 'free', name: 'Үнэгүй', price_monthly: 0, description: 'Туршиж үзэх', features_list: ['Дэлгүүр үзэх', 'Үнэ тооцоолох', 'Захиалгын хүсэлт илгээх', 'Чатаар холбогдох', '3 захиалга/сар'], is_popular: false, slug: 'free' },
  { id: 'basic', name: 'Basic', price_monthly: 29900, description: 'Жижиг бизнест', features_list: ['Бүх үнэгүй боломж', 'Нэрийн хуудас editor', 'Design editor', 'Захиалгын түүх', 'Урьдчилгаа хэтэвч', 'Үнэ харьцуулах', '20 захиалга/сар'], is_popular: false, slug: 'basic' },
  { id: 'pro', name: 'Pro', price_monthly: 79900, description: 'Өсөж буй бизнест', features_list: ['Бүх Basic боломж', 'AI дизайн зөвлөмж', 'Loyalty хөтөлбөр', 'Дижитал нэрийн хуудас', 'Аналитик тайлан', 'Кампани удирдах', 'B2B данс', 'Хязгааргүй захиалга'], is_popular: true, slug: 'pro' },
  { id: 'business', name: 'Байгууллага', price_monthly: 0, price_label: 'Тохиролцооны', description: 'Том байгууллагад', features_list: ['Бүх Pro боломж', 'White-label платформ', 'Custom үнийн тохиргоо', 'Тусгай account менежер', 'API нэвтрэлт', 'SLA баталгаа'], is_popular: false, slug: 'business' },
]

const FAQ: [string, string][] = [
  ['Subscription цуцлах боломжтой юу?', 'Тийм, дурын үед цуцлах боломжтой. Дараагийн тооцооллын өдрөөс хойш автоматаар дуусна.'],
  ['Үнэгүй туршиж үзэх боломж байна уу?', '14 хоногийн Pro trial үнэгүй олгоно. Карт мэдээлэл шаардахгүй.'],
  ['B2B захиалгад хямдрал байна уу?', 'Тийм. Тогтмол захиалагчдад 5-25% хямдрал олгоно. /b2b хуудсаас дэлгэрэнгүй мэдээлэл авна уу.'],
]

export default function PricingPage() {
  const [plans, setPlans] = useState<any[]>(FALLBACK_PLANS)
  const [billing, setBilling] = useState<'monthly' | 'yearly'>('monthly')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    apiFetch<any>('/subscription/plans', { auth: false })
      .then(data => {
        const list = Array.isArray(data) ? data : (data?.data || [])
        if (list.length > 0) {
          setPlans(list.sort((a: any, b: any) => (a.sort_order || 0) - (b.sort_order || 0)))
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  const getPrice = (plan: any) => billing === 'yearly' && plan.price_yearly ? plan.price_yearly : (plan.price_monthly || 0)
  const getFeatures = (plan: any): string[] => {
    if (Array.isArray(plan.features_list)) return plan.features_list
    if (typeof plan.features_list === 'string') try { return JSON.parse(plan.features_list) } catch { return [] }
    return []
  }
  const isEnterprise = (plan: any) => plan.slug === 'business' || plan.slug === 'enterprise' || plan.tier === 'enterprise'
  const ctaUrl = (plan: any) => isEnterprise(plan) ? '/contact' : `/register?plan=${plan.slug || plan.id}`
  const ctaText = (plan: any) => {
    if (isEnterprise(plan)) return 'Холбогдох'
    if (getPrice(plan) === 0) return 'Үнэгүй эхлэх'
    return `${plan.name} авах`
  }

  // Build comparison from all plan features
  const allFeatures = [...new Set(plans.flatMap(p => getFeatures(p)))]
  const compareRows = allFeatures.slice(0, 12).map(feat => ({
    feature: feat,
    values: plans.map(p => getFeatures(p).includes(feat)),
  }))

  return (
    <div style={{ maxWidth: 1100, margin: '0 auto', padding: '48px 20px' }}>
      <div style={{ textAlign: 'center', marginBottom: 32 }}>
        <h1 style={{ fontSize: 32, fontWeight: 800, color: 'var(--text)', marginBottom: 12 }}>Үнийн мэдээлэл</h1>
        <p style={{ fontSize: 15, color: 'var(--text3)', maxWidth: 520, margin: '0 auto' }}>
          Бизнесдээ тохирсон төлөвлөгөө сонгоно уу
        </p>
      </div>

      {/* Billing toggle */}
      {plans.some(p => p.price_yearly > 0) && (
        <div style={{ display: 'flex', justifyContent: 'center', gap: 4, marginBottom: 32, background: 'var(--surface2)', padding: 4, borderRadius: 12, width: 'fit-content', margin: '0 auto 32px' }}>
          {(['monthly', 'yearly'] as const).map(b => (
            <button key={b} onClick={() => setBilling(b)} style={{
              padding: '8px 20px', borderRadius: 10, border: 'none', cursor: 'pointer', fontSize: 13, fontWeight: 600,
              background: billing === b ? '#FF6B00' : 'transparent',
              color: billing === b ? '#fff' : 'var(--text3)',
            }}>
              {b === 'monthly' ? 'Сарын' : 'Жилийн'}
              {b === 'yearly' && <span style={{ fontSize: 10, marginLeft: 4, opacity: 0.8 }}>хэмнэлт</span>}
            </button>
          ))}
        </div>
      )}

      {/* Plans grid */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: 60, color: 'var(--text3)' }}>Ачааллаж байна...</div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: `repeat(${Math.min(plans.length, 4)}, 1fr)`, gap: 16, marginBottom: 48 }}>
          {plans.map(plan => {
            const price = getPrice(plan)
            const features = getFeatures(plan)
            const popular = plan.is_popular
            const enterprise = isEnterprise(plan)

            return (
              <div key={plan.id} style={{
                position: 'relative',
                border: popular ? '2px solid #FF6B00' : '1px solid var(--border)',
                borderRadius: 20, padding: 24, background: 'var(--surface)',
                display: 'flex', flexDirection: 'column',
              }}>
                {popular && (
                  <div style={{ position: 'absolute', top: -12, left: '50%', transform: 'translateX(-50%)' }}>
                    <span style={{ background: '#FF6B00', color: '#fff', fontSize: 11, padding: '4px 14px', borderRadius: 20, fontWeight: 600 }}>Түгээмэл</span>
                  </div>
                )}

                <div style={{ marginBottom: 16 }}>
                  <h2 style={{ fontSize: 18, fontWeight: 700, color: 'var(--text)', marginBottom: 2 }}>{plan.name}</h2>
                  <p style={{ fontSize: 12, color: 'var(--text3)' }}>{plan.description}</p>
                </div>

                <div style={{ marginBottom: 20 }}>
                  {enterprise && price === 0 ? (
                    <p style={{ fontSize: 22, fontWeight: 700, color: 'var(--text)' }}>{plan.price_label || 'Тохиролцооны'}</p>
                  ) : price === 0 ? (
                    <p style={{ fontSize: 22, fontWeight: 700, color: 'var(--text)' }}>Үнэгүй</p>
                  ) : (
                    <div>
                      <span style={{ fontSize: 26, fontWeight: 800, color: 'var(--text)' }}>{price.toLocaleString()}₮</span>
                      <span style={{ fontSize: 13, color: 'var(--text3)' }}>/{billing === 'yearly' ? 'жил' : 'сар'}</span>
                      {billing === 'yearly' && plan.price_monthly > 0 && (
                        <div style={{ fontSize: 11, color: '#10B981', marginTop: 2 }}>
                          Сард {Math.round(price / 12).toLocaleString()}₮ · {Math.round((1 - price / (plan.price_monthly * 12)) * 100)}% хэмнэлт
                        </div>
                      )}
                    </div>
                  )}
                </div>

                <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 20px', flex: 1 }}>
                  {features.map((f: string) => (
                    <li key={f} style={{ display: 'flex', alignItems: 'flex-start', gap: 8, fontSize: 13, color: 'var(--text2)', marginBottom: 8 }}>
                      <span style={{ color: '#10B981', flexShrink: 0, marginTop: 1 }}>✓</span>
                      {f}
                    </li>
                  ))}
                </ul>

                <Link href={ctaUrl(plan)} style={{
                  display: 'block', width: '100%', padding: '10px 0', textAlign: 'center',
                  borderRadius: 12, fontSize: 13, fontWeight: 600, textDecoration: 'none',
                  background: popular ? '#FF6B00' : 'var(--surface2)',
                  color: popular ? '#fff' : 'var(--text2)',
                  border: popular ? 'none' : '1px solid var(--border)',
                }}>
                  {ctaText(plan)}
                </Link>
              </div>
            )
          })}
        </div>
      )}

      {/* Comparison table */}
      {compareRows.length > 0 && (
        <div style={{ border: '1px solid var(--border)', borderRadius: 20, overflow: 'hidden', marginBottom: 48 }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: 'var(--surface2)' }}>
                <th style={{ textAlign: 'left', padding: 16, fontSize: 13, fontWeight: 600, color: 'var(--text2)' }}>Боломж</th>
                {plans.map(p => (
                  <th key={p.id} style={{ padding: 16, textAlign: 'center', fontSize: 13, fontWeight: 600, color: 'var(--text2)' }}>{p.name}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {compareRows.map(row => (
                <tr key={row.feature} style={{ borderTop: '1px solid var(--border)' }}>
                  <td style={{ padding: 14, fontSize: 13, color: 'var(--text3)' }}>{row.feature}</td>
                  {row.values.map((v, i) => (
                    <td key={i} style={{ padding: 14, textAlign: 'center' }}>
                      {v ? <span style={{ color: '#10B981', fontSize: 15 }}>✓</span> : <span style={{ color: 'var(--text4)' }}>—</span>}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

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
