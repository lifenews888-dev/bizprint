'use client'
import { apiFetch } from '@/lib/api'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import DashboardLayout from '@/components/layouts/DashboardLayout'
import KpiCard from '@/components/dashboard/KpiCard'
import { useRoleGuard } from '@/lib/use-role-guard'
import { COURIER_MENU } from '@/config/sidebar-config'

interface Order {
  id: string
  quantity: number
  total_price: number
  status: string
  product_type?: string
  created_at: string
  notes?: string
  customer?: { full_name: string; email: string }
}

const ST_MN: Record<string, string> = {
  pending: '\u0425\u04af\u043b\u044d\u044d\u0433\u0434\u044d\u0436 \u0431\u0430\u0439\u043d\u0430',
  paid: '\u0422\u04e9\u043b\u04e9\u0433\u0434\u0441\u04e9\u043d',
  in_production: '\u0425\u044d\u0432\u043b\u044d\u0436 \u0431\u0430\u0439\u043d\u0430',
  completed: '\u0414\u0443\u0443\u0441\u0441\u0430\u043d',
  shipped: '\u0425\u04af\u0440\u0433\u044d\u0433\u0434\u0441\u044d\u043d',
  delivered: '\u0425\u04af\u0440\u0433\u044d\u0441\u044d\u043d',
  cancelled: '\u0426\u0443\u0446\u043b\u0430\u0433\u0434\u0441\u0430\u043d',
}
const ST_CLR: Record<string, string> = {
  pending: '#F59E0B', paid: '#378ADD', in_production: '#8B5CF6',
  completed: '#10B981', shipped: '#3B82F6', delivered: '#1D9E75', cancelled: '#e24b4a',
}

const WORKFLOW = [
  { status: 'completed',     label: '\u0425\u044d\u0432\u043b\u044d\u043b\u0442 \u0434\u0443\u0443\u0441\u0441\u0430\u043d', icon: '\u2705' },
  { status: 'shipped',       label: '\u0425\u04af\u0440\u0433\u044d\u043b\u0442\u044d\u043d\u0434 \u0433\u0430\u0440\u0441\u0430\u043d', icon: '\ud83d\ude9a' },
  { status: 'delivered',     label: '\u0425\u04af\u0440\u0433\u044d\u0441\u044d\u043d', icon: '\ud83c\udfe0' },
]

type FilterType = 'all' | 'completed' | 'shipped' | 'delivered'

