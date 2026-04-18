'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'

const API = 'http://localhost:4000'

// ─── Types ────────────────────────────────────────────────────────────────────

interface DeliveryOrder {
  id: string
  product_name?: string
  quantity: number
  total_price: number
  status: string
  customer_name?: string
  customer_phone?: string
  notes?: string
}

interface DeliveryRecord {
  id: number
  status: string
  recipient_name?: string
  recipient_phone?: string
  address?: string
  note?: string
  courier_name?: string
  courier_phone?: string
  estimated_at?: string
  created_at: string
  updated_at: string
  order?: DeliveryOrder
}

interface User { id: string; email: string; full_name: string; role: string }

// ─── Constants ────────────────────────────────────────────────────────────────

const STATUS_MN: Record<string, { label: string; color: string; bg: string }> = {
  pending:    { label: 'Хүлээгдэж байна',  color: '#F59E0B', bg: 'rgba(245,158,11,0.12)' },
  assigned:   { label: 'Оноогдсон',        color: '#3B82F6', bg: 'rgba(59,130,246,0.12)' },
  picked_up:  { label: 'Авсан',            color: '#8B5CF6', bg: 'rgba(139,92,246,0.12)' },
  on_the_way: { label: 'Хүргэж байна',     color: '#FF6B00', bg: 'rgba(255,107,0,0.12)' },
  in_transit: { label: 'Замдаа байна',     color: '#0891B2', bg: 'rgba(8,145,178,0.12)'  },
  delivered:  { label: 'Хүргэсэн',         color: '#10B981', bg: 'rgba(16,185,129,0.12)' },
  failed:     { label: 'Алдаатай',         color: '#EF4444', bg: 'rgba(239,68,68,0.12)'  },
  cancelled:  { label: 'Цуцлагдсан',       color: '#6B7280', bg: 'rgba(107,114,128,0.12)'},
}

// Courier-side status progression
const WORKFLOW = [
  { status: 'pending',    label: 'Авахад бэлэн',  icon: '🏭', next: 'picked_up',  nextLabel: '📦 Авсан' },
  { status: 'picked_up',  label: 'Авсан',          icon: '📦', next: 'on_the_way', nextLabel: '🚚 Хүргэлтэнд гарах' },
  { status: 'on_the_way', label: 'Хүргэж байна',   icon: '🚚', next: 'delivered',  nextLabel: '🏠 Хүргэсэн' },
  { status: 'in_transit', label: 'Замдаа байна',   icon: '📍', next: 'delivered',  nextLabel: '🏠 Хүргэсэн' },
  { status: 'delivered',  label: 'Хүргэсэн',       icon: '✅', next: null,         nextLabel: '' },
]

type FilterType = 'all' | 'pending' | 'active' | 'delivered'

function tok() { return localStorage.getItem('access_token') || localStorage.getItem('token') || '' }
function hdrs() { return { Authorization: 'Bearer ' + tok(), 'Content-Type': 'application/json' } }

const F = "'Segoe UI',system-ui,sans-serif"

// ─── Component ────────────────────────────────────────────────────────────────

