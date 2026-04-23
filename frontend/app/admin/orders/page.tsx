'use client'
import { apiFetch } from '@/lib/api'
import { useState, useEffect, useCallback } from 'react'
import { AdminPageHeader } from '@/components/admin/AdminPageHeader'
import { useOrderEvents } from '@/hooks/useOrderEvents'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { RefreshCw, Search, Download } from 'lucide-react'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'

/* âââââââââââââââââââââââââââââââââââââââ
 *  ORDER OPERATIONS CONTROL CENTER
 *  KPI â Alerts â Filters â Table â Bulk â Detail
 * âââââââââââââââââââââââââââââââââââââââ */

const STATUS_COLOR: Record<string, string> = {
  draft: '#94A3B8', quotation_sent: '#F59E0B', confirmed: '#3B82F6',
  pending_file: '#8B5CF6', file_review: '#06B6D4', file_rejected: '#EF4444',
  on_hold: '#F97316', in_production: '#EC4899', finishing: '#8B5CF6',
  partially_dispatched: '#6366F1', dispatched: '#6366F1', delivered: '#10B981',
  completed: '#059669', cancelled: '#EF4444',
}
const STATUS_LABEL: Record<string, string> = {
  draft: 'ÐÐ¾Ð¾ÑÐ¾Ð³', quotation_sent: 'Ð¡Ð°Ð½Ð°Ð» Ð¸Ð»Ð³ÑÑÑÑÐ½', confirmed: 'ÐÐ°ÑÐ°Ð»Ð³Ð°Ð°Ð¶ÑÐ°Ð½',
  pending_file: 'Ð¤Ð°Ð¹Ð» ÑÒ¯Ð»ÑÑÐ¶ Ð±ÑÐ¹', file_review: 'Ð¤Ð°Ð¹Ð» ÑÐ°Ð»Ð³Ð°Ð»Ñ', file_rejected: 'Ð¤Ð°Ð¹Ð» Ð±ÑÑÑÐ°Ð½',
  on_hold: 'Ð¢Ò¯Ñ Ð·Ð¾Ð³ÑÑÐ¾Ð½', in_production: 'Ò®Ð¹Ð»Ð´Ð²ÑÑÐ»ÑÐ»Ð´', finishing: 'ÐÐ¾Ð»Ð¾Ð²ÑÑÑÑÐ»Ð°Ð»Ñ',
  partially_dispatched: 'Ð¥ÑÑÑÐ³ÑÐ»ÑÐ½', dispatched: 'ÐÐ»Ð³ÑÑÑÑÐ½', delivered: 'Ð¥Ò¯ÑÐ³ÑÑÑÐ½',
  completed: 'ÐÑÑÑÑÐ°Ð½', cancelled: 'Ð¦ÑÑÐ°Ð»ÑÐ°Ð½',
}
const PRIORITY_COLOR: Record<string, string> = { low: '#94A3B8', normal: '#3B82F6', high: '#F59E0B', urgent: '#EF4444' }
const PRIORITY_LABEL: Record<string, string> = { low: 'ÐÐ°Ð³Ð°', normal: 'Ð­Ð½Ð³Ð¸Ð¹Ð½', high: 'Ó¨Ð½Ð´Ó©Ñ', urgent: 'Ð¯Ð°ÑÐ°Ð»ÑÐ°Ð¹' }

