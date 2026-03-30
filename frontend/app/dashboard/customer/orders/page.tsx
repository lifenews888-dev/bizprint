'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { apiFetch } from '@/lib/api'

const F = "'DM Sans','Segoe UI',system-ui,sans-serif"
const O = '#FF6B00'

const STATUS: Record<string, { label: string; color: string; bg: string }> = {
  draft: { label: 'Ноорог', color: '#6B7280', bg: '#F3F4F6' },
  quotation_sent: { label: 'Үнийн санал', color: '#8B5CF6', bg: '#EDE9FE' },
  confirmed: { label: 'Баталгаажсан', color: '#2563EB', bg: '#DBEAFE' },
  pending_file: { label: 'Файл хүлээж буй', color: '#D97706', bg: '#FEF3C7' },
  file_review: { label: 'Файл шалгаж буй', color: '#D97706', bg: '#FEF3C7' },
  file_rejected: { label: 'Файл буцаагдсан', color: '#DC2626', bg: '#FEE2E2' },
  on_hold: { label: 'Түр зогссон', color: '#6B7280', bg: '#F3F4F6' },
  in_production: { label: 'Үйлдвэрлэлд', color: '#DB2777', bg: '#FCE7F3' },
  finishing: { label: 'Боловсруулалт', color: '#DB2777', bg: '#FCE7F3' },
  partially_dispatched: { label: 'Хэсэгчлэн илгээсэн', color: '#059669', bg: '#D1FAE5' },
  dispatched: { label: 'Илгээгдсэн', color: '#059669', bg: '#D1FAE5' },
  delivered: { label: 'Хүргэгдсэн', color: '#047857', bg: '#D1FAE5' },
  completed: { label: 'Дууссан', color: '#047857', bg: '#D1FAE5' },
  cancelled: { label: 'Цуцлагдсан', color: '#DC2626', bg: '#FEE2E2' },
}

// Simplified workflow stages for stepper
const STEPPER_STAGES = [
  { key: 'order', label: 'Захиалга', statuses: ['draft', 'quotation_sent', 'confirmed'] },
  { key: 'file', label: 'Файл', statuses: ['pending_file', 'file_review'] },
  { key: 'production', label: 'Үйлдвэрлэл', statuses: ['in_production'] },
  { key: 'finishing', label: 'Боловсруулалт', statuses: ['finishing'] },
  { key: 'delivery', label: 'Хүргэлт', statuses: ['dispatched', 'partially_dispatched'] },
  { key: 'done', label: 'Дууссан', statuses: ['delivered', 'completed'] },
]

type Tab = 'all' | 'active' | 'completed' | 'cancelled'

