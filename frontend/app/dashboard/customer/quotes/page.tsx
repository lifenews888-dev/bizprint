'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'

const API = process.env.NEXT_PUBLIC_API_URL || 'https://bizprint-production.up.railway.app'
const F = "'DM Sans','Segoe UI',system-ui,sans-serif"

const tok = () => localStorage.getItem('access_token') || localStorage.getItem('token') || ''
const hdrs = () => ({ 'Content-Type': 'application/json', Authorization: `Bearer ${tok()}` })

const QST: Record<string, { label: string; color: string }> = {
  draft:     { label: 'Ноорог',        color: '#6B7280' },
  sent:      { label: 'Илгээгдсэн',   color: '#FF6B00' },
  accepted:  { label: 'Зөвшөөрсөн',   color: '#10B981' },
  ordered:   { label: 'Захиалагдсан', color: '#3B82F6' },
  rejected:  { label: 'Татгалзсан',   color: '#EF4444' },
  expired:   { label: 'Хугацаа дуусс', color: '#9CA3AF' },
}

export default function MyQuotesPage() {
  const router  = useRouter()
  const [quotes,  setQuotes]  = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [tab,     setTab]     = useState('all')
  const [detail,  setDetail]  = useState<any>(null)
  const [email,   setEmail]   = useState('')

  useEffect(() => {
    const t = tok()
    if (!t) { router.push('/login'); return }
    const stored = localStorage.getItem('user')
    if (stored) {
      try {
        const u = JSON.parse(stored)
        setEmail(u.email || '')
        loadQuotes(u.email)
      } catch { setLoading(false) }
    } else {
      fetch(`${API}/auth/me`, { headers: hdrs() })
        .then(r => r.json())
        .then(u => { setEmail(u.email); loadQuotes(u.email) })
        .catch(() => setLoading(false))
    }
  }, [])

  function loadQuotes(userEmail: string) {
    fetch(`${API}/quotes-v2`, { headers: hdrs() })
      .then(r => r.json())
      .then((all: any[]) => {
        const mine = Array.isArray(all)
          ? all.filter(q => q.customer_email?.toLowerCase() === userEmail?.toLowerCase())
          : []
        setQuotes(mine)
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }

  const filtered = tab === 'all' ? quotes : quotes.filter(q => q.status === tab)

  const totalAccepted = quotes
    .filter(q => ['accepted','ordered'].includes(q.status))
    .reduce((s, q) => s + Number(q.total_price || 0), 0)

  const TABS = [
    { key: 'all',      label: 'Бүгд', count: quotes.length },
    { key: 'sent',     label: 'Хүлээгдэж буй', count: quotes.filter(q=>q.status==='sent').length },
    { key: 'accepted', label: 'Зөвшөөрсөн',     count: quotes.filter(q=>q.status==='accepted').length },
    { key: 'ordered',  label: 'Захиалагдсан',    count: quotes.filter(q=>q.status==='ordered').length },
    { key: 'rejected', label: 'Татгалзсан',      count: quotes.filter(q=>q.status==='rejected').length },
  ]

  function fmtBreakdown(bd: any) {
    if (!bd || typeof bd !== 'object') return []
    return Object.entries(bd).map(([k, v]) => ({ k, v: String(v) }))
  }

  return (
    <div style={{ padding: '24px 28px', fontFamily: F, maxWidth: 960, margin: '0 auto' }}>

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 700, margin: 0, color: 'var(--text)' }}>Миний үнийн санал</h1>
          <p style={{ color: 'var(--text2)', fontSize: 13, margin: '4px 0 0' }}>
            Нийт {quotes.length} санал · Зөвшөөрсөн: {totalAccepted.toLocaleString()}₮
          </p>
        </div>
        <button onClick={() => router.push('/quote')}
          style={{ background: '#FF6B00', color: '#fff', border: 'none', borderRadius: 8, padding: '9px 18px', cursor: 'pointer', fontSize: 13, fontWeight: 600 }}>
          + Үнийн санал авах
        </button>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 4, marginBottom: 20, borderBottom: '1px solid var(--border)', flexWrap: 'wrap' }}>
        {TABS.map(t => (
          <button key={t.key} onClick={() => setTab(t.key)} style={{
            background: 'none', border: 'none', padding: '8px 14px',
            fontSize: 13, cursor: 'pointer', fontFamily: F,
            color: tab === t.key ? '#FF6B00' : 'var(--text2)',
            fontWeight: tab === t.key ? 600 : 400,
            borderBottom: tab === t.key ? '2px solid #FF6B00' : '2px solid transparent',
            marginBottom: -1, whiteSpace: 'nowrap',
          }}>
            {t.label}
            {t.count > 0 && (
              <span style={{ fontSize: 11, background: tab === t.key ? 'rgba(255,107,0,0.12)' : 'var(--surface2)', borderRadius: 99, padding: '1px 6px', marginLeft: 4 }}>
                {t.count}
              </span>
            )}
          </button>
        ))}
      </div>

      {loading ? (
        <div style={{ padding: 60, textAlign: 'center', color: 'var(--text2)' }}>Уншиж байна...</div>
      ) : filtered.length === 0 ? (
        <div style={{ padding: '60px 40px', textAlign: 'center', border: '2px dashed var(--border)', borderRadius: 16, color: 'var(--text2)' }}>
          <div style={{ fontSize: 40, marginBottom: 12 }}>🧮</div>
          <div style={{ fontWeight: 600, marginBottom: 6 }}>
            {tab === 'all' ? 'Үнийн санал байхгүй байна' : 'Энэ төлөвт санал байхгүй'}
          </div>
          {tab === 'all' && (
            <button onClick={() => router.push('/quote')} style={{ marginTop: 12, background: '#FF6B00', color: '#fff', border: 'none', borderRadius: 8, padding: '9px 20px', cursor: 'pointer', fontSize: 13, fontWeight: 600 }}>
              Үнийн санал авах →
            </button>
          )}
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {filtered.map(q => {
            const st = QST[q.status] || { label: q.status, color: '#888' }
            const expired = q.valid_until && new Date(q.valid_until) < new Date()
            return (
              <div key={q.id} onClick={() => setDetail(q)}
                style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 12, padding: '16px 20px', cursor: 'pointer', transition: 'border-color 0.15s', display: 'grid', gridTemplateColumns: '1fr auto', gap: 12, alignItems: 'center' }}
                onMouseEnter={e => (e.currentTarget.style.borderColor = '#FF6B00')}
                onMouseLeave={e => (e.currentTarget.style.borderColor = 'var(--border)')}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                    <span style={{ fontFamily: 'monospace', fontSize: 12, color: 'var(--text3)' }}>
                      {q.quote_number || `#${q.id?.slice(0, 8)}`}
                    </span>
                    <span style={{ fontSize: 11, padding: '2px 8px', borderRadius: 99, background: st.color + '18', color: st.color, fontWeight: 600 }}>
                      {expired && q.status === 'sent' ? 'Хугацаа дуусс' : st.label}
                    </span>
                    {q.email_sent && (
                      <span style={{ fontSize: 11, color: '#10B981', background: 'rgba(16,185,129,0.1)', padding: '2px 6px', borderRadius: 99 }}>✓ Имэйл</span>
                    )}
                  </div>
                  <div style={{ fontWeight: 600, fontSize: 15, color: 'var(--text)', marginBottom: 4 }}>
                    {q.product_name || 'Үнийн санал'}
                  </div>
                  <div style={{ display: 'flex', gap: 16, fontSize: 12, color: 'var(--text2)', flexWrap: 'wrap' }}>
                    <span>📦 {q.quantity || '—'} ш</span>
                    {q.size && <span>📐 {q.size}</span>}
                    {q.paper_type && <span>📄 {q.paper_type}</span>}
                    {q.finishing && q.finishing !== 'none' && <span>✨ {q.finishing}</span>}
                    <span>📅 {new Date(q.created_at).toLocaleDateString('mn-MN')}</span>
                    {q.valid_until && (
                      <span style={{ color: expired ? '#EF4444' : 'var(--text2)' }}>
                        {expired ? '⚠️ Хугацаа дуусс' : `✓ ${new Date(q.valid_until).toLocaleDateString('mn-MN')} хүртэл`}
                      </span>
                    )}
                  </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: 20, fontWeight: 700, color: '#FF6B00' }}>{Number(q.total_price || 0).toLocaleString()}₮</div>
                  <div style={{ fontSize: 12, color: 'var(--text3)', marginTop: 2 }}>
                    {Number(q.unit_price || 0).toLocaleString()}₮/ш
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Detail modal */}
      {detail && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', zIndex: 999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}
          onClick={() => setDetail(null)}>
          <div style={{ background: 'var(--surface)', borderRadius: 16, width: '100%', maxWidth: 540, maxHeight: '88vh', overflow: 'auto', border: '1px solid var(--border)', boxShadow: '0 24px 60px rgba(0,0,0,0.3)' }}
            onClick={e => e.stopPropagation()}>

            <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'start', position: 'sticky', top: 0, background: 'var(--surface)' }}>
              <div>
                <div style={{ fontSize: 11, fontFamily: 'monospace', color: 'var(--text3)', marginBottom: 4 }}>
                  {detail.quote_number || `#${detail.id?.slice(0, 14)}`}
                </div>
                <div style={{ fontSize: 18, fontWeight: 700 }}>{detail.product_name || 'Үнийн санал'}</div>
                <span style={{ fontSize: 12, padding: '3px 10px', borderRadius: 99, background: (QST[detail.status]?.color || '#888') + '18', color: QST[detail.status]?.color || '#888', fontWeight: 600, display: 'inline-block', marginTop: 4 }}>
                  {QST[detail.status]?.label || detail.status}
                </span>
              </div>
              <button onClick={() => setDetail(null)} style={{ background: 'var(--surface2)', border: '1px solid var(--border)', borderRadius: 8, width: 32, height: 32, cursor: 'pointer', color: 'var(--text2)', fontSize: 16, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>✕</button>
            </div>

            <div style={{ padding: '20px 24px' }}>
              {/* Price highlight */}
              <div style={{ background: 'rgba(255,107,0,0.06)', border: '1px solid rgba(255,107,0,0.2)', borderRadius: 12, padding: '16px 20px', marginBottom: 20, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <div style={{ fontSize: 11, color: 'var(--text2)', marginBottom: 4 }}>Нийт үнэ</div>
                  <div style={{ fontSize: 28, fontWeight: 800, color: '#FF6B00' }}>{Number(detail.total_price||0).toLocaleString()}₮</div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: 11, color: 'var(--text2)', marginBottom: 4 }}>Нэгж үнэ</div>
                  <div style={{ fontSize: 18, fontWeight: 700 }}>{Number(detail.unit_price||0).toLocaleString()}₮</div>
                </div>
              </div>

              {/* Details */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px 20px', marginBottom: 20 }}>
                {[
                  ['Бүтээгдэхүүн',  detail.product_name || '—'],
                  ['Тоо ширхэг',    `${detail.quantity || '—'} ш`],
                  ['Хэмжээ',        detail.size || (detail.width_mm && detail.height_mm ? `${detail.width_mm}×${detail.height_mm}мм` : '—')],
                  ['Цаасны төрөл',  detail.paper_type || '—'],
                  ['Цаас GSM',      detail.paper_gsm ? `${detail.paper_gsm}gsm` : '—'],
                  ['Өнгө',          detail.color_mode || '—'],
                  ['Тал',           detail.sides || '—'],
                  ['Боловсруулалт',  detail.finishing || '—'],
                  ['Хавтаслалт',    detail.binding || '—'],
                  ['Огноо',         new Date(detail.created_at).toLocaleDateString('mn-MN')],
                  ['Хүчинтэй хүртэл', detail.valid_until ? new Date(detail.valid_until).toLocaleDateString('mn-MN') : '—'],
                ].filter(([, v]) => v !== '—').map(([label, value]) => (
                  <div key={label as string} style={{ fontSize: 13 }}>
                    <span style={{ color: 'var(--text3)' }}>{label}:</span>
                    <span style={{ fontWeight: 500, marginLeft: 6 }}>{value}</span>
                  </div>
                ))}
              </div>

              {/* Breakdown */}
              {detail.breakdown && Object.keys(detail.breakdown).length > 0 && (
                <div style={{ marginBottom: 20 }}>
                  <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text2)', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 8 }}>Задаргаа</div>
                  <div style={{ background: 'var(--surface2)', borderRadius: 8, overflow: 'hidden' }}>
                    {fmtBreakdown(detail.breakdown).map(({ k, v }) => (
                      <div key={k} style={{ display: 'flex', justifyContent: 'space-between', padding: '7px 14px', borderBottom: '1px solid var(--border)', fontSize: 12 }}>
                        <span style={{ color: 'var(--text2)' }}>{k}</span>
                        <span style={{ fontWeight: 500 }}>{v}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {detail.notes && (
                <div style={{ background: 'var(--surface2)', borderRadius: 8, padding: '12px 14px', marginBottom: 20 }}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text2)', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 4 }}>Тэмдэглэл</div>
                  <div style={{ fontSize: 13 }}>{detail.notes}</div>
                </div>
              )}

              <button onClick={() => { setDetail(null); router.push('/order') }}
                style={{ width: '100%', padding: '12px', background: '#FF6B00', border: 'none', borderRadius: 8, cursor: 'pointer', fontSize: 14, fontWeight: 700, color: '#fff' }}>
                Энэ санал дагуу захиалах →
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
