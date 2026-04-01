'use client'
import { useState, useEffect } from 'react'
import { apiFetch } from '@/lib/api'
import { AdminPageHeader } from '@/components/admin/AdminPageHeader'
import { BarChart as VBarChart } from '@/components/chart-blocks'

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

  if (loading) return (
    <div className="p-4 md:p-6">
      <div className="animate-pulse space-y-4">
        <div className="h-7 w-48 bg-muted rounded-lg" />
        <div className="grid grid-cols-4 gap-3">{[1,2,3,4].map(i => <div key={i} className="h-24 bg-muted rounded-xl" />)}</div>
        <div className="h-[200px] bg-muted/40 rounded-xl" />
      </div>
    </div>
  )

  const chartData = (stats?.dailyTotals || []).map((d: any) => ({ date: d.date?.slice(5), count: Number(d.count) }))

  return (
    <div className="p-4 md:p-6">
      <AdminPageHeader title="Платформ аналитик">
        <select value={days} onChange={e => setDays(Number(e.target.value))} className="rounded-lg border border-border bg-background px-3 py-2 text-sm">
          <option value={7}>7 хоног</option>
          <option value={30}>30 хоног</option>
          <option value={90}>90 хоног</option>
        </select>
      </AdminPageHeader>

      {/* Overview */}
      {stats?.overview && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
          {stats.overview.map((o: any) => (
            <div key={o.entity_type} className="rounded-xl border border-border bg-card p-5 text-center">
              <div className="text-2xl font-bold text-primary">{Number(o.total_events).toLocaleString()}</div>
              <div className="text-sm text-muted-foreground mt-1">{ENTITY_LABELS[o.entity_type] || o.entity_type}</div>
              <div className="text-xs text-muted-foreground/60 mt-0.5">{o.unique_entities} entities</div>
            </div>
          ))}
        </div>
      )}

      {/* Daily chart — VisActor */}
      {chartData.length > 0 && (
        <div className="rounded-xl border border-border bg-card p-5 mb-6">
          <h3 className="text-base font-semibold text-foreground mb-4">Өдрийн идэвхжил</h3>
          <VBarChart
            data={chartData.map((d: any) => ({ label: d.date, value: d.count }))}
            height={180}
            color="#FF6B00"
            gradient
          />
        </div>
      )}

      {/* Device + Top entities */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {stats?.deviceBreakdown?.length > 0 && (
          <div className="rounded-xl border border-border bg-card p-5">
            <h3 className="text-sm font-semibold text-foreground mb-3">Төхөөрөмж</h3>
            {stats.deviceBreakdown.map((d: any) => (
              <div key={d.device} className="flex justify-between py-2 border-b border-border/50 text-sm">
                <span className="text-muted-foreground">{d.device || 'unknown'}</span>
                <span className="font-semibold text-foreground">{d.count}</span>
              </div>
            ))}
          </div>
        )}
        {stats?.topEntities?.length > 0 && (
          <div className="rounded-xl border border-border bg-card p-5">
            <h3 className="text-sm font-semibold text-foreground mb-3">Топ entities</h3>
            {stats.topEntities.slice(0, 10).map((e: any, i: number) => (
              <div key={i} className="flex justify-between py-1.5 border-b border-border/50 text-sm">
                <span className="text-muted-foreground">{ENTITY_LABELS[e.entity_type] || e.entity_type} #{e.entity_id?.slice(0, 8)}</span>
                <span className="font-semibold text-foreground">{e.count}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {!stats?.overview?.length && (
        <div className="rounded-xl border border-border bg-card p-12 text-center">
          <div className="text-5xl mb-4">📊</div>
          <div className="text-lg font-semibold text-foreground">Аналитик мэдээлэл байхгүй</div>
          <p className="text-muted-foreground text-sm mt-2">QR скан, хуудас үзэлтүүд энд харагдана</p>
        </div>
      )}
    </div>
  )
}
