'use client'
import { useState, useEffect } from 'react'

const API = 'http://localhost:4000'

// ─── Types ────────────────────────────────────────────────────────────────────

interface DeliveryRecord {
  id: number
  status: string
  courier_name?: string
  courier_phone?: string
  address?: string
  note?: string
  estimated_at?: string
  created_at: string
  updated_at: string
  order?: {
    id: string
    status: string
    total_price: number
    product_name?: string
    created_at: string
  }
}

interface Order {
  id: string
  status: string
  total_price: number
  created_at: string
  product_name?: string
}

// ─── Constants ────────────────────────────────────────────────────────────────

// Customer-visible delivery steps (simplified)
const STEPS = [
  { key: 'pending',    label: 'Хүргэлт зохицуулагдаж байна', icon: '📋' },
  { key: 'assigned',   label: 'Курьер оноогдсон',             icon: '🙋' },
  { key: 'picked_up',  label: 'Үйлдвэрээс авсан',             icon: '📦' },
  { key: 'on_the_way', label: 'Хүргэж байна',                 icon: '🚚' },
  { key: 'in_transit', label: 'Замдаа байна',                  icon: '📍' },
  { key: 'delivered',  label: 'Хүргэгдсэн',                   icon: '🏠' },
]

const STATUS_ORDER: Record<string, number> = {
  pending: 0, assigned: 1, picked_up: 2, on_the_way: 3, in_transit: 4, delivered: 5,
}

const ORDER_STATUS_MN: Record<string, string> = {
  pending:       'Хүлээгдэж байна',
  paid:          'Төлөгдсөн',
  in_production: 'Үйлдвэрлэлд',
  completed:     'Үйлдвэрлэл дууссан',
  shipped:       'Хүргэлтэнд',
  delivered:     'Хүргэгдсэн',
  cancelled:     'Цуцлагдсан',
}

const F = "'Segoe UI',system-ui,sans-serif"

function tok() { return localStorage.getItem('access_token') || localStorage.getItem('token') || '' }

// ─── Component ────────────────────────────────────────────────────────────────

