'use client'
import { apiFetch } from '@/lib/api'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'

const FONT = "'DM Sans','Segoe UI',system-ui,sans-serif"
const fmt = (n: number) => new Intl.NumberFormat('mn-MN').format(Math.round(n)) + '₮'

const STATUS_STEPS = ['pending', 'designing', 'prepress', 'printing', 'finishing', 'qc', 'ready', 'delivering', 'completed']
const STATUS_LABEL: Record<string, string> = {
  pending: 'Хүлээгдэж буй', paid: 'Төлөгдсөн', designing: 'Дизайн',
  prepress: 'Prepress', printing: 'Хэвлэл', finishing: 'Finishing',
  qc: 'QC шалгалт', ready: 'Бэлэн', delivering: 'Хүргэлтэнд',
  completed: 'Дууссан', cancelled: 'Цуцлагдсан', shipped: 'Хүргэгдсэн',
  delivered: 'Хүргэгдсэн', in_production: 'Үйлдвэрлэлд',
}
const STATUS_COLOR: Record<string, string> = {
  pending: '#F59E0B', paid: '#3B82F6', designing: '#8B5CF6',
  prepress: '#06B6D4', printing: '#EC4899', finishing: '#3B82F6',
  qc: '#F97316', ready: '#10B981', delivering: '#6366F1',
  completed: '#059669', cancelled: '#EF4444', shipped: '#10B981',
  delivered: '#059669', in_production: '#8B5CF6',
}
const STATUS_ICON: Record<string, string> = {
  pending: '⏳', paid: '💳', designing: '🎨', prepress: '🖥️',
  printing: '🖨️', finishing: '✂️', qc: '🔍', ready: '📦',
  delivering: '🚚', completed: '✅', cancelled: '❌', shipped: '📬', delivered: '🎉', in_production: '⚙️',
}

function ProgressBar({ status }: { status: string }) {
  const idx = STATUS_STEPS.indexOf(status)
  if (idx < 0 || status === 'cancelled') return null
  const pct = Math.round((idx / (STATUS_STEPS.length - 1)) * 100)
  return (
    <div style={{ marginTop: 12 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: 'var(--text2)', marginBottom: 4 }}>
        <span>Захиалга</span>
        <span>Дууссан</span>
      </div>
      <div style={{ height: 6, background: 'var(--border)', borderRadius: 99, overflow: 'hidden' }}>
        <div style={{ height: '100%', width: `${pct}%`, background: pct === 100 ? '#059669' : '#FF6B00', borderRadius: 99, transition: 'width 0.3s' }} />
      </div>
    </div>
  )
}

function OrderCard({ order, onClick }: { order: any; onClick: () => void }) {
  const color = STATUS_COLOR[order.status] || '#888'
  const icon = STATUS_ICON[order.status] || '📋'
  const label = STATUS_LABEL[order.status] || order.status
  return (
    <div onClick={onClick} style={{
      background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 16,
      padding: 20, cursor: 'pointer', transition: 'box-shadow 0.15s',
    }}
      onMouseEnter={e => (e.currentTarget.style.boxShadow = '0 4px 20px rgba(0,0,0,0.1)')}
      onMouseLeave={e => (e.currentTarget.style.boxShadow = 'none')}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
        <div>
          <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--text)', marginBottom: 4 }}>
            {order.product_name || 'Захиалга'}
          </div>
          <div style={{ fontSize: 12, color: 'var(--text2)' }}>
            #{order.id?.slice(-8).toUpperCase()} · {order.quantity} ширхэг
          </div>
        </div>
        <span style={{
          padding: '5px 12px', borderRadius: 99, fontSize: 12, fontWeight: 700,
          background: color + '20', color,
        }}>
          {icon} {label}
        </span>
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ fontSize: 12, color: 'var(--text2)' }}>
          📅 {order.created_at ? new Date(order.created_at).toLocaleDateString('mn-MN') : '—'}
        </div>
        <div style={{ fontSize: 18, fontWeight: 800, color: '#FF6B00' }}>
          {fmt(order.total_price || 0)}
        </div>
      </div>
      <ProgressBar status={order.status} />
    </div>
  )
}

