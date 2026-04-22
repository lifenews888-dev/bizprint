'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { apiFetch, API_URL } from '@/lib/api'
import ProductCard from '@/components/ProductCard'

/* ═══════════════════════════════════════════════
 *  PUBLIC SALES AGENT STOREFRONT — /s/{referralCode}
 *  When the customer follows the agent's share link, this page:
 *    1. captures the agent's code into localStorage so the order picks
 *       it up at confirm time (Cart.confirmQuote falls back to ref code
 *       if user is not registered yet)
 *    2. lists the products the agent has adopted
 * ═══════════════════════════════════════════════ */

interface StorefrontData {
  agent: {
    id: string
    full_name: string
    company_name?: string
    avatar_url?: string
    professional_bio?: string
  } | null
  referral_code: string
  products: any[]
}

export default function SalesStorefrontPublic() {
  const params = useParams()
  const code = (params?.code as string || '').toUpperCase()
  const [data, setData] = useState<StorefrontData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!code) return
    // Persist the referral code the moment the customer lands here so any
    // later signup/checkout (even on a different page) gets credited to
    // this agent. Cleared on successful registration in /register.
    try { localStorage.setItem('bp_referral_code', code) } catch {}

    apiFetch<StorefrontData>(`/sales/storefront/${code}`, { auth: false })
      .then(d => setData(d))
      .catch(() => setError('Дэлгүүр олдсонгүй'))
      .finally(() => setLoading(false))
  }, [code])

  if (loading) {
    return (
      <div style={{ minHeight: '60vh', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text2)' }}>
        Дэлгүүр ачаалж байна...
      </div>
    )
  }

  if (error || !data) {
    return (
      <div style={{ minHeight: '60vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 12, color: 'var(--text2)' }}>
        <div style={{ fontSize: 40 }}>🛍</div>
        <div>{error || 'Дэлгүүр олдсонгүй'}</div>
        <a href="/shop" style={{ color: '#FF6B00', fontWeight: 600 }}>Үндсэн дэлгүүр →</a>
      </div>
    )
  }

  const agent = data.agent
  const initial = agent?.full_name?.charAt(0)?.toUpperCase() || '?'

  return (
    <div style={{ background: 'var(--bg)', minHeight: '100vh' }}>
      {/* Agent hero */}
      <div style={{ background: 'linear-gradient(135deg, #1C1917, #292524)', padding: '32px 20px', color: '#fff' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto', display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
          <div style={{ width: 64, height: 64, borderRadius: '50%', background: 'linear-gradient(135deg, #FF6B00, #F59E0B)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 28, fontWeight: 800, color: '#fff', flexShrink: 0 }}>
            {agent?.avatar_url ? (
              <img src={agent.avatar_url} alt="" style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }} />
            ) : initial}
          </div>
          <div style={{ flex: 1, minWidth: 220 }}>
            <div style={{ fontSize: 11, letterSpacing: 1.5, color: '#FF6B00', fontWeight: 700, marginBottom: 4 }}>BIZPRINT БОРЛУУЛАГЧ</div>
            <h1 style={{ fontSize: 24, fontWeight: 800, margin: 0 }}>{agent?.company_name || agent?.full_name || 'Sales Agent'}</h1>
            {agent?.professional_bio && (
              <p style={{ fontSize: 13, color: '#A8A29E', margin: '4px 0 0' }}>{agent.professional_bio}</p>
            )}
          </div>
          <div style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.15)', borderRadius: 99, padding: '6px 14px', fontSize: 11, fontWeight: 600 }}>
            #{data.referral_code}
          </div>
        </div>
      </div>

      {/* Catalog */}
      <div style={{ maxWidth: 1100, margin: '0 auto', padding: '24px 16px 80px' }}>
        <div style={{ fontSize: 14, color: 'var(--text2)', marginBottom: 16 }}>
          {data.products.length} бүтээгдэхүүн · Захиалга өгсний 48 цагийн дараа борлуулагч хувь хүртэнэ
        </div>
        {data.products.length === 0 ? (
          <div style={{ padding: 60, textAlign: 'center', color: 'var(--text2)', border: '1px dashed var(--border)', borderRadius: 12 }}>
            <div style={{ fontSize: 32, marginBottom: 8 }}>📦</div>
            <div>Энэ дэлгүүр одоохондоо хоосон байна</div>
            <a href="/shop" style={{ color: '#FF6B00', fontWeight: 600, marginTop: 12, display: 'inline-block' }}>Бүх бүтээгдэхүүн →</a>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 18 }}>
            {data.products.map(p => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
