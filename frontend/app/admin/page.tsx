'use client'
import { apiFetch, getToken } from '@/lib/api'
import { useState, useEffect, useMemo } from 'react'
import { useRouter } from 'next/navigation'

/* ═══ Helpers ═══ */
const fmt = (n: number) => '₮' + n.toLocaleString()
const pct = (a: number, b: number) => b > 0 ? Math.round((a / b) * 100) : 0

function change(current: number, previous: number): { text: string; positive: boolean } | null {
  if (!previous) return null
  const p = ((current - previous) / previous) * 100
  return { text: (p >= 0 ? '+' : '') + p.toFixed(1) + '%', positive: p >= 0 }
}

const STATUS_MAP: Record<string, { label: string; color: string }> = {
  DRAFT: { label: 'Ноорог', color: '#9CA3AF' },
  QUOTATION_SENT: { label: 'Үнийн санал', color: '#6366F1' },
  CONFIRMED: { label: 'Баталгаажсан', color: '#3B82F6' },
  PENDING_FILE: { label: 'Файл хүлээж буй', color: '#F59E0B' },
  FILE_REVIEW: { label: 'Файл шалгаж буй', color: '#8B5CF6' },
  IN_PRODUCTION: { label: 'Үйлдвэрлэлд', color: '#EC4899' },
  FINISHING: { label: 'Боловсруулалт', color: '#D946EF' },
  DISPATCHED: { label: 'Илгээгдсэн', color: '#06B6D4' },
  DELIVERED: { label: 'Хүргэгдсэн', color: '#10B981' },
  COMPLETED: { label: 'Дууссан', color: '#059669' },
  CANCELLED: { label: 'Цуцлагдсан', color: '#EF4444' },
}

/* ═══ KPI Card ═══ */
function KpiCard({ icon, label, value, sub, change: ch, color = '#FF6B00', onClick }: {
  icon: string; label: string; value: string; sub?: string
  change?: { text: string; positive: boolean } | null; color?: string; onClick?: () => void
}) {
  return (
    <div onClick={onClick} className={`bg-white rounded-xl border border-[#E5E7EB] p-4 hover:shadow-md transition-shadow ${onClick ? 'cursor-pointer' : ''}`}>
      <div className="flex items-center justify-between mb-2">
        <div className="w-9 h-9 rounded-lg flex items-center justify-center text-lg" style={{ background: color + '12' }}>{icon}</div>
        {ch && <span className={`text-[11px] font-bold px-1.5 py-0.5 rounded-full ${ch.positive ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-600'}`}>{ch.text}</span>}
      </div>
      <div className="text-xl font-extrabold text-[#111] tracking-tight">{value}</div>
      <div className="text-[11px] text-[#888] mt-0.5">{label}</div>
      {sub && <div className="text-[10px] text-[#BBB] mt-0.5">{sub}</div>}
    </div>
  )
}

/* ═══ Alert Item ═══ */
function AlertItem({ severity, message, action, href }: { severity: 'high' | 'medium' | 'low'; message: string; action?: string; href?: string }) {
  const cfg = { high: { bg: 'bg-red-50', border: 'border-red-200', text: 'text-red-700', icon: '🚨' }, medium: { bg: 'bg-amber-50', border: 'border-amber-200', text: 'text-amber-700', icon: '⚠️' }, low: { bg: 'bg-blue-50', border: 'border-blue-200', text: 'text-blue-700', icon: 'ℹ️' } }[severity]
  return (
    <a href={href || '#'} className={`flex items-center gap-3 px-4 py-2.5 rounded-xl ${cfg.bg} border ${cfg.border} ${cfg.text} text-sm font-medium no-underline hover:shadow-sm transition-shadow`}>
      <span className="text-base flex-shrink-0">{cfg.icon}</span>
      <span className="flex-1">{message}</span>
      {action && <span className="text-[10px] font-bold underline flex-shrink-0">{action}</span>}
    </a>
  )
}

/* ═══ SYSTEM TAB COMPONENT ═══ */
const SOURCE_CFG: Record<string, { label: string; icon: string; color: string }> = {
  web: { label: 'Веб апп', icon: '🌐', color: '#3B82F6' },
  user_app: { label: 'Хэрэглэгчийн апп', icon: '📱', color: '#10B981' },
  driver_app: { label: 'Жолоочийн апп', icon: '🚗', color: '#06B6D4' },
  vendor_app: { label: 'Vendor апп', icon: '🏭', color: '#F59E0B' },
  backend: { label: 'Backend', icon: '🖥️', color: '#8B5CF6' },
  webhook: { label: 'Webhook', icon: '🔗', color: '#EC4899' },
  payment: { label: 'Төлбөр', icon: '💳', color: '#EF4444' },
  queue: { label: 'Queue', icon: '📮', color: '#F97316' },
  integration: { label: 'Интеграц', icon: '🔌', color: '#6366F1' },
}

const SEV_CFG: Record<string, { label: string; color: string; bg: string }> = {
  critical: { label: 'CRITICAL', color: '#DC2626', bg: '#FEF2F2' },
  high: { label: 'HIGH', color: '#EF4444', bg: '#FEF2F2' },
  medium: { label: 'MEDIUM', color: '#F59E0B', bg: '#FFF8EB' },
  low: { label: 'LOW', color: '#6B7280', bg: '#F3F4F6' },
}