export default function CourierDashboard() {
  const router = useRouter()
  const [user, setUser]           = useState<User | null>(null)
  const [deliveries, setDeliveries] = useState<DeliveryRecord[]>([])
  const [loading, setLoading]     = useState(true)
  const [filter, setFilter]       = useState<FilterType>('all')
  const [selected, setSelected]   = useState<DeliveryRecord | null>(null)
  const [toast, setToast]         = useState<{ msg: string; ok: boolean } | null>(null)
  const [updating, setUpdating]   = useState(false)

  useEffect(() => {
    const ud = localStorage.getItem('user')
    if (!ud || !tok()) { router.push('/login'); return }
    setUser(JSON.parse(ud))
    fetchDeliveries()
    const interval = setInterval(fetchDeliveries, 30_000)
    return () => clearInterval(interval)
  }, [])

  async function fetchDeliveries() {
    setLoading(true)
    try {
      const r = await fetch(API + '/delivery', { headers: hdrs() })
      setDeliveries(r.ok ? await r.json() : [])
    } catch {}
    setLoading(false)
  }

  function showToast(msg: string, ok = true) {
    setToast({ msg, ok })
    setTimeout(() => setToast(null), 3000)
  }

  async function updateStatus(d: DeliveryRecord, status: string) {
    if (updating) return
    setUpdating(true)
    try {
      const r = await fetch(`${API}/delivery/${d.id}/status`, {
        method: 'PATCH',
        headers: hdrs(),
        body: JSON.stringify({ status }),
      })
      if (r.ok) {
        const updated = { ...d, status }
        setDeliveries(prev => prev.map(x => x.id === d.id ? updated : x))
        setSelected(updated)
        showToast('Төлөв шинэчлэгдлээ ✓')
      } else {
        showToast('Алдаа гарлаа', false)
      }
    } catch {
      showToast('Алдаа гарлаа', false)
    }
    setUpdating(false)
  }

  // ── Filtering ───────────────────────────────────────────────────────────────
  const pending  = deliveries.filter(d => d.status === 'pending' || d.status === 'assigned')
  const active   = deliveries.filter(d => ['picked_up', 'on_the_way', 'in_transit'].includes(d.status))
  const done     = deliveries.filter(d => d.status === 'delivered')

  const filtered = filter === 'pending'   ? pending
                 : filter === 'active'    ? active
                 : filter === 'delivered' ? done
                 : deliveries.filter(d => !['failed','cancelled'].includes(d.status))

  const stats = {
    toPickup:   pending.length,
    delivering: active.length,
    done:       done.length,
    total:      deliveries.filter(d => !['failed','cancelled'].includes(d.status)).length,
  }

  const wfStep = selected
    ? WORKFLOW.find(w => w.status === selected.status) ?? null
    : null

  // ── Styles ──────────────────────────────────────────────────────────────────
  const s = (extra?: React.CSSProperties): React.CSSProperties => ({
    background: 'var(--surface2)', border: '1px solid var(--border)',
    borderRadius: 8, padding: '8px 12px', color: 'var(--text)',
    fontSize: 13, outline: 'none', cursor: 'pointer', ...extra,
  })

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)', fontFamily: F, color: 'var(--text)' }}>

      {/* Toast */}
      {toast && (
        <div style={{ position: 'fixed', top: 20, right: 20, zIndex: 9999, background: toast.ok ? '#10B981' : '#EF4444', color: '#fff', padding: '12px 20px', borderRadius: 10, fontSize: 14, fontWeight: 600, boxShadow: '0 4px 24px rgba(0,0,0,0.3)' }}>
          {toast.msg}
        </div>
      )}

      {/* Topbar */}
      <div style={{ background: 'var(--surface)', borderBottom: '1px solid var(--border)', padding: '0 32px', height: 54, display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'sticky', top: 0, zIndex: 10 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ fontSize: 16, fontWeight: 700 }}><span style={{ color: '#FF6B00' }}>Biz</span>Print</span>
          <span style={{ fontSize: 11, background: 'rgba(16,185,129,0.1)', color: '#10B981', border: '1px solid rgba(16,185,129,0.3)', borderRadius: 20, padding: '2px 10px' }}>Курьер</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ fontSize: 13, color: 'var(--text2)' }}>{user?.full_name}</span>
          <button onClick={fetchDeliveries} style={s({ fontSize: 12 })}>↻ Шинэчлэх</button>
          <button onClick={() => { localStorage.clear(); router.push('/') }} style={s({ fontSize: 12 })}>Гарах</button>
        </div>
      </div>

      <div style={{ padding: '28px 32px', maxWidth: 1300, margin: '0 auto' }}>

        {/* Header */}
        <div style={{ marginBottom: 24 }}>
          <h1 style={{ fontSize: 22, fontWeight: 700, margin: 0 }}>Курьерийн дэшбоард</h1>
          <p style={{ color: 'var(--text2)', fontSize: 13, margin: '4px 0 0' }}>Хүргэлтийн захиалга · маршрут · статус шинэчлэл</p>
        </div>

        {/* Stats */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 14, marginBottom: 24 }}>
          {[
            { label: 'Авах захиалга',  val: stats.toPickup,   color: '#F59E0B', icon: '📦' },
            { label: 'Хүргэж байна',   val: stats.delivering, color: '#FF6B00', icon: '🚚' },
            { label: 'Хүргэсэн',       val: stats.done,       color: '#10B981', icon: '🏠' },
            { label: 'Нийт захиалга',  val: stats.total,      color: '#3B82F6', icon: '📋' },
          ].map(item => (
            <div key={item.label} style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 12, padding: '16px 18px', borderTop: '3px solid ' + item.color }}>
              <div style={{ fontSize: 24, marginBottom: 6 }}>{item.icon}</div>
              <div style={{ fontSize: 26, fontWeight: 700, color: item.color }}>{item.val}</div>
              <div style={{ fontSize: 12, color: 'var(--text2)', marginTop: 4 }}>{item.label}</div>
            </div>
          ))}
        </div>

        {/* Workflow banner */}
        <div style={{ background: 'rgba(16,185,129,0.06)', border: '1px solid rgba(16,185,129,0.2)', borderRadius: 10, padding: '12px 18px', marginBottom: 20, display: 'flex', alignItems: 'center', gap: 14, flexWrap: 'wrap' }}>
          {[
            { label: 'Үйлдвэрт бэлэн', icon: '🏭', color: '#F59E0B' },
            { label: '→',  icon: '', color: 'var(--text3)' },
            { label: 'Авах',            icon: '📦', color: '#8B5CF6' },
            { label: '→',  icon: '', color: 'var(--text3)' },
            { label: 'Хүргэж байна',    icon: '🚚', color: '#FF6B00' },
            { label: '→',  icon: '', color: 'var(--text3)' },
            { label: 'Хүргэсэн',        icon: '🏠', color: '#10B981' },
          ].map((st, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: st.icon === '' ? 16 : 13, color: st.color, fontWeight: st.icon === '' ? 400 : 600 }}>
              {st.icon && <span>{st.icon}</span>}
              <span>{st.label}</span>
            </div>
          ))}
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: selected ? '1fr 400px' : '1fr', gap: 20 }}>

          {/* List */}
          <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 12, overflow: 'hidden' }}>

            {/* Filter tabs */}
            <div style={{ display: 'flex', borderBottom: '1px solid var(--border)', padding: '0 4px' }}>
              {([
                { key: 'all',       label: `Бүгд (${stats.total})` },
                { key: 'pending',   label: `📦 Авах (${stats.toPickup})` },
                { key: 'active',    label: `🚚 Хүргэж байна (${stats.delivering})` },
                { key: 'delivered', label: `✓ Хүргэсэн (${stats.done})` },
              ] as { key: FilterType; label: string }[]).map(f => (
                <button key={f.key} onClick={() => setFilter(f.key)}
                  style={{ background: 'none', border: 'none', padding: '12px 14px', fontSize: 13, fontWeight: 600, cursor: 'pointer', color: filter === f.key ? '#10B981' : 'var(--text2)', borderBottom: filter === f.key ? '2px solid #10B981' : '2px solid transparent', marginBottom: -1, whiteSpace: 'nowrap' }}>
                  {f.label}
                </button>
              ))}
            </div>

            {/* Table head */}
            <div style={{ display: 'grid', gridTemplateColumns: '80px 1fr 0.7fr 0.6fr 0.7fr 1fr', padding: '10px 20px', background: 'var(--surface2)', borderBottom: '1px solid var(--border)', fontSize: 11, fontWeight: 700, color: 'var(--text2)', textTransform: 'uppercase', letterSpacing: '0.07em' }}>
              <span>#ID</span><span>Захиалга</span><span>Хэмжээ</span><span>Дүн</span><span>Хаяг</span><span>Төлөв</span>
            </div>

            {loading ? (
              <div style={{ padding: 48, textAlign: 'center', color: 'var(--text2)' }}>Уншиж байна...</div>
            ) : filtered.length === 0 ? (
              <div style={{ padding: 48, textAlign: 'center', color: 'var(--text2)' }}>
                <div style={{ fontSize: 32, marginBottom: 8 }}>🚚</div>
                <div style={{ fontWeight: 600 }}>Хүргэлтийн захиалга байхгүй</div>
                <div style={{ fontSize: 13, marginTop: 6, color: 'var(--text3)' }}>Үйлдвэрт хэвлэгдэж дуусахад энд харагдана</div>
              </div>
            ) : filtered.map((d, i) => {
              const st = STATUS_MN[d.status] ?? { label: d.status, color: '#888', bg: 'rgba(136,136,136,0.1)' }
              return (
                <div key={d.id}
                  onClick={() => setSelected(selected?.id === d.id ? null : d)}
                  style={{ display: 'grid', gridTemplateColumns: '80px 1fr 0.7fr 0.6fr 0.7fr 1fr', padding: '12px 20px', borderBottom: i < filtered.length - 1 ? '1px solid var(--border)' : 'none', alignItems: 'center', fontSize: 13, cursor: 'pointer', background: selected?.id === d.id ? 'rgba(16,185,129,0.06)' : 'transparent' }}
                  onMouseEnter={e => { if (selected?.id !== d.id) e.currentTarget.style.background = 'var(--surface2)' }}
                  onMouseLeave={e => { if (selected?.id !== d.id) e.currentTarget.style.background = 'transparent' }}>
                  <code style={{ fontSize: 11, color: 'var(--text2)' }}>#{d.id}</code>
                  <div>
                    <div style={{ fontWeight: 500 }}>{d.order?.product_name || '—'}</div>
                    {d.recipient_name && <div style={{ fontSize: 11, color: 'var(--text2)', marginTop: 2 }}>{d.recipient_name}</div>}
                  </div>
                  <span>{d.order?.quantity ?? '—'} ш</span>
                  <span style={{ fontWeight: 600, color: '#FF6B00' }}>{Number(d.order?.total_price ?? 0).toLocaleString()}₮</span>
                  <span style={{ fontSize: 11, color: 'var(--text2)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{d.address ?? '—'}</span>
                  <span style={{ background: st.bg, color: st.color, borderRadius: 20, padding: '3px 10px', fontSize: 11, fontWeight: 600, width: 'fit-content' }}>
                    {st.label}
                  </span>
                </div>
              )
            })}
          </div>

          {/* Detail panel */}
          {selected && (
            <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 12, padding: 24, height: 'fit-content', position: 'sticky', top: 74 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                <div style={{ fontWeight: 700, fontSize: 15 }}>Хүргэлт #{selected.id}</div>
                <button onClick={() => setSelected(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text2)', fontSize: 20, lineHeight: 1 }}>×</button>
              </div>

              {/* Order info */}
              <div style={{ background: 'var(--surface2)', border: '1px solid var(--border)', borderRadius: 8, padding: '14px', marginBottom: 16 }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text2)', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 10 }}>Захиалгийн мэдээлэл</div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                  {[
                    { label: 'Захиалгын ID',  val: (selected.order?.id ?? '—').slice(0, 10) + '...' },
                    { label: 'Бүтээгдэхүүн', val: selected.order?.product_name || '—' },
                    { label: 'Тоо хэмжээ',   val: (selected.order?.quantity ?? '—') + ' ш' },
                    { label: 'Нийт дүн',      val: Number(selected.order?.total_price ?? 0).toLocaleString() + '₮' },
                  ].map(item => (
                    <div key={item.label}>
                      <div style={{ fontSize: 11, color: 'var(--text2)', marginBottom: 2 }}>{item.label}</div>
                      <div style={{ fontSize: 13, fontWeight: 500 }}>{item.val}</div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Recipient + address */}
              <div style={{ background: 'var(--surface2)', border: '1px solid var(--border)', borderRadius: 8, padding: '14px', marginBottom: 16 }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text2)', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 10 }}>Хүлээн авагч</div>
                {selected.recipient_name && <div style={{ fontSize: 13, marginBottom: 6 }}>👤 {selected.recipient_name}</div>}
                {selected.recipient_phone && (
                  <a href={`tel:${selected.recipient_phone}`} style={{ fontSize: 13, color: '#FF6B00', textDecoration: 'none', fontWeight: 600, display: 'block', marginBottom: 6 }}>
                    📞 {selected.recipient_phone}
                  </a>
                )}
                {selected.address && <div style={{ fontSize: 13, color: 'var(--text)' }}>📍 {selected.address}</div>}
                {!selected.recipient_name && !selected.address && (
                  <div style={{ fontSize: 13, color: 'var(--text3)' }}>Хаягийн мэдээлэл байхгүй</div>
                )}
              </div>

              {/* Delivery progress */}
              <div style={{ marginBottom: 16 }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text2)', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 8 }}>Хүргэлтийн явц</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                  {WORKFLOW.map((step, i) => {
                    const statusOrder = WORKFLOW.map(w => w.status)
                    const curIdx = statusOrder.indexOf(selected.status)
                    const stepIdx = statusOrder.indexOf(step.status)
                    const isDone = stepIdx <= curIdx && curIdx >= 0
                    const isCur  = step.status === selected.status
                    return (
                      <div key={step.status} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 10px', borderRadius: 8, background: isCur ? 'rgba(16,185,129,0.08)' : 'transparent', border: isCur ? '1px solid rgba(16,185,129,0.3)' : '1px solid transparent' }}>
                        <div style={{ width: 22, height: 22, borderRadius: '50%', background: isDone ? '#10B981' : 'var(--border)', color: isDone ? '#fff' : 'var(--text3)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 700, flexShrink: 0 }}>
                          {isDone ? '✓' : i + 1}
                        </div>
                        <span style={{ fontSize: 13, fontWeight: isCur ? 600 : 400, color: isCur ? '#10B981' : isDone ? 'var(--text)' : 'var(--text2)' }}>
                          {step.icon} {step.label}
                        </span>
                      </div>
                    )
                  })}
                </div>
              </div>

              {/* Action button */}
              {wfStep?.next && (
                <button
                  onClick={() => updateStatus(selected, wfStep.next!)}
                  disabled={updating}
                  style={{ width: '100%', padding: '12px', background: '#10B981', color: '#fff', border: 'none', borderRadius: 10, cursor: updating ? 'not-allowed' : 'pointer', fontWeight: 700, fontSize: 14, opacity: updating ? 0.7 : 1 }}>
                  {updating ? 'Шинэчилж байна...' : wfStep.nextLabel}
                </button>
              )}
              {selected.status === 'delivered' && (
                <div style={{ padding: '12px', background: 'rgba(16,185,129,0.1)', border: '1px solid #10B981', borderRadius: 10, textAlign: 'center', fontSize: 14, fontWeight: 700, color: '#10B981' }}>
                  ✓ Амжилттай хүргэгдсэн
                </div>
              )}

              {/* Notes */}
              {(selected.note || selected.order?.notes) && (
                <div style={{ marginTop: 12, padding: '10px 12px', background: 'var(--surface2)', border: '1px solid var(--border)', borderRadius: 8, fontSize: 13, color: 'var(--text2)' }}>
                  💬 {selected.note || selected.order?.notes}
                </div>
              )}

              <div style={{ fontSize: 11, color: 'var(--text3)', marginTop: 14, textAlign: 'right' }}>
                Шинэчлэгдсэн: {new Date(selected.updated_at).toLocaleString('mn-MN')}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