export default function MyOrdersPage() {
  const router = useRouter()
  const [orders, setOrders] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('all')
  const [detail, setDetail] = useState<any>(null)

  useEffect(() => {
    const token = getToken()
    if (!token) { router.push('/login'); return }
    apiFetch('/orders/my')
      .then(r => r.json())
      .then(d => setOrders(Array.isArray(d) ? d : Array.isArray(d?.data) ? d.data : []))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  const FILTERS = [
    { value: 'all', label: 'Бүгд' },
    { value: 'pending', label: '⏳ Хүлээж буй' },
    { value: 'printing', label: '🖨️ Хэвлэлд' },
    { value: 'delivering', label: '🚚 Хүргэлтэнд' },
    { value: 'completed', label: '✅ Дууссан' },
  ]

  const filtered = orders.filter(o => filter === 'all' || o.status === filter)

  return (
    <div style={{ maxWidth: 860, margin: '0 auto', padding: '32px 24px', fontFamily: FONT }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 28 }}>
        <div>
          <h1 style={{ fontSize: 26, fontWeight: 800, margin: '0 0 4px' }}>📦 Миний захиалгууд</h1>
          <p style={{ margin: 0, fontSize: 14, color: 'var(--text2)' }}>Нийт {orders.length} захиалга</p>
        </div>
        <button onClick={() => router.push('/smart-quote')} style={{
          background: '#FF6B00', color: '#fff', border: 'none', borderRadius: 12,
          padding: '12px 22px', fontWeight: 700, fontSize: 14, cursor: 'pointer',
        }}>
          + Шинэ захиалга
        </button>
      </div>

      {/* Filter */}
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 24 }}>
        {FILTERS.map(f => (
          <button key={f.value} onClick={() => setFilter(f.value)} style={{
            padding: '8px 16px', borderRadius: 99, border: '1px solid',
            borderColor: filter === f.value ? '#FF6B00' : 'var(--border)',
            background: filter === f.value ? '#FF6B00' : 'transparent',
            color: filter === f.value ? '#fff' : 'var(--text2)',
            fontSize: 13, fontWeight: 600, cursor: 'pointer',
          }}>{f.label}</button>
        ))}
      </div>

      {/* List */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '60px 0', color: 'var(--text2)' }}>
          <div style={{ fontSize: 36, marginBottom: 12 }}>⏳</div>
          <p>Уншиж байна...</p>
        </div>
      ) : filtered.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '60px 20px', background: 'var(--surface)', borderRadius: 16, border: '2px dashed var(--border)' }}>
          <div style={{ fontSize: 56, marginBottom: 16 }}>📦</div>
          <h3 style={{ margin: '0 0 8px', fontSize: 18 }}>Захиалга байхгүй байна</h3>
          <p style={{ margin: '0 0 20px', color: 'var(--text2)', fontSize: 14 }}>PDF upload хийж хурдан үнэ авна уу</p>
          <button onClick={() => router.push('/smart-quote')} style={{
            background: '#FF6B00', color: '#fff', border: 'none', borderRadius: 12,
            padding: '12px 24px', fontWeight: 700, fontSize: 14, cursor: 'pointer',
          }}>🤖 AI Smart Quote</button>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {filtered.map(o => <OrderCard key={o.id} order={o} onClick={() => setDetail(o)} />)}
        </div>
      )}

      {/* Detail Modal */}
      {detail && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}
          onClick={() => setDetail(null)}>
          <div onClick={e => e.stopPropagation()} style={{
            background: 'var(--surface)', borderRadius: 20, maxWidth: 560, width: '100%',
            maxHeight: '90vh', overflow: 'auto',
          }}>
            <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between' }}>
              <h3 style={{ margin: 0, fontSize: 17, fontWeight: 700 }}>Захиалгын дэлгэрэнгүй</h3>
              <button onClick={() => setDetail(null)} style={{ background: 'none', border: 'none', fontSize: 20, cursor: 'pointer', color: 'var(--text2)' }}>✕</button>
            </div>
            <div style={{ padding: 24 }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 20 }}>
                {[
                  ['Захиалгын дугаар', '#' + (detail.id?.slice(-8).toUpperCase() || '—')],
                  ['Статус', STATUS_LABEL[detail.status] || detail.status],
                  ['Бүтээгдэхүүн', detail.product_name || '—'],
                  ['Тоо', detail.quantity + ' ширхэг'],
                  ['Нэгжийн үнэ', fmt(detail.unit_price || 0)],
                  ['Нийт дүн', fmt(detail.total_price || 0)],
                  ['Огноо', detail.created_at ? new Date(detail.created_at).toLocaleDateString('mn-MN') : '—'],
                  ['Төлбөр', detail.payment_status || '—'],
                ].map(([l, v]) => (
                  <div key={l} style={{ background: 'var(--surface2)', borderRadius: 10, padding: '10px 14px' }}>
                    <div style={{ fontSize: 11, color: 'var(--text2)', marginBottom: 4 }}>{l}</div>
                    <div style={{ fontSize: 14, fontWeight: 700 }}>{v}</div>
                  </div>
                ))}
              </div>
              <ProgressBar status={detail.status} />
              {detail.notes && (
                <div style={{ marginTop: 16, padding: '12px 16px', background: '#FFF7ED', borderRadius: 10, fontSize: 13, color: '#92400E' }}>
                  📝 {detail.notes}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
