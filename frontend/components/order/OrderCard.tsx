'use client'
import StatusBadge from '../ui/StatusBadge'

interface Props {
  order: {
    id: string
    status: string
    total_price?: number
    created_at?: string
    quote_number?: string
    product_name?: string
    quantity?: number
  }
  onClick?: () => void
}

const fmt = (n: number) => new Intl.NumberFormat('mn-MN').format(Math.round(n)) + '₮'
const fmtDate = (d: string) => new Date(d).toLocaleDateString('mn-MN', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })

export default function OrderCard({ order, onClick }: Props) {
  return (
    <div
      onClick={onClick}
      style={{
        background: 'var(--surface, #fff)',
        border: '1px solid var(--border, #E5E7EB)',
        borderRadius: 14,
        padding: '16px 20px',
        cursor: onClick ? 'pointer' : 'default',
        transition: 'border-color 0.15s, box-shadow 0.15s',
      }}
      onMouseEnter={e => { if (onClick) { e.currentTarget.style.borderColor = '#FF6B00'; e.currentTarget.style.boxShadow = '0 2px 8px rgba(255,107,0,0.08)' } }}
      onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border, #E5E7EB)'; e.currentTarget.style.boxShadow = 'none' }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
        <div>
          <div style={{ fontSize: 15, fontWeight: 700, marginBottom: 4 }}>
            {order.product_name || order.quote_number || `#${order.id.slice(0, 8)}`}
          </div>
          {order.quantity && (
            <span style={{ fontSize: 12, color: 'var(--text2, #888)' }}>{order.quantity} ширхэг</span>
          )}
        </div>
        <StatusBadge status={order.status} variant="order" />
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        {order.total_price != null && (
          <span style={{ fontSize: 17, fontWeight: 800, color: '#FF6B00' }}>{fmt(order.total_price)}</span>
        )}
        {order.created_at && (
          <span style={{ fontSize: 12, color: 'var(--text2, #888)' }}>{fmtDate(order.created_at)}</span>
        )}
      </div>
    </div>
  )
}
