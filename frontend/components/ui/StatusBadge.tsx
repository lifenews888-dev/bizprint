'use client'

const ORDER_COLORS: Record<string, { bg: string; text: string; label: string }> = {
  draft:                { bg: '#F3F4F6', text: '#6B7280', label: 'Ноорог' },
  quotation_sent:       { bg: '#EFF6FF', text: '#3B82F6', label: 'Үнийн санал илгээсэн' },
  confirmed:            { bg: '#ECFDF5', text: '#059669', label: 'Баталгаажсан' },
  pending_file:         { bg: '#FFF7ED', text: '#EA580C', label: 'Файл хүлээж байна' },
  file_review:          { bg: '#EFF6FF', text: '#2563EB', label: 'Файл шалгаж байна' },
  file_rejected:        { bg: '#FEF2F2', text: '#DC2626', label: 'Файл буцаагдсан' },
  on_hold:              { bg: '#FEF9C3', text: '#CA8A04', label: 'Түр зогсоосон' },
  in_production:        { bg: '#DBEAFE', text: '#1D4ED8', label: 'Үйлдвэрлэлд' },
  finishing:            { bg: '#E0E7FF', text: '#4338CA', label: 'Боловсруулалт' },
  partially_dispatched: { bg: '#FEF3C7', text: '#D97706', label: 'Хэсэгчлэн илгээсэн' },
  dispatched:           { bg: '#D1FAE5', text: '#047857', label: 'Илгээгдсэн' },
  delivered:            { bg: '#ECFDF5', text: '#065F46', label: 'Хүргэгдсэн' },
  completed:            { bg: '#F0FDF4', text: '#15803D', label: 'Дууссан' },
  cancelled:            { bg: '#FEF2F2', text: '#991B1B', label: 'Цуцлагдсан' },
}

const CART_COLORS: Record<string, { bg: string; text: string; label: string }> = {
  active:    { bg: '#ECFDF5', text: '#059669', label: 'Идэвхтэй' },
  merged:    { bg: '#EFF6FF', text: '#3B82F6', label: 'Нэгтгэгдсэн' },
  converted: { bg: '#F0FDF4', text: '#15803D', label: 'Захиалга болсон' },
  expired:   { bg: '#F3F4F6', text: '#6B7280', label: 'Хугацаа дууссан' },
  abandoned: { bg: '#FEF2F2', text: '#991B1B', label: 'Орхигдсон' },
}

const PAYMENT_COLORS: Record<string, { bg: string; text: string; label: string }> = {
  pending:  { bg: '#FFF7ED', text: '#EA580C', label: 'Хүлээгдэж байна' },
  paid:     { bg: '#ECFDF5', text: '#059669', label: 'Төлөгдсөн' },
  failed:   { bg: '#FEF2F2', text: '#DC2626', label: 'Амжилтгүй' },
  refunded: { bg: '#F3F4F6', text: '#6B7280', label: 'Буцаагдсан' },
}

interface Props {
  status: string
  variant?: 'order' | 'cart' | 'payment'
}

export default function StatusBadge({ status, variant = 'order' }: Props) {
  const colorMap = variant === 'cart' ? CART_COLORS : variant === 'payment' ? PAYMENT_COLORS : ORDER_COLORS
  const c = colorMap[status] || { bg: '#F3F4F6', text: '#6B7280', label: status }

  return (
    <span style={{
      display: 'inline-block',
      padding: '3px 10px',
      borderRadius: 999,
      fontSize: 12,
      fontWeight: 600,
      background: c.bg,
      color: c.text,
      whiteSpace: 'nowrap',
    }}>
      {c.label}
    </span>
  )
}

export { ORDER_COLORS }
