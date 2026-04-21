'use client'
import { useState, useEffect } from 'react'

const FONT = "'DM Sans','Segoe UI',system-ui,sans-serif"
const ORANGE = '#FF6B00'

const ENTITY_LABELS: Record<string, string> = {
  digital_card: 'Дижитал карт', invitation: 'Урилга', product_qr: 'Бүтээгдэхүүн QR', quote: 'Үнийн санал',
}
const EVENT_LABELS: Record<string, string> = {
  view: 'Үзсэн', scan: 'Скан', save: 'Хадгалсан', share: 'Хуваалцсан', rsvp: 'RSVP', reorder: 'Дахин захиалга', click: 'Дарсан',
}

export default function AnalyticsDashboard() {
  const [stats, setStats] = useState<any>(null)
  const [days, setDays] = useState(30)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setLoading(true)
    const token = localStorage.getItem('access_token') || localStorage.getItem('token')
    if (!token) { setLoading(false); return }
    fetch(`${process.env.NEXT_PUBLIC_API_URL || 'https://bizprint-production.up.railway.app'}/analytics/my?days=${days}`, { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.ok ? r.json() : null)
      .then(d => setStats(d))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [days])

  if (loading) return <div style={{ padding: 40, textAlign: 'center', fontFamily: FONT, color: '#9CA3AF' }}>Ачааллаж байна...</div>

  // Process events into summary
  const eventSummary: Record<string, Record<string, number>> = {}
  let totalEvents = 0
  stats?.events?.forEach((e: any) => {
    if (!eventSummary[e.entity_type]) eventSummary[e.entity_type] = {}
    eventSummary[e.entity_type][e.event_type] = Number(e.count)
    totalEvents += Number(e.count)
  })

  // Max daily for chart
  const maxDaily = Math.max(1, ...(stats?.daily?.map((d: any) => Number(d.count)) || [1]))

  return (
    <div style={{ padding: 24, fontFamily: FONT, maxWidth: 900, margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 700, margin: 0 }}>Аналитик</h1>
          <p style={{ color: '#6B7280', fontSize: 14, margin: '4px 0 0' }}>QR код, дижитал карт, урилгын статистик</p>
        </div>
        <select value={days} onChange={e => setDays(Number(e.target.value))} style={{ padding: '8px 16px', borderRadius: 10, border: '1px solid var(--border, #E5E7EB)', fontSize: 14, background: 'var(--bg, #fff)', color: 'var(--text, #000)' }}>
          <option value={7}>7 хоног</option>
          <option value={30}>30 хоног</option>
          <option value={90}>90 хоног</option>
        </select>
      </div>

      {/* KPI cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 24 }}>
        <KpiCard label="Нийт үйл явдал" value={totalEvents} color={ORANGE} />
        <KpiCard label="Дижитал карт" value={sumEntity(eventSummary, 'digital_card')} color="#8B5CF6" />
        <KpiCard label="Урилга" value={sumEntity(eventSummary, 'invitation')} color="#10B981" />
        <KpiCard label="Бүтээгдэхүүн QR" value={sumEntity(eventSummary, 'product_qr')} color="#F59E0B" />
      </div>

      {/* Simple bar chart */}
      {stats?.daily?.length > 0 && (
        <div style={{ background: 'var(--surface, #fff)', borderRadius: 16, padding: 24, border: '1px solid var(--border, #E5E7EB)', marginBottom: 24 }}>
          <h3 style={{ fontSize: 16, fontWeight: 600, margin: '0 0 16px' }}>Өдрийн график</h3>
          <div style={{ display: 'flex', alignItems: 'flex-end', gap: 2, height: 120 }}>
            {stats.daily.map((d: any, i: number) => (
              <div key={i} title={`${d.date}: ${d.count}`} style={{
                flex: 1, background: ORANGE, borderRadius: '4px 4px 0 0', minHeight: 4, opacity: 0.8,
                height: `${(Number(d.count) / maxDaily) * 100}%`,
              }} />
            ))}
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 8, fontSize: 11, color: '#9CA3AF' }}>
            <span>{stats.daily[0]?.date}</span>
            <span>{stats.daily[stats.daily.length - 1]?.date}</span>
          </div>
        </div>
      )}

      {/* Breakdown by entity */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        {Object.entries(eventSummary).map(([entityType, events]) => (
          <div key={entityType} style={{ background: 'var(--surface, #fff)', borderRadius: 16, padding: 20, border: '1px solid var(--border, #E5E7EB)' }}>
            <h3 style={{ fontSize: 15, fontWeight: 600, margin: '0 0 12px' }}>{ENTITY_LABELS[entityType] || entityType}</h3>
            {Object.entries(events).map(([eventType, count]) => (
              <div key={eventType} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid var(--border, #F3F4F6)', fontSize: 14 }}>
                <span style={{ color: '#6B7280' }}>{EVENT_LABELS[eventType] || eventType}</span>
                <span style={{ fontWeight: 600, color: 'var(--text, #111)' }}>{count}</span>
              </div>
            ))}
          </div>
        ))}
      </div>

      {!stats?.events?.length && (
        <div style={{ background: 'var(--surface, #fff)', borderRadius: 16, padding: 48, textAlign: 'center', border: '1px solid var(--border, #E5E7EB)' }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>&#x1F4CA;</div>
          <div style={{ fontSize: 18, fontWeight: 600, color: 'var(--text, #374151)' }}>Мэдээлэл байхгүй</div>
          <p style={{ color: '#9CA3AF', fontSize: 14, marginTop: 8 }}>QR код, дижитал карт, урилга үүсгэж ашиглаж эхлээрэй</p>
        </div>
      )}
    </div>
  )
}

function KpiCard({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div style={{ background: 'var(--surface, #fff)', borderRadius: 14, padding: 20, border: '1px solid var(--border, #E5E7EB)', textAlign: 'center' }}>
      <div style={{ fontSize: 28, fontWeight: 700, color }}>{value.toLocaleString()}</div>
      <div style={{ fontSize: 13, color: '#6B7280', marginTop: 4 }}>{label}</div>
    </div>
  )
}

function sumEntity(summary: Record<string, Record<string, number>>, entity: string): number {
  if (!summary[entity]) return 0
  return Object.values(summary[entity]).reduce((s, v) => s + v, 0)
}