export default function DeliveryTrackingPage() {
  const [orders, setOrders]           = useState<Order[]>([])
  const [selectedOrder, setSelectedOrder] = useState<string | null>(null)
  const [delivery, setDelivery]       = useState<DeliveryRecord | null>(null)
  const [loading, setLoading]         = useState(true)
  const [trackLoading, setTrackLoading] = useState(false)
  const [userId, setUserId]           = useState<string | null>(null)

  useEffect(() => {
    const t = tok()
    if (!t) { setLoading(false); return }
    fetchMe(t)
  }, [])

  async function fetchMe(t: string) {
    try {
      const res = await fetch(`${API}/auth/me`, { headers: { Authorization: `Bearer ${t}` } })
      const data = await res.json()
      setUserId(data.id)
      fetchOrders(t, data.id)
    } catch {
      setLoading(false)
    }
  }

  async function fetchOrders(t: string, uid: string) {
    try {
      // Fixed: was /customer-dashboard/:id/orders (wrong), now /orders/customer/:id
      const res = await fetch(`${API}/orders/customer/${uid}`, {
        headers: { Authorization: `Bearer ${t}` },
      })
      const data = await res.json()
      const list: Order[] = Array.isArray(data) ? data : []
      setOrders(list)
      if (list.length > 0) selectOrder(list[0].id, t)
    } catch {} finally {
      setLoading(false)
    }
  }

  async function selectOrder(orderId: string, t?: string) {
    const token = t || tok()
    if (!token) return
    setSelectedOrder(orderId)
    setDelivery(null)
    setTrackLoading(true)
    try {
      const res = await fetch(`${API}/delivery/order/${orderId}`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      setDelivery(res.ok ? await res.json() : null)
    } catch {
      setDelivery(null)
    } finally {
      setTrackLoading(false)
    }
  }

  const currentStep = delivery ? (STATUS_ORDER[delivery.status] ?? -1) : -1
  const isFailed = delivery?.status === 'failed'

  if (!tok()) return (
    <div style={{ padding: 40, textAlign: 'center', color: 'var(--text2)', fontFamily: F }}>
      <p>Хүргэлтийн мэдээлэл харахын тулд нэвтэрнэ үү.</p>
    </div>
  )

  return (
    <div style={{ padding: '24px', maxWidth: 960, margin: '0 auto', fontFamily: F }}>

      {/* Header */}
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 22, fontWeight: 700, color: 'var(--text)', margin: 0 }}>🚚 Хүргэлт хянах</h1>
        <p style={{ color: 'var(--text2)', margin: '4px 0 0', fontSize: 13 }}>Таны захиалгын хүргэлтийн явц</p>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: 40, color: 'var(--text2)' }}>Уншиж байна...</div>
      ) : orders.length === 0 ? (
        <div style={{ textAlign: 'center', padding: 60, border: '2px dashed var(--border)', borderRadius: 16, color: 'var(--text2)' }}>
          <div style={{ fontSize: 40, marginBottom: 12 }}>📭</div>
          <div style={{ fontWeight: 600, fontSize: 15 }}>Захиалга байхгүй байна</div>
          <div style={{ fontSize: 13, marginTop: 6 }}>Захиалга хийснийхээ дараа хүргэлт энд харагдана</div>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: '260px 1fr', gap: 20 }}>

          {/* Order selector */}
          <div>
            <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text2)', marginBottom: 10, textTransform: 'uppercase', letterSpacing: '0.07em' }}>
              Захиалгууд
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {orders.map(o => (
                <div key={o.id} onClick={() => selectOrder(o.id)}
                  style={{ padding: '12px 14px', borderRadius: 10, border: `2px solid ${selectedOrder === o.id ? 'var(--orange)' : 'var(--border)'}`, background: selectedOrder === o.id ? 'rgba(255,107,0,0.06)' : 'var(--surface)', cursor: 'pointer', transition: 'all 0.15s' }}>
                  <div style={{ fontSize: 12, fontWeight: 600, color: selectedOrder === o.id ? 'var(--orange)' : 'var(--text)' }}>
                    Захиалга #{o.id.slice(0, 8)}
                  </div>
                  {o.product_name && (
                    <div style={{ fontSize: 12, color: 'var(--text2)', marginTop: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{o.product_name}</div>
                  )}
                  <div style={{ fontSize: 12, color: 'var(--text2)', marginTop: 2 }}>
                    {new Date(o.created_at).toLocaleDateString('mn-MN')}
                  </div>
                  <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)', marginTop: 4 }}>
                    {Number(o.total_price).toLocaleString()}₮
                  </div>
                  <span style={{ fontSize: 11, padding: '2px 8px', borderRadius: 99, marginTop: 6, display: 'inline-block', background: 'rgba(255,107,0,0.1)', color: 'var(--orange)', fontWeight: 600 }}>
                    {ORDER_STATUS_MN[o.status] || o.status}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Tracking panel */}
          <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 16, padding: 24 }}>
            {trackLoading ? (
              <div style={{ textAlign: 'center', padding: 40, color: 'var(--text2)' }}>Уншиж байна...</div>
            ) : !delivery ? (
              <div style={{ textAlign: 'center', padding: 48, color: 'var(--text2)' }}>
                <div style={{ fontSize: 40, marginBottom: 12 }}>📦</div>
                <div style={{ fontWeight: 600, fontSize: 15, marginBottom: 6 }}>Хүргэлтийн мэдээлэл байхгүй</div>
                <div style={{ fontSize: 13 }}>Үйлдвэрт дуусаад курьер томилогдсоны дараа энд харагдана</div>
              </div>
            ) : (
              <>
                {/* Status header */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 28, padding: '14px 18px', borderRadius: 12, background: isFailed ? 'rgba(239,68,68,0.08)' : delivery.status === 'delivered' ? 'rgba(16,185,129,0.08)' : 'rgba(255,107,0,0.08)' }}>
                  <div>
                    <div style={{ fontSize: 12, color: 'var(--text2)', marginBottom: 4 }}>Одоогийн төлөв</div>
                    <div style={{ fontSize: 18, fontWeight: 700, color: isFailed ? '#EF4444' : delivery.status === 'delivered' ? '#10B981' : 'var(--orange)' }}>
                      {isFailed ? '❌ Хүргэлт амжилтгүй болсон' : STEPS.find(s => s.key === delivery.status)?.icon + ' ' + (STEPS.find(s => s.key === delivery.status)?.label ?? delivery.status)}
                    </div>
                  </div>
                  {delivery.estimated_at && (
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: 11, color: 'var(--text2)' }}>Тооцоолсон цаг</div>
                      <div style={{ fontSize: 13, fontWeight: 600 }}>🕐 {new Date(delivery.estimated_at).toLocaleString('mn-MN')}</div>
                    </div>
                  )}
                </div>

                {/* Timeline */}
                {!isFailed && (
                  <div style={{ marginBottom: 24 }}>
                    {STEPS.map((step, i) => {
                      const stepIdx = STATUS_ORDER[step.key] ?? i
                      const done    = stepIdx <= currentStep
                      const active  = step.key === delivery.status
                      return (
                        <div key={step.key} style={{ display: 'flex', alignItems: 'flex-start', marginBottom: i < STEPS.length - 1 ? 0 : 0 }}>
                          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginRight: 16, width: 28 }}>
                            <div style={{ width: 28, height: 28, borderRadius: '50%', flexShrink: 0, background: done ? '#FF6B00' : 'var(--surface2)', border: `2px solid ${done ? '#FF6B00' : 'var(--border)'}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, color: done ? '#fff' : 'var(--text3)', boxShadow: active ? '0 0 0 4px rgba(255,107,0,0.2)' : 'none', transition: 'all 0.2s' }}>
                              {done ? '✓' : i + 1}
                            </div>
                            {i < STEPS.length - 1 && (
                              <div style={{ width: 2, height: 32, background: stepIdx < currentStep ? '#FF6B00' : 'var(--border)', transition: 'background 0.3s' }} />
                            )}
                          </div>
                          <div style={{ paddingBottom: i < STEPS.length - 1 ? 4 : 0, paddingTop: 4 }}>
                            <div style={{ fontSize: 14, fontWeight: active ? 700 : 500, color: done ? 'var(--text)' : 'var(--text3)' }}>
                              {step.icon} {step.label}
                            </div>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )}

                {/* Courier info */}
                {(delivery.courier_name || delivery.courier_phone) && (
                  <div style={{ padding: '14px 16px', borderRadius: 10, border: '1px solid var(--border)', marginBottom: 16 }}>
                    <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text2)', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.07em' }}>Курьерийн мэдээлэл</div>
                    {delivery.courier_name && <div style={{ fontSize: 14, color: 'var(--text)', marginBottom: 6 }}>👤 {delivery.courier_name}</div>}
                    {delivery.courier_phone && (
                      <a href={`tel:${delivery.courier_phone}`} style={{ fontSize: 14, color: 'var(--orange)', textDecoration: 'none', fontWeight: 600 }}>
                        📞 {delivery.courier_phone}
                      </a>
                    )}
                  </div>
                )}

                {/* Details grid */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  {delivery.address && (
                    <div style={{ padding: '12px 14px', background: 'var(--surface2)', borderRadius: 10 }}>
                      <div style={{ fontSize: 11, color: 'var(--text2)', marginBottom: 4, textTransform: 'uppercase', fontWeight: 700, letterSpacing: '0.07em' }}>Хаяг</div>
                      <div style={{ fontSize: 13 }}>📍 {delivery.address}</div>
                    </div>
                  )}
                  {delivery.note && (
                    <div style={{ padding: '12px 14px', background: 'var(--surface2)', borderRadius: 10, gridColumn: '1/-1' }}>
                      <div style={{ fontSize: 11, color: 'var(--text2)', marginBottom: 4, textTransform: 'uppercase', fontWeight: 700, letterSpacing: '0.07em' }}>Тэмдэглэл</div>
                      <div style={{ fontSize: 13 }}>💬 {delivery.note}</div>
                    </div>
                  )}
                </div>

                <div style={{ fontSize: 11, color: 'var(--text3)', marginTop: 16, textAlign: 'right' }}>
                  Шинэчлэгдсэн: {new Date(delivery.updated_at).toLocaleString('mn-MN')}
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