function SystemTab({ services }: { services: { name: string; icon: string; port: number }[] }) {
  const [errorSummary, setErrorSummary] = useState<any>(null)
  const [errorFilter, setErrorFilter] = useState<string>('')
  const [loadingErrors, setLoadingErrors] = useState(true)

  useEffect(() => {
    apiFetch<any>('/errors/summary').then(d => setErrorSummary(d)).catch(() => {}).finally(() => setLoadingErrors(false))
  }, [])

  const filteredErrors = (errorSummary?.recent || []).filter((e: any) =>
    !errorFilter || e.source === errorFilter
  )

  async function resolveError(id: string) {
    await apiFetch(`/errors/${id}/status`, { method: 'PATCH', body: JSON.stringify({ status: 'resolved' }), headers: { 'Content-Type': 'application/json' } }).catch(() => {})
    apiFetch<any>('/errors/summary').then(d => setErrorSummary(d)).catch(() => {})
  }

  return (
    <div>
      {/* Service Control Panel */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 mb-6">
        {services.map(svc => (
          <div key={svc.name} className="bg-white rounded-xl border border-[#E5E7EB] p-5 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <span className="text-xl">{svc.icon}</span>
                <span className="text-sm font-bold text-[#111]">{svc.name}</span>
              </div>
              <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-lg">🟢 Online</span>
            </div>
            <div className="grid grid-cols-3 gap-2 mb-3 text-center">
              <div className="bg-[#F8F8F8] rounded-lg py-2"><div className="text-xs font-bold text-[#111]">99.9%</div><div className="text-[9px] text-[#888]">Uptime</div></div>
              <div className="bg-[#F8F8F8] rounded-lg py-2"><div className="text-xs font-bold text-emerald-600">&lt;50ms</div><div className="text-[9px] text-[#888]">Response</div></div>
              <div className="bg-[#F8F8F8] rounded-lg py-2"><div className="text-xs font-bold text-[#111]">0.1%</div><div className="text-[9px] text-[#888]">Error rate</div></div>
            </div>
            <div className="text-[10px] text-[#999]">Port: {svc.port}</div>
          </div>
        ))}
      </div>

      {/* Error Summary KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-5">
        <div className="bg-white rounded-xl border border-[#E5E7EB] p-4">
          <div className="text-xs text-[#888]">Нийт алдаа</div>
          <div className="text-2xl font-extrabold text-[#111]">{errorSummary?.total || 0}</div>
        </div>
        <div className={`rounded-xl border p-4 ${(errorSummary?.open || 0) > 0 ? 'bg-red-50 border-red-200' : 'bg-emerald-50 border-emerald-200'}`}>
          <div className={`text-xs ${(errorSummary?.open || 0) > 0 ? 'text-red-600' : 'text-emerald-600'}`}>Нээлттэй</div>
          <div className={`text-2xl font-extrabold ${(errorSummary?.open || 0) > 0 ? 'text-red-700' : 'text-emerald-700'}`}>{errorSummary?.open || 0}</div>
        </div>
        <div className={`rounded-xl border p-4 ${(errorSummary?.critical || 0) > 0 ? 'bg-red-50 border-red-200' : 'bg-white border-[#E5E7EB]'}`}>
          <div className="text-xs text-red-600">🚨 Critical</div>
          <div className="text-2xl font-extrabold text-red-700">{errorSummary?.critical || 0}</div>
        </div>
        <div className="bg-amber-50 rounded-xl border border-amber-200 p-4">
          <div className="text-xs text-amber-600">⚠️ High</div>
          <div className="text-2xl font-extrabold text-amber-700">{errorSummary?.high || 0}</div>
        </div>
      </div>

      {/* Error Center + Source breakdown */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-5">
        {/* Error list */}
        <div className="xl:col-span-2 bg-white rounded-xl border border-[#E5E7EB] overflow-hidden">
          <div className="px-5 py-4 border-b border-[#E5E7EB] flex items-center justify-between flex-wrap gap-2">
            <h2 className="text-sm font-bold text-[#111]">🔴 Алдааны төв</h2>
            <div className="flex gap-1">
              <button onClick={() => setErrorFilter('')} className={`px-2 py-1 text-[10px] font-medium rounded-lg ${!errorFilter ? 'bg-[#FF6B00] text-white' : 'bg-[#F3F4F6] text-[#555]'}`}>Бүгд</button>
              {Object.entries(SOURCE_CFG).slice(0, 5).map(([k, v]) => (
                <button key={k} onClick={() => setErrorFilter(k)} className={`px-2 py-1 text-[10px] font-medium rounded-lg ${errorFilter === k ? 'bg-[#FF6B00] text-white' : 'bg-[#F3F4F6] text-[#555]'}`}>{v.icon}</button>
              ))}
            </div>
          </div>
          {loadingErrors ? (
            <div className="p-5"><div className="animate-pulse space-y-2">{[1,2,3].map(i => <div key={i} className="h-12 bg-gray-100 rounded-lg" />)}</div></div>
          ) : filteredErrors.length === 0 ? (
            <div className="p-8 text-center text-[#999]">
              <div className="text-3xl mb-2">✅</div>
              <div className="text-sm font-medium">Нээлттэй алдаа байхгүй</div>
              <div className="text-xs text-[#BBB] mt-1">Бүх систем хэвийн</div>
            </div>
          ) : (
            <div className="divide-y divide-[#F3F4F6]">
              {filteredErrors.slice(0, 10).map((err: any) => {
                const src = SOURCE_CFG[err.source] || { label: err.source, icon: '❓', color: '#999' }
                const sev = SEV_CFG[err.severity] || SEV_CFG.low
                return (
                  <div key={err.id} className="px-5 py-3 hover:bg-[#FAFAFA] transition-colors">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1 flex-wrap">
                          <span className="text-sm">{src.icon}</span>
                          <span className="text-[10px] font-bold px-1.5 py-0.5 rounded" style={{ background: src.color + '12', color: src.color }}>{src.label}</span>
                          <span className="text-[10px] font-bold px-1.5 py-0.5 rounded" style={{ background: sev.bg, color: sev.color }}>{sev.label}</span>
                          {err.occurrence_count > 1 && <span className="text-[10px] text-[#999]">×{err.occurrence_count}</span>}
                        </div>
                        <div className="text-xs text-[#333] truncate">{err.message}</div>
                        <div className="flex gap-3 mt-1 text-[10px] text-[#BBB]">
                          {err.endpoint && <span className="font-mono">{err.http_method} {err.endpoint}</span>}
                          {err.http_status && <span className={err.http_status >= 500 ? 'text-red-400' : 'text-amber-400'}>{err.http_status}</span>}
                          <span>{new Date(err.created_at).toLocaleString('mn')}</span>
                        </div>
                      </div>
                      <button onClick={() => resolveError(err.id)} className="text-[10px] font-medium text-emerald-600 bg-emerald-50 px-2 py-1 rounded-lg border border-emerald-200 hover:bg-emerald-100 flex-shrink-0">
                        ✓ Шийдэх
                      </button>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* Source breakdown + Queue */}
        <div className="space-y-5">
          {/* By source */}
          <div className="bg-white rounded-xl border border-[#E5E7EB] p-5">
            <h2 className="text-sm font-bold text-[#111] mb-3">Эх үүсвэрээр</h2>
            <div className="space-y-2">
              {(errorSummary?.by_source || []).map((s: any) => {
                const cfg = SOURCE_CFG[s.source] || { label: s.source, icon: '❓', color: '#999' }
                return (
                  <div key={s.source} className="flex items-center justify-between text-xs cursor-pointer hover:bg-[#F8F8F8] rounded-lg px-2 py-1.5 -mx-2" onClick={() => setErrorFilter(s.source)}>
                    <div className="flex items-center gap-2">
                      <span>{cfg.icon}</span>
                      <span className="text-[#555]">{cfg.label}</span>
                    </div>
                    <span className="font-bold" style={{ color: cfg.color }}>{s.count}</span>
                  </div>
                )
              })}
              {!(errorSummary?.by_source?.length) && <div className="text-xs text-[#BBB] text-center py-4">Алдаа байхгүй ✅</div>}
            </div>
          </div>

          {/* Queue Monitor */}
          <div className="bg-white rounded-xl border border-[#E5E7EB] p-5">
            <h2 className="text-sm font-bold text-[#111] mb-3">📮 Queue (BullMQ)</h2>
            <div className="grid grid-cols-3 gap-2 text-center">
              <div className="bg-amber-50 rounded-lg py-2"><div className="text-lg font-extrabold text-amber-600">0</div><div className="text-[9px] text-amber-500">Хүлээж буй</div></div>
              <div className="bg-blue-50 rounded-lg py-2"><div className="text-lg font-extrabold text-blue-600">0</div><div className="text-[9px] text-blue-500">Ажиллаж буй</div></div>
              <div className="bg-red-50 rounded-lg py-2"><div className="text-lg font-extrabold text-red-600">0</div><div className="text-[9px] text-red-500">Алдаатай</div></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

/* ═══ MAIN DASHBOARD ═══ */
export default function AdminDashboard() {
  const router = useRouter()
  const [orders, setOrders] = useState<any[]>([])
  const [users, setUsers] = useState<any[]>([])
  const [quotes, setQuotes] = useState<any[]>([])
  const [summary, setSummary] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [user, setUser] = useState<any>(null)

  useEffect(() => {
    const token = getToken()
    if (!token) { router.push('/login'); return }
    try { setUser(JSON.parse(localStorage.getItem('user') || '{}')) } catch {}

    Promise.all([
      apiFetch<any>('/orders').catch(() => []),
      apiFetch<any>('/admin/users').catch(() => []),
      apiFetch<any>('/quote').catch(() => []),
      apiFetch<any>('/reports/summary').catch(() => null),
    ]).then(([o, u, q, s]) => {
      setOrders(Array.isArray(o) ? o : [])
      setUsers(Array.isArray(u) ? u : [])
      setQuotes(Array.isArray(q) ? q : [])
      setSummary(s)
    }).finally(() => setLoading(false))
  }, [router])

  /* ── Computed ── */
  const stats = useMemo(() => {
    const paid = orders.filter(o => !['CANCELLED', 'DRAFT'].includes(o.status))
    const revenue = paid.reduce((s, o) => s + Number(o.total_price || 0), 0)
    const pending = orders.filter(o => ['DRAFT', 'QUOTATION_SENT', 'PENDING_FILE'].includes(o.status))
    const pendingValue = pending.reduce((s, o) => s + Number(o.total_price || 0), 0)

    // Pipeline
    const pipeline: Record<string, { count: number; value: number }> = {}
    orders.forEach(o => {
      const s = o.status || 'DRAFT'
      if (!pipeline[s]) pipeline[s] = { count: 0, value: 0 }
      pipeline[s].count++
      pipeline[s].value += Number(o.total_price || 0)
    })

    // Status breakdown
    const statusCounts: Record<string, number> = {}
    orders.forEach(o => { statusCounts[o.status || 'DRAFT'] = (statusCounts[o.status || 'DRAFT'] || 0) + 1 })

    // Daily revenue (last 7 days)
    const dailyRevenue: { date: string; value: number }[] = []
    for (let i = 6; i >= 0; i--) {
      const d = new Date(); d.setDate(d.getDate() - i)
      const ds = d.toISOString().split('T')[0]
      const dayOrders = orders.filter(o => o.created_at?.startsWith(ds))
      dailyRevenue.push({ date: d.toLocaleDateString('mn', { month: 'short', day: 'numeric' }), value: dayOrders.reduce((s, o) => s + Number(o.total_price || 0), 0) })
    }

    // User breakdown
    const roleCount: Record<string, number> = {}
    users.forEach(u => { roleCount[u.role || 'customer'] = (roleCount[u.role || 'customer'] || 0) + 1 })

    // Conversion rate
    const convRate = quotes.length > 0 ? Math.round((orders.filter(o => o.status !== 'CANCELLED').length / quotes.length) * 100) : 0

    return { revenue, pendingValue, pipeline, statusCounts, dailyRevenue, roleCount, convRate, pending }
  }, [orders, users, quotes])

  /* ── Alerts ── */
  const alerts = useMemo(() => {
    const list: { severity: 'high' | 'medium' | 'low'; message: string; action?: string; href?: string }[] = []

    // Stuck orders (> 48h in same status)
    const now = Date.now()
    const stuckOrders = orders.filter(o => {
      if (['COMPLETED', 'CANCELLED', 'DELIVERED'].includes(o.status)) return false
      const updated = new Date(o.updated_at || o.created_at).getTime()
      return (now - updated) > 48 * 3600000
    })
    if (stuckOrders.length > 0) list.push({ severity: 'high', message: `${stuckOrders.length} захиалга 48+ цаг шилжилтгүй байна`, action: 'Харах →', href: '/admin/orders' })

    // High value pending
    const highValue = orders.filter(o => ['DRAFT', 'PENDING_FILE'].includes(o.status) && Number(o.total_price) > 500000)
    if (highValue.length > 0) list.push({ severity: 'medium', message: `${highValue.length} өндөр дүнтэй захиалга хүлээгдэж байна (₮500K+)`, action: 'Харах →', href: '/admin/orders' })

    // Low conversion
    if (stats.convRate < 15 && quotes.length > 5) list.push({ severity: 'medium', message: `Хөрвүүлэлтийн хувь бага: ${stats.convRate}%`, href: '/admin/reports' })

    // Profit warning from reports
    if (summary?.total_profit != null && summary.total_profit < 0) list.push({ severity: 'high', message: `Нийт ашиг сөрөг: ${fmt(summary.total_profit)}`, action: 'Тайлан →', href: '/admin/reports' })

    if (list.length === 0) list.push({ severity: 'low', message: 'Бүх зүйл хэвийн ажиллаж байна ✓' })

    return list
  }, [orders, quotes, summary, stats.convRate])

  /* ── Insights ── */
  const insights = useMemo(() => {
    const list: string[] = []
    const topProduct = orders.reduce((acc: Record<string, number>, o) => { acc[o.product_name || 'Unknown'] = (acc[o.product_name || 'Unknown'] || 0) + 1; return acc }, {})
    const topEntry = Object.entries(topProduct).sort((a, b) => b[1] - a[1])[0]
    if (topEntry) list.push(`📦 Хамгийн эрэлттэй бүтээгдэхүүн: "${topEntry[0]}" (${topEntry[1]} захиалга)`)

    if (summary?.avg_margin_rate) list.push(`📊 Дундаж margin: ${Number(summary.avg_margin_rate).toFixed(1)}%`)
    if (stats.convRate > 0) list.push(`🎯 Хөрвүүлэлт: Үнийн санал → Захиалга = ${stats.convRate}%`)

    const todayOrders = orders.filter(o => new Date(o.created_at).toDateString() === new Date().toDateString())
    if (todayOrders.length > 0) list.push(`📈 Өнөөдөр ${todayOrders.length} захиалга, ₮${todayOrders.reduce((s, o) => s + Number(o.total_price || 0), 0).toLocaleString()} орлого`)

    return list
  }, [orders, summary, stats.convRate])

  const [dashTab, setDashTab] = useState<'business' | 'system' | 'actions'>('business')

  if (loading) return <div className="p-6"><div className="animate-pulse space-y-4"><div className="h-8 bg-gray-100 rounded w-48" /><div className="grid grid-cols-3 gap-4">{[1,2,3,4,5,6].map(i => <div key={i} className="h-24 bg-gray-100 rounded-xl" />)}</div></div></div>

  const today = new Date().toLocaleDateString('mn-MN', { year: 'numeric', month: 'long', day: 'numeric', weekday: 'long' })
  const s = summary

  // System services for infra tab
  const systemServices = [
    { name: 'Backend API', endpoint: '/health', icon: '🖥️', port: 4000 },
    { name: 'WebSocket Chat', endpoint: '/chat', icon: '💬', port: 4000 },
    { name: 'Database (PostgreSQL)', endpoint: 'db', icon: '🗄️', port: 5432 },
    { name: 'Redis Cache', endpoint: 'redis', icon: '⚡', port: 6379 },
    { name: 'BullMQ Queue', endpoint: 'queue', icon: '📮', port: 6379 },
  ]

  return (
    <div className="p-4 md:p-6 max-w-[1400px] mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-4">
        <div>
          <h1 className="text-2xl font-extrabold text-[#111] tracking-tight">Control Tower</h1>
          <p className="text-sm text-[#888] mt-0.5">{user?.email ? `${user.full_name || user.email} — ` : ''}{today}</p>
        </div>
        <div className="flex gap-2">
          <a href="/admin/reports" className="px-3 py-1.5 text-xs font-semibold bg-white border border-[#E5E7EB] rounded-lg hover:border-[#FF6B00] transition-colors no-underline text-[#555]">📊 Тайлан</a>
          <a href="/admin/orders" className="px-3 py-1.5 text-xs font-bold bg-[#FF6B00] text-white rounded-lg hover:bg-[#E55D00] transition-colors no-underline">📋 Захиалгууд</a>
        </div>
      </div>

      {/* ═══ ALERTS ═══ */}
      {alerts.length > 0 && alerts[0].severity !== 'low' && (
        <div className="space-y-2 mb-4">
          {alerts.filter(a => a.severity !== 'low').map((a, i) => <AlertItem key={i} {...a} />)}
        </div>
      )}

      {/* ═══ LAYER TABS ═══ */}
      <div className="flex gap-1 mb-5">
        {[
          { key: 'business' as const, label: '📈 Бизнес', desc: 'KPI, Pipeline, Орлого' },
          { key: 'system' as const, label: '🖥️ Систем', desc: 'Инфра, Сервисүүд, Лог' },
          { key: 'actions' as const, label: '⚡ Үйлдэл', desc: 'Шууд хяналт' },
        ].map(t => (
          <button key={t.key} onClick={() => setDashTab(t.key)}
            className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
              dashTab === t.key ? 'bg-[#FF6B00] text-white shadow-md shadow-orange-500/20' : 'bg-white text-[#555] border border-[#E5E7EB] hover:border-[#FF6B00]'
            }`}>
            {t.label}
          </button>
        ))}
      </div>

      {/* ═══ BUSINESS TAB ═══ */}
      {dashTab === 'business' && <>

      {/* ═══ KPI CARDS ═══ */}
      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-3 mb-5">
        <KpiCard icon="💰" label="Нийт орлого" value={fmt(stats.revenue)}
          change={s?.previous ? change(s.total_revenue, s.previous.total_revenue) : null}
          sub={`${orders.filter(o => o.status !== 'CANCELLED').length} захиалга`} onClick={() => router.push('/admin/reports')} />
        <KpiCard icon="📈" label="Цэвэр ашиг" value={s ? fmt(s.total_profit) : '—'} color={s?.total_profit < 0 ? '#EF4444' : '#10B981'}
          change={s?.previous ? change(s.total_profit, s.previous.total_profit) : null}
          onClick={() => router.push('/admin/reports')} />
        <KpiCard icon="⏳" label="Хүлээгдэж буй" value={fmt(stats.pendingValue)} color="#F59E0B"
          sub={`${stats.pending.length} захиалга`} onClick={() => router.push('/admin/orders')} />
        <KpiCard icon="🏦" label="Шимтгэл" value={s ? fmt(s.total_commission) : '—'} color="#8B5CF6" />
        <KpiCard icon="👥" label="Хэрэглэгчид" value={String(users.length)} color="#3B82F6"
          sub={`${stats.roleCount['vendor'] || 0} vendor, ${stats.roleCount['designer'] || 0} designer`} />
        <KpiCard icon="🎯" label="Хөрвүүлэлт" value={`${stats.convRate}%`} color="#EC4899"
          sub={`${quotes.length} санал → ${orders.length} захиалга`} />
      </div>

      {/* ═══ PIPELINE + INSIGHTS ═══ */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-5 mb-5">
        {/* Pipeline */}
        <div className="xl:col-span-2 bg-white rounded-xl border border-[#E5E7EB] p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-bold text-[#111]">Захиалгын Pipeline</h2>
            <a href="/admin/orders" className="text-xs text-[#FF6B00] font-semibold no-underline hover:underline">Бүгдийг харах →</a>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
            {[
              { key: 'PENDING_FILE', label: 'Хүлээгдэж буй', icon: '⏳', color: '#F59E0B' },
              { key: 'FILE_REVIEW', label: 'Файл шалгалт', icon: '🔍', color: '#8B5CF6' },
              { key: 'IN_PRODUCTION', label: 'Үйлдвэрлэлд', icon: '🏭', color: '#EC4899' },
              { key: 'DISPATCHED', label: 'Хүргэлтэнд', icon: '🚚', color: '#06B6D4' },
              { key: 'COMPLETED', label: 'Дууссан', icon: '✅', color: '#10B981' },
            ].map(stage => {
              const data = stats.pipeline[stage.key] || { count: 0, value: 0 }
              const maxCount = Math.max(...Object.values(stats.pipeline).map((p: any) => p.count || 0), 1)
              const barWidth = (data.count / maxCount) * 100
              return (
                <div key={stage.key} className="bg-[#F8F8F8] rounded-xl p-3 hover:shadow-md transition-all cursor-pointer group" onClick={() => router.push('/admin/orders')}>
                  <div className="flex items-center gap-1.5 mb-2">
                    <span className="text-sm">{stage.icon}</span>
                    <span className="text-[11px] text-[#888] truncate">{stage.label}</span>
                  </div>
                  <div className="text-xl font-extrabold mb-2 group-hover:scale-105 transition-transform origin-left" style={{ color: stage.color }}>{data.count}</div>
                  {/* Energy Bar */}
                  <div className="h-1.5 bg-[#E5E7EB] rounded-full overflow-hidden mb-1.5">
                    <div className="h-full rounded-full transition-all duration-700 ease-out" style={{ width: `${barWidth}%`, background: `linear-gradient(90deg, ${stage.color}, ${stage.color}88)`, boxShadow: data.count > 0 ? `0 0 8px ${stage.color}44` : 'none' }} />
                  </div>
                  <div className="text-[10px] text-[#BBB]">{fmt(data.value)}</div>
                </div>
              )
            })}
          </div>
        </div>

        {/* Insights */}
        <div className="bg-white rounded-xl border border-[#E5E7EB] p-5">
          <h2 className="text-base font-bold text-[#111] mb-3">🧠 Ухаалаг мэдээлэл</h2>
          <div className="space-y-2.5">
            {insights.map((ins, i) => {
              const dotColor = ins.includes('🔴') || ins.includes('анхааруулга') ? '#EF4444' : ins.includes('📈') || ins.includes('өслөө') ? '#10B981' : ins.includes('💡') ? '#F59E0B' : '#3B82F6'
              return (
              <div key={i} className="flex items-start gap-3 text-xs text-[#555] bg-[#F8F8F8] rounded-lg px-3 py-2.5 leading-relaxed hover:bg-[#F0F0F0] transition-colors">
                <div className="w-2 h-2 rounded-full mt-1 flex-shrink-0" style={{ background: dotColor, boxShadow: `0 0 6px ${dotColor}44` }} />
                <span>{ins}</span>
              </div>
              )
            })}
            {alerts.filter(a => a.severity === 'low').map((a, i) => (
              <div key={i} className="text-xs text-emerald-600 bg-emerald-50 rounded-lg px-3 py-2.5">{a.message}</div>
            ))}
          </div>
        </div>
      </div>

      {/* ═══ CHART + STATUS BREAKDOWN ═══ */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-5 mb-5">
        {/* Revenue chart */}
        <div className="xl:col-span-2 bg-white rounded-xl border border-[#E5E7EB] p-5">
          <h2 className="text-base font-bold text-[#111] mb-4">Орлогын чиг хандлага (7 хоног)</h2>
          <div className="flex items-end gap-2 h-[160px]">
            {stats.dailyRevenue.map((d, i) => {
              const maxVal = Math.max(...stats.dailyRevenue.map(x => x.value), 1)
              const h = Math.max((d.value / maxVal) * 140, 4)
              const isToday = i === stats.dailyRevenue.length - 1
              return (
                <div key={i} className="flex-1 flex flex-col items-center gap-1 group relative">
                  {/* Tooltip */}
                  <div className="absolute bottom-full mb-1 bg-[#111] text-white text-[10px] px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10">
                    {fmt(d.value)}
                  </div>
                  <div className={`w-full rounded-t-md transition-all ${isToday ? 'bg-[#FF6B00]' : 'bg-[#FF6B00]/30'}`} style={{ height: h }} />
                  <span className={`text-[9px] ${isToday ? 'text-[#FF6B00] font-bold' : 'text-[#BBB]'}`}>{d.date}</span>
                </div>
              )
            })}
          </div>
        </div>

        {/* Status breakdown */}
        <div className="bg-white rounded-xl border border-[#E5E7EB] p-5">
          <h2 className="text-base font-bold text-[#111] mb-3">Захиалгын төлөв</h2>
          <div className="text-xs text-[#888] mb-3">Нийт {orders.length}</div>
          <div className="space-y-2">
            {Object.entries(stats.statusCounts).sort((a, b) => b[1] - a[1]).slice(0, 7).map(([status, count]) => {
              const cfg = STATUS_MAP[status] || { label: status, color: '#999' }
              const w = pct(count, orders.length)
              return (
                <div key={status}>
                  <div className="flex justify-between text-[11px] mb-0.5">
                    <span className="font-medium" style={{ color: cfg.color }}>{cfg.label}</span>
                    <span className="text-[#888]">{count} ({w}%)</span>
                  </div>
                  <div className="w-full h-1.5 bg-[#F3F4F6] rounded-full overflow-hidden">
                    <div className="h-full rounded-full transition-all" style={{ width: `${w}%`, background: cfg.color }} />
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>

      {/* ═══ RECENT ORDERS + QUICK ACTIONS ═══ */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-5 mb-5">
        {/* Recent orders */}
        <div className="xl:col-span-2 bg-white rounded-xl border border-[#E5E7EB] overflow-hidden">
          <div className="px-5 py-4 border-b border-[#E5E7EB] flex justify-between items-center">
            <h2 className="text-base font-bold text-[#111]">Сүүлийн захиалгууд</h2>
            <a href="/admin/orders" className="text-xs text-[#FF6B00] font-semibold no-underline">Бүгдийг →</a>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="text-[10px] text-[#888] uppercase tracking-wider border-b border-[#E5E7EB]">
                  <th className="text-left px-5 py-2.5">ID</th>
                  <th className="text-left px-3 py-2.5">Хэрэглэгч</th>
                  <th className="text-left px-3 py-2.5">Бүтээгдэхүүн</th>
                  <th className="text-right px-3 py-2.5">Дүн</th>
                  <th className="text-center px-3 py-2.5">Төлөв</th>
                  <th className="text-right px-5 py-2.5">Огноо</th>
                </tr>
              </thead>
              <tbody>
                {orders.slice(0, 8).map((o, i) => {
                  const st = STATUS_MAP[o.status] || { label: o.status, color: '#999' }
                  return (
                    <tr key={o.id || i} className="border-t border-[#F3F4F6] hover:bg-[#FAFAFA] transition-colors cursor-pointer" onClick={() => router.push('/admin/orders')}>
                      <td className="px-5 py-2.5 font-mono text-[#999]">#{(o.id || '').slice(-6)}</td>
                      <td className="px-3 py-2.5 font-medium text-[#111]">{o.customer_name || o.customer_email || 'Зочин'}</td>
                      <td className="px-3 py-2.5 text-[#555] truncate max-w-[140px]">{o.product_name || '—'}</td>
                      <td className="px-3 py-2.5 text-right font-bold text-[#FF6B00]">{fmt(Number(o.total_price || 0))}</td>
                      <td className="px-3 py-2.5 text-center">
                        <span className="text-[9px] font-bold px-2 py-0.5 rounded-full" style={{ background: st.color + '15', color: st.color }}>{st.label}</span>
                      </td>
                      <td className="px-5 py-2.5 text-right text-[#999]">{o.created_at ? new Date(o.created_at).toLocaleDateString('mn') : ''}</td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Quick Actions + User Breakdown + System */}
        <div className="space-y-5">
          {/* Quick actions */}
          <div className="bg-white rounded-xl border border-[#E5E7EB] p-5">
            <h2 className="text-base font-bold text-[#111] mb-3">Шууд үйлдлүүд</h2>
            <div className="space-y-1.5">
              {[
                { label: 'Захиалгууд', icon: '📋', href: '/admin/orders' },
                { label: 'Шинэ бүтээгдэхүүн', icon: '➕', href: '/admin/products' },
                { label: 'Vendor удирдлага', icon: '🏭', href: '/admin/vendors' },
                { label: 'Ашгийн тайлан', icon: '📊', href: '/admin/reports' },
                { label: 'Тохиргоо', icon: '⚙️', href: '/admin/settings' },
              ].map(a => (
                <a key={a.label} href={a.href} className="flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm text-[#333] font-medium no-underline hover:bg-[#F8F8F8] transition-colors">
                  <span>{a.icon}</span> {a.label} <span className="ml-auto text-[#CCC]">→</span>
                </a>
              ))}
            </div>
          </div>

          {/* User breakdown */}
          <div className="bg-white rounded-xl border border-[#E5E7EB] p-5">
            <h2 className="text-sm font-bold text-[#111] mb-3">Хэрэглэгчийн бүтэц</h2>
            <div className="space-y-2">
              {[
                { role: 'admin', label: 'Админ', color: '#FF6B00' },
                { role: 'vendor', label: 'Vendor', color: '#F59E0B' },
                { role: 'designer', label: 'Дизайнер', color: '#8B5CF6' },
                { role: 'sales', label: 'Борлуулалт', color: '#3B82F6' },
                { role: 'courier', label: 'Курьер', color: '#10B981' },
                { role: 'customer', label: 'Хэрэглэгч', color: '#6B7280' },
              ].map(r => (
                <div key={r.role} className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full" style={{ background: r.color }} />
                    <span className="text-[#555]">{r.label}</span>
                  </div>
                  <span className="font-bold" style={{ color: r.color }}>{stats.roleCount[r.role] || 0}</span>
                </div>
              ))}
            </div>
          </div>

          {/* System status mini */}
          <div className="bg-white rounded-xl border border-[#E5E7EB] p-5">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-sm font-bold text-[#111]">Систем</h2>
              <button onClick={() => setDashTab('system')} className="text-[10px] text-[#FF6B00] font-semibold hover:underline">Дэлгэрэнгүй →</button>
            </div>
            <div className="space-y-2">
              {systemServices.slice(0, 3).map(svc => (
                <div key={svc.name} className="flex items-center justify-between text-xs">
                  <span className="text-[#555]">{svc.icon} {svc.name}</span>
                  <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded">online</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
      </>}

      {/* ═══════════════════════════════════════════
         SYSTEM / INFRA TAB
         ═══════════════════════════════════════════ */}
      {dashTab === 'system' && <SystemTab services={systemServices} />}

      {/* ═══════════════════════════════════════════
         ACTIONS TAB
         ═══════════════════════════════════════════ */}
      {dashTab === 'actions' && (
        <div>
          {/* Quick Actions Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 mb-6">
            {[
              { icon: '📋', label: 'Захиалга удирдах', desc: 'Захиалга үүсгэх, засах, vendor солих', href: '/admin/orders', color: '#FF6B00' },
              { icon: '🏭', label: 'Vendor удирдлага', desc: 'Vendor бүртгэх, tier шинэчлэх', href: '/admin/vendors', color: '#8B5CF6' },
              { icon: '📊', label: 'Ашгийн тайлан', desc: 'Санхүүгийн дэлгэрэнгүй тайлан', href: '/admin/reports', color: '#10B981' },
              { icon: '🎨', label: 'Дизайн хүсэлт', desc: 'Дизайнер томилох, хянах', href: '/admin/design-requests', color: '#3B82F6' },
              { icon: '⚙️', label: 'Систем тохиргоо', desc: 'Үнэ, шимтгэл, feature flags', href: '/admin/settings', color: '#F59E0B' },
              { icon: '🔗', label: 'Webhook / Интеграц', desc: 'Event-driven integration', href: '/admin/webhooks', color: '#EC4899' },
              { icon: '📦', label: 'Бүтээгдэхүүн', desc: 'Каталог удирдах', href: '/admin/products', color: '#06B6D4' },
              { icon: '👥', label: 'Хэрэглэгчид', desc: 'CRM, хэрэглэгчийн мэдээлэл', href: '/admin/customers', color: '#6366F1' },
              { icon: '💬', label: 'Чат', desc: 'Хэрэглэгчтэй харилцах', href: '/admin/chat', color: '#F97316' },
            ].map(a => (
              <a key={a.label} href={a.href} className="bg-white rounded-xl border border-[#E5E7EB] p-5 no-underline hover:shadow-md hover:-translate-y-0.5 transition-all group">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center text-xl" style={{ background: a.color + '12' }}>{a.icon}</div>
                  <div>
                    <div className="text-sm font-bold text-[#111] group-hover:text-[#FF6B00] transition-colors">{a.label}</div>
                    <div className="text-[11px] text-[#888]">{a.desc}</div>
                  </div>
                  <span className="ml-auto text-[#CCC] group-hover:text-[#FF6B00] transition-colors">→</span>
                </div>
              </a>
            ))}
          </div>

          {/* Debug: Order lookup */}
          <div className="bg-white rounded-xl border border-[#E5E7EB] p-5">
            <h2 className="text-base font-bold text-[#111] mb-3">🔍 Захиалга хайх (Debug)</h2>
            <div className="flex gap-2">
              <input placeholder="Захиалгын ID оруулах..." className="flex-1 px-3 py-2.5 border border-[#E5E7EB] rounded-lg text-sm outline-none focus:border-[#FF6B00] transition-colors font-mono" />
              <button className="px-4 py-2.5 bg-[#FF6B00] hover:bg-[#E55D00] text-white rounded-lg text-sm font-bold transition-colors">Хайх</button>
            </div>
            <div className="text-xs text-[#999] mt-2">Захиалгын бүрэн event flow, лог, timeline, алдааг харна</div>
          </div>
        </div>
      )}

      {/* Speed Dial FAB */}
      <SpeedDial />
    </div>
  )
}

/* ═══ Speed Dial Component ═══ */
function SpeedDial() {
  const [open, setOpen] = useState(false)
  const router = useRouter()
  const actions = [
    { icon: '📦', label: 'Шинэ захиалга', href: '/admin/orders', color: '#FF6B00' },
    { icon: '📊', label: 'Тайлан харах', href: '/admin/reports', color: '#3B82F6' },
    { icon: '🔔', label: 'Мэдэгдэл илгээх', href: '/admin/marketing', color: '#8B5CF6' },
    { icon: '⚙️', label: 'Системийн лог', href: '/admin/system', color: '#10B981' },
  ]

  return (
    <>
      {open && <div onClick={() => setOpen(false)} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.3)', zIndex: 98 }} />}
      <div style={{ position: 'fixed', bottom: 24, right: 24, zIndex: 99, display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 8 }}>
        {open && actions.map((a, i) => (
          <div key={i} onClick={() => { router.push(a.href); setOpen(false) }}
            style={{
              display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer',
              padding: '8px 14px 8px 12px', borderRadius: 12,
              background: 'white', border: '1px solid #E5E7EB',
              boxShadow: '0 4px 16px rgba(0,0,0,0.08)',
              animation: `fadeIn 0.15s ease ${i * 0.05}s both`,
            }}>
            <span style={{ fontSize: 16 }}>{a.icon}</span>
            <span style={{ fontSize: 12, fontWeight: 600, color: '#333', whiteSpace: 'nowrap' }}>{a.label}</span>
          </div>
        ))}
        <button onClick={() => setOpen(!open)} style={{
          width: 48, height: 48, borderRadius: 16, border: 'none',
          background: open ? '#333' : '#FF6B00', color: '#fff',
          fontSize: 20, cursor: 'pointer',
          boxShadow: open ? '0 4px 16px rgba(0,0,0,0.15)' : '0 4px 20px rgba(255,107,0,0.3)',
          transition: 'all 0.2s', transform: open ? 'rotate(45deg)' : 'none',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>+</button>
      </div>
      <style>{`@keyframes fadeIn{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}}`}</style>
    </>
  )
}
