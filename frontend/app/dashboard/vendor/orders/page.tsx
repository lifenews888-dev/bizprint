'use client'

import { apiFetch } from '@/lib/api'
import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import DashboardLayout from '@/components/layouts/DashboardLayout'
import { useRoleGuard } from '@/lib/use-role-guard'
import { VENDOR_MENU } from '@/config/sidebar-config'
import { useOrderEvents } from '@/hooks/useOrderEvents'

/* ═══════════════════════════════════════════════
 *  VENDOR ORDER PRODUCTION DASHBOARD
 *  Shows real orders assigned to this vendor and lets them advance the
 *  production lifecycle: PENDING_FILE → FILE_REVIEW → IN_PRODUCTION
 *  → FINISHING → DISPATCHED.
 *  Status terminology mirrors the FROZEN OrderStatus enum from backend.
 * ═══════════════════════════════════════════════ */

const STATUS_CFG: Record<string, { label: string; color: string }> = {
  DRAFT:                { label: 'Ноорог', color: '#94A3B8' },
  QUOTATION_SENT:       { label: 'Үнийн санал илгээсэн', color: '#0EA5E9' },
  CONFIRMED:            { label: 'Баталсан', color: '#3B82F6' },
  PENDING_FILE:         { label: 'Файл хүлээж байна', color: '#F59E0B' },
  FILE_REVIEW:          { label: 'Файл шалгалт', color: '#06B6D4' },
  FILE_REJECTED:        { label: 'Файл буцаасан', color: '#EF4444' },
  ON_HOLD:              { label: 'Зогссон', color: '#94A3B8' },
  IN_PRODUCTION:        { label: 'Үйлдвэрлэлд', color: '#8B5CF6' },
  FINISHING:            { label: 'Боловсруулалт', color: '#6366F1' },
  PARTIALLY_DISPATCHED: { label: 'Хэсэгчлэн илгээсэн', color: '#0EA5E9' },
  DISPATCHED:           { label: 'Илгээсэн', color: '#10B981' },
  DELIVERED:            { label: 'Хүргэсэн', color: '#059669' },
  COMPLETED:            { label: 'Дууссан', color: '#10B981' },
  CANCELLED:            { label: 'Цуцалсан', color: '#94A3B8' },
}

// Transitions a vendor is allowed to perform on their assigned orders.
// Server enforces the same matrix; this list is just for surfacing UI buttons.
const NEXT_STAGES: Record<string, Array<{ to: string; label: string }>> = {
  CONFIRMED:     [{ to: 'IN_PRODUCTION', label: '🏭 Үйлдвэрлэл эхлүүлэх' }],
  FILE_REVIEW:   [
    { to: 'CONFIRMED',     label: '✅ Файл хүлээн зөвшөөрөх' },
    { to: 'FILE_REJECTED', label: '❌ Файл буцаах' },
  ],
  IN_PRODUCTION: [{ to: 'FINISHING',  label: '🎨 Боловсруулалтад оруулах' }],
  FINISHING:     [{ to: 'DISPATCHED', label: '🚚 Илгээсэн гэж тэмдэглэх' }],
  PARTIALLY_DISPATCHED: [{ to: 'DISPATCHED', label: '🚚 Бүгд илгээсэн' }],
}

interface VendorOrder {
  id: string
  status: string
  payment_status?: string
  product_name?: string
  quantity?: number
  total_price?: number
  customer_name?: string
  customer_phone?: string
  deadline?: string
  file_url?: string
  created_at: string
}