export default function CourierDashboard() {
  const router  = useRouter()
  const { user, loading: authLoading } = useRoleGuard(['courier', 'admin'])
  const [orders, setOrders]     = useState<Order[]>([])
  const [loading, setLoading]   = useState(true)
  const [filter, setFilter]     = useState<FilterType>('all')
  const [selected, setSelected] = useState<Order | null>(null)
  const [toast, setToast]       = useState<{ msg: string; ok: boolean } | null>(null)

  useEffect(() => {
    if (!authLoading && user) fetchOrders()
  }, [authLoading, user])

  async function fetchOrders() {
    setLoading(true)
    try {
      const r = await apiFetch<any>('/admin/orders')
      setOrders(r)
    } catch {}
    setLoading(false)
  }

  function showToast(msg: string, ok = true) {
    setToast({ msg, ok })
    setTimeout(() => setToast(null), 3000)
  }

  async function updateStatus(order: Order, status: string) {
    try {
      await apiFetch<any>('/orders/' + order.id, {
        method: 'PATCH',
        body: { status },
      })
      showToast('\u0422\u04e9\u043b\u04e9\u0432 \u0448\u0438\u043d\u044d\u0447\u043b\u044d\u0433\u0434\u043b\u044d\u044d \u2713')
      const updated = { ...order, status }
      setOrders(prev => prev.map(o => o.id === order.id ? updated : o))
      setSelected(updated)
    } catch { showToast('\u0410\u043b\u0434\u0430\u0430 \u0433\u0430\u0440\u043b\u0430\u0430', false) }
  }

  // Courier-т харагдах захиалгууд: completed болон дараахь
  const courierOrders = orders.filter(o => ['completed', 'shipped', 'delivered'].includes(o.status))
  const filtered = courierOrders.filter(o => filter === 'all' || o.status === filter)

  const stats = {
    toPickup:   courierOrders.filter(o => o.status === 'completed').length,
    delivering: courierOrders.filter(o => o.status === 'shipped').length,
    delivered:  courierOrders.filter(o => o.status === 'delivered').length,
    total:      courierOrders.length,
  }

  const s: React.CSSProperties = { background: 'var(--surface2)', border: '1px solid var(--border)', borderRadius: 8, padding: '8px 12px', color: 'var(--text)', fontSize: 13, outline: 'none' }

  if (authLoading) return <div style={{ minHeight: '100vh', background: 'var(--bg)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text2)' }}>Ачааллаж байна...</div>

  return (
    <DashboardLayout navGroups={COURIER_MENU} user={user || undefined}>
      {toast && (
        <div style={{ position: 'fixed', top: 20, right: 20, zIndex: 9999, background: toast.ok ? '#1D9E75' : '#e24b4a', color: '#fff', padding: '12px 20px', borderRadius: 10, fontSize: 14, fontWeight: 600, boxShadow: '0 4px 24px rgba(0,0,0,0.3)' }}>
          {toast.msg}
        </div>
      )}

      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 22, fontWeight: 700, margin: 0 }}>Хүргэлтийн удирдлага</h1>
        <p style={{ color: 'var(--text2)', fontSize: 13, margin: '4px 0 0' }}>Захиалга, маршрут, статус хяналт</p>
      </div>

      <KpiCard items={[
        { label: 'Авах захиалга', value: stats.toPickup, color: 'orange', icon: '📦' },
        { label: 'Хүргэж байна', value: stats.delivering, color: 'blue', icon: '🚚' },
        { label: 'Хүргэсэн', value: stats.delivered, color: 'green', icon: '🏠' },
        { label: 'Нийт', value: stats.total, color: 'purple', icon: '📋' },
      ]} />

        {/* Delivery flow banner */}
        <div style={{ background: 'rgba(16,185,129,0.06)', border: '1px solid rgba(16,185,129,0.2)', borderRadius: 10, padding: '12px 18px', marginBottom: 20, display: 'flex', alignItems: 'center', gap: 16 }}>
          {[
            { label: 'Үйлдвэрээс авах', icon: '🏭', color: '#F59E0B' },
            { label: '→', icon: '', color: 'var(--text3)' },
            { label: 'Хүргэж байна', icon: '🚚', color: '#3B82F6' },
            { label: '→', icon: '', color: 'var(--text3)' },
            { label: 'Хүргэсэн', icon: '🏠', color: '#1D9E75' },
          ].map((s, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: s.icon === '' ? 16 : 13, color: s.color, fontWeight: s.icon === '' ? 400 : 600 }}>
              {s.icon && <span>{s.icon}</span>}
              <span>{s.label}</span>
            </div>
          ))}
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: selected ? '1fr 380px' : '1fr', gap: 20 }}>

          {/* Orders list */}
          <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 12, overflow: 'hidden' }}>
            {/* Tabs */}
            <div style={{ display: 'flex', borderBottom: '1px solid var(--border)', padding: '0 4px' }}>
              {([
                { key: 'all',       label: 'Бүгд (' + courierOrders.length + ')' },
                { key: 'completed', label: '📦 Авах (' + stats.toPickup + ')' },
                { key: 'shipped',   label: '🚚 Хүргэж байна (' + stats.delivering + ')' },
                { key: 'delivered', label: '✓ Хүргэсэн' },
              ] as { key: FilterType; label: string }[]).map(f => (
                <button key={f.key} onClick={() => setFilter(f.key)}
                  style={{ background: 'none', border: 'none', padding: '12px 14px', fontSize: 13, fontWeight: 600, cursor: 'pointer', color: filter === f.key ? '#1D9E75' : 'var(--text2)', borderBottom: filter === f.key ? '2px solid #1D9E75' : '2px solid transparent', marginBottom: -1, whiteSpace: 'nowrap' }}>
                  {f.label}
                </button>
              ))}
            </div>

            {/* Table header */}
            <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 0.8fr 0.7fr 0.8fr 1fr', padding: '10px 20px', background: 'var(--surface2)', borderBottom: '1px solid var(--border)', fontSize: 11, fontWeight: 700, color: 'var(--text2)', textTransform: 'uppercase', letterSpacing: '0.07em' }}>
              <span>ID</span><span>Бүтээгдэхүүн</span><span>Тоо</span><span>Дүн</span><span>Төлөв</span>
            </div>

            {loading ? (
              <div style={{ padding: 48, textAlign: 'center', color: 'var(--text2)' }}>Уншиж байна...</div>
            ) : filtered.length === 0 ? (
              <div style={{ padding: 48, textAlign: 'center', color: 'var(--text2)' }}>
                <div style={{ fontSize: 32, marginBottom: 8 }}>🚚</div>
                <div style={{ fontWeight: 600 }}>Хүргэлтийн захиалга байхгүй</div>
                <div style={{ fontSize: 13, marginTop: 6, color: 'var(--text3)' }}>Үйлдвэрт хэвлэгдэж дуусахад энд харагдана</div>
              </div>
            ) : filtered.map((o, i) => (
              <div key={o.id}
                onClick={() => setSelected(selected?.id === o.id ? null : o)}
                style={{ display: 'grid', gridTemplateColumns: '1.2fr 0.8fr 0.7fr 0.8fr 1fr', padding: '12px 20px', borderBottom: i < filtered.length - 1 ? '1px solid var(--border)' : 'none', alignItems: 'center', fontSize: 13, cursor: 'pointer', background: selected?.id === o.id ? 'rgba(16,185,129,0.06)' : 'transparent' }}
                onMouseEnter={e => { if (selected?.id !== o.id) e.currentTarget.style.background = 'var(--surface2)' }}
                onMouseLeave={e => { if (selected?.id !== o.id) e.currentTarget.style.background = 'transparent' }}>
                <code style={{ fontSize: 11, color: 'var(--text2)' }}>{o.id.slice(0, 10)}...</code>
                <span style={{ fontSize: 12 }}>{o.product_type || '—'}</span>
                <span>{o.quantity} ш</span>
                <span style={{ fontWeight: 600, color: '#FF6B00' }}>{Number(o.total_price).toLocaleString()}₮</span>
                <span style={{ background: (ST_CLR[o.status] || '#888') + '20', color: ST_CLR[o.status] || '#888', borderRadius: 20, padding: '3px 10px', fontSize: 11, fontWeight: 600, width: 'fit-content' }}>
                  {ST_MN[o.status] || o.status}
                </span>
              </div>
            ))}
          </div>

          {/* Detail panel */}
          {selected && (
            <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 12, padding: 24, height: 'fit-content', position: 'sticky', top: 74 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                <div style={{ fontWeight: 700, fontSize: 15 }}>Хүргэлтийн дэлгэрэнгүй</div>
                <button onClick={() => setSelected(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text2)', fontSize: 20 }}>×</button>
              </div>

              {/* Info */}
              <div style={{ background: 'var(--surface2)', border: '1px solid var(--border)', borderRadius: 8, padding: '12px 14px', marginBottom: 16 }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                  {[
                    { label: 'ID', val: selected.id.slice(0, 12) + '...' },
                    { label: 'Тоо', val: selected.quantity + ' ш' },
                    { label: 'Дүн', val: Number(selected.total_price).toLocaleString() + '₮' },
                    { label: 'Огноо', val: new Date(selected.created_at).toLocaleDateString('mn-MN') },
                  ].map(item => (
                    <div key={item.label}>
                      <div style={{ fontSize: 11, color: 'var(--text2)', marginBottom: 2 }}>{item.label}</div>
                      <div style={{ fontSize: 13, fontWeight: 500 }}>{item.val}</div>
                    </div>
                  ))}
                </div>
                {selected.customer && (
                  <div style={{ marginTop: 10, paddingTop: 10, borderTop: '1px solid var(--border)' }}>
                    <div style={{ fontSize: 11, color: 'var(--text2)', marginBottom: 2 }}>Хэрэглэгч</div>
                    <div style={{ fontSize: 13, fontWeight: 500 }}>{selected.customer.full_name}</div>
                    <div style={{ fontSize: 12, color: 'var(--text2)' }}>{selected.customer.email}</div>
                  </div>
                )}
              </div>

              {/* Delivery workflow */}
              <div style={{ marginBottom: 16 }}>
                <div style={{ fontSize: 11, color: 'var(--text2)', marginBottom: 8, textTransform: 'uppercase', fontWeight: 700, letterSpacing: '0.07em' }}>Хүргэлтийн явц</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                  {WORKFLOW.map((step, i) => {
                    const curIdx = WORKFLOW.findIndex(w => w.status === selected.status)
                    const isDone = i <= curIdx
                    const isCur = step.status === selected.status
                    return (
                      <div key={step.status} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 10px', borderRadius: 8, background: isCur ? 'rgba(16,185,129,0.08)' : 'transparent', border: isCur ? '1px solid rgba(16,185,129,0.3)' : '1px solid transparent' }}>
                        <div style={{ width: 22, height: 22, borderRadius: '50%', background: isDone ? '#1D9E75' : 'var(--border)', color: isDone ? '#fff' : 'var(--text3)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 700, flexShrink: 0 }}>
                          {isDone ? '✓' : i + 1}
                        </div>
                        <span style={{ fontSize: 13, fontWeight: isCur ? 600 : 400, color: isCur ? '#1D9E75' : isDone ? 'var(--text)' : 'var(--text2)' }}>
                          {step.icon} {step.label}
                        </span>
                      </div>
                    )
                  })}
                </div>
              </div>

              {/* Actions */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                <div style={{ fontSize: 11, color: 'var(--text2)', marginBottom: 2, textTransform: 'uppercase', fontWeight: 700, letterSpacing: '0.07em' }}>Үйлдэл</div>
                {selected.status === 'completed' && (
                  <button onClick={() => updateStatus(selected, 'shipped')}
                    style={{ padding: '10px', background: '#3B82F6', color: '#fff', border: 'none', borderRadius: 8, cursor: 'pointer', fontWeight: 700, fontSize: 13 }}>
                    🚚 Хүргэлтэнд гаргах
                  </button>
                )}
                {selected.status === 'shipped' && (
                  <button onClick={() => updateStatus(selected, 'delivered')}
                    style={{ padding: '10px', background: '#1D9E75', color: '#fff', border: 'none', borderRadius: 8, cursor: 'pointer', fontWeight: 700, fontSize: 13 }}>
                    🏠 Хүргэсэн гэж тэмдэглэх
                  </button>
                )}
                {selected.status === 'delivered' && (
                  <div style={{ padding: '10px', background: 'rgba(16,185,129,0.1)', border: '1px solid #1D9E75', borderRadius: 8, textAlign: 'center', fontSize: 13, fontWeight: 600, color: '#1D9E75' }}>
                    ✓ Амжилттай хүргэгдсэн
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
    </DashboardLayout>
  )
}
