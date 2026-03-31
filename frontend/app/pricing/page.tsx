'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { apiFetch, getToken } from '@/lib/api'

const F = "'DM Sans','Segoe UI',system-ui,sans-serif"
const O = '#FF6B00'

const TYPE_META: Record<string, { icon: string; color: string; label: string }> = {
  digital_card: { icon: '💳', color: '#2563EB', label: 'Дижитал карт' },
  loyalty_campaign: { icon: '⭐', color: '#F59E0B', label: 'Loyalty програм' },
  qr_campaign: { icon: '📱', color: '#10B981', label: 'QR кампанит' },
  invitation_premium: { icon: '💌', color: '#8B5CF6', label: 'Урилга' },
  custom: { icon: '📦', color: '#6B7280', label: 'Бусад' },
}
const MODEL_LABELS: Record<string, string> = { one_time: 'Нэг удаа', subscription: 'Сар/Жил', per_unit: 'Ширхэгээр' }

export default function PricingPage() {
  const router = useRouter()
  const [plans, setPlans] = useState<any[]>([])
  const [products, setProducts] = useState<any[]>([])
  const [billing, setBilling] = useState<'monthly' | 'yearly'>('yearly')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([
      apiFetch<any>('/subscription/plans').catch(() => []),
      apiFetch<any>('/subscription/product-pricing').catch(() => []),
    ]).then(([p, pr]) => {
      setPlans(Array.isArray(p) ? p : [])
      setProducts(Array.isArray(pr) ? pr : [])
    }).finally(() => setLoading(false))
  }, [])

  const handleSubscribe = (planId: string) => {
    const token = getToken()
    if (!token) { router.push('/login?redirect=/pricing'); return }
    router.push(`/checkout?source=subscription&plan_id=${planId}&billing_cycle=${billing}`)
  }

  const handleBuyProduct = (productId: string) => {
    const token = getToken()
    if (!token) { router.push('/login?redirect=/pricing'); return }
    router.push(`/checkout?source=product&product_pricing_id=${productId}`)
  }

  if (loading) return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: F }}>
      <div style={{ width: 40, height: 40, border: '3px solid #F0F0F0', borderTopColor: O, borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  )

  const tierIcons: Record<string, string> = { free: '🆓', pro: '🚀', business: '🏢', enterprise: '👑' }

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg, #F9FAFB)', fontFamily: F }}>
      {/* Hero */}
      <div style={{ textAlign: 'center', padding: '60px 20px 40px' }}>
        <h1 style={{ fontSize: 36, fontWeight: 800, color: 'var(--text, #111)', margin: '0 0 12px' }}>
          Үнийн багцууд
        </h1>
        <p style={{ fontSize: 16, color: 'var(--text2, #6B7280)', maxWidth: 480, margin: '0 auto 32px' }}>
          Дижитал карт, QR код, Loyalty програм, Урилга — бүх дижитал үйлчилгээг нэг дороос
        </p>

        {/* Billing toggle */}
        <div style={{ display: 'inline-flex', background: 'var(--surface, #fff)', borderRadius: 12, border: '1px solid var(--border, #E5E7EB)', padding: 4 }}>
          <button onClick={() => setBilling('monthly')} style={{
            padding: '10px 24px', borderRadius: 10, border: 'none', cursor: 'pointer', fontSize: 14, fontWeight: 600, fontFamily: F,
            background: billing === 'monthly' ? O : 'transparent', color: billing === 'monthly' ? '#fff' : 'var(--text2, #6B7280)',
          }}>Сарын</button>
          <button onClick={() => setBilling('yearly')} style={{
            padding: '10px 24px', borderRadius: 10, border: 'none', cursor: 'pointer', fontSize: 14, fontWeight: 600, fontFamily: F,
            background: billing === 'yearly' ? O : 'transparent', color: billing === 'yearly' ? '#fff' : 'var(--text2, #6B7280)',
          }}>
            Жилийн <span style={{ fontSize: 11, opacity: 0.8 }}>(-17%)</span>
          </button>
        </div>
      </div>

      {/* Subscription Plans */}
      <div style={{ maxWidth: 1100, margin: '0 auto', padding: '0 20px 48px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: `repeat(${Math.min(plans.length, 3)}, 1fr)`, gap: 20 }}>
          {plans.map(plan => {
            const price = billing === 'monthly' ? plan.price_monthly : plan.price_yearly
            const perMonth = billing === 'yearly' ? Math.round(plan.price_yearly / 12) : plan.price_monthly
            return (
              <div key={plan.id} style={{
                background: 'var(--surface, #fff)', borderRadius: 20, padding: 32,
                border: plan.is_popular ? `2px solid ${O}` : '1px solid var(--border, #E5E7EB)',
                position: 'relative', display: 'flex', flexDirection: 'column',
              }}>
                {plan.is_popular && (
                  <div style={{ position: 'absolute', top: -12, left: '50%', transform: 'translateX(-50%)', background: O, color: '#fff', padding: '4px 16px', borderRadius: 20, fontSize: 12, fontWeight: 700 }}>
                    Түгээмэл
                  </div>
                )}
                <div style={{ fontSize: 32, marginBottom: 8 }}>{tierIcons[plan.tier] || '📦'}</div>
                <h3 style={{ fontSize: 22, fontWeight: 800, margin: '0 0 4px', color: 'var(--text, #111)' }}>{plan.name}</h3>
                <p style={{ fontSize: 13, color: 'var(--text2, #6B7280)', margin: '0 0 20px' }}>{plan.description}</p>

                <div style={{ marginBottom: 24 }}>
                  <span style={{ fontSize: 36, fontWeight: 800, color: 'var(--text, #111)' }}>
                    {price === 0 ? 'Үнэгүй' : `₮${Number(perMonth).toLocaleString()}`}
                  </span>
                  {price > 0 && <span style={{ fontSize: 14, color: 'var(--text2, #6B7280)' }}>/сар</span>}
                  {billing === 'yearly' && price > 0 && (
                    <div style={{ fontSize: 12, color: 'var(--text3, #9CA3AF)', marginTop: 4 }}>
                      Жилийн нийт: ₮{Number(plan.price_yearly).toLocaleString()}
                    </div>
                  )}
                </div>

                {/* Limits */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 20 }}>
                  {[
                    { label: 'QR код', val: plan.max_qr_codes },
                    { label: 'Дижитал карт', val: plan.max_digital_cards },
                    { label: 'Урилга', val: plan.max_invitations },
                    { label: 'Бүтээгдэхүүн QR', val: plan.max_product_qrs },
                    { label: 'Хадгалах зай', val: `${plan.max_storage_mb >= 1024 ? `${plan.max_storage_mb / 1024}GB` : `${plan.max_storage_mb}MB`}` },
                    { label: 'Loyalty', val: plan.max_loyalty_campaigns ?? '-' },
                  ].map(item => (
                    <div key={item.label} style={{ fontSize: 12, color: 'var(--text2, #6B7280)', padding: '6px 0', borderBottom: '1px solid var(--border, #F3F4F6)' }}>
                      <span style={{ fontWeight: 700, color: 'var(--text, #374151)' }}>{item.val}</span> {item.label}
                    </div>
                  ))}
                </div>

                {/* Features list */}
                {plan.features_list && (
                  <div style={{ flex: 1, marginBottom: 20 }}>
                    {(typeof plan.features_list === 'string' ? JSON.parse(plan.features_list) : plan.features_list).map((f: any, i: number) => (
                      <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '5px 0', fontSize: 13, color: f.included ? 'var(--text, #374151)' : 'var(--text3, #9CA3AF)' }}>
                        <span style={{ fontSize: 12 }}>{f.included ? '✅' : '❌'}</span>
                        <span style={{ textDecoration: f.included ? 'none' : 'line-through' }}>{f.name}</span>
                      </div>
                    ))}
                  </div>
                )}

                <button onClick={() => handleSubscribe(plan.id)} style={{
                  width: '100%', padding: '14px', borderRadius: 12, border: 'none', cursor: 'pointer',
                  fontSize: 15, fontWeight: 700, fontFamily: F, marginTop: 'auto',
                  background: plan.is_popular ? O : 'var(--surface2, #F3F4F6)',
                  color: plan.is_popular ? '#fff' : 'var(--text, #374151)',
                }}>
                  {price === 0 ? 'Үнэгүй эхлэх' : 'Сонгох'}
                </button>
              </div>
            )
          })}
        </div>
      </div>

      {/* Product Pricing - Digital Services */}
      {products.length > 0 && (
        <div style={{ maxWidth: 1100, margin: '0 auto', padding: '0 20px 60px' }}>
          <div style={{ textAlign: 'center', marginBottom: 32 }}>
            <h2 style={{ fontSize: 28, fontWeight: 800, color: 'var(--text, #111)', margin: '0 0 8px' }}>
              Дижитал үйлчилгээнүүд
            </h2>
            <p style={{ fontSize: 14, color: 'var(--text2, #6B7280)', margin: 0 }}>
              Тус тусдаа худалдан авах боломжтой дижитал бүтээгдэхүүнүүд
            </p>
          </div>

          {/* Group by product_type */}
          {Object.entries(TYPE_META).map(([type, meta]) => {
            const typeProducts = products.filter(p => p.product_type === type)
            if (typeProducts.length === 0) return null
            return (
              <div key={type} style={{ marginBottom: 32 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
                  <span style={{ fontSize: 20 }}>{meta.icon}</span>
                  <h3 style={{ fontSize: 18, fontWeight: 700, color: meta.color, margin: 0 }}>{meta.label}</h3>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 16 }}>
                  {typeProducts.map(product => (
                    <div key={product.id} style={{
                      background: 'var(--surface, #fff)', borderRadius: 16, padding: 24,
                      border: '1px solid var(--border, #E5E7EB)', display: 'flex', flexDirection: 'column',
                    }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: 12 }}>
                        <h4 style={{ fontSize: 16, fontWeight: 700, margin: 0, color: 'var(--text, #111)' }}>{product.name}</h4>
                        <span style={{ fontSize: 10, padding: '3px 8px', borderRadius: 20, fontWeight: 600, background: `${meta.color}15`, color: meta.color }}>
                          {MODEL_LABELS[product.price_model]}
                        </span>
                      </div>
                      {product.description && (
                        <p style={{ fontSize: 13, color: 'var(--text2, #6B7280)', margin: '0 0 16px', lineHeight: 1.5 }}>{product.description}</p>
                      )}

                      <div style={{ display: 'flex', alignItems: 'baseline', gap: 6, marginBottom: 12, marginTop: 'auto' }}>
                        {product.price_model === 'per_unit' ? (
                          <span style={{ fontSize: 24, fontWeight: 800, color: meta.color }}>₮{Number(product.unit_price).toLocaleString()}<span style={{ fontSize: 13, fontWeight: 400, color: 'var(--text2)' }}>/ш</span></span>
                        ) : (
                          <span style={{ fontSize: 24, fontWeight: 800, color: meta.color }}>₮{Number(product.price).toLocaleString()}</span>
                        )}
                        {product.price_model === 'subscription' && (
                          <span style={{ fontSize: 12, color: 'var(--text3, #9CA3AF)' }}>/ {product.duration_days} хоног</span>
                        )}
                      </div>

                      {(product.free_tier_days > 0 || product.free_tier_units > 0) && (
                        <div style={{ fontSize: 12, color: '#10B981', fontWeight: 600, marginBottom: 12 }}>
                          🎁 {product.free_tier_days > 0 ? `${product.free_tier_days} хоног үнэгүй туршилт` : `${product.free_tier_units} ширхэг үнэгүй`}
                        </div>
                      )}

                      <button onClick={() => handleBuyProduct(product.id)} style={{
                        width: '100%', padding: '12px', borderRadius: 10, border: 'none', cursor: 'pointer',
                        fontSize: 14, fontWeight: 600, fontFamily: F,
                        background: meta.color, color: '#fff',
                      }}>
                        Худалдан авах
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* FAQ */}
      <div style={{ maxWidth: 700, margin: '0 auto', padding: '0 20px 80px' }}>
        <h2 style={{ fontSize: 24, fontWeight: 800, textAlign: 'center', margin: '0 0 24px', color: 'var(--text, #111)' }}>Түгээмэл асуултууд</h2>
        {[
          { q: 'Үнэгүй багц ямар боломжтой вэ?', a: 'Үнэгүй багцаар 5 QR код, 1 дижитал карт, 1 урилга, 2 бүтээгдэхүүн QR үүсгэх боломжтой. BizPrint брэнд харагдана.' },
          { q: 'Багцаа хэзээ ч солих боломжтой юу?', a: 'Тийм, дашбоардаас хүссэн үедээ дээшлүүлэх эсвэл цуцлах боломжтой.' },
          { q: 'Loyalty програм хэрхэн ажилладаг вэ?', a: 'Та QR тамга цуглуулах програм үүсгэж, өөрийн үйлчлүүлэгчдэд урамшуулал олгоно. Тэд утасны QR уншуулж тамга цуглуулна.' },
          { q: 'Нэмэлт эрх (Add-on) гэж юу вэ?', a: 'Багцын хязгаарт багтахгүй бол нэмэлт QR код, карт, урилга зэргийг тус тусад нь худалдан авах боломжтой.' },
        ].map((item, i) => (
          <details key={i} style={{ background: 'var(--surface, #fff)', borderRadius: 12, border: '1px solid var(--border, #E5E7EB)', padding: '16px 20px', marginBottom: 8, cursor: 'pointer' }}>
            <summary style={{ fontSize: 15, fontWeight: 600, color: 'var(--text, #111)', listStyle: 'none', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              {item.q} <span style={{ fontSize: 18, color: 'var(--text3)' }}>+</span>
            </summary>
            <p style={{ fontSize: 14, color: 'var(--text2, #6B7280)', margin: '12px 0 0', lineHeight: 1.6 }}>{item.a}</p>
          </details>
        ))}
      </div>
    </div>
  )
}
