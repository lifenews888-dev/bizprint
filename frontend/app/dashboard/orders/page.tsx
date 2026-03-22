'use client'
import { apiFetch } from '@/lib/api'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import OrderCard from '@/components/order/OrderCard'
import OrderStepper from '@/components/order/OrderStepper'
import EmptyState from '@/components/ui/EmptyState'

const F = "'DM Sans','Segoe UI',system-ui,sans-serif"
const fmt = (n: number) => new Intl.NumberFormat('mn-MN').format(Math.round(n)) + '₮'

const TABS = [
  { key: 'all',       label: 'Бүгд' },
  { key: 'active',    label: 'Идэвхтэй' },
  { key: 'completed', label: 'Дууссан' },
  { key: 'cancelled', label: 'Цуцлагдсан' },
]

const ACTIVE_STATUSES = ['draft', 'quotation_sent', 'confirmed', 'pending_file', 'file_review', 'in_production', 'finishing', 'dispatched', 'delivered']

export default function OrdersPage() {
  const router = useRouter()
  const [orders, setOrders] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState('all')
  const [expanded, setExpanded] = useState<string | null>(null)

  useEffect(() => {
    apiFetch<any[]>('/orders/my')
      .then(d => setOrders(Array.isArray(d) ? d : []))
      .catch(() => setOrders([]))
      .finally(() => setLoading(false))
  }, [])

  const filtered = orders.filter(o => {
    if (tab === 'all') return true
    if (tab === 'active') return ACTIVE_STATUSES.includes(o.status)
    if (tab === 'completed') return o.status === 'completed'
    if (tab === 'cancelled') return o.status === 'cancelled'
    return true
  })

  return (
    <div style={{ maxWidth: 900, margin: '0 auto', padding: '32px 24px', fontFamily: F }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
        <h1 style={{ fontSize: 24, fontWeight: 800, margin: 0 }}>Миний захиалгууд</h1>
        <button onClick={() => router.push('/shop')} style={{
          background: '#FF6B00', color: '#fff', border: 'none', borderRadius: 10,
          padding: '10px 20px', fontWeight: 700, fontSize: 13, cursor: 'pointer', fontFamily: F,
        }}>
          + Шинэ захиалга
        </button>
      </div>

      {/* Filter tabs */}
      <div style={{ display: 'flex', gap: 6, marginBottom: 24 }}>
        {TABS.map(t => (
          <button key={t.key} onClick={() => setTab(t.key)} style={{
            padding: '8px 16px', borderRadius: 999, border: 'none', cursor: 'pointer',
            background: tab === t.key ? '#FF6B00' : 'var(--surface, #F3F4F6)',
            color: tab === t.key ? '#fff' : 'var(--text2, #666)',
            fontWeight: tab === t.key ? 700 : 500, fontSize: 13, fontFamily: F,
          }}>
            {t.label}
            {t.key !== 'all' && (() => {
              const count = orders.filter(o => {
                if (t.key === 'active') return ACTIVE_STATUSES.includes(o.status)
                if (t.key === 'completed') return o.status === 'completed'
                if (t.key === 'cancelled') return o.status === 'cancelled'
                return false
              }).length
              return count > 0 ? ` (${count})` : ''
            })()}
          </button>
        ))}
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '60px 0', color: '#888' }}>Уншиж байна...</div>
      ) : filtered.length === 0 ? (
        <EmptyState
          icon="📦"
          title="Захиалга байхгүй"
          message={tab === 'all' ? 'Та одоогоор захиалга хийгээгүй байна' : `"${TABS.find(t => t.key === tab)?.label}" захиалга байхгүй`}
          ctaText="Захиалга эхлэх"
          ctaHref="/shop"
        />
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {filtered.map(order => (
            <div key={order.id}>
              <OrderCard
                order={order}
                onClick={() => setExpanded(expanded === order.id ? null : order.id)}
              />
              {/* Expanded details */}
              {expanded === order.id && (
                <div style={{
                  background: 'var(--surface, #FAFAFA)', border: '1px solid var(--border, #E5E7EB)',
                  borderTop: 'none', borderRadius: '0 0 14px 14px', padding: '16px 20px',
                }}>
                  <OrderStepper currentStatus={order.status} />
                  <div style={{ marginTop: 16, display: 'flex', flexWrap: 'wrap', gap: '8px 24px', fontSize: 13, color: '#666' }}>
                    {order.paper_gsm && <span>Цаас: {order.paper_gsm}gsm</span>}
                    {order.color_mode && <span>Өнгө: {order.color_mode === 'color' ? 'Өнгөт' : 'ХЦ'}</span>}
                    {order.sides && <span>Тал: {order.sides === 'double' ? '2 тал' : '1 тал'}</span>}
                    {order.finishing && order.finishing !== 'none' && <span>Финиш: {order.finishing}</span>}
                  </div>
                  {order.notes && (
                    <p style={{ fontSize: 13, color: '#888', marginTop: 8 }}>{order.notes}</p>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
