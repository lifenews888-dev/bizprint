'use client'
import { apiFetch } from '@/lib/api'
import { useState, useEffect, useCallback } from 'react'
import { MultiBarChart } from '@/components/chart-blocks'

/* ═══════════════════════════════════════════
   TYPES
   ═══════════════════════════════════════════ */
interface Summary {
  total_orders: number; total_revenue: number; total_cost: number
  total_margin: number; total_profit: number; total_commission: number
  total_delivery_cost: number; total_vat: number; avg_margin_rate: number
  avg_order_value: number; conversion_rate: number
  previous: {
    total_orders: number; total_revenue: number; total_profit: number
    total_commission: number; avg_order_value: number; total_cost: number
  } | null
}
interface TimePoint { date: string; revenue: number; cost: number; profit: number; orders: number }
interface VendorRow { vendor_id: string; vendor_name: string; order_count: number; revenue: number; cost: number; margin: number; profit: number; commission: number; avg_margin_rate: number }
interface ProductRow { product_id: string; product_name: string; order_count: number; revenue: number; cost: number; margin: number; profit: number; avg_margin_rate: number }
interface CustomerRow { customer_id: string; customer_name: string; email: string; order_count: number; total_spend: number; profit_generated: number; last_order_date: string }
interface Cashflow { paid_orders: number; pending_payments: number; total_commission: number; total_delivery_cost: number; total_vat: number }

/* ═══════════════════════════════════════════
   HELPERS
   ═══════════════════════════════════════════ */
const fmt = (n: number) => '₮' + n.toLocaleString()
const pct = (n: number) => n.toFixed(1) + '%'
const fmtDate = (d: string) => new Date(d).toLocaleDateString('mn-MN', { month: 'short', day: 'numeric' })

function calcChange(current: number, previous: number | undefined): { value: string; positive: boolean } | null {
  if (!previous || previous === 0) return null
  const change = ((current - previous) / previous) * 100
  return { value: (change >= 0 ? '+' : '') + change.toFixed(1) + '%', positive: change >= 0 }
}

/* ═══════════════════════════════════════════
   KPI CARD
   ═══════════════════════════════════════════ */
