'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'
const F = "'DM Sans','Segoe UI',system-ui,sans-serif"

const tok = () => localStorage.getItem('access_token') || localStorage.getItem('token') || ''
const hdrs = () => ({ 'Content-Type': 'application/json', Authorization: `Bearer ${tok()}` })

const ST: Record<string, { label: string; color: string }> = {
  pending:       { label: 'Хүлээгдэж буй',  color: '#F59E0B' },
  paid:          { label: 'Төлөгдсөн',       color: '#3B82F6' },
  in_design:     { label: 'Дизайн хийгдэж байна', color: '#8B5CF6' },
  designing:     { label: 'Дизайн',          color: '#8B5CF6' },
  prepress:      { label: 'Эх бэлтгэл',       color: '#06B6D4' },
  in_production: { label: 'Үйлдвэрлэлд',    color: '#EC4899' },
  printing:      { label: 'Хэвлэгдэж байна', color: '#EC4899' },
  finishing:     { label: 'Боловсруулалт',   color: '#3B82F6' },
  qc:            { label: 'Чанарын шалгалт', color: '#F97316' },
  ready:         { label: 'Бэлэн болсон',     color: '#10B981' },
  shipped:       { label: 'Хүргэгдсэн',      color: '#10B981' },
  delivering:    { label: 'Хүргэлтэнд',      color: '#6366F1' },
  completed:     { label: 'Дууссан',          color: '#059669' },
  delivered:     { label: 'Хүргэгдсэн',      color: '#059669' },
  cancelled:     { label: 'Цуцлагдсан',      color: '#EF4444' },
}

const TABS = [
  { key: 'all',         label: 'Бүгд'           },
  { key: 'pending',     label: 'Хүлээгдэж буй'  },
  { key: 'in_progress', label: 'Явцад байгаа'   },
  { key: 'completed',   label: 'Дууссан'         },
  { key: 'cancelled',   label: 'Цуцлагдсан'      },
]

const IN_PROGRESS = new Set(['paid','in_design','designing','prepress','in_production','printing','finishing','qc','ready','shipped','delivering'])

function statusGroup(s: string) {
  if (['completed','delivered'].includes(s)) return 'completed'
  if (['cancelled'].includes(s))            return 'cancelled'
  if (IN_PROGRESS.has(s))                   return 'in_progress'
  return s
}

