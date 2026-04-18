'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'

const API = 'http://localhost:4000'
const F = "'DM Sans','Segoe UI',system-ui,sans-serif"
const fmt = (n: number) => Number(n).toLocaleString('mn-MN') + '₮'
const fmtDate = (d: string) => new Date(d).toLocaleDateString('mn-MN', { year: 'numeric', month: 'short', day: 'numeric' })

interface Order {
  id: string
  status: string
  payment_status: string
  product_name: string
  quantity: number
  total_price: number
  unit_price: number
  created_at: string
  updated_at: string
  customer_name: string
  invoice_no: string
  notes: string
  file_url: string
  delivery_address: string
}

const FLOW = [
  { key: 'pending',       label: 'Захиалга өгсөн',    icon: '📝', color: '#6B7280' },
  { key: 'paid',          label: 'Төлбөр хийгдсэн',   icon: '💳', color: '#2563EB' },
  { key: 'in_production', label: 'Үйлдвэрлэлд',       icon: '⚙️',  color: '#D97706' },
  { key: 'completed',     label: 'Бэлэн болсон',       icon: '✅', color: '#16A34A' },
  { key: 'shipped',       label: 'Хүргэлтэнд гарсан', icon: '📦', color: '#7C3AED' },
  { key: 'delivered',     label: 'Хүргэгдсэн',         icon: '🏠', color: '#059669' },
]

const STATUS_IDX: Record<string, number> = {
  pending: 0, paid: 1, in_production: 2, completed: 3, shipped: 4, delivered: 5, cancelled: -1,
}

const STATUS_COLOR: Record<string, { bg: string; color: string }> = {
  pending:       { bg: '#F3F4F6', color: '#6B7280' },
  paid:          { bg: '#DBEAFE', color: '#2563EB' },
  in_production: { bg: '#FEF3C7', color: '#D97706' },
  completed:     { bg: '#DCFCE7', color: '#16A34A' },
  shipped:       { bg: '#EDE9FE', color: '#7C3AED' },
  delivered:     { bg: '#D1FAE5', color: '#059669' },
  cancelled:     { bg: '#FEE2E2', color: '#DC2626' },
}

