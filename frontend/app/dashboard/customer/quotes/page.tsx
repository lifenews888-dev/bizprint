'use client'
import { apiFetch } from '@/lib/api'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'

    ? localStorage.getItem('access_token') || localStorage.getItem('token') || ''
    : ''
const STATUS_MAP: Record<string, { label: string; color: string; bg: string }> = {
  draft:     { label: 'Ноорог',       color: '#6B7280', bg: '#F3F4F6' },
  sent:      { label: 'Илгээгдсэн',   color: '#FF6B00', bg: '#FFF7ED' },
  confirmed: { label: 'Баталгаажсан', color: '#059669', bg: '#D1FAE5' },
  ordered:   { label: 'Захиалагдсан', color: '#2563EB', bg: '#DBEAFE' },
  expired:   { label: 'Хугацаа дууссан', color: '#DC2626', bg: '#FEE2E2' },
}

export default function MyQuotesPage() {
  const router = useRouter()
  const [quotes, setQuotes] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const token = getToken()
    if (!token) { router.push('/login'); return }

    // ✅ Correct endpoint: /quotes-v2/my (filters by JWT user)
    apiFetch('/quotes-v2/my')
      .then(r => r.json())
      .then(d => setQuotes(Array.isArray(d) ? d : []))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  const fmt = (n: number) => new Intl.NumberFormat('mn-MN').format(Math.round(n)) + '₮'
  const fmtDate = (d: string) => d ? new Date(d).toLocaleDateString('mn-MN') : ''

  return (
    <div style={{ maxWidth: 900, margin: '0 auto', padding: '40px 24px', fontFamily: "'DM Sans','Segoe UI',system-ui,sans-serif" }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 28 }}>
        <h1 style={{ fontSize: 26, fontWeight: 700, margin: 0 }}>Миний үнийн санал</h1>
        <button
          onClick={() => router.push('/quote')}
          style={{ background: '#FF6B00', color: '#fff', border: 'none', borderRadius: 10, padding: '10px 22px', fontWeight: 600, fontSize: 14, cursor: 'pointer' }}
        >
          + Шинэ үнийн санал авах
        </button>
      </div>

      {loading ? (
        <p style={{ color: 'var(--text2)' }}>Уншиж байна...</p>
      ) : quotes.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '60px 20px', background: 'var(--surface2)', borderRadius: 16, border: '2px dashed var(--border2)' }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>📋</div>
          <p style={{ color: 'var(--text2)', fontSize: 16, margin: 0 }}>Үнийн санал байхгүй байна</p>
          <button
            onClick={() => router.push('/quote')}
            style={{ marginTop: 16, background: '#FF6B00', color: '#fff', border: 'none', borderRadius: 10, padding: '10px 22px', fontWeight: 600, fontSize: 14, cursor: 'pointer' }}
          >
            Үнийн санал авах →
          </button>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {quotes.map(q => {
            const st = STATUS_MAP[q.status] || { label: q.status, color: '#6B7280', bg: '#F3F4F6' }
            return (
              <div key={q.id} style={{ background: 'var(--surface)', border: '1px solid var(--border2)', borderRadius: 14, padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: 10 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 8 }}>
                  <div>
                    <span style={{ fontWeight: 700, fontSize: 16 }}>{q.product_name || 'Бүтээгдэхүүн'}</span>
                    <span style={{ marginLeft: 12, fontSize: 13, color: 'var(--text2)' }}>#{q.quote_number}</span>
                  </div>
                  <span style={{ background: st.bg, color: st.color, borderRadius: 8, padding: '4px 12px', fontSize: 13, fontWeight: 600 }}>
                    {st.label}
                  </span>
                </div>

                <div style={{ display: 'flex', gap: 24, flexWrap: 'wrap', fontSize: 14, color: 'var(--text2)' }}>
                  <span>📦 {q.quantity} ширхэг</span>
                  {q.dimensions && <span>📐 {q.dimensions}</span>}
                  <span>📅 {fmtDate(q.created_at)}</span>
                  {q.expires_at && <span>⏰ {fmtDate(q.expires_at)} хүртэл</span>}
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8 }}>
                  <span style={{ fontSize: 22, fontWeight: 700, color: '#FF6B00' }}>
                    {fmt(Number(q.total_price) || 0)}
                  </span>
                  {q.status === 'sent' && (
                    <button
                      onClick={() => router.push('/dashboard?section=quotes')}
                      style={{ background: '#FF6B00', color: '#fff', border: 'none', borderRadius: 10, padding: '8px 20px', fontWeight: 600, fontSize: 13, cursor: 'pointer' }}
                    >
                      Захиалах →
                    </button>
                  )}
                  {q.status === 'ordered' && (
                    <button
                      onClick={() => router.push('/dashboard?section=orders')}
                      style={{ background: '#059669', color: '#fff', border: 'none', borderRadius: 10, padding: '8px 20px', fontWeight: 600, fontSize: 13, cursor: 'pointer' }}
                    >
                      Захиалга харах →
                    </button>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