export default function MyOrdersPage() {
  const router = useRouter()
  const [orders,  setOrders]  = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [tab,     setTab]     = useState('all')
  const [detail,  setDetail]  = useState<any>(null)
  const [uid,     setUid]     = useState('')

  useEffect(() => {
    const t = tok()
    if (!t) { router.push('/login'); return }
    const u = localStorage.getItem('user')
    if (u) {
      try {
        const parsed = JSON.parse(u)
        setUid(parsed.id)
        loadOrders(parsed.id)
      } catch { setLoading(false) }
    } else {
      fetch(`${API}/auth/me`, { headers: hdrs() })
        .then(r => r.json()).then(u => { setUid(u.id); loadOrders(u.id) })
        .catch(() => setLoading(false))
    }
  }, [])

  function loadOrders(userId: string) {
    fetch(`${API}/orders/customer/${userId}`, { headers: hdrs() })
      .then(r => r.json())
      .then(d => setOrders(Array.isArray(d) ? d : []))
      .catch(() => {})
      .finally(() => setLoading(false))
  }

  const filtered = orders.filter(o =>
    tab === 'all' ? true : statusGroup(o.status) === tab
  )

  const counts = {
    all:         orders.length,
    pending:     orders.filter(o => o.status === 'pending').length,
    in_progress: orders.filter(o => IN_PROGRESS.has(o.status)).length,
    completed:   orders.filter(o => ['completed','delivered'].includes(o.status)).length,
    cancelled:   orders.filter(o => o.status === 'cancelled').length,
  } as Record<string, number>

  const totalSpent = orders
    .filter(o => !['pending','cancelled'].includes(o.status))
    .reduce((s, o) => s + Number(o.total_price || 0), 0)

  return (
    <div style={{ padding: '24px 28px', fontFamily: F, maxWidth: 1000, margin: '0 auto' }}>

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 700, margin: 0, color: 'var(--text)' }}>Миний захиалгууд</h1>
          <p style={{ color: 'var(--text2)', fontSize: 13, margin: '4px 0 0' }}>
            Нийт {orders.length} захиалга · {totalSpent.toLocaleString()}₮ зарцуулсан
          </p>
        </div>
        <button onClick={() => router.push('/order')}
          style={{ background: '#FF6B00', color: '#fff', border: 'none', borderRadius: 8, padding: '9px 18px', cursor: 'pointer', fontSize: 13, fontWeight: 600 }}>
          + Шинэ захиалга
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
            {t.label} {counts[t.key] > 0 && <span style={{ fontSize: 11, background: tab === t.key ? 'rgba(255,107,0,0.12)' : 'var(--surface2)', borderRadius: 99, padding: '1px 6px', marginLeft: 4 }}>{counts[t.key]}</span>}
          </button>
        ))}
      </div>

      {loading ? (
        <div style={{ padding: 60, textAlign: 'center', color: 'var(--text2)' }}>Уншиж байна...</div>
      ) : filtered.length === 0 ? (
        <div style={{ padding: '60px 40px', textAlign: 'center', border: '2px dashed var(--border)', borderRadius: 16, color: 'var(--text2)' }}>
          <div style={{ fontSize: 40, marginBottom: 12 }}>📦</div>
          <div style={{ fontWeight: 600, marginBottom: 6 }}>
            {tab === 'all' ? 'Захиалга байхгүй байна' : 'Энэ төлөвт захиалга байхгүй'}
          </div>
          {tab === 'all' && (
            <button onClick={() => router.push('/order')} style={{ marginTop: 12, background: '#FF6B00', color: '#fff', border: 'none', borderRadius: 8, padding: '9px 20px', cursor: 'pointer', fontSize: 13, fontWeight: 600 }}>
              Анхны захиалгаа өгөх →
            </button>
          )}
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {filtered.map(o => {
            const st = ST[o.status] || { label: o.status, color: '#888' }
            return (
              <div key={o.id} onClick={() => setDetail(o)}
                style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 12, padding: '16px 20px', cursor: 'pointer', transition: 'all 0.15s', display: 'grid', gridTemplateColumns: '1fr auto', gap: 12, alignItems: 'center' }}
                onMouseEnter={e => (e.currentTarget.style.borderColor = '#FF6B00')}
                onMouseLeave={e => (e.currentTarget.style.borderColor = 'var(--border)')}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
                    <span style={{ fontFamily: 'monospace', fontSize: 12, color: 'var(--text3)' }}>#{o.id?.slice(0, 10)}</span>
                    <span style={{ fontSize: 11, padding: '2px 8px', borderRadius: 99, background: st.color + '18', color: st.color, fontWeight: 600 }}>
                      {st.label}
                    </span>
                  </div>
                  <div style={{ fontWeight: 600, fontSize: 15, color: 'var(--text)', marginBottom: 4 }}>
                    {o.product_name || 'Захиалга'}
                  </div>
                  <div style={{ display: 'flex', gap: 16, fontSize: 12, color: 'var(--text2)' }}>
                    <span>📦 {o.quantity || '—'} ш</span>
                    {o.paper_gsm && <span>📄 {o.paper_gsm}gsm</span>}
                    {o.width_mm && o.height_mm && <span>📐 {o.width_mm}×{o.height_mm}мм</span>}
                    <span>📅 {new Date(o.created_at).toLocaleDateString('mn-MN')}</span>
                  </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: 18, fontWeight: 700, color: '#FF6B00' }}>{Number(o.total_price || 0).toLocaleString()}₮</div>
                  <div style={{ fontSize: 11, color: 'var(--text3)', marginTop: 4 }}>Дэлгэрэнгүй →</div>
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
          <div style={{ background: 'var(--surface)', borderRadius: 16, width: '100%', maxWidth: 520, maxHeight: '85vh', overflow: 'auto', border: '1px solid var(--border)', boxShadow: '0 24px 60px rgba(0,0,0,0.3)' }}
            onClick={e => e.stopPropagation()}>

            <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
              <div>
                <div style={{ fontSize: 11, fontFamily: 'monospace', color: 'var(--text3)', marginBottom: 4 }}>#{detail.id?.slice(0, 14)}</div>
                <div style={{ fontSize: 18, fontWeight: 700 }}>{detail.product_name || 'Захиалга'}</div>
                <span style={{ fontSize: 12, padding: '3px 10px', borderRadius: 99, background: (ST[detail.status]?.color || '#888') + '18', color: ST[detail.status]?.color || '#888', fontWeight: 600, display: 'inline-block', marginTop: 4 }}>
                  {ST[detail.status]?.label || detail.status}
                </span>
              </div>
              <button onClick={() => setDetail(null)} style={{ background: 'var(--surface2)', border: '1px solid var(--border)', borderRadius: 8, width: 32, height: 32, cursor: 'pointer', color: 'var(--text2)', fontSize: 16, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>✕</button>
            </div>

            <div style={{ padding: '20px 24px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px 20px', marginBottom: 20 }}>
                {[
                  ['Нийт дүн',      `${Number(detail.total_price||0).toLocaleString()}₮`],
                  ['Тоо ширхэг',    `${detail.quantity || '—'} ш`],
                  ['Хэмжээ',        detail.width_mm && detail.height_mm ? `${detail.width_mm}×${detail.height_mm}мм` : '—'],
                  ['Цаас',          detail.paper_gsm ? `${detail.paper_gsm}gsm` : '—'],
                  ['Өнгө',          detail.color_mode || '—'],
                  ['Тал',           detail.sides || '—'],
                  ['Боловсруулалт',  detail.finishing || '—'],
                  ['Хавтаслалт',    detail.binding || '—'],
                  ['Огноо',         new Date(detail.created_at).toLocaleDateString('mn-MN')],
                  ['Төлбөр',        detail.payment_status || '—'],
                ].map(([label, value]) => (
                  <div key={label} style={{ fontSize: 13 }}>
                    <span style={{ color: 'var(--text3)' }}>{label}:</span>
                    <span style={{ fontWeight: 500, marginLeft: 6 }}>{value}</span>
                  </div>
                ))}
              </div>

              {detail.notes && (
                <div style={{ background: 'var(--surface2)', borderRadius: 8, padding: '12px 14px', marginBottom: 16 }}>
                  <div style={{ fontSize: 11, color: 'var(--text2)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 4 }}>Тэмдэглэл</div>
                  <div style={{ fontSize: 13 }}>{detail.notes}</div>
                </div>
              )}

              {detail.file_url && (
                <a href={detail.file_url.startsWith('http') ? detail.file_url : `${API}/${detail.file_url}`}
                  target="_blank" rel="noreferrer"
                  style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 14px', background: 'rgba(59,130,246,0.06)', border: '1px solid rgba(59,130,246,0.2)', borderRadius: 8, textDecoration: 'none', color: '#3B82F6', fontSize: 13, fontWeight: 500 }}>
                  📎 {detail.file_url.split('/').pop() || 'Файл татах'}
                </a>
              )}

              <div style={{ display: 'flex', gap: 10, marginTop: 20 }}>
                <button onClick={() => { setDetail(null); router.push('/dashboard/delivery') }}
                  style={{ flex: 1, padding: '10px', background: 'rgba(255,107,0,0.08)', border: '1px solid rgba(255,107,0,0.25)', borderRadius: 8, cursor: 'pointer', fontSize: 13, fontWeight: 600, color: '#FF6B00' }}>
                  🚚 Хүргэлт хянах
                </button>
                <button onClick={() => router.push('/order')}
                  style={{ flex: 1, padding: '10px', background: '#FF6B00', border: 'none', borderRadius: 8, cursor: 'pointer', fontSize: 13, fontWeight: 600, color: '#fff' }}>
                  + Дахин захиалах
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