const ALL_STATUSES = Object.keys(STATUS_LABEL)
const fmt = (n: number) => n?.toLocaleString?.() ?? '0'

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<any[]>([])
  const [kpi, setKpi] = useState<any>(null)
  const [alerts, setAlerts] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('')
  const [search, setSearch] = useState('')
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [detail, setDetail] = useState<any>(null)
  const [timeline, setTimeline] = useState<any[]>([])
  const [vendors, setVendors] = useState<any[]>([])
  const [bulkAction, setBulkAction] = useState('')
  const [gateResult, setGateResult] = useState<any>(null)
  const [gateLoading, setGateLoading] = useState(false)

  const load = useCallback(async () => {
    try {
      const [o, k, a, v] = await Promise.all([
        apiFetch('/orders'),
        apiFetch('/orders/ops/summary').catch(() => null),
        apiFetch('/orders/ops/alerts').catch(() => null),
        apiFetch('/vendors').catch(() => []),
      ])
      setOrders(Array.isArray(o) ? o : [])
      setKpi(k)
      setAlerts(a)
      setVendors(Array.isArray(v) ? v : [])
    } catch {} finally { setLoading(false) }
  }, [])

  useEffect(() => { load() }, [load])

  // Live updates: admin sees every order change as it happens (vendor
  // advances production, courier marks delivered, payment confirmed).
  useOrderEvents({ rooms: ['admin'], onChange: load })

  const updateStatus = async (id: string, status: string) => {
    await apiFetch(`/orders/${id}/status`, { method: 'PATCH', body: JSON.stringify({ status }) })
    load()
    if (detail?.id === id) setDetail((p: any) => p ? { ...p, status } : null)
  }

  const openDetail = async (order: any) => {
    setDetail(order)
    setGateResult(null)
    try {
      const tl = await apiFetch(`/orders/${order.id}/timeline`)
      setTimeline((tl as any)?.timeline || [])
    } catch { setTimeline([]) }
    // Auto-load gate check
    try {
      const g = await apiFetch(`/order-files/gate/order/${order.id}`)
      setGateResult(g)
    } catch { setGateResult(null) }
  }

  const runGateCheck = async (orderId: string) => {
    setGateLoading(true)
    try {
      const g = await apiFetch(`/order-files/gate/order/${orderId}`)
      setGateResult(g)
    } catch {} finally { setGateLoading(false) }
  }

  const toggleSelect = (id: string) => {
    setSelected(prev => {
      const n = new Set(prev)
      n.has(id) ? n.delete(id) : n.add(id)
      return n
    })
  }

  const selectAll = () => {
    if (selected.size === filtered.length) setSelected(new Set())
    else setSelected(new Set(filtered.map(o => o.id)))
  }

  const executeBulk = async () => {
    const ids = Array.from(selected)
    if (!ids.length || !bulkAction) return
    if (bulkAction === 'cancel') {
      if (!confirm(`${ids.length} Ð·Ð°ÑÐ¸Ð°Ð»Ð³Ð° ÑÑÑÐ»Ð°Ñ ÑÑ?`)) return
      await apiFetch('/orders/bulk/cancel', { method: 'POST', body: JSON.stringify({ order_ids: ids }) })
    } else if (bulkAction.startsWith('status:')) {
      const status = bulkAction.replace('status:', '')
      await apiFetch('/orders/bulk/status', { method: 'POST', body: JSON.stringify({ order_ids: ids, status }) })
    } else if (bulkAction.startsWith('priority:')) {
      const priority = bulkAction.replace('priority:', '')
      await apiFetch('/orders/bulk/priority', { method: 'POST', body: JSON.stringify({ order_ids: ids, priority }) })
    }
    setSelected(new Set())
    setBulkAction('')
    load()
  }

  const assignVendor = async (orderId: string, vendorId: string) => {
    await apiFetch(`/orders/${orderId}/reassign-vendor`, { method: 'POST', body: JSON.stringify({ vendor_id: vendorId }) })
    load()
  }

  // Filter + Search
  const filtered = orders.filter(o => {
    if (filter && o.status !== filter) return false
    if (search) {
      const s = search.toLowerCase()
    
  const handleExportCsv = async () => {
    try {
      const token = localStorage.getItem('token') ?? '';
      const res = await fetch('/api/orders/export', {
        headers: { Authorization: 'Bearer ' + token },
      });
      if (!res.ok) throw new Error('Export failed');
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'orders-' + new Date().toISOString().split('T')[0] + '.csv';
      a.click();
      URL.revokeObjectURL(url);
    } catch (e) {
      alert('CSV tatahad aldaa garlaa');
    }
  };

  return (o.customer_name || '').toLowerCase().includes(s) ||
        (o.product_name || '').toLowerCase().includes(s) ||
        (o.id || '').toLowerCase().includes(s) ||
        (o.customer_email || '').toLowerCase().includes(s)
    }
    return true
  })

  const stLabel = (s: string) => STATUS_LABEL[s] || s
  const stColor = (s: string) => STATUS_COLOR[s] || '#888'

  // ── CSV / Excel export ───────────────────────────────────────────────
  const handleExport = async (format: 'csv' | 'excel') => {
    try {
      const params = new URLSearchParams({ format })
      if (search) params.set('search', search)
      if (filterStatus) params.set('status', filterStatus)
      const res = await fetch(`/api/orders/export?${params.toString()}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token') || ''}` },
      })
      if (!res.ok) { toast.error('Export амжилтгүй боллоо'); return; }
      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = format === 'excel' ? 'orders.csv' : 'orders.csv'
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
      toast.success('Export амжилттай!')
    } catch {
      toast.error('Export явцад алдаа гарлаа')
    }
  }


  return (
    <div className="p-4 md:p-6">
      <style>{`
        @keyframes fadeIn{from{opacity:0}to{opacity:1}}
        @keyframes slideUp{from{opacity:0;transform:translateY(12px)}to{opacity:1;transform:translateY(0)}}
        .ord-row{transition:background .15s}.ord-row:hover{background:var(--surface2)!important}
      `}</style>

      {/* Header */}
      <AdminPageHeader title="ÐÐ°ÑÐ¸Ð°Ð»Ð³ÑÐ½ ÑÐ´Ð¸ÑÐ´Ð»Ð°Ð³Ð°" description={`Operations Control Center Â· ${orders.length} Ð·Ð°ÑÐ¸Ð°Ð»Ð³Ð°`}>
        <Button variant="outline" size="sm" onClick={load}>
          <RefreshCw className="h-3.5 w-3.5 mr-1.5" />
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleExport('csv')}
                className="flex items-center gap-1"
              >
                <Download className="h-4 w-4" />
                CSV татах
              </Button>Ð¨Ð¸Ð½ÑÑÐ»ÑÑ
        </Button>
      </AdminPageHeader>

      {/* KPI SUMMARY */}
      {kpi && (
        <div className="grid grid-cols-2 sm:grid-cols-4 xl:grid-cols-8 gap-2.5 mb-5">
          {[
            { label: 'ÐÐ¸Ð¹Ñ Ð·Ð°ÑÐ¸Ð°Ð»Ð³Ð°', value: kpi.total_orders, color: '#64748B', icon: 'ð' },
            { label: 'ÐÐ¸Ð¹Ñ Ð¾ÑÐ»Ð¾Ð³Ð¾', value: `â®${fmt(kpi.total_revenue)}`, color: '#FF6B00', icon: 'ð°' },
            { label: 'Ð¥Ò¯Ð»ÑÑÐ³Ð´ÑÐ¶ Ð±ÑÐ¹', value: `${kpi.pending?.count || 0}`, sub: `â®${fmt(kpi.pending?.value || 0)}`, color: '#F59E0B', icon: 'â³' },
            { label: 'Ò®Ð¹Ð»Ð´Ð²ÑÑÐ»ÑÐ»Ð´', value: `${kpi.production?.count || 0}`, sub: `â®${fmt(kpi.production?.value || 0)}`, color: '#EC4899', icon: 'ð­' },
            { label: 'ÐÑÑÑÑÐ°Ð½', value: `${kpi.completed?.count || 0}`, sub: `â®${fmt(kpi.completed?.value || 0)}`, color: '#059669', icon: 'â' },
            { label: 'Ð¥Ð¾ÑÐ¾ÑÑÐ¾Ð½', value: `${kpi.delayed?.count || 0}`, color: '#EF4444', icon: 'ð´' },
            { label: 'Ó¨Ð½Ó©Ó©Ð´Ó©Ñ', value: `${kpi.today?.count || 0}`, color: '#3B82F6', icon: 'ð' },
            { label: 'Ð¯Ð°ÑÐ°Ð»ÑÐ°Ð¹', value: `${kpi.urgent?.count || 0}`, color: '#EF4444', icon: 'ð¨' },
          ].map(k => (
            <div key={k.label} className="rounded-xl border border-border bg-card px-4 py-3.5" style={{ borderLeftWidth: 4, borderLeftColor: k.color }}>
              <div className="text-[11px] text-muted-foreground mb-1">{k.icon} {k.label}</div>
              <div className="text-xl font-bold" style={{ color: k.color }}>{k.value}</div>
              {k.sub && <div className="text-[11px] text-muted-foreground mt-0.5">{k.sub}</div>}
            </div>
          ))}
        </div>
      )}

      {/* ALERTS */}
      {alerts && alerts.total_alerts > 0 && (
        <div className="flex flex-wrap items-center gap-5 rounded-xl border border-red-200 bg-red-50 dark:bg-red-500/10 px-5 py-3.5 mb-5">
          <span className="text-sm font-bold text-red-600">ð¥ ÐÐ½ÑÐ°Ð°ÑÑÑÐ»Ð³Ð° ({alerts.total_alerts})</span>
          {alerts.delayed?.count > 0 && <span className="text-sm text-red-600">â° Ð¥Ð¾ÑÐ¾ÑÑÐ¾Ð½: {alerts.delayed.count}</span>}
          {alerts.no_vendor?.count > 0 && <span className="text-sm text-red-600">ð¤ Vendor-Ð³Ò¯Ð¹: {alerts.no_vendor.count}</span>}
          {alerts.urgent?.count > 0 && <span className="text-sm text-red-600">ð¨ Ð¯Ð°ÑÐ°Ð»ÑÐ°Ð¹: {alerts.urgent.count}</span>}
          {alerts.stale?.count > 0 && <span className="text-sm text-red-600">â ï¸ Ð¥Ó©Ð´Ó©Ð»Ð³Ó©Ó©Ð½Ð³Ò¯Ð¹: {alerts.stale.count}</span>}
          {alerts.file_pending?.count > 0 && <span className="text-sm text-red-600">ð Ð¤Ð°Ð¹Ð» ÑÒ¯Ð»ÑÑÐ¶: {alerts.file_pending.count}</span>}
        </div>
      )}

      {/* FILTERS + SEARCH */}
      <div className="flex flex-wrap items-center gap-2.5 mb-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Ð¥Ð°Ð¹Ñ... (Ð½ÑÑ, Ð±Ò¯ÑÑÑÐ³Ð´ÑÑÒ¯Ò¯Ð½, ID)"
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="pl-9 h-9 w-[260px] text-sm"
          />
        </div>
        <div className="flex flex-wrap gap-1">
          <button onClick={() => setFilter('')} className={cn('px-3 py-1.5 rounded-md text-[11px] font-medium cursor-pointer border-none transition-colors', !filter ? 'bg-primary text-white' : 'bg-muted text-muted-foreground hover:bg-muted/80')}>ÐÒ¯Ð³Ð´</button>
          {ALL_STATUSES.map(s => (
            <button key={s} onClick={() => setFilter(filter === s ? '' : s)} className={cn('px-3 py-1.5 rounded-md text-[11px] cursor-pointer border-none transition-colors', filter === s ? 'text-white font-semibold' : 'bg-muted text-muted-foreground hover:bg-muted/80')} style={filter === s ? { background: stColor(s) } : undefined}>
              {stLabel(s)}
            </button>
          ))}
        </div>
      </div>

      {/* BULK ACTION BAR */}
      {selected.size > 0 && (
        <div className="flex flex-wrap items-center gap-3 rounded-lg border border-blue-200 bg-blue-50 dark:bg-blue-500/10 px-4 py-2.5 mb-4">
          <Badge variant="secondary" className="text-blue-700 bg-blue-100">{selected.size} ÑÐ¾Ð½Ð³Ð¾ÑÐ¾Ð½</Badge>
          <select value={bulkAction} onChange={e => setBulkAction(e.target.value)} className="rounded-md border border-blue-200 bg-background px-2.5 py-1.5 text-xs">
            <option value="">Ò®Ð¹Ð»Ð´ÑÐ» ÑÐ¾Ð½Ð³Ð¾Ñ...</option>
            <optgroup label="Ð¢Ó©Ð»Ó©Ð² ÑÐ¾Ð»Ð¸Ñ">
              {ALL_STATUSES.map(s => <option key={s} value={`status:${s}`}>{stLabel(s)}</option>)}
            </optgroup>
            <optgroup label="ÐÑ ÑÐ¾Ð»Ð±Ð¾Ð³Ð´Ð¾Ð»">
              {Object.keys(PRIORITY_LABEL).map(p => <option key={p} value={`priority:${p}`}>{PRIORITY_LABEL[p]}</option>)}
            </optgroup>
            <option value="cancel">â Ð¦ÑÑÐ»Ð°Ñ</option>
          </select>
          <Button size="sm" onClick={executeBulk} disabled={!bulkAction} className="h-7 text-xs">ÐÒ¯Ð¹ÑÑÑÐ³ÑÑ</Button>
          <Button size="sm" variant="ghost" onClick={() => setSelected(new Set())} className="h-7 text-xs text-blue-700">ÐÐ¾Ð»Ð¸Ñ</Button>
        </div>
      )}

      {/* ORDERS TABLE */}
      <div className="rounded-xl border border-border bg-card overflow-hidden">
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
          <thead>
            <tr style={{ background: 'var(--surface2)' }}>
              <th style={{ padding: '10px 12px', width: 32 }}>
                <input type="checkbox" checked={selected.size === filtered.length && filtered.length > 0} onChange={selectAll} />
              </th>
              {['ID', 'Ð¥ÑÑÑÐ³Ð»ÑÐ³Ñ', 'ÐÒ¯ÑÑÑÐ³Ð´ÑÑÒ¯Ò¯Ð½', 'Vendor', 'Ð¢Ð¾Ð¾', 'ÐÒ¯Ð½', 'Ð¢Ó©Ð»Ó©Ð²', 'ÐÑÑÑÐ³', 'Ð¥ÑÐ³Ð°ÑÐ°Ð°', 'Ò®Ð¹Ð»Ð´ÑÐ»'].map(h => (
                <th key={h} style={{ padding: '10px 12px', textAlign: 'left', color: 'var(--text2)', fontWeight: 500, whiteSpace: 'nowrap', fontSize: 11, textTransform: 'uppercase' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={11} style={{ padding: 40, textAlign: 'center', color: 'var(--text2)' }}>Ð£Ð½ÑÐ¸Ð¶ Ð±Ð°Ð¹Ð½Ð°...</td></tr>
            ) : filtered.length === 0 ? (
              <tr><td colSpan={11} style={{ padding: 40, textAlign: 'center', color: 'var(--text2)' }}>ÐÐ°ÑÐ¸Ð°Ð»Ð³Ð° Ð±Ð°Ð¹ÑÐ³Ò¯Ð¹</td></tr>
            ) : filtered.map(o => {
              const isDelayed = o.is_delayed || (o.deadline && new Date(o.deadline) < new Date() && !['completed', 'cancelled', 'delivered'].includes(o.status))
              const vendorName = vendors.find((v: any) => v.id === o.factory_id)?.company_name
              return (
                <tr key={o.id} className="ord-row" style={{ borderTop: '1px solid var(--border)', cursor: 'pointer', background: isDelayed ? '#FEF2F220' : undefined }} onClick={() => openDetail(o)}>
                  <td style={{ padding: '8px 12px' }} onClick={e => e.stopPropagation()}>
                    <input type="checkbox" checked={selected.has(o.id)} onChange={() => toggleSelect(o.id)} />
                  </td>
                  <td style={{ padding: '8px 12px', fontFamily: 'monospace', color: 'var(--text3)', fontSize: 11 }}>#{o.id?.slice(0, 8)}</td>
                  <td style={{ padding: '8px 12px' }}>
                    <div style={{ fontWeight: 500, fontSize: 13 }}>{o.customer_name || 'â'}</div>
                    <div style={{ fontSize: 11, color: 'var(--text3)' }}>{o.customer_email || ''}</div>
                  </td>
                  <td style={{ padding: '8px 12px', color: 'var(--text2)', fontSize: 12 }}>{o.product_name || 'â'}</td>
                  <td style={{ padding: '8px 12px', fontSize: 12 }}>
                    {vendorName ? (
                      <span style={{ fontSize: 11, padding: '2px 8px', borderRadius: 6, background: '#EFF6FF', color: '#1D4ED8' }}>{vendorName}</span>
                    ) : o.factory_id ? (
                      <span style={{ fontSize: 11, color: 'var(--text3)' }}>#{o.factory_id.slice(0, 6)}</span>
                    ) : (
                      <span style={{ fontSize: 11, color: '#EF4444' }}>â</span>
                    )}
                  </td>
                  <td style={{ padding: '8px 12px', color: 'var(--text2)' }}>{o.quantity || 'â'}</td>
                  <td style={{ padding: '8px 12px', color: '#FF6B00', fontWeight: 600, whiteSpace: 'nowrap' }}>â®{fmt(Number(o.total_price || 0))}</td>
                  <td style={{ padding: '8px 12px' }}>
                    <span style={{ fontSize: 10, padding: '3px 8px', borderRadius: 99, background: stColor(o.status) + '18', color: stColor(o.status), fontWeight: 600 }}>
                      {stLabel(o.status)}
                    </span>
                  </td>
                  <td style={{ padding: '8px 12px' }}>
                    <span style={{ fontSize: 10, padding: '2px 6px', borderRadius: 4, background: (PRIORITY_COLOR[o.priority] || '#94A3B8') + '18', color: PRIORITY_COLOR[o.priority] || '#94A3B8', fontWeight: 600 }}>
                      {PRIORITY_LABEL[o.priority] || 'Ð­Ð½Ð³Ð¸Ð¹Ð½'}
                    </span>
                  </td>
                  <td style={{ padding: '8px 12px', fontSize: 11 }}>
                    {o.deadline ? (
                      <span style={{ color: isDelayed ? '#EF4444' : 'var(--text2)', fontWeight: isDelayed ? 700 : 400 }}>
                        {isDelayed && 'ð´ '}{new Date(o.deadline).toLocaleDateString('mn-MN')}
                      </span>
                    ) : (
                      <span style={{ color: 'var(--text3)' }}>â</span>
                    )}
                  </td>
                  <td style={{ padding: '8px 12px' }} onClick={e => e.stopPropagation()}>
                    <button onClick={() => openDetail(o)} style={{ padding: '4px 10px', background: 'rgba(59,130,246,0.1)', color: '#3B82F6', border: 'none', borderRadius: 6, cursor: 'pointer', fontSize: 11, fontWeight: 500 }}>ÐÑÐ»Ð³ÑÑÑÐ½Ð³Ò¯Ð¹</button>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      {/* DETAIL MODAL */}
      {detail && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 999, display: 'flex', alignItems: 'center', justifyContent: 'center', animation: 'fadeIn 0.2s ease' }} onClick={() => setDetail(null)}>
          <div style={{ background: 'var(--surface)', borderRadius: 16, width: '100%', maxWidth: 700, border: '1px solid var(--border)', maxHeight: '90vh', display: 'flex', flexDirection: 'column', overflow: 'hidden', boxShadow: '0 20px 60px rgba(0,0,0,0.3)', animation: 'slideUp 0.25s ease' }} onClick={e => e.stopPropagation()}>

            {/* Header */}
            <div style={{ padding: '20px 24px 16px', borderBottom: '1px solid var(--border)', flexShrink: 0 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                    <span style={{ fontSize: 12, fontFamily: 'monospace', color: 'var(--text3)' }}>#{detail.id?.slice(0, 12)}</span>
                    <span style={{ fontSize: 10, padding: '2px 10px', borderRadius: 99, background: stColor(detail.status) + '15', color: stColor(detail.status), fontWeight: 600 }}>{stLabel(detail.status)}</span>
                    {detail.is_delayed && <span style={{ fontSize: 10, padding: '2px 8px', borderRadius: 99, background: '#FEE2E2', color: '#DC2626', fontWeight: 700 }}>ð´ Ð¥ÐÐ¦ÐÐ Ð¡ÐÐ</span>}
                    <span style={{ fontSize: 10, padding: '2px 8px', borderRadius: 4, background: (PRIORITY_COLOR[detail.priority] || '#94A3B8') + '15', color: PRIORITY_COLOR[detail.priority] || '#94A3B8', fontWeight: 600 }}>{PRIORITY_LABEL[detail.priority] || 'Ð­Ð½Ð³Ð¸Ð¹Ð½'}</span>
                  </div>
                  <div style={{ fontSize: 18, fontWeight: 700, marginBottom: 2 }}>{detail.product_name || 'ÐÐ°ÑÐ¸Ð°Ð»Ð³Ð°'}</div>
                  <div style={{ fontSize: 13, color: 'var(--text2)' }}>
                    {detail.customer_name || detail.customer_email || 'â'} Â· {detail.quantity || 0}Ñ Â· <span style={{ color: '#FF6B00', fontWeight: 600 }}>â®{fmt(Number(detail.total_price || 0))}</span>
                  </div>
                </div>
                <button onClick={() => setDetail(null)} style={{ background: 'var(--surface2)', border: '1px solid var(--border)', color: 'var(--text2)', width: 32, height: 32, borderRadius: 8, cursor: 'pointer', fontSize: 16, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>â</button>
              </div>
            </div>

            {/* Body */}
            <div style={{ flex: 1, overflow: 'auto', padding: '16px 24px 24px' }}>

              {/* Info Grid */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px 16px', marginBottom: 20 }}>
                {[
                  { label: 'Ð¥ÑÑÑÐ³Ð»ÑÐ³Ñ', value: detail.customer_name || 'â' },
                  { label: 'Ð£ÑÐ°Ñ', value: detail.customer_phone || 'â' },
                  { label: 'Ð-Ð¼ÑÐ¹Ð»', value: detail.customer_email || 'â' },
                  { label: 'Ð¢Ð¾Ð¾ ÑÐ¸ÑÑÑÐ³', value: detail.quantity || 'â' },
                  { label: 'ÐÑÐ³Ð¶ Ò¯Ð½Ñ', value: detail.unit_price ? `â®${fmt(Number(detail.unit_price))}` : 'â' },
                  { label: 'ÐÐ¸Ð¹Ñ Ð´Ò¯Ð½', value: detail.total_price ? `â®${fmt(Number(detail.total_price))}` : 'â' },
                  { label: 'Ð¥ÑÐ¼Ð¶ÑÑ', value: detail.width_mm && detail.height_mm ? `${detail.width_mm}Ã${detail.height_mm}Ð¼Ð¼` : 'â' },
                  { label: 'Ð¦Ð°Ð°Ñ', value: detail.paper_gsm ? `${detail.paper_gsm}gsm` : 'â' },
                  { label: 'Finishing', value: detail.finishing || 'â' },
                  { label: 'Ð¢Ó©Ð»Ð±Ó©Ñ', value: detail.payment_status || 'â' },
                  { label: 'ÐÑÑÑÐ°Ñ ÑÑÐ³Ð°ÑÐ°Ð°', value: detail.deadline ? new Date(detail.deadline).toLocaleDateString('mn-MN') : 'â' },
                  { label: 'ÐÐ³Ð½Ð¾Ð¾', value: detail.created_at ? new Date(detail.created_at).toLocaleString('mn-MN') : 'â' },
                ].map(item => (
                  <div key={item.label} style={{ fontSize: 12 }}>
                    <span style={{ color: 'var(--text3)', marginRight: 6 }}>{item.label}:</span>
                    <span style={{ fontWeight: 500 }}>{item.value}</span>
                  </div>
                ))}
              </div>

              {/* Vendor Assignment */}
              <div style={{ marginBottom: 20 }}>
                <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 8, color: 'var(--text2)' }}>Vendor ÑÑÐ²Ð°Ð°ÑÐ¸Ð»Ð°Ð»Ñ</div>
                <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                  <select
                    value={detail.factory_id || ''}
                    onChange={e => { if (e.target.value) assignVendor(detail.id, e.target.value) }}
                    style={{ padding: '8px 12px', borderRadius: 8, border: '1px solid var(--border)', fontSize: 13, flex: 1 }}
                  >
                    <option value="">â Vendor ÑÐ¾Ð½Ð³Ð¾Ñ â</option>
                    {vendors.map((v: any) => (
                      <option key={v.id} value={v.id}>{v.company_name} ({v.load_status || 'available'})</option>
                    ))}
                  </select>
                  {detail.factory_id && (
                    <span style={{ fontSize: 12, color: '#10B981', fontWeight: 600 }}>
                      â {vendors.find((v: any) => v.id === detail.factory_id)?.company_name || detail.factory_id.slice(0, 8)}
                    </span>
                  )}
                </div>
              </div>

              {/* PRODUCTION GATE â Preflight Panel */}
              <div style={{ marginBottom: 20 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text2)' }}>Ð¤Ð°Ð¹Ð» ÑÐ°Ð»Ð³Ð°Ð»Ñ (Production Gate)</div>
                  <button onClick={() => runGateCheck(detail.id)} disabled={gateLoading} style={{ padding: '4px 12px', borderRadius: 6, border: '1px solid var(--border)', background: 'var(--surface)', fontSize: 11, cursor: 'pointer' }}>
                    {gateLoading ? 'â³ Ð¨Ð°Ð»Ð³Ð°Ð¶ Ð±Ð°Ð¹Ð½Ð°...' : 'ð ÐÐ°ÑÐ¸Ð½ ÑÐ°Ð»Ð³Ð°Ñ'}
                  </button>
                </div>

                {!gateResult ? (
                  <div style={{ padding: 16, background: 'var(--surface2)', borderRadius: 10, fontSize: 12, color: 'var(--text3)', textAlign: 'center' }}>
                    Ð¤Ð°Ð¹Ð» Ð±Ð°Ð¹ÑÐ³Ò¯Ð¹ ÑÑÐ²ÑÐ» ÑÐ°Ð»Ð³Ð°Ð»Ñ ÑÐ¸Ð¹Ð³Ð´ÑÑÐ³Ò¯Ð¹
                  </div>
                ) : gateResult.total_files === 0 ? (
                  <div style={{ padding: 16, background: '#FEF3C7', border: '1px solid #FDE68A', borderRadius: 10, fontSize: 12, color: '#92400E' }}>
                    â ï¸ Ð¤Ð°Ð¹Ð» Ð¾ÑÑÑÐ»Ð°Ð³Ð´Ð°Ð°Ð³Ò¯Ð¹ Ð±Ð°Ð¹Ð½Ð°
                  </div>
                ) : (
                  <div style={{ border: '1px solid var(--border)', borderRadius: 10, overflow: 'hidden' }}>
                    {/* Gate Summary */}
                    <div style={{
                      padding: '12px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                      background: gateResult.production_ready ? '#F0FDF4' : '#FEF2F2',
                      borderBottom: '1px solid var(--border)',
                    }}>
                      <div>
                        <span style={{ fontSize: 14, fontWeight: 700, color: gateResult.production_ready ? '#16A34A' : '#DC2626' }}>
                          {gateResult.production_ready ? 'â Ò®Ð¹Ð»Ð´Ð²ÑÑÑ Ð±ÑÐ»ÑÐ½' : 'â Ð¨Ð°Ð»Ð³Ð°Ð»Ñ Ð´Ð°Ð²ÑÐ°Ð½Ð³Ò¯Ð¹'}
                        </span>
                        <div style={{ fontSize: 11, color: 'var(--text3)', marginTop: 2 }}>{gateResult.summary}</div>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <div style={{ fontSize: 11, color: 'var(--text3)' }}>Ð¤Ð°Ð¹Ð»: {gateResult.total_files}</div>
                        <div style={{ fontSize: 11, color: 'var(--text3)' }}>Ð¨Ð°Ð»Ð³Ð°ÑÐ°Ð½: {gateResult.checked}</div>
                      </div>
                    </div>

                    {/* Per-file results */}
                    {gateResult.results?.map((r: any, i: number) => (
                      <div key={i} style={{ padding: '10px 16px', borderBottom: '1px solid var(--border)' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                          <span style={{ fontSize: 12, fontWeight: 600 }}>ð {r.filename}</span>
                          <span style={{
                            fontSize: 11, padding: '2px 10px', borderRadius: 99, fontWeight: 700,
                            background: r.score >= 80 ? '#DCFCE7' : r.score >= 60 ? '#FEF3C7' : '#FEE2E2',
                            color: r.score >= 80 ? '#16A34A' : r.score >= 60 ? '#D97706' : '#DC2626',
                          }}>
                            {r.score}/100 Â· {r.risk}
                          </span>
                        </div>

                        {/* Checks Grid */}
                        {r.checks && (
                          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '4px 12px' }}>
                            {Object.entries(r.checks).map(([key, val]: [string, any]) => {
                              const icon = val.status === 'pass' ? 'â' : val.status === 'fail' ? 'â' : val.status === 'warning' ? 'â ï¸' : 'â¹ï¸'
                              const color = val.status === 'pass' ? '#16A34A' : val.status === 'fail' ? '#DC2626' : val.status === 'warning' ? '#D97706' : '#64748B'
                              const labels: Record<string, string> = {
                                resolution: 'ÐÑÐ³ÑÐ°ÑÑÐ¸Ð» (DPI)', color_mode: 'Ó¨Ð½Ð³Ó© (CMYK)', bleed: 'Bleed (3Ð¼Ð¼)',
                                fonts: 'Ð¤Ð¾Ð½Ñ embed', page_size: 'Ð¥ÑÐ¼Ð¶ÑÑ', transparency: 'Transparency',
                                image_count: 'ÐÑÑÐ³ÑÑÐ´', bleed_box: 'BleedBox',
                              }
                              return (
                                <div key={key} style={{ fontSize: 11, display: 'flex', gap: 4, alignItems: 'start' }}>
                                  <span>{icon}</span>
                                  <div>
                                    <span style={{ fontWeight: 600, color }}>{labels[key] || key}</span>
                                    <div style={{ color: 'var(--text3)', fontSize: 10 }}>{val.detail}</div>
                                  </div>
                                </div>
                              )
                            })}
                          </div>
                        )}

                        {/* Blocking issues */}
                        {r.blocking_issues?.length > 0 && (
                          <div style={{ marginTop: 8, padding: '6px 10px', background: '#FEE2E2', borderRadius: 6 }}>
                            {r.blocking_issues.map((issue: string, j: number) => (
                              <div key={j} style={{ fontSize: 11, color: '#DC2626', fontWeight: 500 }}>â {issue}</div>
                            ))}
                          </div>
                        )}

                        {/* Warnings */}
                        {r.warnings?.length > 0 && (
                          <div style={{ marginTop: 6, padding: '6px 10px', background: '#FEF3C7', borderRadius: 6 }}>
                            {r.warnings.map((w: string, j: number) => (
                              <div key={j} style={{ fontSize: 11, color: '#92400E' }}>â ï¸ {w}</div>
                            ))}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Timeline */}
              {timeline.length > 0 && (
                <div style={{ marginBottom: 20 }}>
                  <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 8, color: 'var(--text2)' }}>Ð¢Ò¯Ò¯Ñ (Timeline)</div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 0, paddingLeft: 12 }}>
                    {timeline.map((t: any, i: number) => (
                      <div key={i} style={{ display: 'flex', gap: 12, position: 'relative', paddingBottom: i < timeline.length - 1 ? 16 : 0 }}>
                        {i < timeline.length - 1 && <div style={{ position: 'absolute', left: 5, top: 14, bottom: -2, width: 2, background: 'var(--border)' }} />}
                        <div style={{ width: 12, height: 12, borderRadius: '50%', background: t.completed ? stColor(t.status) : 'var(--border)', flexShrink: 0, marginTop: 2, border: '2px solid var(--surface)', zIndex: 1 }} />
                        <div>
                          <div style={{ fontSize: 13, fontWeight: 500 }}>{t.label}</div>
                          <div style={{ fontSize: 11, color: 'var(--text3)' }}>{t.date ? new Date(t.date).toLocaleString('mn-MN') : ''}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Ò®Ð¹Ð»Ð´Ð²ÑÑÑ Ð¸Ð»Ð³ÑÑÑ â ÑÑÑÐ³Ð°Ð¹ ÑÐ¾Ð²Ñ */}
              {(detail.status === 'file_review' || detail.status === 'confirmed' || detail.status === 'paid') && (
                <div style={{ marginBottom: 16, padding: 16, background: '#F0FDF4', borderRadius: 12, border: '1px solid #BBF7D0' }}>
                  <div style={{ fontSize: 14, fontWeight: 700, color: '#059669', marginBottom: 8 }}>ð­ Ò®Ð¹Ð»Ð´Ð²ÑÑÐ»ÑÐ»Ð´ Ð±ÑÐ»ÑÐ½</div>
                  <div style={{ fontSize: 11, color: '#6B7280', marginBottom: 10 }}>Ð¤Ð°Ð¹Ð» ÑÐ°Ð»Ð³Ð°Ð»Ñ Ð´ÑÑÑÑÐ°Ð½ Ð±Ð¾Ð» Ò¯Ð¹Ð»Ð´Ð²ÑÑÑ Ð¸Ð»Ð³ÑÑÐ½Ñ</div>
                  <button onClick={async () => {
                    await updateStatus(detail.id, 'in_production')
                    setDetail({ ...detail, status: 'in_production' })
                    alert('Ò®Ð¹Ð»Ð´Ð²ÑÑÐ»ÑÐ»Ð´ Ð¸Ð»Ð³ÑÑÐ³Ð´Ð»ÑÑ!')
                  }} style={{ width: '100%', padding: '12px 0', borderRadius: 10, border: 'none', background: '#10B981', color: '#fff', fontSize: 14, fontWeight: 700, cursor: 'pointer' }}>
                    ð­ Ò®Ð¹Ð»Ð´Ð²ÑÑÐ»ÑÐ»Ð´ Ð¸Ð»Ð³ÑÑÑ
                  </button>
                </div>
              )}

              {/* Quick Actions */}
              <div style={{ marginBottom: 20 }}>
                <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 8, color: 'var(--text2)' }}>Ð¢Ó©Ð»Ó©Ð² ÑÐ¾Ð»Ð¸Ñ</div>
                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                  {ALL_STATUSES.map(s => (
                    <button key={s} onClick={() => updateStatus(detail.id, s)} style={{
                      padding: '5px 10px', borderRadius: 6, border: 'none', fontSize: 11, cursor: 'pointer',
                      background: detail.status === s ? stColor(s) : stColor(s) + '15',
                      color: detail.status === s ? '#fff' : stColor(s),
                      fontWeight: detail.status === s ? 700 : 500, transition: 'all 0.15s',
                    }}>
                      {stLabel(s)}
                    </button>
                  ))}
                </div>
              </div>

              {/* Priority */}
              <div>
                <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 8, color: 'var(--text2)' }}>ÐÑ ÑÐ¾Ð»Ð±Ð¾Ð³Ð´Ð¾Ð»</div>
                <div style={{ display: 'flex', gap: 6 }}>
                  {Object.entries(PRIORITY_LABEL).map(([k, v]) => (
                    <button key={k} onClick={async () => {
                      await apiFetch(`/orders/${detail.id}/status`, { method: 'PATCH', body: JSON.stringify({ priority: k }) })
                      setDetail((p: any) => p ? { ...p, priority: k } : null)
                      load()
                    }} style={{
                      padding: '6px 14px', borderRadius: 6, border: detail.priority === k ? `2px solid ${PRIORITY_COLOR[k]}` : '1px solid var(--border)',
                      background: detail.priority === k ? PRIORITY_COLOR[k] + '15' : 'transparent',
                      color: PRIORITY_COLOR[k], fontSize: 12, cursor: 'pointer', fontWeight: detail.priority === k ? 700 : 400,
                    }}>
                      {v}
                    </button>
                  ))}
                </div>
              </div>

              {/* Notes */}
              {detail.notes && (
                <div style={{ marginTop: 16 }}>
                  <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 6, color: 'var(--text2)' }}>Ð¢ÑÐ¼Ð´ÑÐ³Ð»ÑÐ»</div>
                  <div style={{ fontSize: 12, color: 'var(--text2)', background: 'var(--surface2)', padding: '10px 14px', borderRadius: 8 }}>{detail.notes}</div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
