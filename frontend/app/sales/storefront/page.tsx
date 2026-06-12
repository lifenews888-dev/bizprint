'use client'

import { apiFetch, getToken } from '@/lib/api'
import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import DashboardLayout from '@/components/layouts/DashboardLayout'
import { useRoleGuard } from '@/lib/use-role-guard'
import { SALES_MENU } from '@/config/sidebar-config'
import { optimizeImage } from '@/lib/image'

/* ═══════════════════════════════════════════════
 *  SALES AGENT'S "MY STOREFRONT"
 *  Lists every product the agent has adopted, plus a quick add-to-store
 *  search that feeds /products and lets them adopt with one click.
 *  Public link: /s/{referralCode}
 * ═══════════════════════════════════════════════ */

interface Listing {
  id: string
  name: string
  thumbnail_url?: string
  base_price?: number
  sale_price?: number
  category?: string
  sales_listing?: {
    id: string
    is_active: boolean
    commission_rate_override?: number
    sort_order: number
    agent_note?: string
  }
}

interface CatalogProduct {
  id: string
  name?: string | null
  name_mn?: string | null
  thumbnail_url?: string | null
  base_price?: number | string | null
  sale_price?: number | string | null
  category?: string | null
}

interface ReferralInfo {
  code?: string
}

export default function SalesStorefrontPage() {
  const router = useRouter()
  const { user, loading: authLoading } = useRoleGuard(['sales', 'admin'])
  const [listings, setListings] = useState<Listing[]>([])
  const [loading, setLoading] = useState(true)
  const [referralCode, setReferralCode] = useState('')
  const [search, setSearch] = useState('')
  const [allProducts, setAllProducts] = useState<CatalogProduct[]>([])
  const [showAdd, setShowAdd] = useState(false)
  const [busy, setBusy] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)

  const load = useCallback(() => {
    Promise.all([
      apiFetch<Listing[]>('/sales/me/storefront').catch(() => []),
      apiFetch<ReferralInfo | null>('/referral/my').catch(() => null),
    ]).then(([items, ref]) => {
      setListings(Array.isArray(items) ? items : [])
      if (ref?.code) setReferralCode(ref.code)
      setLoading(false)
    })
  }, [])

  useEffect(() => {
    if (authLoading) return
    if (!getToken()) { router.push('/login'); return }
    load()
  }, [authLoading, load, router])

  const openAdd = async () => {
    setShowAdd(true)
    if (!allProducts.length) {
      try {
        const data = await apiFetch<CatalogProduct[]>('/products?limit=100', { auth: false })
        setAllProducts(Array.isArray(data) ? data : [])
      } catch {}
    }
  }

  const adopt = async (productId: string) => {
    setBusy(productId)
    try {
      await apiFetch(`/products/${productId}/adopt`, { method: 'POST', body: {} })
      load()
    } catch {} finally { setBusy(null) }
  }

  const unadopt = async (productId: string) => {
    if (!confirm('Энэ бүтээгдэхүүнийг дэлгүүрээс хасах уу?')) return
    setBusy(productId)
    try {
      await apiFetch(`/products/${productId}/adopt`, { method: 'DELETE' })
      load()
    } catch {} finally { setBusy(null) }
  }

  const storefrontUrl = referralCode
    ? `${typeof window !== 'undefined' ? window.location.origin : 'https://bizprint.mn'}/s/${referralCode}`
    : ''

  const copyUrl = () => {
    navigator.clipboard.writeText(storefrontUrl)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const adoptedIds = new Set(listings.map(l => l.id))
  const searchResults = allProducts
    .filter(p => !adoptedIds.has(p.id))
    .filter(p => !search || (p.name_mn || p.name || '').toLowerCase().includes(search.toLowerCase()))
    .slice(0, 20)

  if (authLoading) return <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text2)' }}>Ачаалж байна...</div>

  return (
    <DashboardLayout navGroups={SALES_MENU} user={user || undefined}>
      <div style={{ marginBottom: 20 }}>
        <h1 style={{ fontSize: 22, fontWeight: 700, margin: 0 }}>🛍 Миний дэлгүүр</h1>
        <p style={{ color: 'var(--text2)', fontSize: 13, margin: '4px 0 0' }}>
          Та сонгосон бүтээгдэхүүнээ өөрийн линкээр борлуулна. Захиалга бүрд автоматаар комисс орно.
        </p>
      </div>

      {/* Public storefront link */}
      {referralCode && (
        <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 12, padding: 16, marginBottom: 20, display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
          <div style={{ flex: 1, minWidth: 240 }}>
            <div style={{ fontSize: 11, color: 'var(--text3)', marginBottom: 4 }}>Таны дэлгүүрийн линк</div>
            <div style={{ fontSize: 14, fontFamily: 'monospace', color: '#FF6B00', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{storefrontUrl}</div>
          </div>
          <button onClick={copyUrl} style={{ padding: '10px 18px', background: copied ? '#10B981' : '#FF6B00', color: '#fff', border: 'none', borderRadius: 8, cursor: 'pointer', fontWeight: 700, fontSize: 13 }}>
            {copied ? '✓ Хуулагдлаа' : 'Линк хуулах'}
          </button>
          <a href={storefrontUrl} target="_blank" rel="noreferrer" style={{ padding: '10px 18px', background: 'var(--surface2)', color: 'var(--text)', border: '1px solid var(--border)', borderRadius: 8, fontSize: 13, fontWeight: 600, textDecoration: 'none' }}>
            Үзэх →
          </a>
        </div>
      )}

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
        <span style={{ fontSize: 14, color: 'var(--text2)' }}>{listings.length} бүтээгдэхүүн</span>
        <button onClick={openAdd} style={{ padding: '8px 16px', background: '#FF6B00', color: '#fff', border: 'none', borderRadius: 8, cursor: 'pointer', fontWeight: 700, fontSize: 13 }}>
          + Бүтээгдэхүүн нэмэх
        </button>
      </div>

      {loading ? (
        <div style={{ padding: 40, textAlign: 'center', color: 'var(--text2)' }}>Уншиж байна...</div>
      ) : listings.length === 0 ? (
        <div style={{ padding: 60, textAlign: 'center', border: '1px dashed var(--border)', borderRadius: 12, color: 'var(--text2)' }}>
          <div style={{ fontSize: 32, marginBottom: 8 }}>🛍</div>
          <div style={{ fontWeight: 600 }}>Дэлгүүр хоосон</div>
          <div style={{ fontSize: 13, marginTop: 4 }}>+ Бүтээгдэхүүн нэмэх товч даран бүтээгдэхүүнээ сонгож эхлээрэй</div>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 14 }}>
          {listings.map(p => (
            <div key={p.id} style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 12, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
              <div style={{ aspectRatio: '1 / 1', background: 'var(--surface2)' }}>
                {p.thumbnail_url && (
                  <img src={optimizeImage(p.thumbnail_url, { w: 400, h: 400 })} alt={p.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                )}
              </div>
              <div style={{ padding: 12, flex: 1, display: 'flex', flexDirection: 'column', gap: 8 }}>
                <div style={{ fontSize: 13, fontWeight: 600, lineHeight: 1.3 }}>{p.name}</div>
                {p.base_price != null && (
                  <div style={{ fontSize: 14, fontWeight: 700, color: '#FF6B00' }}>₮{Number(p.base_price).toLocaleString()}</div>
                )}
                <button onClick={() => unadopt(p.id)} disabled={busy === p.id} style={{ marginTop: 'auto', padding: '7px 0', background: 'transparent', color: '#EF4444', border: '1px solid #EF4444', borderRadius: 6, cursor: 'pointer', fontSize: 12, fontWeight: 600 }}>
                  {busy === p.id ? '...' : 'Хасах'}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add modal */}
      {showAdd && (
        <div onClick={() => setShowAdd(false)} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
          <div onClick={e => e.stopPropagation()} style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 14, padding: 20, width: '100%', maxWidth: 720, maxHeight: '85vh', display: 'flex', flexDirection: 'column' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
              <h3 style={{ fontSize: 16, fontWeight: 700, margin: 0 }}>Бүтээгдэхүүн нэмэх</h3>
              <button onClick={() => setShowAdd(false)} style={{ background: 'var(--surface2)', border: '1px solid var(--border)', borderRadius: 6, width: 32, height: 32, cursor: 'pointer' }}>✕</button>
            </div>
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Хайх..." style={{ width: '100%', padding: '10px 14px', background: 'var(--surface2)', border: '1px solid var(--border)', borderRadius: 8, fontSize: 13, marginBottom: 12 }} />
            <div style={{ flex: 1, overflow: 'auto', display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: 10 }}>
              {searchResults.length === 0 ? (
                <div style={{ gridColumn: '1/-1', padding: 24, textAlign: 'center', color: 'var(--text3)', fontSize: 13 }}>Бүтээгдэхүүн олдсонгүй</div>
              ) : searchResults.map(p => (
                <div key={p.id} style={{ background: 'var(--surface2)', borderRadius: 10, padding: 10, display: 'flex', flexDirection: 'column', gap: 6 }}>
                  <div style={{ aspectRatio: '1 / 1', background: 'var(--surface3)', borderRadius: 6, overflow: 'hidden' }}>
                    {p.thumbnail_url && <img src={optimizeImage(p.thumbnail_url, { w: 200, h: 200 })} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />}
                  </div>
                  <div style={{ fontSize: 12, fontWeight: 600, lineHeight: 1.2, minHeight: 30 }}>{p.name_mn || p.name || 'Бүтээгдэхүүн'}</div>
                  <button onClick={() => adopt(p.id)} disabled={busy === p.id} style={{ padding: '6px 0', background: '#FF6B00', color: '#fff', border: 'none', borderRadius: 6, cursor: 'pointer', fontSize: 11, fontWeight: 700 }}>
                    {busy === p.id ? '...' : '+ Нэмэх'}
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  )
}
