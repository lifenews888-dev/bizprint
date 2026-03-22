'use client'
import { ORDER_COLORS } from '../ui/StatusBadge'

const STEPS = [
  { key: 'draft',                label: 'Ноорог' },
  { key: 'quotation_sent',      label: 'Үнийн санал' },
  { key: 'confirmed',           label: 'Баталгаажсан' },
  { key: 'pending_file',        label: 'Файл хүлээгдэж' },
  { key: 'file_review',         label: 'Файл шалгалт' },
  { key: 'in_production',       label: 'Үйлдвэрлэл' },
  { key: 'finishing',           label: 'Боловсруулалт' },
  { key: 'dispatched',          label: 'Илгээгдсэн' },
  { key: 'delivered',           label: 'Хүргэгдсэн' },
  { key: 'completed',           label: 'Дууссан' },
]

const TERMINAL = ['cancelled', 'file_rejected', 'on_hold']

interface Props {
  currentStatus: string
}

export default function OrderStepper({ currentStatus }: Props) {
  if (TERMINAL.includes(currentStatus)) {
    const c = ORDER_COLORS[currentStatus] || ORDER_COLORS.cancelled
    return (
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '12px 16px', background: c.bg, borderRadius: 12 }}>
        <span style={{ fontSize: 18 }}>{currentStatus === 'cancelled' ? '✕' : currentStatus === 'on_hold' ? '⏸' : '↩'}</span>
        <span style={{ fontWeight: 600, color: c.text, fontSize: 14 }}>{c.label}</span>
      </div>
    )
  }

  const currentIdx = STEPS.findIndex(s => s.key === currentStatus)

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 0, overflowX: 'auto', padding: '8px 0' }}>
      {STEPS.map((step, i) => {
        const isDone = i < currentIdx
        const isActive = i === currentIdx
        const isFuture = i > currentIdx

        return (
          <div key={step.key} style={{ display: 'flex', alignItems: 'center', flexShrink: 0 }}>
            {/* Circle */}
            <div style={{
              width: 28, height: 28, borderRadius: '50%',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 12, fontWeight: 700,
              background: isDone ? '#FF6B00' : isActive ? '#FF6B00' : '#E5E7EB',
              color: isDone || isActive ? '#fff' : '#9CA3AF',
              border: isActive ? '3px solid #FFCCA8' : 'none',
              transition: 'all 0.2s',
            }}>
              {isDone ? '✓' : i + 1}
            </div>
            {/* Label */}
            <span style={{
              fontSize: 11, fontWeight: isActive ? 700 : 500,
              color: isDone ? '#FF6B00' : isActive ? '#111' : '#9CA3AF',
              marginLeft: 4, marginRight: 8, whiteSpace: 'nowrap',
            }}>
              {step.label}
            </span>
            {/* Connector */}
            {i < STEPS.length - 1 && (
              <div style={{
                width: 20, height: 2,
                background: isDone ? '#FF6B00' : '#E5E7EB',
                marginRight: 4, flexShrink: 0,
              }} />
            )}
          </div>
        )
      })}
    </div>
  )
}