export default function VendorOrdersPage() {
  const router = useRouter()
  const { user, loading: authLoading } = useRoleGuard(['vendor', 'admin'])
  const [orders, setOrders] = useState<VendorOrder[]>([])
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState<string>('active')
  const [busy, setBusy] = useState<string | null>(null)
  const [error, setError] = useState('')

  const load = useCallback(async () => {
    try {
      const data = await apiFetch<any>('/orders/vendor/me')
      setOrders(Array.isArray(data) ? data : [])
    } catch (e: any) {
      setError(e?.message || 'Захиалгыг ачаалж чадсангүй')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    if (authLoading) return
    if (!user) { router.push('/login'); return }
    load()
  }, [authLoading, user, load])

  // Live updates: refresh when a new order is paid/assigned to this vendor
  // or when the customer cancels mid-flight.
  useOrderEvents({
    rooms: user?.id ? [`user:${user.id}`, `vendor:${user.id}`] : [],
    onChange: load,
    enabled: !!user?.id,
  })

  const advance = async (orderId: string, toStatus: string) => {
    if (busy) return
    setBusy(orderId); setError('')
    try {
      await apiFetch(`/orders/${orderId}/status`, {
        method: 'PATCH',
        body: { status: toStatus },
      })
      await load()
    } catch (e: any) {
      setError(e?.message || 'Статус солих үед алдаа гарлаа')
    } finally {
      setBusy(null)
    }
  }

  const isActive = (s: string) => !['COMPLETED', 'CANCELLED', 'DELIVERED'].includes(s)
  const filtered = orders.filter(o =>
    tab === 'active' ? isActive(o.status) :
    tab === 'finished' ? !isActive(o.status) :
    tab === 'all' ? true :
    o.status === tab
  )

  const counts = {
    active: orders.filter(o => isActive(o.status)).length,
    finished: orders.filter(o => !isActive(o.status)).length,
    all: orders.length,
  }

  if (authLoading) return <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text2)' }}>Ачаалж байна...</div>

  return (
    <DashboardLayout navGroups={VENDOR_MENU} user={user || undefined}>
      <div style={{ marginBottom: 20 }}>
        <h1 style={{ fontSize: 22, fontWeight: 700, margin: 0 }}>Захиалгын урсгал</h1>
        <p style={{ color: 'var(--text2)', fontSize: 13, margin: '4px 0 0' }}>Танд оноогдсон захиалгууд — файл шалгалт, үйлдвэрлэл, илгээлт</p>
      </div>

      {error && (
        <div style={{ padding: 12, background: 'rgba(239,68,68,0.1)', border: '1px solid #EF4444', borderRadius: 8, color: '#EF4444', fontSize: 13, marginBottom: 16 }}>
          {error}
        </div>
      )}

      <div style={{ display: 'flex', gap: 4, marginBottom: 16, borderBottom: '1px solid var(--border)' }}>
        {[
          { key: 'active', label: `Идэвхтэй (${counts.active})` },
          { key: 'finished', label: `Дууссан (${counts.finished})` },
          { key: 'all', label: `Бүгд (${counts.all})` },
        ].map(t => (
          <button key={t.key} onClick={() => setTab(t.key)} style={{
            padding: '10px 18px', border: 'none', background: 'transparent', cursor: 'pointer',
            color: tab === t.key ? '#FF6B00' : 'var(--text2)',
            borderBottom: `2px solid ${tab === t.key ? '#FF6B00' : 'transparent'}`,
            fontSize: 13, fontWeight: 600, marginBottom: -1,
          }}>{t.label}</button>
        ))}
      </div>

      {loading ? (
        <div style={{ padding: 40, textAlign: 'center', color: 'var(--text2)' }}>Уншиж байна...</div>
      ) : filtered.length === 0 ? (
        <div style={{ padding: 60, textAlign: 'center', border: '1px dashed var(--border)', borderRadius: 12, color: 'var(--text2)' }}>
          <div style={{ fontSize: 32, marginBottom: 8 }}>📦</div>
          <div style={{ fontWeight: 600 }}>Захиалга байхгүй</div>
          <div style={{ fontSize: 13, marginTop: 4 }}>Танд оноогдсон шинэ захиалга энд харагдана</div>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {filtered.map(o => {
            const cfg = STATUS_CFG[o.status] || { label: o.status, color: '#888' }
            const transitions = NEXT_STAGES[o.status] || []
            return (
              <div key={o.id} style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 12, padding: 18 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 12 }}>
                  <div style={{ flex: 1, minWidth: 240 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6, flexWrap: 'wrap' }}>
                      <span style={{ fontSize: 12, color: 'var(--text3)', fontWeight: 600 }}>#{o.id.slice(0, 8).toUpperCase()}</span>
                      <span style={{ fontSize: 11, padding: '3px 10px', borderRadius: 99, background: cfg.color + '22', color: cfg.color, fontWeight: 600 }}>{cfg.label}</span>
                      {o.payment_status === 'paid' && (
                        <span style={{ fontSize: 10, padding: '2px 8px', borderRadius: 99, background: 'rgba(16,185,129,0.15)', color: '#10B981', fontWeight: 600 }}>💰 Төлсөн</span>
                      )}
                    </div>
                    <div style={{ fontSize: 15, fontWeight: 600, marginBottom: 4 }}>{o.product_name || 'Бүтээгдэхүүн'}</div>
                    <div style={{ fontSize: 12, color: 'var(--text2)' }}>
                      {o.customer_name && <span>{o.customer_name} · </span>}
                      {o.quantity && <span>{o.quantity} ширхэг · </span>}
                      {o.total_price != null && <span style={{ color: '#FF6B00', fontWeight: 600 }}>₮{Number(o.total_price).toLocaleString()}</span>}
                    </div>
                    <div style={{ fontSize: 11, color: 'var(--text3)', marginTop: 6, display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                      <span>{new Date(o.created_at).toLocaleString('mn-MN')}</span>
                      {o.deadline && <span>⏱ Дуусах: {new Date(o.deadline).toLocaleDateString('mn-MN')}</span>}
                      {o.file_url && (
                        <a href={o.file_url} target="_blank" rel="noreferrer" style={{ color: '#3B82F6', textDecoration: 'none' }}>📎 Файл татах</a>
                      )}
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', justifyContent: 'flex-end' }}>
                    {transitions.length === 0 && (
                      <span style={{ fontSize: 11, color: 'var(--text3)', alignSelf: 'center' }}>Ажиллагаа байхгүй</span>
                    )}
                    {transitions.map(t => {
                      const isReject = t.to === 'FILE_REJECTED'
                      return (
                        <button
                          key={t.to}
                          onClick={() => advance(o.id, t.to)}
                          disabled={busy === o.id}
                          style={{
                            padding: '8px 14px',
                            background: isReject ? 'transparent' : '#FF6B00',
                            color: isReject ? '#EF4444' : '#fff',
                            border: isReject ? '1px solid #EF4444' : 'none',
                            borderRadius: 8,
                            fontSize: 12,
                            fontWeight: 600,
                            cursor: busy === o.id ? 'wait' : 'pointer',
                          }}>
                          {busy === o.id ? '...' : t.label}
                        </button>
                      )
                    })}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </DashboardLayout>
  )
}
