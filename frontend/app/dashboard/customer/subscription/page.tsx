'use client'
import { useState, useEffect } from 'react'
import { apiFetch } from '@/lib/api'
import UpgradeModal from '@/components/UpgradeModal'

const FONT = "'DM Sans','Segoe UI',system-ui,sans-serif"
const ORANGE = '#FF6B00'

const TIER_ICONS: Record<string, string> = { free: '\u{1F193}', pro: '\u{1F680}', business: '\u{1F3E2}', enterprise: '\u{1F451}' }
const STATUS_COLORS: Record<string, { color: string; bg: string; label: string }> = {
  active: { color: '#059669', bg: '#D1FAE5', label: 'Идэвхтэй' },
  trial: { color: '#7C3AED', bg: '#EDE9FE', label: 'Туршилт' },
  past_due: { color: '#DC2626', bg: '#FEE2E2', label: 'Хугацаа хэтэрсэн' },
  cancelled: { color: '#6B7280', bg: '#F3F4F6', label: 'Цуцлагдсан' },
  expired: { color: '#DC2626', bg: '#FEE2E2', label: 'Дууссан' },
  free: { color: '#6B7280', bg: '#F3F4F6', label: 'Үнэгүй' },
}
const FEATURE_LABELS: Record<string, string> = {
  qr_codes: 'QR код',
  invitations: 'Урилга',
  product_qrs: 'Бүтээгдэхүүн QR',
  digital_cards: 'Дижитал карт',
  storage_mb: 'Хадгалах зай',
  loyalty_campaigns: 'Loyalty кампанит',
}
const FEATURE_ICONS: Record<string, string> = {
  qr_codes: '📱',
  invitations: '💌',
  product_qrs: '📦',
  digital_cards: '💳',
  storage_mb: '💾',
  loyalty_campaigns: '⭐',
}
const SEVERITY_COLORS: Record<string, { color: string; bg: string }> = {
  info: { color: '#2563EB', bg: '#DBEAFE' },
  warning: { color: '#D97706', bg: '#FEF3C7' },
  critical: { color: '#DC2626', bg: '#FEE2E2' },
}