function KpiCard({ label, value, change, icon, color = '#FF6B00', tooltip }: {
  label: string; value: string; change?: { value: string; positive: boolean } | null
  icon: string; color?: string; tooltip?: string
}) {
  return (
    <div className="bg-white rounded-xl border border-[#E5E7EB] p-5 hover:shadow-md transition-shadow relative group" title={tooltip}>
      <div className="flex items-start justify-between mb-3">
        <div className="w-10 h-10 rounded-lg flex items-center justify-center text-xl" style={{ background: color + '15' }}>{icon}</div>
        {change && (
          <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${change.positive ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-600'}`}>
            {change.value}
          </span>
        )}
      </div>
      <div className="text-2xl font-extrabold text-[#111] tracking-tight">{value}</div>
      <div className="text-xs text-[#888] mt-1">{label}</div>
      {tooltip && (
        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-1.5 bg-[#111] text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-10">
          {tooltip}
        </div>
      )}
    </div>
  )
}

/* ═══════════════════════════════════════════
   PROFIT CHART — VisActor MultiBarChart
   ═══════════════════════════════════════════ */
function ProfitChart({ data, visibleSeries }: { data: TimePoint[]; visibleSeries: Set<string> }) {
  if (!data.length) return <div className="text-center text-[#999] py-16 text-sm">Өгөгдөл байхгүй</div>

  const yFields: { field: string; name: string; color: string }[] = []
  if (visibleSeries.has('revenue')) yFields.push({ field: 'revenue', name: 'Орлого', color: '#FF6B00' })
  if (visibleSeries.has('cost'))    yFields.push({ field: 'cost',    name: 'Зардал', color: '#8B5CF6' })
  if (visibleSeries.has('profit'))  yFields.push({ field: 'profit',  name: 'Ашиг',   color: '#10B981' })

  const chartData = data.map(d => ({ date: fmtDate(d.date), revenue: d.revenue, cost: d.cost, profit: d.profit }))

  return (
    <MultiBarChart
      data={chartData}
      xField="date"
      yFields={yFields}
      height={220}
      currency
    />
  )
}

/* ═══════════════════════════════════════════
   ALERT SYSTEM
   ═══════════════════════════════════════════ */
function AlertsPanel({ summary, products, vendors }: { summary: Summary | null; products: ProductRow[]; vendors: VendorRow[] }) {
  const alerts: { type: 'danger' | 'warning' | 'info'; message: string }[] = []

  if (summary) {
    if (summary.total_profit < 0) alerts.push({ type: 'danger', message: `Нийт ашиг сөрөг: ${fmt(summary.total_profit)}. Яаралтай шалгах шаардлагатай!` })
    if (summary.previous && summary.total_revenue < summary.previous.total_revenue * 0.8)
      alerts.push({ type: 'warning', message: `Орлого өмнөх үеэс ${pct(((summary.previous.total_revenue - summary.total_revenue) / summary.previous.total_revenue) * 100)} буурсан` })
    if (summary.conversion_rate < 10) alerts.push({ type: 'warning', message: `Хөрвүүлэлтийн хувь бага: ${pct(summary.conversion_rate)}` })
  }

  const lossMaking = products.filter(p => p.profit < 0)
  if (lossMaking.length) alerts.push({ type: 'danger', message: `${lossMaking.length} бүтээгдэхүүн алдагдалтай: ${lossMaking.map(p => p.product_name).join(', ')}` })

  const negVendors = vendors.filter(v => v.profit < 0)
  if (negVendors.length) alerts.push({ type: 'danger', message: `${negVendors.length} vendor сөрөг margin-тэй: ${negVendors.map(v => v.vendor_name).join(', ')}` })

  if (!alerts.length) return null

  return (
    <div className="space-y-2 mb-6">
      {alerts.map((a, i) => (
        <div key={i} className={`flex items-start gap-3 px-4 py-3 rounded-xl text-sm font-medium ${
          a.type === 'danger' ? 'bg-red-50 text-red-700 border border-red-200' :
          a.type === 'warning' ? 'bg-amber-50 text-amber-700 border border-amber-200' :
          'bg-blue-50 text-blue-700 border border-blue-200'
        }`}>
          <span className="text-lg flex-shrink-0">{a.type === 'danger' ? '🚨' : a.type === 'warning' ? '⚠️' : 'ℹ️'}</span>
          {a.message}
        </div>
      ))}
    </div>
  )
}

/* ═══════════════════════════════════════════
   MAIN PAGE
   ═══════════════════════════════════════════ */
type Period = '7d' | '30d' | '90d' | 'custom'
type GroupBy = 'day' | 'week' | 'month'
type ProductTab = 'profit' | 'revenue' | 'loss'

const GROUP_BY_OPTIONS = ['day', 'week', 'month'] as const

function groupByValue(value: string): GroupBy {
  return GROUP_BY_OPTIONS.includes(value as GroupBy) ? value as GroupBy : 'day'
}

export default function AdminReportsPage() {
  const [period, setPeriod] = useState<Period>('30d')
  const [groupBy, setGroupBy] = useState<GroupBy>('day')
  const [loading, setLoading] = useState(true)
  const [summary, setSummary] = useState<Summary | null>(null)
  const [timeSeries, setTimeSeries] = useState<TimePoint[]>([])
  const [vendors, setVendors] = useState<VendorRow[]>([])
  const [products, setProducts] = useState<ProductRow[]>([])
  const [customers, setCustomers] = useState<CustomerRow[]>([])
  const [cashflow, setCashflow] = useState<Cashflow | null>(null)
  const [visibleSeries, setVisibleSeries] = useState<Set<string>>(new Set(['revenue', 'cost', 'profit']))
  const [productTab, setProductTab] = useState<ProductTab>('profit')

  const getDateRange = useCallback(() => {
    const end = new Date()
    const days = period === '7d' ? 7 : period === '90d' ? 90 : 30
    const start = new Date(end.getTime() - days * 86400000)
    return { start: start.toISOString().split('T')[0], end: end.toISOString().split('T')[0] }
  }, [period])

  const fetchAll = useCallback(async () => {
    setLoading(true)
    const { start, end } = getDateRange()
    const qs = `start=${start}&end=${end}`
    try {
      const [sum, ts, ven, prod, cust, cf] = await Promise.all([
        apiFetch<Summary>(`/reports/summary?${qs}`).catch(() => null),
        apiFetch<TimePoint[]>(`/reports/profit?${qs}&groupBy=${groupBy}`).catch(() => []),
        apiFetch<VendorRow[]>(`/reports/vendors?${qs}`).catch(() => []),
        apiFetch<ProductRow[]>(`/reports/products?${qs}`).catch(() => []),
        apiFetch<CustomerRow[]>(`/reports/customers?${qs}`).catch(() => []),
        apiFetch<Cashflow>(`/reports/cashflow?${qs}`).catch(() => null),
      ])
      setSummary(sum)
      setTimeSeries(Array.isArray(ts) ? ts : [])
      setVendors(Array.isArray(ven) ? ven : [])
      setProducts(Array.isArray(prod) ? prod : [])
      setCustomers(Array.isArray(cust) ? cust : [])
      setCashflow(cf)
    } finally {
      setLoading(false)
    }
  }, [getDateRange, groupBy])

  useEffect(() => { fetchAll() }, [fetchAll])

  const toggleSeries = (key: string) => {
    setVisibleSeries(prev => {
      const next = new Set(prev)
      next.has(key) ? next.delete(key) : next.add(key)
      return next
    })
  }

  // Product tabs
  const sortedProducts = productTab === 'loss'
    ? products.filter(p => p.profit < 0).sort((a, b) => a.profit - b.profit)
    : productTab === 'revenue'
      ? [...products].sort((a, b) => b.revenue - a.revenue)
      : [...products].sort((a, b) => b.profit - a.profit)

  if (loading && !summary) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-100 rounded w-48" />
          <div className="grid grid-cols-3 gap-4">{[1,2,3,4,5,6].map(i => <div key={i} className="h-28 bg-gray-100 rounded-xl" />)}</div>
          <div className="h-64 bg-gray-100 rounded-xl" />
        </div>
      </div>
    )
  }

  const s = summary

  return (
    <div className="p-4 md:p-6 max-w-[1400px] mx-auto">
      {/* ═══ HEADER ═══ */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-extrabold text-[#111] tracking-tight">Ашгийн тайлан</h1>
          <p className="text-sm text-[#888] mt-1">Санхүүгийн удирдлагын самбар</p>
        </div>
        <div className="flex items-center gap-2">
          {(['7d', '30d', '90d'] as Period[]).map(p => (
            <button key={p} onClick={() => setPeriod(p)}
              className={`px-3.5 py-1.5 rounded-lg text-sm font-medium transition-colors border ${
                period === p ? 'bg-[#FF6B00] text-white border-[#FF6B00]' : 'bg-white text-[#555] border-[#E5E7EB] hover:border-[#FF6B00]'
              }`}>
              {p === '7d' ? '7 хоног' : p === '30d' ? '30 хоног' : '90 хоног'}
            </button>
          ))}
          <button onClick={fetchAll} className="px-3 py-1.5 rounded-lg text-sm font-medium bg-white text-[#555] border border-[#E5E7EB] hover:border-[#FF6B00] transition-colors">
            🔄
          </button>
        </div>
      </div>

      {/* ═══ ALERTS ═══ */}
      <AlertsPanel summary={summary} products={products} vendors={vendors} />

      {/* ═══ KPI CARDS ═══ */}
      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-3 mb-6">
        <KpiCard icon="💰" label="Нийт орлого" value={s ? fmt(s.total_revenue) : '—'}
          change={s?.previous ? calcChange(s.total_revenue, s.previous.total_revenue) : null}
          tooltip="Хэрэглэгчээс авсан нийт мөнгө" />
        <KpiCard icon="📈" label="Цэвэр ашиг" value={s ? fmt(s.total_profit) : '—'} color={s && s.total_profit < 0 ? '#EF4444' : '#10B981'}
          change={s?.previous ? calcChange(s.total_profit, s.previous.total_profit) : null}
          tooltip="Орлого - Зардал - Шимтгэл - Хүргэлт" />
        <KpiCard icon="🏦" label="Шимтгэл" value={s ? fmt(s.total_commission) : '—'}
          change={s?.previous ? calcChange(s.total_commission, s.previous.total_commission) : null}
          tooltip="Борлуулалтын шимтгэлийн нийт дүн" color="#8B5CF6" />
        <KpiCard icon="📦" label="Захиалга" value={s ? s.total_orders.toLocaleString() : '—'}
          change={s?.previous ? calcChange(s.total_orders, s.previous.total_orders) : null}
          tooltip="Нийт захиалгын тоо" color="#3B82F6" />
        <KpiCard icon="🧾" label="Дундаж захиалга" value={s ? fmt(s.avg_order_value) : '—'}
          change={s?.previous ? calcChange(s.avg_order_value, s.previous.avg_order_value) : null}
          tooltip="Нэг захиалгын дундаж дүн" color="#F59E0B" />
        <KpiCard icon="🎯" label="Хөрвүүлэлт" value={s ? pct(s.conversion_rate) : '—'}
          tooltip="Үнийн санал → Төлбөр хийсэн хувь" color="#EC4899" />
      </div>

      {/* ═══ CHART SECTION ═══ */}
      <div className="bg-white rounded-xl border border-[#E5E7EB] p-5 mb-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-4">
          <h2 className="text-lg font-bold text-[#111]">Санхүүгийн график</h2>
          <div className="flex items-center gap-3 flex-wrap">
            {/* Series toggles */}
            {[
              { key: 'revenue', label: 'Орлого', color: '#FF6B00' },
              { key: 'cost', label: 'Зардал', color: '#8B5CF6' },
              { key: 'profit', label: 'Ашиг', color: '#10B981' },
            ].map(s => (
              <button key={s.key} onClick={() => toggleSeries(s.key)}
                className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium border transition-colors ${
                  visibleSeries.has(s.key)
                    ? 'border-current text-white'
                    : 'border-[#E5E7EB] text-[#999]'
                }`}
                style={visibleSeries.has(s.key) ? { background: s.color, borderColor: s.color } : {}}>
                <span className="w-2 h-2 rounded-full" style={{ background: s.color }} />
                {s.label}
              </button>
            ))}
            {/* Group by */}
            <select value={groupBy} onChange={e => setGroupBy(groupByValue(e.target.value))}
              className="text-xs font-medium text-[#555] border border-[#E5E7EB] rounded-lg px-2 py-1 outline-none" style={{ appearance: 'auto' }}>
              <option value="day">Өдөр</option>
              <option value="week">Долоо хоног</option>
              <option value="month">Сар</option>
            </select>
          </div>
        </div>
        <ProfitChart data={timeSeries} visibleSeries={visibleSeries} />
      </div>

      {/* ═══ TWO-COLUMN: Products + Vendors ═══ */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 mb-6">

        {/* ── Products ── */}
        <div className="bg-white rounded-xl border border-[#E5E7EB] overflow-hidden">
          <div className="px-5 pt-5 pb-3 flex items-center justify-between">
            <h2 className="text-lg font-bold text-[#111]">Бүтээгдэхүүн</h2>
          </div>
          <div className="flex border-b border-[#E5E7EB]">
            {([
              { key: 'profit', label: 'Ашгаар' },
              { key: 'revenue', label: 'Орлогоор' },
              { key: 'loss', label: '🚨 Алдагдалтай' },
            ] as Array<{ key: ProductTab; label: string }>).map(t => (
              <button key={t.key} onClick={() => setProductTab(t.key)}
                className={`flex-1 py-2.5 text-xs font-semibold text-center border-b-2 transition-colors ${
                  productTab === t.key ? 'border-[#FF6B00] text-[#FF6B00]' : 'border-transparent text-[#999] hover:text-[#555]'
                }`}>
                {t.label}
              </button>
            ))}
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-[11px] text-[#999] uppercase tracking-wider">
                  <th className="text-left px-5 py-3 font-semibold">Бүтээгдэхүүн</th>
                  <th className="text-right px-3 py-3 font-semibold">Орлого</th>
                  <th className="text-right px-3 py-3 font-semibold">Зардал</th>
                  <th className="text-right px-3 py-3 font-semibold">Ашиг</th>
                  <th className="text-right px-5 py-3 font-semibold">Margin</th>
                </tr>
              </thead>
              <tbody>
                {sortedProducts.slice(0, 10).map((p, i) => (
                  <tr key={p.product_id || i} className="border-t border-[#F3F4F6] hover:bg-[#FAFAFA] transition-colors">
                    <td className="px-5 py-3">
                      <div className="font-medium text-[#111] truncate max-w-[180px]">{p.product_name}</div>
                      <div className="text-[11px] text-[#999]">{p.order_count} захиалга</div>
                    </td>
                    <td className="text-right px-3 py-3 font-medium text-[#111]">{fmt(p.revenue)}</td>
                    <td className="text-right px-3 py-3 text-[#888]">{fmt(p.cost)}</td>
                    <td className={`text-right px-3 py-3 font-bold ${p.profit >= 0 ? 'text-green-600' : 'text-red-600'}`}>{fmt(p.profit)}</td>
                    <td className="text-right px-5 py-3">
                      <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${p.avg_margin_rate >= 20 ? 'bg-green-50 text-green-600' : p.avg_margin_rate >= 10 ? 'bg-amber-50 text-amber-600' : 'bg-red-50 text-red-600'}`}>
                        {pct(p.avg_margin_rate)}
                      </span>
                    </td>
                  </tr>
                ))}
                {sortedProducts.length === 0 && (
                  <tr><td colSpan={5} className="text-center py-8 text-[#999] text-sm">{productTab === 'loss' ? 'Алдагдалтай бүтээгдэхүүн байхгүй 🎉' : 'Өгөгдөл байхгүй'}</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* ── Vendors ── */}
        <div className="bg-white rounded-xl border border-[#E5E7EB] overflow-hidden">
          <div className="px-5 pt-5 pb-3">
            <h2 className="text-lg font-bold text-[#111]">Vendor тайлан</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-[11px] text-[#999] uppercase tracking-wider border-b border-[#E5E7EB]">
                  <th className="text-left px-5 py-3 font-semibold">Vendor</th>
                  <th className="text-right px-3 py-3 font-semibold">Захиалга</th>
                  <th className="text-right px-3 py-3 font-semibold">Орлого</th>
                  <th className="text-right px-3 py-3 font-semibold">Ашиг</th>
                  <th className="text-right px-5 py-3 font-semibold">Шимтгэл</th>
                </tr>
              </thead>
              <tbody>
                {vendors.slice(0, 10).map((v, i) => (
                  <tr key={v.vendor_id || i} className="border-t border-[#F3F4F6] hover:bg-[#FAFAFA] transition-colors">
                    <td className="px-5 py-3">
                      <div className="font-medium text-[#111]">{v.vendor_name}</div>
                      <div className="text-[11px] text-[#999]">Margin: {pct(v.avg_margin_rate)}</div>
                    </td>
                    <td className="text-right px-3 py-3 text-[#555]">{v.order_count}</td>
                    <td className="text-right px-3 py-3 font-medium text-[#111]">{fmt(v.revenue)}</td>
                    <td className={`text-right px-3 py-3 font-bold ${v.profit >= 0 ? 'text-green-600' : 'text-red-600'}`}>{fmt(v.profit)}</td>
                    <td className="text-right px-5 py-3 text-[#8B5CF6] font-medium">{fmt(v.commission)}</td>
                  </tr>
                ))}
                {vendors.length === 0 && (
                  <tr><td colSpan={5} className="text-center py-8 text-[#999] text-sm">Өгөгдөл байхгүй</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* ═══ TWO-COLUMN: Customers + Cashflow ═══ */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 mb-6">

        {/* ── Customers ── */}
        <div className="bg-white rounded-xl border border-[#E5E7EB] overflow-hidden">
          <div className="px-5 pt-5 pb-3">
            <h2 className="text-lg font-bold text-[#111]">Топ хэрэглэгч</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-[11px] text-[#999] uppercase tracking-wider border-b border-[#E5E7EB]">
                  <th className="text-left px-5 py-3 font-semibold">Хэрэглэгч</th>
                  <th className="text-right px-3 py-3 font-semibold">Захиалга</th>
                  <th className="text-right px-3 py-3 font-semibold">Нийт зарцуулалт</th>
                  <th className="text-right px-5 py-3 font-semibold">Сүүлд</th>
                </tr>
              </thead>
              <tbody>
                {customers.slice(0, 10).map((c, i) => (
                  <tr key={`${c.customer_id}-${i}`} className="border-t border-[#F3F4F6] hover:bg-[#FAFAFA] transition-colors">
                    <td className="px-5 py-3">
                      <div className="font-medium text-[#111]">{c.customer_name}</div>
                      <div className="text-[11px] text-[#999]">{c.email}</div>
                    </td>
                    <td className="text-right px-3 py-3 text-[#555]">{c.order_count}</td>
                    <td className="text-right px-3 py-3 font-bold text-[#FF6B00]">{fmt(c.total_spend)}</td>
                    <td className="text-right px-5 py-3 text-[11px] text-[#999]">{c.last_order_date ? fmtDate(c.last_order_date) : '—'}</td>
                  </tr>
                ))}
                {customers.length === 0 && (
                  <tr><td colSpan={4} className="text-center py-8 text-[#999] text-sm">Өгөгдөл байхгүй</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* ── Cashflow + Commission ── */}
        <div className="space-y-6">
          {/* Cashflow */}
          <div className="bg-white rounded-xl border border-[#E5E7EB] p-5">
            <h2 className="text-lg font-bold text-[#111] mb-4">Мөнгөн урсгал</h2>
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-green-50 rounded-xl p-4">
                <div className="text-xs text-green-600 font-medium mb-1">Төлсөн захиалга</div>
                <div className="text-xl font-extrabold text-green-700">{cashflow ? fmt(cashflow.paid_orders) : '—'}</div>
              </div>
              <div className="bg-amber-50 rounded-xl p-4">
                <div className="text-xs text-amber-600 font-medium mb-1">Хүлээгдэж буй</div>
                <div className="text-xl font-extrabold text-amber-700">{cashflow ? fmt(cashflow.pending_payments) : '—'}</div>
              </div>
            </div>
          </div>

          {/* Commission breakdown */}
          <div className="bg-white rounded-xl border border-[#E5E7EB] p-5">
            <h2 className="text-lg font-bold text-[#111] mb-4">Шимтгэлийн задаргаа</h2>
            <div className="space-y-3">
              {[
                { label: 'Нийт шимтгэл', value: cashflow?.total_commission, color: '#8B5CF6' },
                { label: 'Хүргэлтийн зардал', value: cashflow?.total_delivery_cost, color: '#3B82F6' },
                { label: 'НӨАТ', value: cashflow?.total_vat, color: '#F59E0B' },
              ].map(item => (
                <div key={item.label} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full" style={{ background: item.color }} />
                    <span className="text-sm text-[#555]">{item.label}</span>
                  </div>
                  <span className="text-sm font-bold text-[#111]">{item.value != null ? fmt(item.value) : '—'}</span>
                </div>
              ))}
            </div>
            {/* Margin gauge */}
            {s && (
              <div className="mt-4 pt-4 border-t border-[#F3F4F6]">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs text-[#888]">Дундаж margin</span>
                  <span className="text-sm font-bold text-[#111]">{pct(s.avg_margin_rate)}</span>
                </div>
                <div className="w-full h-2 bg-[#F3F4F6] rounded-full overflow-hidden">
                  <div className="h-full rounded-full transition-all" style={{
                    width: `${Math.min(Math.max(s.avg_margin_rate, 0), 100)}%`,
                    background: s.avg_margin_rate >= 20 ? '#10B981' : s.avg_margin_rate >= 10 ? '#F59E0B' : '#EF4444',
                  }} />
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
