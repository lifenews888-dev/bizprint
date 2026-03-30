'use client'
import { useState, useEffect } from 'react'
import { apiFetch } from '@/lib/api'

const FONT = "'DM Sans','Segoe UI',system-ui,sans-serif"
const ORANGE = '#FF6B00'

const ENTITY_LABELS: Record<string, string> = {
  digital_card: 'Дижитал карт', invitation: 'Урилга', product_qr: 'Бүтээгдэхүүн QR', quote: 'Үнийн санал',
}

export default function AdminAnalytics() {
  const [stats, setStats] = useState<any>(null)
  const [days, setDays] = useState(30)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setLoading(true)
    apiFetch(`/analytics/platform?days=${days}`).then(setStats).catch(() => {}).finally(() => setLoading(false))
  }, [days])

  if (loading) return <div style={{ padding: 40, textAlign: 'center', fontFamily: FONT, color: '#9CA3AF' }}>Ачааллаж байна...</div>

  const maxDaily = Math.max(1, ...(stats?.dailyTotals?.map((d: any) => Number(d.count)) || [1]))

  return (
    <div style={{ padding: 24, fontFamily: FONT }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <h1 style={{ fontSize: 22, fontWeight: 700, margin: 0 }}>Платформ аналитик</h1>
        <select value={days} onChange={e => setDays(Number(e.target.value))} style={{ padding: '8px 16px', borderRadius: 10, border: '1px solid var(--border, #E5E7EB)', fontSize: 14, background: 'var(--bg, #fff)', color: 'var(--text, #000)' }}>
          <option value={7}>7 хоног</option>
          <option value={30}>30 хоног</option>
          <option value={90}>90 хоног</option>
        </select>
      </div>

      {/* Overview by entity type */}
      {stats?.overview && (
        <div style={{ display: 'grid', gridTemplateColumns: `repeat(${Math.min(stats.overview.length || 1, 4)}, 1fr)`, gap: 12, marginBottom: 24 }}>
          {stats.overview.map((o: any) => (
            <div key={o.entity_type} style={{ background: 'var(--surface, #fff)', borderRadius: 14, padding: 20, border: '1px solid var(--border, #E5E7EB)', textAlign: 'center' }}>
              <div style={{ fontSize: 28, fontWeight: 700, color: ORANGE }}>{Number(o.total_events).toLocaleString()}</div>
              <div style={{ fontSize: 13, color: '#6B7280', marginTop: 4 }}>{ENTITY_LABELS[o.entity_type] || o.entity_type}</div>
              <div style={{ fontSize: 12, color: '#9CA3AF', marginTop: 2 }}>{o.unique_entities} entities</div>
            </div>
          ))}
        </div>
      )}

      {/* Daily chart */}
      {stats?.dailyTotals?.length > 0 && (
        <div style={{ background: 'var(--surface, #fff)', borderRadius: 16, padding: 24, border: '1px solid var(--border, #E5E7EB)', marginBottom: 24 }}>
          <h3 style={{ fontSize: 16, fontWeight: 600, margin: '0 0 16px' }}>Өдрийн идэвхжил</h3>
          <div style={{ display: 'flex', alignItems: 'flex-end', gap: 2, height: 150 }}>
            {stats.dailyTotals.map((d: any, i: number) => (
              <div key={i} title={`${d.date}: ${d.count}`} style={{
                flex: 1, background: ORANGE, borderRadius: '4px 4px 0 0', minHeight: 4, opacity: 0.8,
                height: `${(Number(d.count) / maxDaily) * 100}%`,
              }} />
            ))}
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 8, fontSize: 11, color: '#9CA3AF' }}>
            <span>{stats.dailyTotals[0]?.date}</span>
            <span>{stats.dailyTotals[stats.dailyTotals.length - 1]?.date}</span>
          </div>
        </div>
      )}

      {/* Device breakdown + Top entities */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        {stats?.deviceBreakdown?.length > 0 && (
          <div style={{ background: 'var(--surface, #fff)', borderRadius: 16, padding: 20, border: '1px solid var(--border, #E5E7EB)' }}>
            <h3 style={{ fontSize: 15, fontWeight: 600, margin: '0 0 12px' }}>Төхөөрөмж</h3>
            {stats.deviceBreakdown.map((d: any) => (
              <div key={d.device} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid var(--border, #F3F4F6)', fontSize: 14 }}>
                <span style={{ color: '#6B7280' }}>{d.device || 'unknown'}</span>
                <span style={{ fontWeight: 600, color: 'var(--text, #111)' }}>{d.count}</span>
              </div>
            ))}
          </div>
        )}

        {stats?.topEntities?.length > 0 && (
          <div style={{ background: 'var(--surface, #fff)', borderRadius: 16, padding: 20, border: '1px solid var(--border, #E5E7EB)' }}>
            <h3 style={{ fontSize: 15, fontWeight: 600, margin: '0 0 12px' }}>Топ entities</h3>
            {stats.topEntities.slice(0, 10).map((e: any, i: number) => (
              <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid var(--border, #F3F4F6)', fontSize: 13 }}>
                <span style={{ color: '#6B7280' }}>{ENTITY_LABELS[e.entity_type] || e.entity_type} #{e.entity_id?.slice(0, 8)}</span>
                <span style={{ fontWeight: 600, color: 'var(--text, #111)' }}>{e.count}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {!stats?.overview?.length && (
        <div style={{ background: 'var(--surface, #fff)', borderRadius: 16, padding: 48, textAlign: 'center', border: '1px solid var(--border, #E5E7EB)' }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>&#x1F4CA;</div>
          <div style={{ fontSize: 18, fontWeight: 600, color: 'var(--text, #374151)' }}>Аналитик мэдээлэл байхгүй</div>
          <p style={{ color: '#9CA3AF', fontSize: 14, marginTop: 8 }}>QR скан, хуудас үзэлтүүд энд харагдана</p>
        </div>
      )}
    </div>
  )
}
