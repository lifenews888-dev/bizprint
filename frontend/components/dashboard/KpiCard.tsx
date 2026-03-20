'use client'

interface KpiItem {
  label: string
  value: string | number
  color: string  // orange, blue, green, purple
  icon?: string
  change?: string  // "+12%"
}

const COLOR_MAP: Record<string, { bg: string; text: string; border: string }> = {
  orange: { bg: 'rgba(255,106,0,0.08)', text: '#FF6A00', border: 'rgba(255,106,0,0.2)' },
  blue: { bg: 'rgba(59,130,246,0.08)', text: '#3B82F6', border: 'rgba(59,130,246,0.2)' },
  green: { bg: 'rgba(34,197,94,0.08)', text: '#22C55E', border: 'rgba(34,197,94,0.2)' },
  purple: { bg: 'rgba(139,92,246,0.08)', text: '#8B5CF6', border: 'rgba(139,92,246,0.2)' },
}

export default function KpiCard({ items }: { items: KpiItem[] }) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: `repeat(${Math.min(items.length, 4)}, 1fr)`, gap: 14, marginBottom: 24 }} className="grid-4 stack-mobile">
      {items.map(item => {
        const c = COLOR_MAP[item.color] || COLOR_MAP.orange
        return (
          <div key={item.label} style={{
            background: 'var(--surface)', border: `1px solid ${c.border}`, borderRadius: 14, padding: '20px 18px',
            display: 'flex', flexDirection: 'column', gap: 4,
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: 12, color: 'var(--text2)', fontWeight: 500 }}>{item.label}</span>
              {item.icon && <span style={{ fontSize: 18 }}>{item.icon}</span>}
            </div>
            <div style={{ fontSize: 28, fontWeight: 700, color: c.text, letterSpacing: '-1px' }}>
              {typeof item.value === 'number' ? item.value.toLocaleString() : item.value}
            </div>
            {item.change && (
              <span style={{ fontSize: 11, color: item.change.startsWith('+') ? '#22C55E' : item.change.startsWith('-') ? '#EF4444' : 'var(--text3)', fontWeight: 500 }}>
                {item.change}
              </span>
            )}
          </div>
        )
      })}
    </div>
  )
}
