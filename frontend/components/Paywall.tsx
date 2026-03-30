'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'

const FONT = "'DM Sans','Segoe UI',system-ui,sans-serif"
const O = '#FF6B00'
const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'

interface Props {
  feature: string
  title?: string
  description?: string
  icon?: string
}

const FEATURE_INFO: Record<string, { title: string; description: string; icon: string }> = {
  loyalty_campaigns: {
    title: 'Loyalty кампанит',
    description: 'Loyalty кампанит үүсгэж, QR + тамга + шагнал системээр хэрэглэгч татаарай',
    icon: '⭐',
  },
  invitations: {
    title: 'Дижитал урилга',
    description: 'Дижитал урилга үүсгэж, зочдоо удирдаарай',
    icon: '💌',
  },
  product_qrs: {
    title: 'Бүтээгдэхүүн QR',
    description: 'Бүтээгдэхүүн бүрт QR код үүсгэж, дахин захиалга авах',
    icon: '📦',
  },
  digital_cards: {
    title: 'Дижитал карт',
    description: 'Дижитал нэрийн хуудас үүсгээрэй',
    icon: '💳',
  },
  qr_codes: {
    title: 'QR код',
    description: 'QR код үүсгэж ашиглаарай',
    icon: '📱',
  },
}

export default function Paywall({ feature, title, description, icon }: Props) {
  const router = useRouter()
  const [plans, setPlans] = useState<any[]>([])
  const [current, setCurrent] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  const info = FEATURE_INFO[feature] || { title: title || 'Функц', description: description || '', icon: icon || '🔒' }

  useEffect(() => {
    const token = localStorage.getItem('access_token') || localStorage.getItem('token')
    const headers: any = token ? { Authorization: `Bearer ${token}` } : {}
    const sf = (p: string) => fetch(`${API}${p}`, { headers }).then(r => r.ok ? r.json() : null).catch(() => null)
    Promise.all([
      sf('/subscription/plans'),
      token ? sf('/subscription/my') : Promise.resolve(null),
    ]).then(([p, c]) => {
      setPlans(Array.isArray(p) ? p : [])
      setCurrent(c)
    }).finally(() => setLoading(false))
  }, [])

  if (loading) return null

  const currentTier = current?.plan?.tier || 'free'
  const tierOrder = ['free', 'pro', 'business', 'enterprise']
  const currentIdx = tierOrder.indexOf(currentTier)

  // Find plans that have this feature
  const LIMIT_KEY_MAP: Record<string, string> = {
    loyalty_campaigns: 'max_loyalty_campaigns',
    invitations: 'max_invitations',
    product_qrs: 'max_product_qrs',
    digital_cards: 'max_digital_cards',
    qr_codes: 'max_qr_codes',
  }
  const limitKey = LIMIT_KEY_MAP[feature]
  const upgradePlans = plans.filter(p => {
    const idx = tierOrder.indexOf(p.tier)
    if (idx <= currentIdx) return false
    if (limitKey) return (p as any)[limitKey] > 0
    return true
  })

  return (
    <div style={{
      background: 'linear-gradient(135deg, #FFF7ED, #FEF3C7)', borderRadius: 20, padding: 40,
      border: `2px solid ${O}30`, textAlign: 'center', maxWidth: 700, margin: '0 auto',
      fontFamily: FONT,
    }}>
      {/* Lock icon */}
      <div style={{ fontSize: 56, marginBottom: 16 }}>{info.icon}</div>

      <h2 style={{ fontSize: 24, fontWeight: 800, color: '#1F2937', margin: '0 0 8px' }}>{info.title}</h2>
      <p style={{ fontSize: 15, color: '#6B7280', margin: '0 0 24px', lineHeight: 1.6 }}>{info.description}</p>

      {/* Current plan info */}
      <div style={{ background: 'rgba(255,255,255,0.7)', borderRadius: 12, padding: '12px 20px', display: 'inline-flex', alignItems: 'center', gap: 8, marginBottom: 24 }}>
        <span style={{ fontSize: 13, color: '#6B7280' }}>Одоогийн багц:</span>
        <span style={{ fontSize: 14, fontWeight: 700, color: O }}>{current?.plan?.name || 'Үнэгүй'}</span>
        {limitKey && (
          <span style={{ fontSize: 12, color: '#9CA3AF' }}>
            ({(current?.plan as any)?.[limitKey] || 0} хязгаар)
          </span>
        )}
      </div>

      {/* Upgrade options */}
      {upgradePlans.length > 0 ? (
        <div style={{ display: 'grid', gridTemplateColumns: `repeat(${Math.min(upgradePlans.length, 3)}, 1fr)`, gap: 16, marginBottom: 24 }}>
          {upgradePlans.map((plan: any) => (
            <div key={plan.id} style={{
              background: '#fff', borderRadius: 16, padding: 24,
              border: plan.is_popular ? `2px solid ${O}` : '1px solid #E5E7EB',
              position: 'relative',
            }}>
              {plan.is_popular && (
                <div style={{ position: 'absolute', top: -10, left: '50%', transform: 'translateX(-50%)', background: O, color: '#fff', padding: '2px 14px', borderRadius: 20, fontSize: 11, fontWeight: 600 }}>Санал болгох</div>
              )}
              <div style={{ fontSize: 18, fontWeight: 700, color: '#1F2937', marginBottom: 4 }}>{plan.name}</div>
              <div style={{ fontSize: 28, fontWeight: 800, color: O, marginBottom: 4 }}>
                {Number(plan.price_monthly).toLocaleString()}₮
              </div>
              <div style={{ fontSize: 12, color: '#6B7280', marginBottom: 16 }}>/сар</div>

              {/* What they get */}
              {limitKey && (
                <div style={{ fontSize: 13, color: '#059669', fontWeight: 600, marginBottom: 12 }}>
                  {(plan as any)[limitKey]} {info.title}
                </div>
              )}

              <button onClick={() => router.push('/dashboard/customer/subscription')} style={{
                width: '100%', padding: '12px', background: plan.is_popular ? O : '#F3F4F6',
                color: plan.is_popular ? '#fff' : '#374151', border: 'none', borderRadius: 10,
                fontSize: 14, fontWeight: 700, cursor: 'pointer', fontFamily: FONT,
              }}>
                Шинэчлэх
              </button>
            </div>
          ))}
        </div>
      ) : (
        <button onClick={() => router.push('/dashboard/customer/subscription')} style={{
          padding: '14px 40px', background: O, color: '#fff', border: 'none', borderRadius: 12,
          fontSize: 16, fontWeight: 700, cursor: 'pointer', fontFamily: FONT, marginBottom: 16,
        }}>
          Багц шинэчлэх →
        </button>
      )}

      <div style={{ fontSize: 12, color: '#9CA3AF' }}>
        Бүх багцуудыг <a href="/dashboard/customer/subscription" style={{ color: O, textDecoration: 'underline' }}>эндээс</a> харна уу
      </div>
    </div>
  )
}
