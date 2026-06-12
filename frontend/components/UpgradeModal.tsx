'use client'
import { useState } from 'react'
import { apiFetch } from '@/lib/api'

const ORANGE = '#FF6B00'
const FONT = "'DM Sans','Segoe UI',system-ui,sans-serif"

const FEATURE_LABELS: Record<string, string> = {
  qr_codes: 'QR код',
  invitations: 'Урилга',
  product_qrs: 'Бүтээгдэхүүн QR',
  digital_cards: 'Дижитал карт',
  storage_mb: 'Хадгалах зай',
}

interface Props {
  isOpen: boolean
  onClose: () => void
  featureKey?: string
  current?: number
  max?: number
  suggestedPlan?: SuggestedPlan
  addons?: SubscriptionAddon[]
}

interface SuggestedPlan {
  id: string
  name: string
  price_monthly: number | string
  [key: string]: number | string | undefined
}

interface SubscriptionAddon {
  id: string
  name: string
  feature_key: string
  bonus_amount: number | string
  price: number | string
}

export default function UpgradeModal({ isOpen, onClose, featureKey, current, max, suggestedPlan, addons }: Props) {
  const [loading, setLoading] = useState(false)
  const [tab, setTab] = useState<'upgrade' | 'addon'>('upgrade')

  if (!isOpen) return null

  const featureLabel = featureKey ? FEATURE_LABELS[featureKey] || featureKey : ''
  const relevantAddons = addons?.filter(a => a.feature_key === featureKey) || []

  const handleUpgrade = async (planId: string) => {
    setLoading(true)
    try {
      await apiFetch('/subscription/subscribe', {
        method: 'POST',
        body: { plan_id: planId, billing_cycle: 'monthly' },
      })
      try { const u = await apiFetch('/auth/me'); if (u) localStorage.setItem('user', JSON.stringify(u)) } catch {}
      window.location.reload()
    } catch {
      alert('Алдаа гарлаа')
    } finally {
      setLoading(false)
    }
  }

  const handleAddon = async (addonId: string) => {
    setLoading(true)
    try {
      await apiFetch('/subscription/addons/purchase', {
        method: 'POST',
        body: { addon_id: addonId },
      })
      try { const u = await apiFetch('/auth/me'); if (u) localStorage.setItem('user', JSON.stringify(u)) } catch {}
      window.location.reload()
    } catch {
      alert('Алдаа гарлаа')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{
      position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex',
      alignItems: 'center', justifyContent: 'center', zIndex: 9999, fontFamily: FONT,
    }}
      onClick={onClose}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{
          background: 'var(--surface, #fff)', borderRadius: 20, padding: 32, width: 480,
          maxWidth: '90vw', maxHeight: '85vh', overflowY: 'auto', boxShadow: '0 20px 60px rgba(0,0,0,0.2)',
        }}
      >
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: 24 }}>
          <div style={{ fontSize: 48, marginBottom: 12 }}>🚀</div>
          <h2 style={{ fontSize: 22, fontWeight: 700, margin: '0 0 6px', color: 'var(--text, #111)' }}>
            Багцаа шинэчлэх
          </h2>
          {featureKey && (
            <p style={{ fontSize: 14, color: '#6B7280', margin: 0 }}>
              {featureLabel} хязгаар хэтэрсэн ({current}/{max})
            </p>
          )}
        </div>

        {/* Warning bar */}
        <div style={{
          background: 'linear-gradient(135deg, #FEF3C7, #FDE68A)', borderRadius: 12,
          padding: '14px 18px', marginBottom: 20, display: 'flex', alignItems: 'center', gap: 10,
        }}>
          <span style={{ fontSize: 20 }}>⚠️</span>
          <div style={{ fontSize: 13, color: '#92400E', fontWeight: 500 }}>
            Үргэлжлүүлэхийн тулд багцаа шинэчлэх эсвэл нэмэлт худалдан авна уу
          </div>
        </div>

        {/* Tabs */}
        <div style={{ display: 'flex', gap: 0, marginBottom: 20, borderBottom: '2px solid #E5E7EB' }}>
          <button onClick={() => setTab('upgrade')} style={{
            flex: 1, padding: '10px', border: 'none', cursor: 'pointer', fontSize: 14, fontWeight: 600,
            background: 'none', color: tab === 'upgrade' ? ORANGE : '#9CA3AF',
            borderBottom: tab === 'upgrade' ? `2px solid ${ORANGE}` : '2px solid transparent',
            marginBottom: -2, fontFamily: FONT,
          }}>
            Багц шинэчлэх
          </button>
          {relevantAddons.length > 0 && (
            <button onClick={() => setTab('addon')} style={{
              flex: 1, padding: '10px', border: 'none', cursor: 'pointer', fontSize: 14, fontWeight: 600,
              background: 'none', color: tab === 'addon' ? ORANGE : '#9CA3AF',
              borderBottom: tab === 'addon' ? `2px solid ${ORANGE}` : '2px solid transparent',
              marginBottom: -2, fontFamily: FONT,
            }}>
              Нэмэлт авах
            </button>
          )}
        </div>

        {tab === 'upgrade' && suggestedPlan && (
          <div style={{
            border: `2px solid ${ORANGE}40`, borderRadius: 16, padding: 24,
            background: 'linear-gradient(135deg, #FFF7ED, #FFEDD5)',
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: 16 }}>
              <div>
                <div style={{ fontSize: 11, color: ORANGE, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 4 }}>
                  Санал болгож байна
                </div>
                <div style={{ fontSize: 20, fontWeight: 700, color: 'var(--text, #111)' }}>
                  {suggestedPlan.name}
                </div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: 24, fontWeight: 700, color: ORANGE }}>
                  {Number(suggestedPlan.price_monthly).toLocaleString()}₮
                </div>
                <div style={{ fontSize: 12, color: '#6B7280' }}>/сар</div>
              </div>
            </div>

            {/* Plan limits comparison */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 16 }}>
              {[
                { key: 'max_qr_codes', label: 'QR код' },
                { key: 'max_invitations', label: 'Урилга' },
                { key: 'max_product_qrs', label: 'Бүтээгдэхүүн QR' },
                { key: 'max_digital_cards', label: 'Дижитал карт' },
              ].map(item => (
                <div key={item.key} style={{
                  background: 'rgba(255,255,255,0.7)', borderRadius: 8, padding: '8px 12px',
                }}>
                  <div style={{ fontSize: 11, color: '#6B7280' }}>{item.label}</div>
                  <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--text, #111)' }}>
                    {suggestedPlan[item.key]}
                  </div>
                </div>
              ))}
            </div>

            <button
              onClick={() => handleUpgrade(suggestedPlan.id)}
              disabled={loading}
              style={{
                width: '100%', padding: '14px', borderRadius: 12, border: 'none', fontSize: 15,
                fontWeight: 700, cursor: loading ? 'not-allowed' : 'pointer', fontFamily: FONT,
                background: ORANGE, color: '#fff', opacity: loading ? 0.6 : 1,
              }}
            >
              {loading ? 'Хүлээнэ үү...' : `${suggestedPlan.name} багц руу шилжих`}
            </button>
          </div>
        )}

        {tab === 'addon' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {relevantAddons.map((addon) => (
              <div key={addon.id} style={{
                border: '1px solid var(--border, #E5E7EB)', borderRadius: 14, padding: '18px 20px',
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              }}>
                <div>
                  <div style={{ fontSize: 15, fontWeight: 600, color: 'var(--text, #111)', marginBottom: 4 }}>
                    {addon.name}
                  </div>
                  <div style={{ fontSize: 13, color: '#6B7280' }}>
                    +{addon.bonus_amount} {FEATURE_LABELS[addon.feature_key] || addon.feature_key}
                  </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: 16, fontWeight: 700, color: ORANGE, marginBottom: 6 }}>
                    {Number(addon.price).toLocaleString()}₮
                  </div>
                  <button
                    onClick={() => handleAddon(addon.id)}
                    disabled={loading}
                    style={{
                      padding: '8px 18px', borderRadius: 10, border: 'none', fontSize: 13,
                      fontWeight: 600, cursor: loading ? 'not-allowed' : 'pointer', fontFamily: FONT,
                      background: ORANGE, color: '#fff', opacity: loading ? 0.6 : 1,
                    }}
                  >
                    Авах
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Close button */}
        <button
          onClick={onClose}
          style={{
            width: '100%', padding: '12px', borderRadius: 10, border: '1px solid var(--border, #E5E7EB)',
            background: 'transparent', color: '#6B7280', fontSize: 14, fontWeight: 500, cursor: 'pointer',
            marginTop: 16, fontFamily: FONT,
          }}
        >
          Хаах
        </button>
      </div>
    </div>
  )
}
