'use client'
import { apiFetch } from '@/lib/api'
import { useState, useEffect, useMemo } from 'react'

export default function AdminReportsPage() {
  const [orders, setOrders] = useState<any[]>([])
  const [users, setUsers] = useState<any[]>([])
  const [quotes, setQuotes] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [period, setPeriod] = useState<'7d' | '30d' | 'all'>('30d')

  useEffect(() => {
    Promise.all([
      apiFetch('/orders').catch(() => []),
      apiFetch('/admin/users').catch(() => []),
      apiFetch('/quotes-v2').catch(() => []),
    ]).then(([o, u, q]) => {
      setOrders(Array.isArray(o) ? o : [])
      setUsers(Array.isArray(u) ? u : [])
      setQuotes(Array.isArray(q) ? q : [])
    }).finally(() => setLoading(false))
  }, [])

  const stats = useMemo(() => {
    const now = new Date()
    const cutoff = period === '7d' ? new Date(now.getTime() - 7 * 86400000)
      : period === '30d' ? new Date(now.getTime() - 30 * 86400000) : new Date(0)

    const filtered = orders.filter(o => new Date(o.created_at) >= cutoff)
    const totalRevenue = filtered.filter(o => !['cancelled', 'pending'].includes(o.status)).reduce((s, o) => s + Number(o.total_price || 0), 0)
    const avgOrder = filtered.length > 0 ? totalRevenue / Math.max(filtered.filter(o => !['cancelled', 'pending'].includes(o.status)).length, 1) : 0

    // Status breakdown
    const statusCounts: Record<string, number> = {}
    filtered.forEach(o => { statusCounts[o.status] = (statusCounts[o.status] || 0) + 1 })

    // Daily breakdown
    const days = period === '7d' ? 7 : period === '30d' ? 30 : 60
    const daily: { date: string; count: number; revenue: number }[] = []
    for (let i = days - 1; i >= 0; i--) {
      const d = new Date(now); d.setDate(d.getDate() - i)
      const ds = d.toDateString()
      const dayOrders = orders.filter(o => new Date(o.created_at).toDateString() === ds)
      daily.push({
        date: d.toLocaleDateString('mn', { month: 'short', day: 'numeric' }),
        count: dayOrders.length,
        revenue: dayOrders.reduce((s, o) => s + Number(o.total_price || 0), 0),
      })
    }

    // Top products
    const productMap: Record<string, { name: string; count: number; revenue: number }> = {}
    filtered.forEach(o => {
      const name = o.product_name || 'Бусад'
      if (!productMap[name]) productMap[name] = { name, count: 0, revenue: 0 }
      productMap[name].count++
      productMap[name].revenue += Number(o.total_price || 0)
    })
    const topProducts = Object.values(productMap).sort((a, b) => b.revenue - a.revenue).slice(0, 5)

    // Top customers
    const custMap: Record<string, { name: string; count: number; revenue: number }> = {}
    filtered.forEach(o => {
      const name = o.customer_name || o.customer_email || 'Зочин'
      if (!custMap[name]) custMap[name] = { name, count: 0, revenue: 0 }
      custMap[name].count++
      custMap[name].revenue += Number(o.total_price || 0)
    })
    const topCustomers = Object.values(custMap).sort((a, b) => b.revenue - a.revenue).slice(0, 5)

    // Conversion
    const quotesInPeriod = quotes.filter(q => new Date(q.created_at) >= cutoff).length
    const conversionRate = quotesInPeriod > 0 ? ((filtered.length / quotesInPeriod) * 100).toFixed(1) : '—'

    return { totalRevenue, avgOrder, filtered, statusCounts, daily, topProducts, topCustomers, quotesInPeriod, conversionRate }
  }, [orders, users, quotes, period])

  if (loading) return <div style={{ padding: 60, textAlign: 'center', color: 'var(--text2)', fontFamily: "'DM Sans','Segoe UI',system-ui,sans-serif" }}>Тайлан ачаалж байна...</div>

  const maxDailyRev = Math.max(...stats.daily.map(d => d.revenue), 1)

  return (
    <div style={{ padding: 24, fontFamily: "'DM Sans','Segoe UI',system-ui,sans-serif" }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 700, margin: 0 }}>Тайлан</h1>
          <p style={{ color: 'var(--text2)', fontSize: 13, margin: '4px 0 0' }}>Борлуулалт, орлого, хэрэглэгчийн аналитик</p>
        </div>
        <div style={{ display: 'flex', gap: 6 }}>
          {([['7d', '7 хоног'], ['30d', '30 хоног'], ['all', 'Бүгд']] as const).map(([k, label]) => (
            <button key={k} onClick={() => setPeriod(k as any)} style={{ padding: '7px 16px', borderRadius: 8, fontSize: 12, fontWeight: 500, cursor: 'pointer', background: period === k ? '#FF6B00' : 'var(--surface)', color: period === k ? '#fff' : 'var(--text2)', border: period === k ? 'none' : '1px solid var(--border)' }}>{label}</button>
          ))}
        </div>
      </div>

      {/* KPIs */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: 12, marginBottom: 24 }} className="grid-4">
        {[
          { label: 'Нийт орлого', value: `₮${stats.totalRevenue.toLocaleString()}`, color: '#10B981' },
          { label: 'Захиалга', value: stats.filtered.length.toString(), color: '#FF6B00' },
          { label: 'Дундаж захиалга', value: `₮${Math.round(stats.avgOrder).toLocaleString()}`, color: '#3B82F6' },
          { label: 'Үнийн санал', value: stats.quotesInPeriod.toString(), color: '#8B5CF6' },
          { label: 'Хөрвүүлэлт', value: `${stats.conversionRate}%`, color: '#06B6D4' },
        ].map(k => (
          <div key={k.label} style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 12, padding: '16px 18px', borderTop: `3px solid ${k.color}` }}>
            <div style={{ fontSize: 12, color: 'var(--text2)', marginBottom: 6 }}>{k.label}</div>
            <div style={{ fontSize: 22, fontWeight: 700, color: k.color }}>{k.value}</div>
          </div>
        ))}
      </div>

      {/* Revenue Chart */}
      <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 14, padding: '20px 24px', marginBottom: 20 }}>
        <h3 style={{ fontSize: 15, fontWeight: 600, margin: '0 0 16px' }}>Өдрийн орлого</h3>
        <div style={{ display: 'flex', gap: 3, alignItems: 'flex-end', height: 140, overflowX: 'auto' }}>
          {stats.daily.map((d, i) => {
            const h = Math.max((d.revenue / maxDailyRev) * 110, 2)
            const isLast = i === stats.daily.length - 1
            return (
              <div key={i} style={{ flex: '1 0 auto', minWidth: period === '7d' ? 60 : 16, maxWidth: 60, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3 }}>
                {d.revenue > 0 && period === '7d' && <span style={{ fontSize: 10, color: isLast ? '#FF6B00' : 'var(--text3)' }}>₮{(d.revenue / 1000000).toFixed(1)}M</span>}
                <div style={{ width: '80%', height: h, background: isLast ? '#FF6B00' : d.revenue > 0 ? 'rgba(255,107,0,0.3)' : 'var(--surface3)', borderRadius: '3px 3px 1px 1px', transition: 'height 0.5s' }} title={`${d.date}: ₮${d.revenue.toLocaleString()}`} />
                {(period === '7d' || i % 5 === 0) && <span style={{ fontSize: 9, color: 'var(--text3)', whiteSpace: 'nowrap' }}>{d.date}</span>}
              </div>
            )
          })}
        </div>
      </div>

      {/* Bottom: Products + Customers */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }} className="grid-2">
        {/* Top Products */}
        <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 14, padding: '20px 24px' }}>
          <h3 style={{ fontSize: 15, fontWeight: 600, margin: '0 0 14px' }}>Топ бүтээгдэхүүн</h3>
          {stats.topProducts.length === 0 ? <p style={{ color: 'var(--text3)', fontSize: 13 }}>Мэдээлэл байхгүй</p>
          : stats.topProducts.map((p, i) => (
            <div key={p.name} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0', borderBottom: i < stats.topProducts.length - 1 ? '1px solid var(--border)' : 'none' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ fontSize: 11, color: 'var(--text3)', fontWeight: 600, minWidth: 18 }}>#{i + 1}</span>
                <span style={{ fontSize: 13, fontWeight: 500 }}>{p.name}</span>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: '#FF6B00' }}>₮{p.revenue.toLocaleString()}</div>
                <div style={{ fontSize: 11, color: 'var(--text3)' }}>{p.count} захиалга</div>
              </div>
            </div>
          ))}
        </div>

        {/* Top Customers */}
        <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 14, padding: '20px 24px' }}>
          <h3 style={{ fontSize: 15, fontWeight: 600, margin: '0 0 14px' }}>Топ хэрэглэгч</h3>
          {stats.topCustomers.length === 0 ? <p style={{ color: 'var(--text3)', fontSize: 13 }}>Мэдээлэл байхгүй</p>
          : stats.topCustomers.map((c, i) => (
            <div key={c.name} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0', borderBottom: i < stats.topCustomers.length - 1 ? '1px solid var(--border)' : 'none' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <div style={{ width: 26, height: 26, borderRadius: '50%', background: 'rgba(255,107,0,0.1)', color: '#FF6B00', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 700 }}>{(c.name || 'U').charAt(0).toUpperCase()}</div>
                <span style={{ fontSize: 13, fontWeight: 500 }}>{c.name}</span>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: '#FF6B00' }}>₮{c.revenue.toLocaleString()}</div>
                <div style={{ fontSize: 11, color: 'var(--text3)' }}>{c.count} захиалга</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
