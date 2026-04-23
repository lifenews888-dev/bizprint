'use client'

import { apiFetch, getToken } from '@/lib/api'
import { useEffect, useState, useCallback, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import DashboardLayout from '@/components/layouts/DashboardLayout'
import { useRoleGuard } from '@/lib/use-role-guard'
import { SALES_MENU } from '@/config/sidebar-config'

interface OrderRow {
  id: string
  customer_id: string
  customer_name: string | null
  customer_email: string | null
  product_name: string | null
  quantity: number
  total_price: number
  status: string
  payment_status: string | null
  created_at: string
  delivered_at: string | null
  commission: {
    id: string
    amount: number
    rate: number
    status: string
    paid_at: string | null
  } | null
}

interface QuoteRow { id: string; status: string; total_price: number; created_at: string }
interface CustomerRow { id: string; order_count: number; lifetime_value: number; created_at: string }
interface SalesSummary { totalOrders: number; pendingAmount: number; paidAmount: number; totalRevenue: number }

type Range = '7d' | '30d' | '90d' | 'all'

export default function SalesReportsPage() {
  const router = useRouter()
  const { user, loading: authLoading } = useRoleGuard(['sales', 'admin'])
  const [orders, setOrders] = useState<OrderRow[]>([])
  const [quotes, setQuotes] = useState<QuoteRow[]>([])
  const [customers, setCustomers] = useState<CustomerRow[]>([])
  const [summary, setSummary] = useState<SalesSummary | null>(null)
  const [loading, setLoading] = useState(true)
  const [range, setRange] = useState<Range>('30d')

  const load = useCallback(() => {
    Promise.all([
      apiFetch<OrderRow[]>('/sales/me/orders').catch(() => []),
      apiFetch<QuoteRow[]>('/sales/me/quotes').catch(() => []),
      apiFetch<CustomerRow[]>('/sales/me/customers').catch(() => []),
      apiFetch<SalesSummary>('/commission/sales/me/summary').catch(() => null),
    ]).then(([o, q, c, s]) => {
      setOrders(Array.isArray(o) ? o : [])
      setQuotes(Array.isArray(q) ? q : [])
      setCustomers(Array.isArray(c) ? c : [])
      if (s) setSummary(s)
      setLoading(false)
    })
  }, [])

  useEffect(() => {
    if (authLoading) return
    if (!getToken()) { router.push('/login'); return }
    load()
  }, [authLoading, load, router])

  const cutoff = useMemo(() => {
    if (range === 'all') return 0
    const days = range === '7d' ? 7 : range === '30d' ? 30 : 90
    return Date.now() - days * 24 * 60 * 60 * 1000
  }, [range])

  const inRange = (d: string) => cutoff === 0 || new Date(d).getTime() >= cutoff

  // ── Aggregations scoped to range ──
  const rangedOrders = orders.filter(o => inRange(o.created_at))
  const rangedQuotes = quotes.filter(q => inRange(q.created_at))
  const rangedCustomers = customers.filter(c => inRange(c.created_at))

  const totalRevenue = rangedOrders.reduce((s, o) => s + Number(o.total_price || 0), 0)
  const totalCommission = rangedOrders.reduce((s, o) => s + Number(o.commission?.amount || 0), 0)
  const paidCommission = rangedOrders
    .filter(o => o.commission?.status === 'paid' || o.commission?.status === 'approved')
    .reduce((s, o) => s + Number(o.commission!.amount || 0), 0)
  const pendingCommission = rangedOrders
    .filter(o => o.commission?.status === 'pending')
    .reduce((s, o) => s + Number(o.commission!.amount || 0), 0)

  // ── Funnel ──
  const funnelCustomers = rangedCustomers.length
  const funnelQuotes = rangedQuotes.length
  const funnelOrders = rangedOrders.length
  const funnelPaid = rangedOrders.filter(o => ['delivered', 'completed'].includes(o.status)).length
  const quoteToOrder = funnelQuotes > 0 ? (funnelOrders / funnelQuotes) * 100 : 0
  const customerToOrder = funnelCustomers > 0 ? (funnelOrders / funnelCustomers) * 100 : 0

  // ── Status distribution ──
  const orderByStatus: Record<string, number> = {}
  for (const o of rangedOrders) orderByStatus[o.status] = (orderByStatus[o.status] || 0) + 1

  // ── Top customers by LTV ──
  const topCustomers = [...customers]
    .filter(c => c.order_count > 0)
    .sort((a, b) => Number(b.lifetime_value) - Number(a.lifetime_value))
    .slice(0, 5)

  // ── Daily time-series (last N days) ──
  const days = range === '7d' ? 7 : range === '30d' ? 30 : range === '90d' ? 90 : 30
  const series = useMemo(() => {
    const buckets: { date: string; revenue: number; commission: number; orders: number }[] = []
    const now = new Date()
    for (let i = days - 1; i >= 0; i--) {
      const d = new Date(now)
      d.setDate(d.getDate() - i)
      d.setHours(0, 0, 0, 0)
      buckets.push({ date: d.toISOString().slice(0, 10), revenue: 0, commission: 0, orders: 0 })
    }
    const byDate = new Map(buckets.map(b => [b.date, b]))
    for (const o of orders) {
      const k = new Date(o.created_at).toISOString().slice(0, 10)
      const b = byDate.get(k)
      if (!b) continue
      b.revenue += Number(o.total_price || 0)
      b.commission += Number(o.commission?.amount || 0)
      b.orders += 1
    }
    return buckets
  }, [orders, days])

  const maxRevenue = Math.max(1, ...series.map(s => s.revenue))

  if (authLoading) return <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text2)' }}>Ачаалж байна...</div>

  return (
    <DashboardLayout navGroups={SALES_MENU} user={user || undefined}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20, gap: 12, flexWrap: 'wrap' }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 700, margin: 0 }}>Тайлан</h1>
          <p style={{ color: 'var(--text2)', fontSize: 13, margin: '4px 0 0' }}>
            Борлуулалтын бүрэн аналитик, хөрвөлт, топ хэрэглэгч
          </p>
        </div>
        <div style={{ display: 'flex', gap: 4, background: 'var(--surface2)', border: '1px solid var(--border)', borderRadius: 8, padding: 3 }}>
          {([
            { k: '7d', label: '7 хоног' },
            { k: '30d', label: '30 хоног' },
            { k: '90d', label: '90 хоног' },
            { k: 'all', label: 'Бүгд' },
          ] as { k: Range; label: string }[]).map(t => {
            const active = range === t.k
            return (
              <button key={t.k} onClick={() => setRange(t.k)}
                style={{
                  padding: '7px 14px', borderRadius: 6, border: 'none',
                  background: active ? '#FF6B00' : 'transparent',
                  color: active ? '#fff' : 'var(--text2)',
                  fontSize: 12, fontWeight: 600, cursor: 'pointer',
                }}>
                {t.label}
              </button>
            )
          })}
        </div>
      </div>

      {loading ? (
        <div style={{ padding: 40, textAlign: 'center', color: 'var(--text2)' }}>Уншиж байна...</div>
      ) : (
        <>
          {/* KPI row */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 12, marginBottom: 20 }}>
            <Kpi label="Орлого" value={totalRevenue.toLocaleString() + '₮'} color="#FF6B00" icon="💰" />
            <Kpi label="Нийт комисс" value={totalCommission.toLocaleString() + '₮'} color="#10B981" icon="🎯" />
            <Kpi label="Төлөгдсөн" value={paidCommission.toLocaleString() + '₮'} color="#378ADD" icon="✓" />
            <Kpi label="Хүлээгдэж буй" value={pendingCommission.toLocaleString() + '₮'} color="#F59E0B" icon="⏳" />
            <Kpi label="Захиалга" value={funnelOrders.toString()} color="#8B5CF6" icon="📦" />
          </div>

          {/* Time series */}
          <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 12, padding: 20, marginBottom: 20 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
              <div style={{ fontWeight: 700, fontSize: 15 }}>📈 Өдрийн орлого</div>
              <div style={{ fontSize: 11, color: 'var(--text3)' }}>{series.length} өдөр</div>
            </div>
            <div style={{ display: 'flex', alignItems: 'flex-end', gap: 2, height: 160, paddingTop: 10 }}>
              {series.map((b, i) => {
                const h = (b.revenue / maxRevenue) * 140
                return (
                  <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3, minWidth: 0 }}
                    title={`${b.date}\n${b.orders} захиалга\n${b.revenue.toLocaleString()}₮\nКомисс: ${b.commission.toLocaleString()}₮`}>
                    <div style={{
                      width: '100%',
                      height: h || 2,
                      background: b.revenue > 0 ? 'linear-gradient(180deg, #FF6B00, #FFA25C)' : 'var(--surface2)',
                      borderRadius: '3px 3px 0 0',
                      transition: 'height 0.3s',
                      minHeight: 2,
                    }} />
                    {(days <= 30 || i % Math.ceil(days / 20) === 0) && (
                      <div style={{ fontSize: 9, color: 'var(--text3)', whiteSpace: 'nowrap' }}>
                        {b.date.slice(5)}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </div>

          {/* Funnel + Status */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 20 }}>
            {/* Funnel */}
            <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 12, padding: 20 }}>
              <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 16 }}>🔻 Хөрвөлтийн юүлүүр</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                <FunnelRow label="Хэрэглэгч бүртгүүлсэн" value={funnelCustomers} maxValue={Math.max(funnelCustomers, 1)} color="#FF6B00" />
                <FunnelRow label="Үнийн санал үүсгэсэн" value={funnelQuotes} maxValue={Math.max(funnelCustomers, funnelQuotes, 1)} color="#378ADD" />
                <FunnelRow label="Захиалга өгсөн" value={funnelOrders} maxValue={Math.max(funnelCustomers, funnelQuotes, funnelOrders, 1)} color="#8B5CF6" />
                <FunnelRow label="Хүргэгдсэн" value={funnelPaid} maxValue={Math.max(funnelCustomers, funnelQuotes, funnelOrders, funnelPaid, 1)} color="#10B981" />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginTop: 16, paddingTop: 16, borderTop: '1px solid var(--border)' }}>
                <div>
                  <div style={{ fontSize: 11, color: 'var(--text3)' }}>Хэрэглэгч → Захиалга</div>
                  <div style={{ fontSize: 18, fontWeight: 700, color: '#FF6B00' }}>{customerToOrder.toFixed(1)}%</div>
                </div>
                <div>
                  <div style={{ fontSize: 11, color: 'var(--text3)' }}>Санал → Захиалга</div>
                  <div style={{ fontSize: 18, fontWeight: 700, color: '#10B981' }}>{quoteToOrder.toFixed(1)}%</div>
                </div>
              </div>
            </div>

            {/* Status breakdown */}
            <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 12, padding: 20 }}>
              <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 16 }}>📊 Захиалгын төлөв</div>
              {Object.keys(orderByStatus).length === 0 ? (
                <div style={{ padding: 20, textAlign: 'center', color: 'var(--text3)', fontSize: 13 }}>Мэдээлэл алга</div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {Object.entries(orderByStatus).sort((a, b) => b[1] - a[1]).map(([status, count]) => {
                    const pct = (count / funnelOrders) * 100
                    return (
                      <div key={status}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4, fontSize: 12 }}>
                          <span style={{ color: 'var(--text2)' }}>{statusMn(status)}</span>
                          <span style={{ fontWeight: 600 }}>{count} ({pct.toFixed(0)}%)</span>
                        </div>
                        <div style={{ height: 6, background: 'var(--surface2)', borderRadius: 3, overflow: 'hidden' }}>
                          <div style={{ height: '100%', width: pct + '%', background: statusColor(status), transition: 'width 0.3s' }} />
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          </div>

          {/* Top customers + Recent orders */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 20 }}>
            <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 12, padding: 20 }}>
              <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 14 }}>🏆 Топ 5 хэрэглэгч</div>
              {topCustomers.length === 0 ? (
                <div style={{ padding: 20, textAlign: 'center', color: 'var(--text3)', fontSize: 13 }}>Захиалгатай хэрэглэгч алга</div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {topCustomers.map((c, i) => (
                    <div key={c.id} style={{ display: 'flex', gap: 10, alignItems: 'center', padding: '8px 12px', background: 'var(--surface2)', borderRadius: 8 }}>
                      <div style={{ fontSize: 14, fontWeight: 700, color: i < 3 ? ['#FFD700','#C0C0C0','#CD7F32'][i] : 'var(--text2)', width: 22 }}>
                        {i < 3 ? ['🥇','🥈','🥉'][i] : '#' + (i + 1)}
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontFamily: 'monospace', fontSize: 11, color: 'var(--text3)' }}>{c.id.slice(0, 8)}…</div>
                      </div>
                      <span style={{ fontSize: 12, color: 'var(--text2)' }}>{c.order_count} захиалга</span>
                      <span style={{ fontSize: 13, fontWeight: 700, color: '#FF6B00', minWidth: 90, textAlign: 'right' }}>
                        {Number(c.lifetime_value).toLocaleString()}₮
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 12, padding: 20 }}>
              <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 14 }}>📦 Сүүлийн захиалгууд</div>
              {rangedOrders.slice(0, 6).length === 0 ? (
                <div style={{ padding: 20, textAlign: 'center', color: 'var(--text3)', fontSize: 13 }}>Захиалга алга</div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  {rangedOrders.slice(0, 6).map(o => (
                    <div key={o.id} style={{
                      display: 'grid',
                      gridTemplateColumns: '1fr 110px 90px',
                      gap: 8,
                      padding: '8px 12px',
                      background: 'var(--surface2)',
                      borderRadius: 6,
                      fontSize: 12,
                      alignItems: 'center',
                    }}>
                      <div style={{ minWidth: 0 }}>
                        <div style={{ fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {o.customer_name || o.customer_email || o.id.slice(0, 8)}
                        </div>
                        <div style={{ fontSize: 10, color: 'var(--text3)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {o.product_name || '—'}
                        </div>
                      </div>
                      <span style={{ textAlign: 'right', fontWeight: 700, color: '#FF6B00' }}>
                        {Number(o.total_price || 0).toLocaleString()}₮
                      </span>
                      <span style={{ textAlign: 'right', fontWeight: 600, color: statusColor(o.status) }}>
                        {statusMn(o.status)}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Summary footer */}
          {summary && (
            <div style={{ background: 'linear-gradient(135deg, rgba(255,107,0,0.05), rgba(139,92,246,0.05))', border: '1px solid var(--border)', borderRadius: 12, padding: 20 }}>
              <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 12 }}>🌐 Нийт дүн (бүх хугацаа)</div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 16 }}>
                <SumCell label="Нийт захиалга" value={summary.totalOrders.toString()} />
                <SumCell label="Нийт орлого" value={Number(summary.totalRevenue).toLocaleString() + '₮'} />
                <SumCell label="Хүлээгдэж буй" value={Number(summary.pendingAmount).toLocaleString() + '₮'} color="#F59E0B" />
                <SumCell label="Төлөгдсөн" value={Number(summary.paidAmount).toLocaleString() + '₮'} color="#10B981" />
              </div>
            </div>
          )}
        </>
      )}
    </DashboardLayout>
  )
}

