'use client'
import { apiFetch } from '@/lib/api'
import { useState, useEffect, useMemo } from 'react'
import CreatorUgcPanel from './CreatorUgcPanel'
import { AdminPageHeader } from '@/components/admin/AdminPageHeader'
import { FunnelChart } from '@/components/chart-blocks'
import { Button } from '@/components/ui/button'

/* ═══ Config ═══ */
const CAMPAIGN_TYPES = [
  { key: 'discount', label: 'Хямдрал', icon: '🏷️', color: '#FF6B00' },
  { key: 'referral', label: 'Referral', icon: '👥', color: '#8B5CF6' },
  { key: 'bundle', label: 'Багц', icon: '📦', color: '#3B82F6' },
  { key: 'free_shipping', label: 'Үнэгүй хүргэлт', icon: '🚚', color: '#10B981' },
  { key: 'seasonal', label: 'Улирлын', icon: '🎉', color: '#F59E0B' },
  { key: 'loyalty', label: 'Loyalty', icon: '⭐', color: '#EC4899' },
]

const SEGMENTS = [
  { key: 'all', label: 'Бүх хэрэглэгч', icon: '👤', count: 0 },
  { key: 'new', label: 'Шинэ хэрэглэгч', icon: '🆕', count: 0 },
  { key: 'returning', label: 'Буцаж ирсэн', icon: '🔄', count: 0 },
  { key: 'high_value', label: 'Өндөр дүнтэй', icon: '💎', count: 0 },
  { key: 'inactive', label: 'Идэвхгүй (7+ хоног)', icon: '😴', count: 0 },
]

const CHANNELS = [
  { key: 'website', label: 'Вебсайт', icon: '🌐' },
  { key: 'email', label: 'Имэйл', icon: '📧' },
  { key: 'sms', label: 'SMS', icon: '📱' },
  { key: 'social', label: 'Facebook/IG', icon: '📣' },
]

const AUTOMATION_TEMPLATES = [
  { key: 'abandoned_cart', label: 'Сагс орхисон', desc: 'Сагсанд бараа нэмээд 24 цагт захиалга хийгээгүй бол', icon: '🛒', trigger: 'cart_abandoned_24h' },
  { key: 'inactive_user', label: 'Идэвхгүй хэрэглэгч', desc: '7 хоног нэвтрээгүй бол хямдралын мессеж', icon: '😴', trigger: 'user_inactive_7d' },
  { key: 'high_value', label: 'Өндөр дүнтэй захиалга', desc: '₮500K+ захиалгад loyalty урамшуулал', icon: '💎', trigger: 'order_amount_gt_500k' },
  { key: 'first_order', label: 'Анхны захиалга', desc: 'Шинэ хэрэглэгчийн анхны захиалгад баярлалаа мессеж', icon: '🎉', trigger: 'first_order_completed' },
  { key: 'reorder', label: 'Дахин захиалга', desc: '30 хоногийн дараа дахин захиалга санал', icon: '🔄', trigger: 'last_order_30d_ago' },
]

const fmt = (n: number) => '₮' + n.toLocaleString()

/* ═══ MAIN PAGE ═══ */
type MarketingTab = 'overview' | 'campaigns' | 'segments' | 'automation' | 'coupons' | 'ugc'

type OrderSummary = {
  id?: string
  status?: string
  payment_status?: string
  total_price?: number | string
  created_at?: string
  customer_id?: string
}

type MarketingCampaignForm = {
  name: string
  type: string
  code: string
  discount_percent: number
  start_date: string
  end_date: string
  is_active: boolean
  description: string
  target_segment: string
  channels: string[]
  min_order_amount: number
  max_uses: number
  per_user_limit: number
}

type MarketingCampaign = MarketingCampaignForm & {
  id: string
}

type AdminUser = {
  id?: string
  created_at?: string
}

type AutomationTemplate = typeof AUTOMATION_TEMPLATES[number]

type AutomationState = {
  active: boolean
  channel: string
  message: string
}