export default function SubscriptionPage() {
  const [plans, setPlans] = useState<any[]>([])
  const [current, setCurrent] = useState<any>(null)
  const [usage, setUsage] = useState<any>(null)
  const [events, setEvents] = useState<any[]>([])
  const [suggestions, setSuggestions] = useState<any>(null)
  const [addons, setAddons] = useState<any[]>([])
  const [myAddons, setMyAddons] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [billing, setBilling] = useState<'monthly' | 'yearly'>('yearly')
  const [upgradeModal, setUpgradeModal] = useState<{ open: boolean; featureKey?: string; current?: number; max?: number }>({ open: false })

  const [productPricing, setProductPricing] = useState<any[]>([])

  useEffect(() => {
    const token = localStorage.getItem('access_token') || localStorage.getItem('token')
    const headers: any = token ? { Authorization: `Bearer ${token}` } : {}
    const safeFetch = (path: string) => fetch(`${process.env.NEXT_PUBLIC_API_URL || 'https://bizprint-production.up.railway.app'}${path}`, { headers }).then(r => r.ok ? r.json() : null).catch(() => null)
    Promise.all([
      safeFetch('/subscription/plans'),
      token ? safeFetch('/subscription/my') : Promise.resolve(null),
      token ? safeFetch('/subscription/usage') : Promise.resolve(null),
      token ? safeFetch('/subscription/events?limit=10') : Promise.resolve(null),
      token ? safeFetch('/subscription/suggestions') : Promise.resolve(null),
      safeFetch('/subscription/addons'),
      token ? safeFetch('/subscription/my-addons') : Promise.resolve(null),
      safeFetch('/subscription/product-pricing'),
    ]).then(([p, c, u, e, s, a, ma, pp]) => {
      setPlans(Array.isArray(p) ? p : [])
      setCurrent(c)
      setUsage(u)
      setEvents(Array.isArray(e) ? e : [])
      setSuggestions(s)
      setAddons(Array.isArray(a) ? a : [])
      setMyAddons(Array.isArray(ma) ? ma : [])
      setProductPricing(Array.isArray(pp) ? pp : [])
    }).finally(() => setLoading(false))
  }, [])

  const handleSubscribe = async (planId: string) => {
    const plan = plans.find((p: any) => p.id === planId)
    const price = billing === 'yearly' ? Number(plan?.price_yearly) : Number(plan?.price_monthly)
    // Free plan — subscribe directly
    if (price === 0) {
      await apiFetch('/subscription/subscribe', {
        method: 'POST',
        body: { plan_id: planId, billing_cycle: billing },
      })
      window.location.reload()
      return
    }
    // Paid plan — go to checkout
    const params = new URLSearchParams({
      product_name: `${plan?.name} багц (${billing === 'yearly' ? 'жилийн' : 'сарын'})`,
      quantity: '1',
      total_price: String(price),
      source: 'subscription',
      plan_id: planId,
      billing_cycle: billing,
    })
    window.location.href = `/checkout?${params.toString()}`
    return
  }
  // Keep old subscribe for compatibility
  const _legacySubscribe = async (planId: string) => {
    await apiFetch('/subscription/subscribe', {
      method: 'POST',
      body: { plan_id: planId, billing_cycle: billing },
    })
    window.location.reload()
  }

  const handleCancel = async () => {
    if (!confirm('Эрхээ цуцлахдаа итгэлтэй байна уу?')) return
    await apiFetch('/subscription/cancel', { method: 'POST', body: {} })
    window.location.reload()
  }

  const handlePurchaseAddon = (addonId: string) => {
    const addon = addons.find((a: any) => a.id === addonId)
    if (!addon) return
    const params = new URLSearchParams({
      product_name: addon.name,
      quantity: '1',
      total_price: String(addon.price),
      source: 'addon',
      addon_id: addonId,
    })
    window.location.href = `/checkout?${params.toString()}`
  }

  if (loading) return <div style={{ padding: 40, textAlign: 'center', fontFamily: FONT, color: '#9CA3AF' }}>Ачааллаж байна...</div>

  const status = current?.status || (current?.is_free ? 'free' : 'none')
  const statusInfo = STATUS_COLORS[status] || STATUS_COLORS.free

  return (
    <div style={{ padding: 24, fontFamily: FONT, maxWidth: 1000, margin: '0 auto' }}>
      <h1 style={{ fontSize: 22, fontWeight: 700, margin: '0 0 4px' }}>Эрх & Багц</h1>
      <p style={{ color: '#6B7280', fontSize: 14, margin: '0 0 24px' }}>Дижитал платформын эрхээ удирдах</p>

      {/* ═══ CURRENT PLAN + STATUS ═══ */}
      {current && (
        <div style={{ background: 'var(--surface, #fff)', borderRadius: 16, padding: 24, border: '1px solid var(--border, #E5E7EB)', marginBottom: 20 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
                <span style={{ fontSize: 28 }}>{TIER_ICONS[current.plan?.tier] || '\u2B50'}</span>
                <div>
                  <div style={{ fontSize: 20, fontWeight: 700, color: 'var(--text, #111)' }}>{current.plan?.name || 'Үнэгүй'}</div>
                  <span style={{
                    fontSize: 11, fontWeight: 600, padding: '2px 10px', borderRadius: 20,
                    background: statusInfo.bg, color: statusInfo.color,
                  }}>
                    {statusInfo.label}
                  </span>
                </div>
              </div>
              {current.days_left != null && !current.is_free && (
                <div style={{ fontSize: 13, color: '#6B7280', marginTop: 4 }}>
                  {current.days_left > 0 ? `${current.days_left} өдөр үлдсэн` : 'Хугацаа дууссан'}
                </div>
              )}
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              {!current.is_free && (
                <button onClick={handleCancel} style={{ padding: '8px 20px', background: '#FEE2E2', color: '#EF4444', border: 'none', borderRadius: 10, fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: FONT }}>Цуцлах</button>
              )}
            </div>
          </div>

          {/* ═══ USAGE BARS ═══ */}
          {usage && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 14 }}>
              {Object.entries(usage).map(([key, data]: [string, any]) => {
                const pct = Math.min(data.percentage, 100)
                const isWarning = data.status === 'warning'
                const isExceeded = data.status === 'exceeded'
                const barColor = isExceeded ? '#DC2626' : isWarning ? '#F59E0B' : ORANGE
                return (
                  <div key={key} style={{
                    background: 'var(--surface2, #F9FAFB)', borderRadius: 12, padding: 16,
                    border: isExceeded ? '2px solid #FCA5A5' : isWarning ? '2px solid #FDE68A' : '1px solid var(--border, #E5E7EB)',
                    position: 'relative', overflow: 'hidden',
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <span style={{ fontSize: 14 }}>{FEATURE_ICONS[key] || '📊'}</span>
                        <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text, #374151)' }}>{FEATURE_LABELS[key] || key}</span>
                      </div>
                      {isWarning && <span style={{ fontSize: 12 }} title="Хязгаарт ойрхон">⚠️</span>}
                      {isExceeded && <span style={{ fontSize: 12 }} title="Хязгаар хэтэрсэн">🚫</span>}
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 8 }}>
                      <span style={{ fontSize: 22, fontWeight: 700, color: barColor }}>{data.current}</span>
                      <span style={{ fontSize: 13, color: '#6B7280' }}>/ {data.effective_max}</span>
                    </div>
                    {/* Progress bar */}
                    <div style={{ height: 6, background: '#E5E7EB', borderRadius: 3, overflow: 'hidden' }}>
                      <div style={{ height: '100%', width: `${pct}%`, background: barColor, borderRadius: 3, transition: 'width 0.5s ease' }} />
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 4 }}>
                      <span style={{ fontSize: 11, color: '#9CA3AF' }}>{data.percentage}%</span>
                      {data.addon_bonus > 0 && (
                        <span style={{ fontSize: 10, color: '#10B981', fontWeight: 600 }}>+{data.addon_bonus} нэмэлт</span>
                      )}
                    </div>
                    {isExceeded && (
                      <button
                        onClick={() => setUpgradeModal({ open: true, featureKey: key, current: data.current, max: data.effective_max })}
                        style={{
                          marginTop: 8, width: '100%', padding: '6px', borderRadius: 8, border: 'none',
                          background: ORANGE, color: '#fff', fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: FONT,
                        }}
                      >
                        Шинэчлэх →
                      </button>
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </div>
      )}

      {/* ═══ SMART UPGRADE SUGGESTION ═══ */}
      {suggestions?.should_upgrade && (
        <div style={{
          background: 'linear-gradient(135deg, #FFF7ED, #FFEDD5)', borderRadius: 16,
          padding: 20, marginBottom: 20, border: `1px solid ${ORANGE}30`,
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <span style={{ fontSize: 28 }}>💡</span>
            <div>
              <div style={{ fontSize: 14, fontWeight: 700, color: '#92400E' }}>Багц шинэчлэх санал</div>
              <div style={{ fontSize: 13, color: '#B45309' }}>{suggestions.reason}</div>
            </div>
          </div>
          {suggestions.suggested_plan && (
            <button
              onClick={() => setUpgradeModal({ open: true })}
              style={{
                padding: '10px 24px', borderRadius: 12, border: 'none', background: ORANGE,
                color: '#fff', fontSize: 14, fontWeight: 700, cursor: 'pointer', fontFamily: FONT,
                whiteSpace: 'nowrap',
              }}
            >
              {suggestions.suggested_plan.name} руу шилжих
            </button>
          )}
        </div>
      )}

      {/* ═══ EVENTS / NOTIFICATIONS ═══ */}
      {events.length > 0 && (
        <div style={{ marginBottom: 20 }}>
          <h3 style={{ fontSize: 15, fontWeight: 600, margin: '0 0 10px', color: 'var(--text, #374151)' }}>Сүүлийн үйл явдлууд</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {events.slice(0, 5).map((ev: any) => {
              const sev = SEVERITY_COLORS[ev.severity] || SEVERITY_COLORS.info
              return (
                <div key={ev.id} style={{
                  background: sev.bg, borderRadius: 10, padding: '10px 14px',
                  display: 'flex', alignItems: 'center', gap: 10,
                }}>
                  <span style={{
                    width: 8, height: 8, borderRadius: '50%', background: sev.color, flexShrink: 0,
                  }} />
                  <div style={{ flex: 1 }}>
                    <span style={{ fontSize: 13, fontWeight: 600, color: sev.color }}>{ev.title}</span>
                    {ev.message && <span style={{ fontSize: 12, color: sev.color, opacity: 0.7, marginLeft: 8 }}>{ev.message}</span>}
                  </div>
                  <span style={{ fontSize: 11, color: sev.color, opacity: 0.5, whiteSpace: 'nowrap' }}>
                    {new Date(ev.created_at).toLocaleDateString()}
                  </span>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* ═══ ADD-ONS ═══ */}
      {addons.length > 0 && (
        <div style={{ marginBottom: 24 }}>
          <h3 style={{ fontSize: 15, fontWeight: 600, margin: '0 0 10px', color: 'var(--text, #374151)' }}>Нэмэлтүүд</h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 12 }}>
            {addons.map((addon: any) => {
              const owned = myAddons.some(ma => ma.addon_id === addon.id)
              return (
                <div key={addon.id} style={{
                  background: 'var(--surface, #fff)', borderRadius: 14, padding: 20,
                  border: owned ? `2px solid #10B981` : '1px solid var(--border, #E5E7EB)',
                  textAlign: 'center',
                }}>
                  <div style={{ fontSize: 24, marginBottom: 8 }}>{FEATURE_ICONS[addon.feature_key] || '📦'}</div>
                  <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text, #111)', marginBottom: 4 }}>{addon.name}</div>
                  <div style={{ fontSize: 12, color: '#6B7280', marginBottom: 12 }}>
                    +{addon.bonus_amount} {FEATURE_LABELS[addon.feature_key] || addon.feature_key}
                  </div>
                  <div style={{ fontSize: 18, fontWeight: 700, color: ORANGE, marginBottom: 12 }}>
                    {Number(addon.price).toLocaleString()}₮
                  </div>
                  <button
                    onClick={() => !owned && handlePurchaseAddon(addon.id)}
                    disabled={owned}
                    style={{
                      width: '100%', padding: '10px', borderRadius: 10, border: 'none', fontSize: 13,
                      fontWeight: 600, cursor: owned ? 'default' : 'pointer', fontFamily: FONT,
                      background: owned ? '#D1FAE5' : ORANGE, color: owned ? '#059669' : '#fff',
                    }}
                  >
                    {owned ? 'Авсан ✓' : 'Худалдан авах'}
                  </button>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* ═══ BILLING TOGGLE ═══ */}
      <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 24, gap: 0 }}>
        <button onClick={() => setBilling('monthly')} style={{ padding: '10px 24px', background: billing === 'monthly' ? ORANGE : 'var(--surface2, #F3F4F6)', color: billing === 'monthly' ? '#fff' : '#6B7280', border: 'none', borderRadius: '10px 0 0 10px', fontSize: 14, fontWeight: 600, cursor: 'pointer', fontFamily: FONT }}>Сарын</button>
        <button onClick={() => setBilling('yearly')} style={{ padding: '10px 24px', background: billing === 'yearly' ? ORANGE : 'var(--surface2, #F3F4F6)', color: billing === 'yearly' ? '#fff' : '#6B7280', border: 'none', borderRadius: '0 10px 10px 0', fontSize: 14, fontWeight: 600, cursor: 'pointer', fontFamily: FONT }}>Жилийн (хэмнэ)</button>
      </div>

      {/* ═══ PLANS ═══ */}
      <div style={{ display: 'grid', gridTemplateColumns: `repeat(${Math.min(plans.length || 3, 4)}, 1fr)`, gap: 16, marginBottom: 32 }}>
        {plans.map((plan: any) => {
          const isCurrent = current?.plan?.id === plan.id && !current.is_free
          const price = billing === 'yearly' ? Number(plan.price_yearly) : Number(plan.price_monthly)
          return (
            <div key={plan.id} style={{
              background: 'var(--surface, #fff)', borderRadius: 16, padding: 28, position: 'relative',
              border: isCurrent ? `2px solid ${ORANGE}` : plan.is_popular ? `2px solid ${ORANGE}40` : '1px solid var(--border, #E5E7EB)',
            }}>
              {plan.is_popular && (
                <div style={{ position: 'absolute', top: -12, left: '50%', transform: 'translateX(-50%)', background: ORANGE, color: '#fff', padding: '4px 16px', borderRadius: 20, fontSize: 11, fontWeight: 600 }}>Хамгийн түгээмэл</div>
              )}
              <div style={{ textAlign: 'center', marginBottom: 20 }}>
                <div style={{ fontSize: 32, marginBottom: 8 }}>{TIER_ICONS[plan.tier] || '\u2B50'}</div>
                <h3 style={{ fontSize: 20, fontWeight: 700, margin: 0, color: 'var(--text, #111)' }}>{plan.name}</h3>
                <div style={{ marginTop: 8 }}>
                  <span style={{ fontSize: 32, fontWeight: 700, color: 'var(--text, #111)' }}>{price > 0 ? `${price.toLocaleString()}₮` : 'Үнэгүй'}</span>
                  {price > 0 && <span style={{ fontSize: 13, color: '#6B7280' }}>/{billing === 'yearly' ? 'жил' : 'сар'}</span>}
                </div>
              </div>

              {/* Limits */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6, marginBottom: 16 }}>
                {[
                  { label: 'QR код', val: plan.max_qr_codes },
                  { label: 'Урилга', val: plan.max_invitations },
                  { label: 'QR бүтээгдэхүүн', val: plan.max_product_qrs },
                  { label: 'Дижитал карт', val: plan.max_digital_cards },
                ].map(item => (
                  <div key={item.label} style={{ background: 'var(--surface2, #F9FAFB)', borderRadius: 6, padding: '6px 8px', textAlign: 'center' }}>
                    <div style={{ fontSize: 10, color: '#9CA3AF' }}>{item.label}</div>
                    <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text, #111)' }}>{item.val || '∞'}</div>
                  </div>
                ))}
              </div>

              {/* Features */}
              <div style={{ marginBottom: 20 }}>
                {plan.features_list?.map((f: any, i: number) => (
                  <div key={i} style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 6, fontSize: 12, color: f.included ? 'var(--text, #374151)' : '#D1D5DB' }}>
                    <span style={{ color: f.included ? '#10B981' : '#D1D5DB', fontSize: 11 }}>{f.included ? '✓' : '✗'}</span>
                    {f.name}
                  </div>
                ))}
              </div>

              <button
                onClick={() => !isCurrent && handleSubscribe(plan.id)}
                disabled={isCurrent}
                style={{
                  width: '100%', padding: '12px', borderRadius: 10, border: 'none', fontSize: 14, fontWeight: 600, cursor: isCurrent ? 'default' : 'pointer',
                  background: isCurrent ? '#E5E7EB' : price === 0 ? 'var(--surface2, #F3F4F6)' : ORANGE,
                  color: isCurrent ? '#9CA3AF' : price === 0 ? 'var(--text, #374151)' : '#fff',
                  fontFamily: FONT,
                }}
              >
                {isCurrent ? 'Одоогийн багц' : price === 0 ? 'Үнэгүй эхлэх' : 'Сонгох'}
              </button>
            </div>
          )
        })}
      </div>

      {/* ═══ MY ADD-ONS ═══ */}
      {myAddons.length > 0 && (
        <div style={{ marginBottom: 24 }}>
          <h3 style={{ fontSize: 15, fontWeight: 600, margin: '0 0 10px', color: 'var(--text, #374151)' }}>Миний нэмэлтүүд</h3>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            {myAddons.map((ua: any) => (
              <div key={ua.id} style={{
                background: '#D1FAE5', borderRadius: 10, padding: '8px 14px',
                display: 'flex', alignItems: 'center', gap: 6,
              }}>
                <span style={{ fontSize: 12 }}>{FEATURE_ICONS[ua.addon?.feature_key] || '📦'}</span>
                <span style={{ fontSize: 13, fontWeight: 500, color: '#059669' }}>{ua.addon?.name}</span>
                <span style={{ fontSize: 11, color: '#10B981' }}>+{ua.addon?.bonus_amount}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ═══ PRODUCT PRICING ═══ */}
      {productPricing.length > 0 && (
        <div style={{ marginBottom: 24 }}>
          <h3 style={{ fontSize: 15, fontWeight: 600, margin: '0 0 10px', color: 'var(--text, #374151)' }}>Дижитал бүтээгдэхүүн</h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 12 }}>
            {productPricing.map((pp: any) => {
              const typeInfo: Record<string, { icon: string; color: string }> = {
                digital_card: { icon: '💳', color: '#2563EB' },
                loyalty_campaign: { icon: '⭐', color: '#F59E0B' },
                qr_campaign: { icon: '📱', color: '#10B981' },
                invitation_premium: { icon: '💌', color: '#8B5CF6' },
              }
              const ti = typeInfo[pp.product_type] || { icon: '📦', color: '#6B7280' }
              const isFree = Number(pp.price) === 0
              return (
                <div key={pp.id} style={{ background: 'var(--surface, #fff)', borderRadius: 14, padding: 20, border: '1px solid var(--border, #E5E7EB)', textAlign: 'center' }}>
                  <div style={{ fontSize: 28, marginBottom: 6 }}>{ti.icon}</div>
                  <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text, #111)', marginBottom: 4 }}>{pp.name}</div>
                  {pp.description && <div style={{ fontSize: 11, color: '#9CA3AF', marginBottom: 8, lineHeight: 1.4 }}>{pp.description}</div>}
                  <div style={{ fontSize: 22, fontWeight: 800, color: isFree ? '#10B981' : ti.color, marginBottom: 4 }}>
                    {isFree ? 'Үнэгүй' : `${Number(pp.price).toLocaleString()}₮`}
                  </div>
                  {pp.duration_days > 0 && !isFree && <div style={{ fontSize: 11, color: '#9CA3AF' }}>{pp.duration_days} хоног</div>}
                  {pp.free_tier_days > 0 && <div style={{ fontSize: 11, color: '#10B981', fontWeight: 600, marginTop: 4 }}>🎁 {pp.free_tier_days} хоног үнэгүй</div>}
                  {!isFree && (
                    <button onClick={() => {
                      const params = new URLSearchParams({
                        product_name: pp.name,
                        quantity: '1',
                        total_price: String(pp.price),
                        source: 'product',
                        product_pricing_id: pp.id,
                      })
                      window.location.href = `/checkout?${params.toString()}`
                    }} style={{ marginTop: 10, width: '100%', padding: '10px', borderRadius: 10, border: 'none', background: ti.color, color: '#fff', fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: FONT }}>
                      Худалдан авах
                    </button>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* ═══ SUBSCRIPTION STATES INFO ═══ */}
      <div style={{ background: 'var(--surface, #fff)', borderRadius: 14, padding: 20, border: '1px solid var(--border, #E5E7EB)' }}>
        <h3 style={{ fontSize: 14, fontWeight: 600, margin: '0 0 12px', color: 'var(--text, #374151)' }}>Эрхийн төлөвүүд</h3>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
          {Object.entries(STATUS_COLORS).map(([key, val]) => (
            <div key={key} style={{ background: val.bg, color: val.color, fontSize: 12, fontWeight: 600, padding: '4px 12px', borderRadius: 20 }}>
              {val.label}
            </div>
          ))}
        </div>
      </div>

      {/* ═══ UPGRADE MODAL ═══ */}
      <UpgradeModal
        isOpen={upgradeModal.open}
        onClose={() => setUpgradeModal({ open: false })}
        featureKey={upgradeModal.featureKey}
        current={upgradeModal.current}
        max={upgradeModal.max}
        suggestedPlan={suggestions?.suggested_plan}
        addons={addons}
      />
    </div>
  )
}