const STATUS_MN: Record<string, string> = {
  pending:       'Хүлээгдэж буй',
  paid:          'Төлбөр хийгдсэн',
  in_production: 'Үйлдвэрлэлд',
  completed:     'Дуусгасан',
  shipped:       'Хүргэлтэнд',
  delivered:     'Хүргэгдсэн',
  cancelled:     'Цуцлагдсан',
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function OrderPage() {
  const router = useRouter()
  const [orders, setOrders]   = useState<Order[]>([])
  const [selected, setSelected] = useState<Order | null>(null)
  const [loading, setLoading] = useState(true)
  const [token, setToken]     = useState<string | null>(null)
  const [filter, setFilter]   = useState('all')

  useEffect(() => {
    const t = localStorage.getItem('access_token') || localStorage.getItem('token') || ''
    setToken(t)
    if (t) fetchMe(t)
    else setLoading(false)
  }, [])

  async function fetchMe(t: string) {
    try {
      const res = await fetch(`${API}/auth/me`, { headers: { Authorization: `Bearer ${t}` } })
      const data = await res.json()
      fetchOrders(t, data.id)
    } catch { setLoading(false) }
  }

  async function fetchOrders(t: string, uid: string) {
    try {
      const res = await fetch(`${API}/orders/customer/${uid}`, { headers: { Authorization: `Bearer ${t}` } })
      const data = await res.json()
      const list = Array.isArray(data) ? data : []
      setOrders(list)
      if (list.length > 0) setSelected(list[0])
    } catch {}
    finally { setLoading(false) }
  }

  const filtered = filter === 'all' ? orders : orders.filter(o => o.status === filter)
  const currentStep = selected ? (STATUS_IDX[selected.status] ?? 0) : 0
  const isCancelled = selected?.status === 'cancelled'
  const sc = selected ? (STATUS_COLOR[selected.status] || STATUS_COLOR.pending) : STATUS_COLOR.pending
  const canPay = selected?.payment_status === 'pending' && selected?.status === 'pending'

  if (!token && !loading) return (
    <div style={{ padding: 40, textAlign: 'center', fontFamily: F, color: 'var(--text2)' }}>
      <div style={{ fontSize: 40, marginBottom: 12 }}>🔒</div>
      <h2 style={{ margin: '0 0 16px', color: 'var(--text)' }}>Нэвтэрч орно уу</h2>
      <a href="/login" style={{ padding: '11px 24px', background: '#FF6B00', color: '#fff', borderRadius: 10, textDecoration: 'none', fontWeight: 700 }}>Нэвтрэх</a>
    </div>
  )

  return (
    <div style={{ padding: '28px 24px', maxWidth: 1100, margin: '0 auto', fontFamily: F }}>
      <div style={{ marginBottom: 20 }}>
        <h1 style={{ fontSize: 24, fontWeight: 700, color: 'var(--text)', margin: 0 }}>Миний захиалгууд</h1>
        <p style={{ color: 'var(--text2)', margin: '4px 0 0', fontSize: 13 }}>Захиалгын явцыг шууд хянах</p>
      </div>

      {/* Filter tabs */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 20, flexWrap: 'wrap' }}>
        {[
          ['all',          'Бүгд'],
          ['pending',      'Хүлээгдэж буй'],
          ['paid',         'Төлбөр хийгдсэн'],
          ['in_production','Үйлдвэрлэлд'],
          ['completed',    'Дуусгасан'],
          ['delivered',    'Хүргэгдсэн'],
          ['cancelled',    'Цуцлагдсан'],
        ].map(([f, l]) => {
          const cnt = f === 'all' ? orders.length : orders.filter(o => o.status === f).length
          return (
            <button key={f} onClick={() => setFilter(f)} style={{ padding: '6px 14px', borderRadius: 99, border: '1px solid var(--border, #E5E7EB)', background: filter === f ? '#FF6B00' : 'var(--surface, #fff)', color: filter === f ? '#fff' : 'var(--text2)', cursor: 'pointer', fontSize: 12, fontWeight: filter === f ? 700 : 400, fontFamily: F }}>
              {l} ({cnt})
            </button>
          )
        })}
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: 60, color: 'var(--text2)' }}>Уншиж байна...</div>
      ) : orders.length === 0 ? (
        <div style={{ textAlign: 'center', padding: 60, border: '2px dashed var(--border, #E5E7EB)', borderRadius: 16, color: 'var(--text2)' }}>
          <div style={{ fontSize: 40, marginBottom: 12 }}>📭</div>
          <div style={{ fontWeight: 600, marginBottom: 16 }}>Захиалга байхгүй байна</div>
          <a href="/quote" style={{ padding: '10px 22px', background: '#FF6B00', color: '#fff', borderRadius: 10, textDecoration: 'none', fontWeight: 700, fontSize: 14 }}>Үнэ тооцоолох →</a>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: '300px 1fr', gap: 20 }}>

          {/* Order list */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {filtered.length === 0 ? (
              <div style={{ textAlign: 'center', padding: 20, color: 'var(--text2)', fontSize: 13 }}>Энэ төлөвийн захиалга байхгүй</div>
            ) : filtered.map(o => {
              const s = STATUS_COLOR[o.status] || STATUS_COLOR.pending
              return (
                <div key={o.id} onClick={() => setSelected(o)} style={{ padding: '14px 16px', borderRadius: 12, border: `2px solid ${selected?.id === o.id ? '#FF6B00' : 'var(--border, #E5E7EB)'}`, background: selected?.id === o.id ? 'rgba(255,107,0,0.04)' : 'var(--surface, #fff)', cursor: 'pointer', transition: 'all 0.15s' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div style={{ fontSize: 13, fontWeight: 700, color: selected?.id === o.id ? '#FF6B00' : 'var(--text)' }}>
                      #{o.id.slice(0, 8).toUpperCase()}
                    </div>
                    <span style={{ fontSize: 11, padding: '2px 8px', borderRadius: 99, background: s.bg, color: s.color, fontWeight: 600 }}>
                      {STATUS_MN[o.status] ?? o.status}
                    </span>
                  </div>
                  <div style={{ fontSize: 13, color: 'var(--text)', marginTop: 6, fontWeight: 500 }}>
                    {o.product_name || 'Бүтээгдэхүүн'}
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 6 }}>
                    <span style={{ fontSize: 12, color: 'var(--text2)' }}>{o.quantity} ш</span>
                    <span style={{ fontSize: 13, fontWeight: 700, color: '#FF6B00' }}>{fmt(o.total_price)}</span>
                  </div>
                  <div style={{ fontSize: 11, color: 'var(--text2)', marginTop: 4 }}>{fmtDate(o.created_at)}</div>
                  {o.payment_status === 'pending' && o.status === 'pending' && (
                    <div style={{ marginTop: 6, fontSize: 11, padding: '3px 8px', background: 'rgba(245,158,11,0.1)', color: '#D97706', borderRadius: 6, fontWeight: 600, display: 'inline-block' }}>
                      ⚠️ Төлбөр хүлээгдэж байна
                    </div>
                  )}
                </div>
              )
            })}
          </div>

          {/* Order detail */}
          {selected && (
            <div style={{ background: 'var(--surface, #fff)', border: '1px solid var(--border, #E5E7EB)', borderRadius: 16, padding: 24 }}>

              {/* Header */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24, padding: '16px 20px', borderRadius: 12, background: isCancelled ? '#FEE2E2' : sc.bg }}>
                <div>
                  <div style={{ fontSize: 12, color: 'var(--text2)', marginBottom: 2 }}>
                    Захиалга #{selected.id.slice(0, 8).toUpperCase()}
                  </div>
                  <div style={{ fontSize: 20, fontWeight: 800, color: isCancelled ? '#DC2626' : sc.color }}>
                    {isCancelled ? 'Цуцлагдсан' : (STATUS_MN[selected.status] ?? selected.status)}
                  </div>
                </div>
                <div style={{ fontSize: 36 }}>{isCancelled ? '❌' : (FLOW[currentStep]?.icon ?? '📋')}</div>
              </div>

              {/* Pay button — only for unpaid pending orders */}
              {canPay && (
                <div style={{ marginBottom: 20, padding: '16px 20px', background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.25)', borderRadius: 12 }}>
                  <div style={{ fontSize: 14, fontWeight: 600, color: '#92400E', marginBottom: 10 }}>
                    ⚠️ Төлбөр хийгдээгүй байна
                  </div>
                  <button
                    onClick={() => router.push(`/payment?order_id=${selected.id}&amount=${selected.total_price}`)}
                    style={{ padding: '11px 24px', background: '#FF6B00', color: '#fff', border: 'none', borderRadius: 10, fontSize: 14, fontWeight: 700, cursor: 'pointer', fontFamily: F }}
                  >
                    💳 Төлбөр төлөх — {fmt(selected.total_price)}
                  </button>
                </div>
              )}

              {/* Progress timeline */}
              {!isCancelled && (
                <div style={{ marginBottom: 24 }}>
                  <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--text2)', marginBottom: 14, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    Захиалгын явц
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center' }}>
                    {FLOW.map((step, i) => {
                      const done = i <= currentStep
                      const active = i === currentStep
                      return (
                        <div key={step.key} style={{ display: 'flex', alignItems: 'center', flex: i < FLOW.length - 1 ? 1 : 0 }}>
                          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
                            <div style={{ width: 32, height: 32, borderRadius: '50%', background: done ? step.color : 'var(--surface2, #F3F4F6)', border: `2px solid ${done ? step.color : 'var(--border, #E5E7EB)'}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: done ? 14 : 11, boxShadow: active ? `0 0 0 4px ${step.color}25` : 'none', flexShrink: 0, transition: 'all 0.2s' }}>
                              {done ? (active ? step.icon : '✓') : <span style={{ color: 'var(--text3)', fontWeight: 700 }}>{i + 1}</span>}
                            </div>
                            <div style={{ fontSize: 10, fontWeight: active ? 700 : 400, color: done ? step.color : 'var(--text3)', textAlign: 'center', whiteSpace: 'nowrap', maxWidth: 64 }}>
                              {step.label}
                            </div>
                          </div>
                          {i < FLOW.length - 1 && (
                            <div style={{ flex: 1, height: 2, marginBottom: 22, background: i < currentStep ? step.color : 'var(--border, #E5E7EB)', transition: 'background 0.3s' }} />
                          )}
                        </div>
                      )
                    })}
                  </div>
                </div>
              )}

              {/* Order details grid */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 16 }}>
                {[
                  { label: 'Бүтээгдэхүүн',  value: selected.product_name || '—' },
                  { label: 'Тоо ширхэг',     value: `${selected.quantity} ш` },
                  { label: 'Нэгж үнэ',       value: selected.unit_price ? fmt(selected.unit_price) : '—' },
                  { label: 'Нийт дүн',       value: fmt(selected.total_price) },
                  { label: 'Төлбөрийн төлөв', value: STATUS_MN[selected.payment_status] ?? selected.payment_status ?? '—' },
                  { label: 'Нэхэмжлэл',      value: selected.invoice_no || '—' },
                  { label: 'Огноо',           value: fmtDate(selected.created_at) },
                  { label: 'Шинэчлэгдсэн',   value: fmtDate(selected.updated_at) },
                ].map(item => (
                  <div key={item.label} style={{ padding: '10px 14px', background: 'var(--surface2, #F9FAFB)', borderRadius: 10 }}>
                    <div style={{ fontSize: 11, color: 'var(--text2)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: 4 }}>{item.label}</div>
                    <div style={{ fontSize: 13, color: 'var(--text)', fontWeight: 500 }}>{item.value}</div>
                  </div>
                ))}
              </div>

              {selected.delivery_address && (
                <div style={{ padding: '10px 14px', background: 'var(--surface2, #F9FAFB)', borderRadius: 10, marginBottom: 10, fontSize: 13 }}>
                  <div style={{ fontSize: 11, color: 'var(--text2)', fontWeight: 600, textTransform: 'uppercase', marginBottom: 4 }}>Хүргэлтийн хаяг</div>
                  <div>📍 {selected.delivery_address}</div>
                </div>
              )}

              {selected.notes && (
                <div style={{ padding: '10px 14px', background: 'var(--surface2, #F9FAFB)', borderRadius: 10, marginBottom: 10, fontSize: 13 }}>
                  <div style={{ fontSize: 11, color: 'var(--text2)', fontWeight: 600, textTransform: 'uppercase', marginBottom: 4 }}>Тэмдэглэл</div>
                  <div>{selected.notes}</div>
                </div>
              )}

              {selected.file_url && (
                <a href={selected.file_url} target="_blank" rel="noreferrer" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '8px 14px', borderRadius: 8, border: '1px solid var(--border, #E5E7EB)', color: '#FF6B00', textDecoration: 'none', fontSize: 13, fontWeight: 500 }}>
                  📎 Файл харах
                </a>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
