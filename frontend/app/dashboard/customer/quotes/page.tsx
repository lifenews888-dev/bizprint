'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { apiFetch, getToken, API_URL } from '@/lib/api'

const F = "'DM Sans','Segoe UI',system-ui,sans-serif"
const O = '#FF6B00'

const STATUS_MAP: Record<string, { label: string; color: string; bg: string }> = {
  draft:     { label: 'Ноорог',          color: '#6B7280', bg: '#F3F4F6' },
  sent:      { label: 'Илгээгдсэн',      color: '#FF6B00', bg: '#FFF7ED' },
  confirmed: { label: 'Баталгаажсан',    color: '#059669', bg: '#D1FAE5' },
  ordered:   { label: 'Захиалагдсан',    color: '#2563EB', bg: '#DBEAFE' },
  expired:   { label: 'Хугацаа дууссан', color: '#DC2626', bg: '#FEE2E2' },
}

type Tab = 'all' | 'sent' | 'confirmed' | 'ordered' | 'expired'

export default function MyQuotesPage() {
  const router = useRouter()
  const [quotes, setQuotes] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState<Tab>('all')
  const [converting, setConverting] = useState<string | null>(null)

  useEffect(() => {
    const token = getToken()
    if (!token) { router.push('/login'); return }

    apiFetch<any>('/quote/my')
      .then(d => setQuotes(Array.isArray(d) ? d : []))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  const filtered = quotes.filter(q => {
    if (tab === 'all') return true
    return q.status === tab
  })

  const counts: Record<Tab, number> = {
    all: quotes.length,
    sent: quotes.filter(q => q.status === 'sent').length,
    confirmed: quotes.filter(q => q.status === 'confirmed').length,
    ordered: quotes.filter(q => q.status === 'ordered').length,
    expired: quotes.filter(q => q.status === 'expired').length,
  }

  const fmt = (n: number) => '₮' + new Intl.NumberFormat('mn-MN').format(Math.round(n))
  const fmtDate = (d: string) => d ? new Date(d).toLocaleDateString('mn-MN') : ''

  async function convertToOrder(quoteId: string) {
    setConverting(quoteId)
    try {
      await apiFetch('/orders/from-quote', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ quote_id: quoteId }),
      })
      router.push('/dashboard/customer/orders')
    } catch {
      alert('Захиалга үүсгэхэд алдаа гарлаа')
    } finally {
      setConverting(null)
    }
  }

  if (loading) return (
    <div style={{ padding: 40, fontFamily: F, color: 'var(--text3)' }}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {[1,2,3].map(i => <div key={i} style={{ height: 100, background: 'var(--surface)', borderRadius: 14, animation: 'pulse 1.5s infinite' }} />)}
      </div>
      <style>{`@keyframes pulse{0%,100%{opacity:1}50%{opacity:0.5}}`}</style>
    </div>
  )

  return (
    <div style={{ padding: '24px 28px', fontFamily: F, maxWidth: 960, margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 700, margin: '0 0 4px' }}>Үнийн саналууд</h1>
          <p style={{ color: 'var(--text3)', fontSize: 14, margin: 0 }}>Таны хүлээн авсан үнийн саналууд</p>
        </div>
        <button onClick={() => router.push('/dashboard/customer/quote-calc')} style={{
          background: O, color: '#fff', border: 'none', borderRadius: 10,
          padding: '10px 20px', fontSize: 13, fontWeight: 700, cursor: 'pointer',
        }}>
          + Шинэ үнийн санал
        </button>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 4, marginBottom: 20, borderBottom: '1px solid var(--border)' }}>
        {([
          { key: 'all', label: 'Бүгд' },
          { key: 'sent', label: 'Хүлээгдэж буй' },
          { key: 'confirmed', label: 'Баталгаажсан' },
          { key: 'ordered', label: 'Захиалагдсан' },
          { key: 'expired', label: 'Дууссан' },
        ] as { key: Tab; label: string }[]).map(t => (
          <button key={t.key} onClick={() => setTab(t.key)} style={{
            background: 'none', border: 'none', padding: '10px 16px',
            fontSize: 13, fontWeight: 600, cursor: 'pointer',
            color: tab === t.key ? O : 'var(--text3)',
            borderBottom: tab === t.key ? `2px solid ${O}` : '2px solid transparent',
            marginBottom: -1,
          }}>
            {t.label} {counts[t.key] > 0 && <span style={{ fontSize: 11, opacity: 0.7 }}>({counts[t.key]})</span>}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div style={{ background: 'var(--surface)', borderRadius: 16, padding: 48, textAlign: 'center', border: '1px solid var(--border)' }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>📋</div>
          <div style={{ fontSize: 18, fontWeight: 600 }}>Үнийн санал байхгүй</div>
          <p style={{ color: 'var(--text3)', fontSize: 14, marginTop: 8 }}>Үнийн санал авахын тулд захиалга өгнө үү</p>
          <button onClick={() => router.push('/dashboard/customer/quote-calc')} style={{
            marginTop: 16, background: O, color: '#fff', border: 'none', borderRadius: 10,
            padding: '10px 24px', fontSize: 14, fontWeight: 600, cursor: 'pointer',
          }}>
            Үнийн санал авах →
          </button>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {filtered.map(q => {
            const st = STATUS_MAP[q.status] || { label: q.status, color: '#6B7280', bg: '#F3F4F6' }
            const isExpired = q.expires_at && new Date(q.expires_at) < new Date()
            const isConverting = converting === q.id

            return (
              <div key={q.id} style={{
                background: 'var(--surface)', borderRadius: 14,
                border: `1px solid ${q.status === 'sent' ? `${O}40` : 'var(--border)'}`,
                padding: '20px 22px', transition: 'box-shadow 0.15s',
              }}>
                {/* Header row */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
                      <span style={{ fontSize: 16, fontWeight: 700 }}>{q.product_name || 'Бүтээгдэхүүн'}</span>
                      <span style={{ background: st.bg, color: st.color, borderRadius: 20, padding: '3px 12px', fontSize: 11, fontWeight: 600 }}>
                        {st.label}
                      </span>
                    </div>
                    <div style={{ fontSize: 12, color: 'var(--text3)' }}>#{q.quote_number}</div>
                  </div>
                  <div style={{ fontSize: 24, fontWeight: 800, color: O }}>{fmt(Number(q.total_price) || 0)}</div>
                </div>

                {/* Details row */}
                <div style={{ display: 'flex', gap: 20, flexWrap: 'wrap', fontSize: 13, color: 'var(--text3)', marginBottom: 14 }}>
                  <span>📦 {q.quantity} ширхэг</span>
                  {q.dimensions && <span>📐 {q.dimensions}</span>}
                  <span>📅 {fmtDate(q.created_at)}</span>
                  {q.expires_at && (
                    <span style={{ color: isExpired ? '#DC2626' : 'var(--text3)' }}>
                      ⏰ {fmtDate(q.expires_at)} хүртэл {isExpired ? '(дууссан)' : ''}
                    </span>
                  )}
                  {q.unit_price && <span>💵 {fmt(Number(q.unit_price))}/ш</span>}
                </div>

                {/* Line items if available */}
                {q.items && q.items.length > 0 && (
                  <div style={{ background: 'var(--surface2, rgba(0,0,0,0.02))', borderRadius: 10, padding: '10px 14px', marginBottom: 14, fontSize: 13 }}>
                    {q.items.map((item: any, i: number) => (
                      <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0', borderBottom: i < q.items.length - 1 ? '1px solid var(--border)' : 'none' }}>
                        <span>{item.name || item.description}</span>
                        <span style={{ fontWeight: 600 }}>{fmt(Number(item.price || item.total) || 0)}</span>
                      </div>
                    ))}
                  </div>
                )}

                {/* Actions */}
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  <a href={`${API_URL}/quote/${q.id}/pdf`} target="_blank" rel="noopener noreferrer"
                    style={{
                      display: 'inline-flex', alignItems: 'center', gap: 6,
                      background: 'var(--surface)', border: '1px solid var(--border)',
                      color: 'var(--text)', borderRadius: 8, padding: '8px 16px',
                      fontWeight: 600, fontSize: 12, textDecoration: 'none', cursor: 'pointer',
                    }}>
                    📄 PDF татах
                  </a>

                  {q.status === 'sent' && !isExpired && (
                    <button onClick={() => convertToOrder(q.id)} disabled={isConverting}
                      style={{
                        background: O, color: '#fff', border: 'none', borderRadius: 8,
                        padding: '8px 20px', fontWeight: 700, fontSize: 12, cursor: isConverting ? 'wait' : 'pointer',
                        opacity: isConverting ? 0.7 : 1,
                      }}>
                      {isConverting ? 'Үүсгэж байна...' : 'Захиалга болгох →'}
                    </button>
                  )}

                  {q.status === 'confirmed' && (
                    <button onClick={() => convertToOrder(q.id)} disabled={isConverting}
                      style={{
                        background: '#059669', color: '#fff', border: 'none', borderRadius: 8,
                        padding: '8px 20px', fontWeight: 700, fontSize: 12, cursor: isConverting ? 'wait' : 'pointer',
                        opacity: isConverting ? 0.7 : 1,
                      }}>
                      {isConverting ? 'Үүсгэж байна...' : 'Захиалга үүсгэх →'}
                    </button>
                  )}

                  {q.status === 'ordered' && (
                    <button onClick={() => router.push('/dashboard/customer/orders')}
                      style={{
                        background: '#DBEAFE', color: '#2563EB', border: 'none', borderRadius: 8,
                        padding: '8px 20px', fontWeight: 700, fontSize: 12, cursor: 'pointer',
                      }}>
                      Захиалга харах →
                    </button>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}

      <style>{`@keyframes pulse{0%,100%{opacity:1}50%{opacity:0.5}}`}</style>
    </div>
  )
}