function Kpi({ label, value, color, icon }: { label: string; value: string; color: string; icon: string }) {
  return (
    <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 10, padding: 14, display: 'flex', alignItems: 'center', gap: 12 }}>
      <div style={{ width: 40, height: 40, borderRadius: 10, background: color + '18', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18 }}>{icon}</div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 11, color: 'var(--text2)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{label}</div>
        <div style={{ fontSize: 16, fontWeight: 700, color, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{value}</div>
      </div>
    </div>
  )
}

function FunnelRow({ label, value, maxValue, color }: { label: string; value: number; maxValue: number; color: string }) {
  const pct = (value / maxValue) * 100
  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4, fontSize: 12 }}>
        <span style={{ color: 'var(--text2)' }}>{label}</span>
        <span style={{ fontWeight: 700, color }}>{value}</span>
      </div>
      <div style={{ height: 8, background: 'var(--surface2)', borderRadius: 4, overflow: 'hidden' }}>
        <div style={{ height: '100%', width: Math.max(4, pct) + '%', background: color, transition: 'width 0.3s' }} />
      </div>
    </div>
  )
}

function SumCell({ label, value, color = '#FF6B00' }: { label: string; value: string; color?: string }) {
  return (
    <div>
      <div style={{ fontSize: 11, color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{label}</div>
      <div style={{ fontSize: 18, fontWeight: 700, color, marginTop: 2 }}>{value}</div>
    </div>
  )
}

function statusMn(status: string): string {
  const map: Record<string, string> = {
    draft: 'Ноорог',
    quotation_sent: 'Санал илгээсэн',
    confirmed: 'Баталсан',
    pending_file: 'Файл хүлээж буй',
    file_review: 'Файл шалгаж буй',
    file_rejected: 'Файл буцаасан',
    on_hold: 'Хүлээгдэж буй',
    in_production: 'Үйлдвэрлэж байна',
    finishing: 'Эцсийн боловсруулалт',
    partially_dispatched: 'Хэсэгчлэн илгээсэн',
    dispatched: 'Илгээсэн',
    delivered: 'Хүргэгдсэн',
    completed: 'Дууссан',
    cancelled: 'Цуцалсан',
  }
  return map[status] || status
}

function statusColor(status: string): string {
  const map: Record<string, string> = {
    draft: '#888',
    quotation_sent: '#378ADD',
    confirmed: '#8B5CF6',
    pending_file: '#F59E0B',
    file_review: '#F59E0B',
    file_rejected: '#EF4444',
    on_hold: '#F59E0B',
    in_production: '#8B5CF6',
    finishing: '#8B5CF6',
    partially_dispatched: '#1D9E75',
    dispatched: '#1D9E75',
    delivered: '#10B981',
    completed: '#10B981',
    cancelled: '#EF4444',
  }
  return map[status] || '#888'
}