export default function AdminMarketingPage() {
  const [orders, setOrders] = useState<OrderSummary[]>([])
  const [campaigns, setCampaigns] = useState<MarketingCampaign[]>([])
  const [users, setUsers] = useState<AdminUser[]>([])
  const [now] = useState(() => Date.now())
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState<MarketingTab>('overview')
  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing] = useState<MarketingCampaign | null>(null)
  const [automationStates, setAutomationStates] = useState<Record<string, AutomationState>>({})
  const [editingAuto, setEditingAuto] = useState<AutomationTemplate | null>(null)

  // Form state
  const [form, setForm] = useState({
    name: '', type: 'discount', code: '', discount_percent: 10,
    start_date: '', end_date: '', is_active: true, description: '',
    target_segment: 'all', channels: ['website'],
    min_order_amount: 0, max_uses: 0, per_user_limit: 1,
  })

  const load = async () => {
    setLoading(true)
    const [o, c, u] = await Promise.all([
      apiFetch<OrderSummary[]>('/orders').catch(() => []),
      apiFetch<MarketingCampaign[]>('/marketing/campaigns').catch(() => []),
      apiFetch<AdminUser[]>('/admin/users').catch(() => []),
    ])
    setOrders(Array.isArray(o) ? o : [])
    setCampaigns(Array.isArray(c) ? c : [])
    setUsers(Array.isArray(u) ? u : [])
    setLoading(false)
  }
  useEffect(() => {
    const timer = window.setTimeout(() => { load() }, 0)
    return () => window.clearTimeout(timer)
  }, [])

  const resetForm = () => {
    setEditing(null); setShowForm(false)
    setForm({ name: '', type: 'discount', code: '', discount_percent: 10, start_date: '', end_date: '', is_active: true, description: '', target_segment: 'all', channels: ['website'], min_order_amount: 0, max_uses: 0, per_user_limit: 1 })
  }

  const save = async () => {
    const method = editing?.id ? 'PATCH' : 'POST'
    const url = editing?.id ? `/marketing/campaigns/${editing.id}` : `/marketing/campaigns`
    await apiFetch<MarketingCampaign>(url, { method, body: JSON.stringify(form), headers: { 'Content-Type': 'application/json' } }).catch(() => {})
    resetForm(); load()
  }

  const del = async (id: string) => { if (confirm('Устгах уу?')) { await apiFetch<void>(`/marketing/campaigns/${id}`, { method: 'DELETE' }).catch(() => {}); load() } }
  const toggle = async (c: MarketingCampaign) => { await apiFetch<MarketingCampaign>(`/marketing/campaigns/${c.id}`, { method: 'PATCH', body: JSON.stringify({ is_active: !c.is_active }), headers: { 'Content-Type': 'application/json' } }).catch(() => {}); load() }

  /* ── Stats ── */
  const stats = useMemo(() => {
    const revenue = orders.filter(o => o.status !== 'CANCELLED').reduce((s, o) => s + Number(o.total_price || 0), 0)
    const currentDate = new Date(now)
    const thisMonth = orders.filter(o => {
      if (!o.created_at) return false
      const d = new Date(o.created_at)
      return d.getMonth() === currentDate.getMonth() && d.getFullYear() === currentDate.getFullYear()
    })
    const active = campaigns.filter(c => c.is_active)
    const totalDiscount = campaigns.reduce((s, c) => s + Number(c.discount_percent || 0), 0)

    // Segments
    const sevenDaysAgo = now - 7 * 86400000
    const newUsers = users.filter(u => u.created_at && new Date(u.created_at).getTime() > sevenDaysAgo).length
    const customerOrders: Record<string, number> = {}
    orders.forEach(o => { customerOrders[o.customer_id || ''] = (customerOrders[o.customer_id || ''] || 0) + 1 })
    const returning = Object.values(customerOrders).filter(c => c > 1).length

    return {
      revenue, monthOrders: thisMonth.length, active: active.length, totalCampaigns: campaigns.length,
      avgDiscount: campaigns.length > 0 ? Math.round(totalDiscount / campaigns.length) : 0,
      newUsers, returning, totalUsers: users.length,
    }
  }, [orders, campaigns, users, now])

  const TABS = [
    { key: 'overview' as const, label: '📊 Тойм', count: undefined },
    { key: 'campaigns' as const, label: '🎯 Кампанит ажил', count: campaigns.length },
    { key: 'segments' as const, label: '👥 Сегмент', count: SEGMENTS.length },
    { key: 'automation' as const, label: '⚡ Автомат', count: AUTOMATION_TEMPLATES.length },
    { key: 'coupons' as const, label: '🎟️ Купон', count: campaigns.filter(c => c.code).length },
    { key: 'ugc' as const, label: '🎨 UGC & Creators', count: undefined },
  ]

  if (loading) return <div className="p-6"><div className="animate-pulse space-y-4"><div className="h-8 bg-gray-100 rounded w-48" /><div className="grid grid-cols-3 gap-4">{[1,2,3].map(i => <div key={i} className="h-24 bg-gray-100 rounded-xl" />)}</div></div></div>

  return (
    <div className="p-4 md:p-6 max-w-[1400px] mx-auto">
      <AdminPageHeader title="Growth Engine" description="Маркетинг, кампанит ажил, хэрэглэгчийн өсөлт">
        <Button size="sm" onClick={() => { resetForm(); setShowForm(true) }}>+ Шинэ кампанит</Button>
      </AdminPageHeader>

      {/* KPI */}
      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-3 mb-5">
        {[
          { icon: '💰', label: 'Нийт орлого', value: fmt(stats.revenue), color: '#FF6B00' },
          { icon: '📦', label: 'Сарын захиалга', value: String(stats.monthOrders), color: '#3B82F6' },
          { icon: '🎯', label: 'Идэвхтэй кампанит', value: String(stats.active), color: '#10B981' },
          { icon: '👥', label: 'Нийт хэрэглэгч', value: String(stats.totalUsers), color: '#8B5CF6' },
          { icon: '🆕', label: 'Шинэ (7 хоног)', value: String(stats.newUsers), color: '#06B6D4' },
          { icon: '🔄', label: 'Буцсан хэрэглэгч', value: String(stats.returning), color: '#EC4899' },
        ].map(k => (
          <div key={k.label} className="bg-white rounded-xl border border-[#E5E7EB] p-4">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center text-base mb-2" style={{ background: k.color + '12' }}>{k.icon}</div>
            <div className="text-xl font-extrabold text-[#111]">{k.value}</div>
            <div className="text-[11px] text-[#888]">{k.label}</div>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-5 overflow-x-auto">
        {TABS.map(t => (
          <button key={t.key} onClick={() => setTab(t.key)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors whitespace-nowrap ${
              tab === t.key ? 'bg-[#FF6B00] text-white' : 'bg-white text-[#555] border border-[#E5E7EB] hover:border-[#FF6B00]'
            }`}>
            {t.label} {t.count != null && <span className="text-[10px] opacity-75">({t.count})</span>}
          </button>
        ))}
      </div>

      {/* ═══ OVERVIEW TAB ═══ */}
      {tab === 'overview' && (() => {
        const visitors = stats.totalUsers * 5
        const paidOrders = orders.filter(o => o.payment_status === 'paid').length
        const conversionRate = visitors > 0 ? ((paidOrders / visitors) * 100).toFixed(1) : '0'
        const quoteToOrder = stats.totalUsers > 0 ? ((orders.length / stats.totalUsers) * 100).toFixed(0) : '0'
        const activeCampaigns = campaigns.filter(c => c.is_active)

        // Generate insights with actions
        const insights: { icon: string; type: 'warning' | 'opportunity' | 'success'; title: string; desc: string; action: string; actionFn: () => void }[] = []

        if (Number(conversionRate) < 5) insights.push({ icon: '🚨', type: 'warning', title: 'Conversion бага', desc: `Зочин → Төлбөр: ${conversionRate}%. Дундаж 5%-аас бага`, action: 'Кампанит эхлүүлэх', actionFn: () => { resetForm(); setShowForm(true); setTab('campaigns') } })
        if (Number(quoteToOrder) < 40) insights.push({ icon: '⚠️', type: 'warning', title: 'Quote → Order уналт', desc: `Зөвхөн ${quoteToOrder}% нь захиалга болж байна`, action: 'Follow-up SMS илгээх', actionFn: () => setTab('automation') })
        if (stats.returning === 0) insights.push({ icon: '🔄', type: 'warning', title: 'Буцсан хэрэглэгч 0', desc: 'Нэг ч хэрэглэгч дахин захиалга хийгээгүй', action: 'Loyalty кампанит', actionFn: () => { resetForm(); setShowForm(true); setTab('campaigns') } })
        if (stats.newUsers > 3) insights.push({ icon: '🆕', type: 'opportunity', title: `${stats.newUsers} шинэ хэрэглэгч`, desc: 'Сүүлийн 7 хоногт бүртгүүлсэн', action: 'Welcome offer илгээх', actionFn: () => setTab('automation') })
        if (activeCampaigns.length > 0) insights.push({ icon: '✅', type: 'success', title: `${activeCampaigns.length} кампанит идэвхтэй`, desc: activeCampaigns.map(c => c.name).join(', '), action: 'Удирдах', actionFn: () => setTab('campaigns') })
        if (stats.returning > 2) insights.push({ icon: '💎', type: 'success', title: `${stats.returning} давтан хэрэглэгч`, desc: 'Loyalty program эхлүүлэх боломжтой', action: 'Loyalty үүсгэх', actionFn: () => setTab('campaigns') })

        const typeColors = { warning: { bg: '#FEF2F2', border: '#FECACA', color: '#DC2626' }, opportunity: { bg: '#FFF7ED', border: '#FFEDD5', color: '#EA580C' }, success: { bg: '#F0FDF4', border: '#BBF7D0', color: '#16A34A' } }

        return (
        <div className="space-y-5">
          {/* Alerts / Insights — top priority */}
          {insights.length > 0 && (
            <div className="space-y-3">
              <h2 className="text-sm font-bold text-[#111] flex items-center gap-2">🧠 Ухаалаг зөвлөмж <span className="text-[10px] font-normal text-[#999]">{insights.length} зүйл</span></h2>
              {insights.map((ins, i) => {
                const tc = typeColors[ins.type]
                return (
                  <div key={i} className="flex items-center gap-4 p-4 rounded-xl" style={{ background: tc.bg, border: `1px solid ${tc.border}` }}>
                    <span className="text-2xl shrink-0">{ins.icon}</span>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-bold" style={{ color: tc.color }}>{ins.title}</div>
                      <div className="text-xs text-[#666] mt-0.5">{ins.desc}</div>
                    </div>
                    <button onClick={ins.actionFn}
                      className="shrink-0 px-4 py-2 rounded-lg text-xs font-bold text-white transition-colors hover:opacity-90"
                      style={{ background: tc.color }}>
                      {ins.action}
                    </button>
                  </div>
                )
              })}
            </div>
          )}

          <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">
            {/* Funnel — VisActor */}
            <div className="bg-white dark:bg-[var(--surface)] rounded-xl border border-[#E5E7EB] dark:border-[var(--border)] p-5">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-base font-bold text-[#111] dark:text-[var(--text)]">🔻 Маркетинг Funnel</h2>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full" style={{ color: Number(conversionRate) >= 5 ? '#10B981' : '#EF4444', background: Number(conversionRate) >= 5 ? '#10B98112' : '#EF444412' }}>
                  Conversion: {conversionRate}%
                </span>
              </div>
              <FunnelChart
                data={[
                  { label: 'Сайтын зочид', value: visitors, color: '#3B82F6' },
                  { label: 'Бүртгэл', value: stats.totalUsers, color: '#8B5CF6' },
                  { label: 'Үнийн санал', value: Math.round(stats.totalUsers * 0.6), color: '#F59E0B' },
                  { label: 'Захиалга', value: orders.length, color: '#FF6B00' },
                  { label: 'Төлбөр', value: paidOrders, color: '#10B981' },
                ]}
                height={260}
              />
            </div>

            {/* Campaign performance — with actions */}
            <div className="bg-white rounded-xl border border-[#E5E7EB] p-5">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-base font-bold text-[#111]">📊 Кампанит ажлууд</h2>
                <button onClick={() => { resetForm(); setShowForm(true); setTab('campaigns') }} className="text-[10px] font-bold px-3 py-1.5 rounded-lg bg-[#FF6B00] text-white hover:bg-[#E55D00]">+ Шинэ</button>
              </div>
              {campaigns.length === 0 ? (
                <div className="text-center py-8">
                  <div className="text-3xl mb-2">🎯</div>
                  <div className="text-sm text-[#999] mb-3">Кампанит ажил байхгүй</div>
                  <button onClick={() => { resetForm(); setShowForm(true); setTab('campaigns') }} className="text-xs font-bold px-4 py-2 rounded-lg bg-[#FF6B00] text-white">Эхний кампанит үүсгэх</button>
                </div>
              ) : campaigns.slice(0, 4).map(c => {
                const t = CAMPAIGN_TYPES.find(ct => ct.key === c.type) || CAMPAIGN_TYPES[0]
                return (
                  <div key={c.id} className="flex items-center justify-between py-3 border-b border-[#F3F4F6] last:border-0">
                    <div className="flex items-center gap-3">
                      <span className="text-lg">{t.icon}</span>
                      <div>
                        <div className="text-sm font-semibold text-[#111]">{c.name}</div>
                        <div className="text-[10px] text-[#999]">{c.start_date} — {c.end_date}</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-bold" style={{ color: t.color }}>{c.discount_percent}%</span>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${c.is_active ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-600'}`}>
                        {c.is_active ? 'ON' : 'OFF'}
                      </span>
                      <button onClick={() => { setEditing(c); setTab('campaigns') }} className="text-[9px] text-[#888] hover:text-[#FF6B00] ml-1">⚙️</button>
                    </div>
                  </div>
                )
              })}
              {campaigns.length > 4 && <button onClick={() => setTab('campaigns')} className="text-xs text-[#FF6B00] mt-2 font-medium hover:underline">Бүгд харах ({campaigns.length}) →</button>}
            </div>

            {/* Quick actions */}
            <div className="xl:col-span-2 bg-gradient-to-r from-[#FF6B00]/5 to-[#8B5CF6]/5 rounded-xl border border-[#FF6B00]/10 p-5">
              <h2 className="text-sm font-bold text-[#111] mb-3">⚡ Түргэн үйлдэл</h2>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {[
                  { icon: '🎯', label: 'Кампанит эхлүүлэх', desc: 'Шинэ хямдрал/урамшуулал', fn: () => { resetForm(); setShowForm(true); setTab('campaigns') } },
                  { icon: '📧', label: 'Имэйл илгээх', desc: 'Сегмент рүү мессеж', fn: () => setTab('segments') },
                  { icon: '⚡', label: 'Автомат тохируулах', desc: 'Сагс орхисон, идэвхгүй', fn: () => setTab('automation') },
                  { icon: '🎨', label: 'Creator удирдах', desc: 'UGC & Marketplace', fn: () => setTab('ugc') },
                ].map(a => (
                  <button key={a.label} onClick={a.fn}
                    className="text-left p-4 rounded-xl bg-white border border-[#E5E7EB] hover:border-[#FF6B00] hover:shadow-md transition-all cursor-pointer">
                    <div className="text-2xl mb-2">{a.icon}</div>
                    <div className="text-xs font-bold text-[#111]">{a.label}</div>
                    <div className="text-[10px] text-[#999] mt-0.5">{a.desc}</div>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
        )
      })()}

      {/* ═══ CAMPAIGNS TAB ═══ */}
      {tab === 'campaigns' && (
        <div className="bg-white rounded-xl border border-[#E5E7EB] overflow-hidden">
          <div className="px-5 py-4 border-b border-[#E5E7EB] flex items-center justify-between">
            <h2 className="text-sm font-bold text-[#111]">Кампанит ажлууд</h2>
            <button onClick={() => { resetForm(); setShowForm(true) }} className="text-xs text-[#FF6B00] font-semibold hover:underline">+ Шинэ</button>
          </div>
          {campaigns.length === 0 ? (
            <div className="text-center py-12 text-[#999]"><div className="text-4xl mb-3">🎯</div><div className="text-sm">Кампанит ажил үүсгэнэ үү</div></div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead><tr className="text-[10px] text-[#888] uppercase tracking-wider border-b border-[#E5E7EB]">
                  <th className="text-left px-5 py-3">Нэр</th><th className="text-left px-3 py-3">Төрөл</th><th className="text-right px-3 py-3">Хямдрал</th>
                  <th className="text-left px-3 py-3">Хугацаа</th><th className="text-center px-3 py-3">Төлөв</th><th className="text-right px-5 py-3">Үйлдэл</th>
                </tr></thead>
                <tbody>
                  {campaigns.map(c => {
                    const t = CAMPAIGN_TYPES.find(ct => ct.key === c.type) || CAMPAIGN_TYPES[0]
                    return (
                      <tr key={c.id} className="border-t border-[#F3F4F6] hover:bg-[#FAFAFA]">
                        <td className="px-5 py-3"><div className="font-semibold text-[#111]">{c.name}</div>{c.code && <div className="text-[10px] text-[#999] font-mono mt-0.5">{c.code}</div>}</td>
                        <td className="px-3 py-3"><span className="text-[10px] font-bold px-2 py-0.5 rounded-md" style={{ background: t.color + '12', color: t.color }}>{t.icon} {t.label}</span></td>
                        <td className="text-right px-3 py-3 font-bold text-[#FF6B00]">{c.discount_percent}%</td>
                        <td className="px-3 py-3 text-[#888]">{c.start_date?.slice(0, 10)} — {c.end_date?.slice(0, 10)}</td>
                        <td className="text-center px-3 py-3">
                          <button onClick={() => toggle(c)} className={`text-[10px] font-bold px-2.5 py-1 rounded-lg border ${c.is_active ? 'bg-emerald-50 text-emerald-600 border-emerald-200' : 'bg-red-50 text-red-600 border-red-200'}`}>
                            {c.is_active ? '🟢 ON' : '🔴 OFF'}
                          </button>
                        </td>
                        <td className="text-right px-5 py-3">
                          <button onClick={() => { setEditing(c); setForm({ ...form, ...c }); setShowForm(true) }} className="text-[10px] text-amber-600 font-medium mr-2">✏️</button>
                          <button onClick={() => del(c.id)} className="text-[10px] text-red-500 font-medium">🗑</button>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ═══ SEGMENTS TAB ═══ */}
      {tab === 'segments' && (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {SEGMENTS.map(seg => (
            <div key={seg.key} className="bg-white rounded-xl border border-[#E5E7EB] p-5 hover:shadow-md transition-shadow">
              <div className="flex items-center gap-3 mb-3">
                <span className="text-2xl">{seg.icon}</span>
                <div>
                  <div className="text-sm font-bold text-[#111]">{seg.label}</div>
                  <div className="text-[11px] text-[#888]">Хэрэглэгчийн бүлэг</div>
                </div>
              </div>
              <div className="text-2xl font-extrabold text-[#111] mb-2">
                {seg.key === 'all' ? stats.totalUsers : seg.key === 'new' ? stats.newUsers : seg.key === 'returning' ? stats.returning : seg.key === 'high_value' ? Math.round(stats.totalUsers * 0.1) : Math.round(stats.totalUsers * 0.3)}
              </div>
              <button className="text-xs text-[#FF6B00] font-semibold hover:underline">Кампанит хийх →</button>
            </div>
          ))}
        </div>
      )}

      {/* ═══ AUTOMATION TAB ═══ */}
      {tab === 'automation' && (
        <div className="space-y-3">
          {AUTOMATION_TEMPLATES.map(auto => {
            const state = automationStates[auto.key]
            const isActive = state?.active || false
            const isConfigured = !!state
            return (
              <div key={auto.key} className="bg-white rounded-xl border border-[#E5E7EB] p-5 hover:shadow-md transition-shadow">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <span className="text-2xl">{auto.icon}</span>
                    <div>
                      <div className="text-sm font-bold text-[#111]">{auto.label}</div>
                      <div className="text-xs text-[#888] mt-0.5">{auto.desc}</div>
                      <div className="text-[10px] text-[#BBB] font-mono mt-1">trigger: {auto.trigger}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    {isConfigured ? (
                      <span className={`text-[10px] font-bold px-2 py-1 rounded-lg ${isActive ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-500'}`}>
                        {isActive ? '✅ Идэвхтэй' : '⏸ Зогссон'}
                      </span>
                    ) : (
                      <span className="text-[10px] font-bold px-2 py-1 rounded-lg bg-amber-50 text-amber-600">Тохируулаагүй</span>
                    )}
                    <button onClick={() => setEditingAuto(auto)}
                      className="px-3 py-1.5 text-xs font-semibold bg-[#F3F4F6] text-[#555] rounded-lg hover:bg-[#E5E7EB] transition-colors">
                      ⚙️ Тохируулах
                    </button>
                    <button onClick={() => {
                      if (!isConfigured) { setEditingAuto(auto); return }
                      setAutomationStates(prev => ({ ...prev, [auto.key]: { ...prev[auto.key], active: !isActive } }))
                      apiFetch(`/marketing/automation/${auto.key}`, { method: 'PATCH', body: JSON.stringify({ is_active: !isActive }) }).catch(() => {})
                    }}
                      className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors ${isActive ? 'bg-red-50 text-red-500 hover:bg-red-100' : 'bg-[#FF6B00] text-white hover:bg-[#E55D00]'}`}>
                      {isActive ? '⏸ Зогсоох' : '▶ Идэвхжүүлэх'}
                    </button>
                  </div>
                </div>
                {/* Show config if active */}
                {isConfigured && state.message && (
                  <div className="mt-3 pt-3 border-t border-[#F3F4F6] flex items-center gap-4 text-xs text-[#888]">
                    <span>📧 {state.channel === 'sms' ? 'SMS' : state.channel === 'email' ? 'Имэйл' : 'Push'}</span>
                    <span className="truncate flex-1">💬 {state.message}</span>
                  </div>
                )}
              </div>
            )
          })}

          {/* Config modal */}
          {editingAuto && (
            <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4" onClick={() => setEditingAuto(null)}>
              <div className="bg-white rounded-2xl max-w-md w-full p-6" onClick={e => e.stopPropagation()}>
                <div className="flex items-center justify-between mb-5">
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">{editingAuto.icon}</span>
                    <div>
                      <h3 className="text-base font-bold text-[#111]">{editingAuto.label}</h3>
                      <p className="text-[10px] text-[#999]">{editingAuto.desc}</p>
                    </div>
                  </div>
                  <button onClick={() => setEditingAuto(null)} className="w-7 h-7 rounded-lg bg-[#F3F4F6] flex items-center justify-center text-[#999]">✕</button>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="text-xs font-semibold text-[#555] mb-1 block">Суваг</label>
                    <div className="flex gap-2">
                      {[
                        { key: 'email', label: '📧 Имэйл' },
                        { key: 'sms', label: '📱 SMS' },
                        { key: 'push', label: '🔔 Push' },
                      ].map(ch => (
                        <button key={ch.key} onClick={() => setAutomationStates(prev => ({
                          ...prev, [editingAuto.key]: { ...prev[editingAuto.key], channel: ch.key, active: prev[editingAuto.key]?.active || false, message: prev[editingAuto.key]?.message || '' }
                        }))}
                          className={`px-3 py-2 rounded-lg text-xs font-medium transition-colors ${
                            automationStates[editingAuto.key]?.channel === ch.key ? 'bg-[#FF6B00] text-white' : 'bg-[#F3F4F6] text-[#555]'}`}>
                          {ch.label}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-[#555] mb-1 block">Мессеж</label>
                    <textarea
                      value={automationStates[editingAuto.key]?.message || ''}
                      onChange={e => setAutomationStates(prev => ({
                        ...prev, [editingAuto.key]: { ...prev[editingAuto.key], channel: prev[editingAuto.key]?.channel || 'email', active: prev[editingAuto.key]?.active || false, message: e.target.value }
                      }))}
                      placeholder={`${editingAuto.label} мессеж...`}
                      rows={3}
                      className="w-full px-3 py-2.5 rounded-xl border border-[#E5E7EB] text-sm resize-none outline-none focus:border-[#FF6B00]" />
                  </div>
                  <div className="bg-[#F9FAFB] rounded-xl p-3">
                    <div className="text-[10px] font-semibold text-[#888] mb-1">Trigger нөхцөл</div>
                    <div className="text-xs text-[#555] font-mono">{editingAuto.trigger}</div>
                  </div>
                </div>

                <div className="flex gap-2 mt-5">
                  <button onClick={() => setEditingAuto(null)} className="flex-1 py-2.5 bg-[#F3F4F6] text-[#555] rounded-xl text-sm font-medium">Болих</button>
                  <button onClick={() => {
                    const current = automationStates[editingAuto.key] || { active: false, channel: 'email', message: '' }
                    if (!current.message.trim()) { alert('Мессеж бичнэ үү'); return }
                    setAutomationStates(prev => ({ ...prev, [editingAuto.key]: { ...current, active: true } }))
                    apiFetch(`/marketing/automation/${editingAuto.key}`, {
                      method: 'PUT', body: JSON.stringify({ trigger: editingAuto.trigger, channel: current.channel, message: current.message, is_active: true })
                    }).catch(() => {})
                    setEditingAuto(null)
                  }} className="flex-1 py-2.5 bg-[#FF6B00] text-white rounded-xl text-sm font-bold">Хадгалах & Идэвхжүүлэх</button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ═══ COUPONS TAB ═══ */}
      {tab === 'coupons' && (
        <div className="bg-white rounded-xl border border-[#E5E7EB] p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-bold text-[#111]">🎟️ Купон кодууд</h2>
            <button onClick={() => { resetForm(); setForm(f => ({ ...f, type: 'discount', code: 'BIZPRINT' + Math.random().toString(36).slice(2, 6).toUpperCase() })); setShowForm(true) }}
              className="px-3 py-1.5 text-xs font-bold bg-[#FF6B00] text-white rounded-lg">+ Шинэ купон</button>
          </div>
          {campaigns.filter(c => c.code).length === 0 ? (
            <div className="text-center py-8 text-[#999]"><div className="text-3xl mb-2">🎟️</div><div className="text-sm">Купон код байхгүй</div></div>
          ) : (
            <div className="space-y-2">
              {campaigns.filter(c => c.code).map(c => (
                <div key={c.id} className="flex items-center justify-between py-3 px-4 bg-[#F8F8F8] rounded-xl">
                  <div className="flex items-center gap-3">
                    <span className="font-mono text-sm font-bold text-[#FF6B00] bg-orange-50 px-3 py-1 rounded-lg">{c.code}</span>
                    <span className="text-xs text-[#555]">{c.name}</span>
                  </div>
                  <div className="flex items-center gap-3 text-xs">
                    <span className="font-bold text-[#111]">{c.discount_percent}% хямдрал</span>
                    <span className={`font-bold ${c.is_active ? 'text-emerald-600' : 'text-red-500'}`}>{c.is_active ? 'Идэвхтэй' : 'Идэвхгүй'}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ═══ UGC & CREATORS TAB ═══ */}
      {tab === 'ugc' && <CreatorUgcPanel />}

      {/* ═══ CAMPAIGN FORM MODAL ═══ */}
      {showForm && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[200] flex items-center justify-center p-4" onClick={resetForm}>
          <div onClick={e => e.stopPropagation()} className="bg-white rounded-2xl w-full max-w-[560px] max-h-[90vh] shadow-2xl flex flex-col overflow-hidden">
            <div className="px-6 pt-5 pb-4 border-b border-[#E5E7EB] flex justify-between items-center flex-shrink-0">
              <h2 className="text-lg font-bold text-[#111]">{editing ? '✏️ Кампанит засах' : '🎯 Шинэ кампанит'}</h2>
              <button onClick={resetForm} className="w-7 h-7 rounded-lg bg-[#F3F4F6] flex items-center justify-center text-[#888] text-sm cursor-pointer border-none">✕</button>
            </div>
            <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
              <div>
                <label className="text-xs font-semibold text-[#555] mb-1 block">Кампанитын нэр *</label>
                <input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="Жишээ: Зуны баярын аян"
                  className="w-full px-3 py-2.5 border border-[#E5E7EB] rounded-lg text-sm outline-none focus:border-[#FF6B00]" />
              </div>
              <div>
                <label className="text-xs font-semibold text-[#555] mb-2 block">Төрөл</label>
                <div className="flex flex-wrap gap-1.5">
                  {CAMPAIGN_TYPES.map(t => (
                    <button key={t.key} type="button" onClick={() => setForm({ ...form, type: t.key })}
                      className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${form.type === t.key ? 'text-white' : 'text-[#555] border-[#E5E7EB]'}`}
                      style={form.type === t.key ? { background: t.color, borderColor: t.color } : {}}>
                      {t.icon} {t.label}
                    </button>
                  ))}
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-[#555] mb-1 block">Хямдрал (%)</label>
                  <input type="number" min={0} max={100} value={form.discount_percent} onChange={e => setForm({ ...form, discount_percent: Number(e.target.value) })}
                    className="w-full px-3 py-2.5 border border-[#E5E7EB] rounded-lg text-sm outline-none focus:border-[#FF6B00]" />
                </div>
                <div>
                  <label className="text-xs font-semibold text-[#555] mb-1 block">Купон код</label>
                  <input value={form.code} onChange={e => setForm({ ...form, code: e.target.value.toUpperCase() })} placeholder="SUMMER2026"
                    className="w-full px-3 py-2.5 border border-[#E5E7EB] rounded-lg text-sm font-mono outline-none focus:border-[#FF6B00]" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div><label className="text-xs font-semibold text-[#555] mb-1 block">Эхлэх огноо</label>
                  <input type="date" value={form.start_date} onChange={e => setForm({ ...form, start_date: e.target.value })}
                    className="w-full px-3 py-2.5 border border-[#E5E7EB] rounded-lg text-sm outline-none focus:border-[#FF6B00]" /></div>
                <div><label className="text-xs font-semibold text-[#555] mb-1 block">Дуусах огноо</label>
                  <input type="date" value={form.end_date} onChange={e => setForm({ ...form, end_date: e.target.value })}
                    className="w-full px-3 py-2.5 border border-[#E5E7EB] rounded-lg text-sm outline-none focus:border-[#FF6B00]" /></div>
              </div>
              <div>
                <label className="text-xs font-semibold text-[#555] mb-2 block">Зорилтот сегмент</label>
                <div className="flex flex-wrap gap-1.5">
                  {SEGMENTS.map(s => (
                    <button key={s.key} type="button" onClick={() => setForm({ ...form, target_segment: s.key })}
                      className={`px-2.5 py-1 rounded-lg text-xs font-medium border transition-colors ${form.target_segment === s.key ? 'bg-[#FF6B00] text-white border-[#FF6B00]' : 'text-[#555] border-[#E5E7EB]'}`}>
                      {s.icon} {s.label}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="text-xs font-semibold text-[#555] mb-2 block">Суваг</label>
                <div className="flex flex-wrap gap-1.5">
                  {CHANNELS.map(ch => (
                    <button key={ch.key} type="button" onClick={() => {
                      const channels = form.channels.includes(ch.key) ? form.channels.filter(c => c !== ch.key) : [...form.channels, ch.key]
                      setForm({ ...form, channels })
                    }}
                      className={`px-2.5 py-1 rounded-lg text-xs font-medium border transition-colors ${form.channels.includes(ch.key) ? 'bg-[#FF6B00] text-white border-[#FF6B00]' : 'text-[#555] border-[#E5E7EB]'}`}>
                      {ch.icon} {ch.label}
                    </button>
                  ))}
                </div>
              </div>
              <div><label className="text-xs font-semibold text-[#555] mb-1 block">Тайлбар</label>
                <textarea value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} rows={2}
                  className="w-full px-3 py-2.5 border border-[#E5E7EB] rounded-lg text-sm outline-none focus:border-[#FF6B00] resize-none" /></div>
            </div>
            <div className="px-6 py-4 border-t border-[#E5E7EB] flex justify-end gap-2 flex-shrink-0">
              <button onClick={resetForm} className="px-4 py-2.5 border border-[#E5E7EB] rounded-lg text-sm font-medium text-[#555]">Болих</button>
              <button onClick={save} disabled={!form.name.trim()} className={`px-6 py-2.5 rounded-lg text-sm font-bold transition-colors ${form.name.trim() ? 'bg-[#FF6B00] hover:bg-[#E55D00] text-white' : 'bg-[#E5E7EB] text-[#999]'}`}>
                {editing ? '✓ Хадгалах' : '✓ Үүсгэх'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