export default function OrdersPage() {
  const router = useRouter()
  const [orders, setOrders] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState<Tab>('all')
  const [expanded, setExpanded] = useState<string | null>(null)

  useEffect(() => {
    apiFetch<any>('/orders/my')
      .then(d => setOrders(Array.isArray(d) ? d : []))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  const activeStatuses = ['draft','quotation_sent','confirmed','pending_file','file_review','file_rejected','on_hold','in_production','finishing','partially_dispatched','dispatched']

  const filtered = orders.filter(o => {
    if (tab === 'active') return activeStatuses.includes(o.status)
    if (tab === 'completed') return o.status === 'completed' || o.status === 'delivered'
    if (tab === 'cancelled') return o.status === 'cancelled'
    return true
  })

  const counts = {
    all: orders.length,
    active: orders.filter(o => activeStatuses.includes(o.status)).length,
    completed: orders.filter(o => o.status === 'completed' || o.status === 'delivered').length,
    cancelled: orders.filter(o => o.status === 'cancelled').length,
  }

  if (loading) return (
    <div style={{ padding: 40, textAlign: 'center', fontFamily: F, color: 'var(--text3)' }}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {[1,2,3].map(i => <div key={i} style={{ height: 100, background: 'var(--surface)', borderRadius: 14, animation: 'pulse 1.5s infinite' }} />)}
      </div>
      <style>{`@keyframes pulse{0%,100%{opacity:1}50%{opacity:0.5}}`}</style>
    </div>
  )

  return (
    <div style={{ padding: '24px 28px', fontFamily: F, maxWidth: 960, margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 700, margin: '0 0 4px' }}>Захиалгууд</h1>
          <p style={{ color: 'var(--text3)', fontSize: 14, margin: 0 }}>Таны хэвлэлийн захиалгууд</p>
        </div>
        <button onClick={() => router.push('/dashboard/customer/new-order')} style={{
          background: O, color: '#fff', border: 'none', borderRadius: 10,
          padding: '10px 20px', fontSize: 13, fontWeight: 700, cursor: 'pointer',
          display: 'flex', alignItems: 'center', gap: 6,
        }}>
          + Шинэ захиалга
        </button>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 4, marginBottom: 20, borderBottom: '1px solid var(--border)' }}>
        {([
          { key: 'all', label: 'Бүгд' },
          { key: 'active', label: 'Идэвхтэй' },
          { key: 'completed', label: 'Дууссан' },
          { key: 'cancelled', label: 'Цуцлагдсан' },
        ] as { key: Tab; label: string }[]).map(t => (
          <button key={t.key} onClick={() => setTab(t.key)} style={{
            background: 'none', border: 'none', padding: '10px 16px',
            fontSize: 13, fontWeight: 600, cursor: 'pointer',
            color: tab === t.key ? O : 'var(--text3)',
            borderBottom: tab === t.key ? `2px solid ${O}` : '2px solid transparent',
            marginBottom: -1,
          }}>
            {t.label} <span style={{ fontSize: 11, opacity: 0.7 }}>({counts[t.key]})</span>
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div style={{ background: 'var(--surface)', borderRadius: 16, padding: 48, textAlign: 'center', border: '1px solid var(--border)' }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>📦</div>
          <div style={{ fontSize: 18, fontWeight: 600 }}>Захиалга байхгүй</div>
          <p style={{ color: 'var(--text3)', fontSize: 14, marginTop: 8 }}>Эхний захиалгаа өгөөрэй</p>
          <button onClick={() => router.push('/dashboard/customer/new-order')} style={{
            marginTop: 16, background: O, color: '#fff', border: 'none', borderRadius: 10,
            padding: '10px 24px', fontSize: 14, fontWeight: 600, cursor: 'pointer',
          }}>
            Захиалга өгөх
          </button>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {filtered.map(o => {
            const s = STATUS[o.status] || STATUS.draft
            const isExpanded = expanded === o.id
            return (
              <div key={o.id} style={{ background: 'var(--surface)', borderRadius: 14, border: '1px solid var(--border)', overflow: 'hidden', transition: 'box-shadow 0.15s' }}>
                {/* Order header */}
                <div onClick={() => setExpanded(isExpanded ? null : o.id)} style={{ padding: '18px 22px', cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
                      <span style={{ fontSize: 15, fontWeight: 600 }}>{o.product_name || 'Захиалга'}</span>
                      <span style={{ padding: '2px 10px', borderRadius: 20, background: s.bg, color: s.color, fontSize: 11, fontWeight: 600 }}>{s.label}</span>
                    </div>
                    <div style={{ fontSize: 12, color: 'var(--text3)' }}>
                      #{o.id?.slice(0, 8)} · {o.quantity}ш · {new Date(o.created_at).toLocaleDateString('mn-MN')}
                    </div>
                  </div>
                  <div style={{ textAlign: 'right', display: 'flex', alignItems: 'center', gap: 16 }}>
                    <div style={{ fontSize: 17, fontWeight: 700 }}>₮{Number(o.total_price || 0).toLocaleString()}</div>
                    <span style={{ fontSize: 16, color: 'var(--text3)', transition: 'transform 0.2s', transform: isExpanded ? 'rotate(180deg)' : 'none' }}>▾</span>
                  </div>
                </div>

                {/* Expanded: Timeline stepper */}
                {isExpanded && o.status !== 'cancelled' && (
                  <div style={{ padding: '0 22px 20px', borderTop: '1px solid var(--border)' }}>
                    <div style={{ padding: '18px 0 10px' }}>
                      <OrderStepper status={o.status} />
                    </div>
                    {/* Actions */}
                    <div style={{ display: 'flex', gap: 8, marginTop: 10 }}>
                      {o.status === 'pending_file' && (
                        <ActionButton label="📁 Файл оруулах" color="#D97706" onClick={() => {}} />
                      )}
                      <ActionButton label="💬 Чат" color="#3B82F6" onClick={() => router.push('/dashboard/customer/chat')} />
                      {(o.status === 'delivered' || o.status === 'completed') && (
                        <ActionButton label="⭐ Үнэлгээ" color="#F59E0B" onClick={() => {}} />
                      )}
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}

      <style>{`@keyframes pulse{0%,100%{opacity:1}50%{opacity:0.5}}`}</style>
    </div>
  )
}

function OrderStepper({ status }: { status: string }) {
  // Find which stage this order is at
  let activeStageIndex = -1
  for (let i = 0; i < STEPPER_STAGES.length; i++) {
    if (STEPPER_STAGES[i].statuses.includes(status)) {
      activeStageIndex = i
      break
    }
  }

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 0 }}>
      {STEPPER_STAGES.map((stage, i) => {
        const isPast = i < activeStageIndex
        const isActive = i === activeStageIndex
        const color = isPast ? '#10B981' : isActive ? O : 'var(--border)'
        const textColor = isPast ? '#10B981' : isActive ? O : 'var(--text3)'

        return (
          <div key={stage.key} style={{ display: 'flex', alignItems: 'center', flex: i < STEPPER_STAGES.length - 1 ? 1 : 'none' }}>
            {/* Circle */}
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, minWidth: 50 }}>
              <div style={{
                width: isActive ? 28 : 22, height: isActive ? 28 : 22,
                borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
                background: isPast || isActive ? color : 'transparent',
                border: `2px solid ${color}`,
                color: isPast || isActive ? '#fff' : 'var(--text3)',
                fontSize: isActive ? 13 : 11, fontWeight: 700,
                transition: 'all 0.3s',
              }}>
                {isPast ? '✓' : i + 1}
              </div>
              <span style={{ fontSize: 10, fontWeight: isActive ? 700 : 500, color: textColor, whiteSpace: 'nowrap' }}>{stage.label}</span>
            </div>
            {/* Line */}
            {i < STEPPER_STAGES.length - 1 && (
              <div style={{ flex: 1, height: 2, background: isPast ? '#10B981' : 'var(--border)', margin: '0 4px', marginBottom: 18, transition: 'background 0.3s' }} />
            )}
          </div>
        )
      })}
    </div>
  )
}

function ActionButton({ label, color, onClick }: { label: string; color: string; onClick: () => void }) {
  return (
    <button onClick={(e) => { e.stopPropagation(); onClick() }} style={{
      background: `${color}15`, color, border: `1px solid ${color}30`,
      borderRadius: 8, padding: '6px 14px', fontSize: 12, fontWeight: 600,
      cursor: 'pointer', transition: 'all 0.15s',
    }}>
      {label}
    </button>
  )
}
