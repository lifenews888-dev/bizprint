'use client'
import { apiFetch } from '@/lib/api'
import { useState, useEffect, useCallback } from 'react'

/* ═══════════════════════════════════════
 *  ORDER OPERATIONS CONTROL CENTER
 *  KPI → Alerts → Filters → Table → Bulk → Detail
 * ═══════════════════════════════════════ */

const STATUS_COLOR: Record<string, string> = {
  draft: '#94A3B8', quotation_sent: '#F59E0B', confirmed: '#3B82F6',
  pending_file: '#8B5CF6', file_review: '#06B6D4', file_rejected: '#EF4444',
  on_hold: '#F97316', in_production: '#EC4899', finishing: '#8B5CF6',
  partially_dispatched: '#6366F1', dispatched: '#6366F1', delivered: '#10B981',
  completed: '#059669', cancelled: '#EF4444',
}
const STATUS_LABEL: Record<string, string> = {
  draft: 'Ноорог', quotation_sent: 'Санал илгээсэн', confirmed: 'Баталгаажсан',
  pending_file: 'Файл хүлээж буй', file_review: 'Файл шалгалт', file_rejected: 'Файл буцсан',
  on_hold: 'Түр зогссон', in_production: 'Үйлдвэрлэлд', finishing: 'Боловсруулалт',
  partially_dispatched: 'Хэсэгчлэн', dispatched: 'Илгээсэн', delivered: 'Хүргэсэн',
  completed: 'Дууссан', cancelled: 'Цуцалсан',
}
const PRIORITY_COLOR: Record<string, string> = { low: '#94A3B8', normal: '#3B82F6', high: '#F59E0B', urgent: '#EF4444' }
const PRIORITY_LABEL: Record<string, string> = { low: 'Бага', normal: 'Энгийн', high: 'Өндөр', urgent: 'Яаралтай' }

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
      if (!confirm(`${ids.length} захиалга цуцлах уу?`)) return
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
      return (o.customer_name || '').toLowerCase().includes(s) ||
        (o.product_name || '').toLowerCase().includes(s) ||
        (o.id || '').toLowerCase().includes(s) ||
        (o.customer_email || '').toLowerCase().includes(s)
    }
    return true
  })

  const stLabel = (s: string) => STATUS_LABEL[s] || s
  const stColor = (s: string) => STATUS_COLOR[s] || '#888'

  return (
    <div style={{ padding: 24, fontFamily: "'DM Sans','Segoe UI',system-ui,sans-serif" }}>
      <style>{`
        @keyframes fadeIn{from{opacity:0}to{opacity:1}}
        @keyframes slideUp{from{opacity:0;transform:translateY(12px)}to{opacity:1;transform:translateY(0)}}
        .ord-row{transition:background .15s}.ord-row:hover{background:var(--surface2)!important}
      `}</style>

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 700, margin: 0 }}>Захиалгын удирдлага</h1>
          <p style={{ color: 'var(--text2)', fontSize: 13, margin: '4px 0 0' }}>Operations Control Center · {orders.length} захиалга</p>
        </div>
        <button onClick={load} style={{ padding: '8px 16px', borderRadius: 8, border: '1px solid var(--border)', background: 'var(--surface)', cursor: 'pointer', fontSize: 13 }}>
          🔄 Шинэчлэх
        </button>
      </div>

      {/* KPI SUMMARY */}
      {kpi && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(160px,1fr))', gap: 10, marginBottom: 20 }}>
          {[
            { label: 'Нийт захиалга', value: kpi.total_orders, color: '#64748B', icon: '📋' },
            { label: 'Нийт орлого', value: `₮${fmt(kpi.total_revenue)}`, color: '#FF6B00', icon: '💰' },
            { label: 'Хүлээгдэж буй', value: `${kpi.pending?.count || 0}`, sub: `₮${fmt(kpi.pending?.value || 0)}`, color: '#F59E0B', icon: '⏳' },
            { label: 'Үйлдвэрлэлд', value: `${kpi.production?.count || 0}`, sub: `₮${fmt(kpi.production?.value || 0)}`, color: '#EC4899', icon: '🏭' },
            { label: 'Дууссан', value: `${kpi.completed?.count || 0}`, sub: `₮${fmt(kpi.completed?.value || 0)}`, color: '#059669', icon: '✅' },
            { label: 'Хоцорсон', value: `${kpi.delayed?.count || 0}`, color: '#EF4444', icon: '🔴' },
            { label: 'Өнөөдөр', value: `${kpi.today?.count || 0}`, color: '#3B82F6', icon: '📅' },
            { label: 'Яаралтай', value: `${kpi.urgent?.count || 0}`, color: '#EF4444', icon: '🚨' },
          ].map(k => (
            <div key={k.label} style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 12, padding: '14px 16px', borderLeft: `4px solid ${k.color}` }}>
              <div style={{ fontSize: 11, color: 'var(--text3)', marginBottom: 4 }}>{k.icon} {k.label}</div>
              <div style={{ fontSize: 20, fontWeight: 700, color: k.color }}>{k.value}</div>
              {k.sub && <div style={{ fontSize: 11, color: 'var(--text3)', marginTop: 2 }}>{k.sub}</div>}
            </div>
          ))}
        </div>
      )}

      {/* ALERTS */}
      {alerts && alerts.total_alerts > 0 && (
        <div style={{ background: '#FEF2F2', border: '1px solid #FECACA', borderRadius: 12, padding: '14px 20px', marginBottom: 20, display: 'flex', gap: 20, flexWrap: 'wrap', alignItems: 'center' }}>
          <span style={{ fontWeight: 700, color: '#DC2626', fontSize: 14 }}>🔥 Анхааруулга ({alerts.total_alerts})</span>
          {alerts.delayed?.count > 0 && <span style={{ fontSize: 13, color: '#DC2626' }}>⏰ Хоцорсон: {alerts.delayed.count}</span>}
          {alerts.no_vendor?.count > 0 && <span style={{ fontSize: 13, color: '#DC2626' }}>👤 Vendor-гүй: {alerts.no_vendor.count}</span>}
          {alerts.urgent?.count > 0 && <span style={{ fontSize: 13, color: '#DC2626' }}>🚨 Яаралтай: {alerts.urgent.count}</span>}
          {alerts.stale?.count > 0 && <span style={{ fontSize: 13, color: '#DC2626' }}>⚠️ Хөдөлгөөнгүй: {alerts.stale.count}</span>}
          {alerts.file_pending?.count > 0 && <span style={{ fontSize: 13, color: '#DC2626' }}>📁 Файл хүлээж: {alerts.file_pending.count}</span>}
        </div>
      )}

      {/* FILTERS + SEARCH */}
      <div style={{ display: 'flex', gap: 10, marginBottom: 16, flexWrap: 'wrap', alignItems: 'center' }}>
        <input
          placeholder="Хайх... (нэр, бүтээгдэхүүн, ID)"
          value={search}
          onChange={e => setSearch(e.target.value)}
          style={{ padding: '8px 14px', borderRadius: 8, border: '1px solid var(--border)', background: 'var(--surface)', fontSize: 13, width: 260 }}
        />
        <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
          <button onClick={() => setFilter('')} style={{ padding: '6px 12px', borderRadius: 6, border: 'none', fontSize: 11, cursor: 'pointer', background: !filter ? '#FF6B00' : 'var(--surface2)', color: !filter ? '#fff' : 'var(--text2)', fontWeight: !filter ? 600 : 400 }}>Бүгд</button>
          {ALL_STATUSES.map(s => (
            <button key={s} onClick={() => setFilter(filter === s ? '' : s)} style={{ padding: '6px 12px', borderRadius: 6, border: 'none', fontSize: 11, cursor: 'pointer', background: filter === s ? stColor(s) : 'var(--surface2)', color: filter === s ? '#fff' : 'var(--text2)', fontWeight: filter === s ? 600 : 400 }}>
              {stLabel(s)}
            </button>
          ))}
        </div>
      </div>

      {/* BULK ACTION BAR */}
      {selected.size > 0 && (
        <div style={{ background: '#EFF6FF', border: '1px solid #BFDBFE', borderRadius: 10, padding: '10px 16px', marginBottom: 16, display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
          <span style={{ fontWeight: 600, color: '#1D4ED8', fontSize: 13 }}>{selected.size} сонгосон</span>
          <select value={bulkAction} onChange={e => setBulkAction(e.target.value)} style={{ padding: '6px 10px', borderRadius: 6, border: '1px solid #BFDBFE', fontSize: 12 }}>
            <option value="">Үйлдэл сонгох...</option>
            <optgroup label="Төлөв солих">
              {ALL_STATUSES.map(s => <option key={s} value={`status:${s}`}>{stLabel(s)}</option>)}
            </optgroup>
            <optgroup label="Ач холбогдол">
              {Object.keys(PRIORITY_LABEL).map(p => <option key={p} value={`priority:${p}`}>{PRIORITY_LABEL[p]}</option>)}
            </optgroup>
            <option value="cancel">❌ Цуцлах</option>
          </select>
          <button onClick={executeBulk} disabled={!bulkAction} style={{ padding: '6px 14px', borderRadius: 6, border: 'none', background: bulkAction ? '#1D4ED8' : '#94A3B8', color: '#fff', fontSize: 12, cursor: bulkAction ? 'pointer' : 'not-allowed', fontWeight: 600 }}>Гүйцэтгэх</button>
          <button onClick={() => setSelected(new Set())} style={{ padding: '6px 14px', borderRadius: 6, border: '1px solid #BFDBFE', background: 'transparent', color: '#1D4ED8', fontSize: 12, cursor: 'pointer' }}>Болих</button>
        </div>
      )}

      {/* ORDERS TABLE */}
      <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 14, overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
          <thead>
            <tr style={{ background: 'var(--surface2)' }}>
              <th style={{ padding: '10px 12px', width: 32 }}>
                <input type="checkbox" checked={selected.size === filtered.length && filtered.length > 0} onChange={selectAll} />
              </th>
              {['ID', 'Хэрэглэгч', 'Бүтээгдэхүүн', 'Vendor', 'Тоо', 'Дүн', 'Төлөв', 'Зэрэг', 'Хугацаа', 'Үйлдэл'].map(h => (
                <th key={h} style={{ padding: '10px 12px', textAlign: 'left', color: 'var(--text2)', fontWeight: 500, whiteSpace: 'nowrap', fontSize: 11, textTransform: 'uppercase' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={11} style={{ padding: 40, textAlign: 'center', color: 'var(--text2)' }}>Уншиж байна...</td></tr>
            ) : filtered.length === 0 ? (
              <tr><td colSpan={11} style={{ padding: 40, textAlign: 'center', color: 'var(--text2)' }}>Захиалга байхгүй</td></tr>
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
                    <div style={{ fontWeight: 500, fontSize: 13 }}>{o.customer_name || '—'}</div>
                    <div style={{ fontSize: 11, color: 'var(--text3)' }}>{o.customer_email || ''}</div>
                  </td>
                  <td style={{ padding: '8px 12px', color: 'var(--text2)', fontSize: 12 }}>{o.product_name || '—'}</td>
                  <td style={{ padding: '8px 12px', fontSize: 12 }}>
                    {vendorName ? (
                      <span style={{ fontSize: 11, padding: '2px 8px', borderRadius: 6, background: '#EFF6FF', color: '#1D4ED8' }}>{vendorName}</span>
                    ) : o.factory_id ? (
                      <span style={{ fontSize: 11, color: 'var(--text3)' }}>#{o.factory_id.slice(0, 6)}</span>
                    ) : (
                      <span style={{ fontSize: 11, color: '#EF4444' }}>—</span>
                    )}
                  </td>
                  <td style={{ padding: '8px 12px', color: 'var(--text2)' }}>{o.quantity || '—'}</td>
                  <td style={{ padding: '8px 12px', color: '#FF6B00', fontWeight: 600, whiteSpace: 'nowrap' }}>₮{fmt(Number(o.total_price || 0))}</td>
                  <td style={{ padding: '8px 12px' }}>
                    <span style={{ fontSize: 10, padding: '3px 8px', borderRadius: 99, background: stColor(o.status) + '18', color: stColor(o.status), fontWeight: 600 }}>
                      {stLabel(o.status)}
                    </span>
                  </td>
                  <td style={{ padding: '8px 12px' }}>
                    <span style={{ fontSize: 10, padding: '2px 6px', borderRadius: 4, background: (PRIORITY_COLOR[o.priority] || '#94A3B8') + '18', color: PRIORITY_COLOR[o.priority] || '#94A3B8', fontWeight: 600 }}>
                      {PRIORITY_LABEL[o.priority] || 'Энгийн'}
                    </span>
                  </td>
                  <td style={{ padding: '8px 12px', fontSize: 11 }}>
                    {o.deadline ? (
                      <span style={{ color: isDelayed ? '#EF4444' : 'var(--text2)', fontWeight: isDelayed ? 700 : 400 }}>
                        {isDelayed && '🔴 '}{new Date(o.deadline).toLocaleDateString('mn-MN')}
                      </span>
                    ) : (
                      <span style={{ color: 'var(--text3)' }}>—</span>
                    )}
                  </td>
                  <td style={{ padding: '8px 12px' }} onClick={e => e.stopPropagation()}>
                    <button onClick={() => openDetail(o)} style={{ padding: '4px 10px', background: 'rgba(59,130,246,0.1)', color: '#3B82F6', border: 'none', borderRadius: 6, cursor: 'pointer', fontSize: 11, fontWeight: 500 }}>Дэлгэрэнгүй</button>
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
                    {detail.is_delayed && <span style={{ fontSize: 10, padding: '2px 8px', borderRadius: 99, background: '#FEE2E2', color: '#DC2626', fontWeight: 700 }}>🔴 ХОЦОРСОН</span>}
                    <span style={{ fontSize: 10, padding: '2px 8px', borderRadius: 4, background: (PRIORITY_COLOR[detail.priority] || '#94A3B8') + '15', color: PRIORITY_COLOR[detail.priority] || '#94A3B8', fontWeight: 600 }}>{PRIORITY_LABEL[detail.priority] || 'Энгийн'}</span>
                  </div>
                  <div style={{ fontSize: 18, fontWeight: 700, marginBottom: 2 }}>{detail.product_name || 'Захиалга'}</div>
                  <div style={{ fontSize: 13, color: 'var(--text2)' }}>
                    {detail.customer_name || detail.customer_email || '—'} · {detail.quantity || 0}ш · <span style={{ color: '#FF6B00', fontWeight: 600 }}>₮{fmt(Number(detail.total_price || 0))}</span>
                  </div>
                </div>
                <button onClick={() => setDetail(null)} style={{ background: 'var(--surface2)', border: '1px solid var(--border)', color: 'var(--text2)', width: 32, height: 32, borderRadius: 8, cursor: 'pointer', fontSize: 16, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>✕</button>
              </div>
            </div>

            {/* Body */}
            <div style={{ flex: 1, overflow: 'auto', padding: '16px 24px 24px' }}>

              {/* Info Grid */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px 16px', marginBottom: 20 }}>
                {[
                  { label: 'Хэрэглэгч', value: detail.customer_name || '—' },
                  { label: 'Утас', value: detail.customer_phone || '—' },
                  { label: 'И-мэйл', value: detail.customer_email || '—' },
                  { label: 'Тоо ширхэг', value: detail.quantity || '—' },
                  { label: 'Нэгж үнэ', value: detail.unit_price ? `₮${fmt(Number(detail.unit_price))}` : '—' },
                  { label: 'Нийт дүн', value: detail.total_price ? `₮${fmt(Number(detail.total_price))}` : '—' },
                  { label: 'Хэмжээ', value: detail.width_mm && detail.height_mm ? `${detail.width_mm}×${detail.height_mm}мм` : '—' },
                  { label: 'Цаас', value: detail.paper_gsm ? `${detail.paper_gsm}gsm` : '—' },
                  { label: 'Finishing', value: detail.finishing || '—' },
                  { label: 'Төлбөр', value: detail.payment_status || '—' },
                  { label: 'Дуусах хугацаа', value: detail.deadline ? new Date(detail.deadline).toLocaleDateString('mn-MN') : '—' },
                  { label: 'Огноо', value: detail.created_at ? new Date(detail.created_at).toLocaleString('mn-MN') : '—' },
                ].map(item => (
                  <div key={item.label} style={{ fontSize: 12 }}>
                    <span style={{ color: 'var(--text3)', marginRight: 6 }}>{item.label}:</span>
                    <span style={{ fontWeight: 500 }}>{item.value}</span>
                  </div>
                ))}
              </div>

              {/* Vendor Assignment */}
              <div style={{ marginBottom: 20 }}>
                <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 8, color: 'var(--text2)' }}>Vendor хуваарилалт</div>
                <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                  <select
                    value={detail.factory_id || ''}
                    onChange={e => { if (e.target.value) assignVendor(detail.id, e.target.value) }}
                    style={{ padding: '8px 12px', borderRadius: 8, border: '1px solid var(--border)', fontSize: 13, flex: 1 }}
                  >
                    <option value="">— Vendor сонгох —</option>
                    {vendors.map((v: any) => (
                      <option key={v.id} value={v.id}>{v.company_name} ({v.load_status || 'available'})</option>
                    ))}
                  </select>
                  {detail.factory_id && (
                    <span style={{ fontSize: 12, color: '#10B981', fontWeight: 600 }}>
                      ✅ {vendors.find((v: any) => v.id === detail.factory_id)?.company_name || detail.factory_id.slice(0, 8)}
                    </span>
                  )}
                </div>
              </div>

              {/* PRODUCTION GATE — Preflight Panel */}
              <div style={{ marginBottom: 20 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text2)' }}>Файл шалгалт (Production Gate)</div>
                  <button onClick={() => runGateCheck(detail.id)} disabled={gateLoading} style={{ padding: '4px 12px', borderRadius: 6, border: '1px solid var(--border)', background: 'var(--surface)', fontSize: 11, cursor: 'pointer' }}>
                    {gateLoading ? '⏳ Шалгаж байна...' : '🔄 Дахин шалгах'}
                  </button>
                </div>

                {!gateResult ? (
                  <div style={{ padding: 16, background: 'var(--surface2)', borderRadius: 10, fontSize: 12, color: 'var(--text3)', textAlign: 'center' }}>
                    Файл байхгүй эсвэл шалгалт хийгдээгүй
                  </div>
                ) : gateResult.total_files === 0 ? (
                  <div style={{ padding: 16, background: '#FEF3C7', border: '1px solid #FDE68A', borderRadius: 10, fontSize: 12, color: '#92400E' }}>
                    ⚠️ Файл оруулагдаагүй байна
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
                          {gateResult.production_ready ? '✅ Үйлдвэрт бэлэн' : '❌ Шалгалт давсангүй'}
                        </span>
                        <div style={{ fontSize: 11, color: 'var(--text3)', marginTop: 2 }}>{gateResult.summary}</div>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <div style={{ fontSize: 11, color: 'var(--text3)' }}>Файл: {gateResult.total_files}</div>
                        <div style={{ fontSize: 11, color: 'var(--text3)' }}>Шалгасан: {gateResult.checked}</div>
                      </div>
                    </div>

                    {/* Per-file results */}
                    {gateResult.results?.map((r: any, i: number) => (
                      <div key={i} style={{ padding: '10px 16px', borderBottom: '1px solid var(--border)' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                          <span style={{ fontSize: 12, fontWeight: 600 }}>📄 {r.filename}</span>
                          <span style={{
                            fontSize: 11, padding: '2px 10px', borderRadius: 99, fontWeight: 700,
                            background: r.score >= 80 ? '#DCFCE7' : r.score >= 60 ? '#FEF3C7' : '#FEE2E2',
                            color: r.score >= 80 ? '#16A34A' : r.score >= 60 ? '#D97706' : '#DC2626',
                          }}>
                            {r.score}/100 · {r.risk}
                          </span>
                        </div>

                        {/* Checks Grid */}
                        {r.checks && (
                          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '4px 12px' }}>
                            {Object.entries(r.checks).map(([key, val]: [string, any]) => {
                              const icon = val.status === 'pass' ? '✅' : val.status === 'fail' ? '❌' : val.status === 'warning' ? '⚠️' : 'ℹ️'
                              const color = val.status === 'pass' ? '#16A34A' : val.status === 'fail' ? '#DC2626' : val.status === 'warning' ? '#D97706' : '#64748B'
                              const labels: Record<string, string> = {
                                resolution: 'Нягтаршил (DPI)', color_mode: 'Өнгө (CMYK)', bleed: 'Bleed (3мм)',
                                fonts: 'Фонт embed', page_size: 'Хэмжээ', transparency: 'Transparency',
                                image_count: 'Зургууд', bleed_box: 'BleedBox',
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
                              <div key={j} style={{ fontSize: 11, color: '#DC2626', fontWeight: 500 }}>❌ {issue}</div>
                            ))}
                          </div>
                        )}

                        {/* Warnings */}
                        {r.warnings?.length > 0 && (
                          <div style={{ marginTop: 6, padding: '6px 10px', background: '#FEF3C7', borderRadius: 6 }}>
                            {r.warnings.map((w: string, j: number) => (
                              <div key={j} style={{ fontSize: 11, color: '#92400E' }}>⚠️ {w}</div>
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
                  <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 8, color: 'var(--text2)' }}>Түүх (Timeline)</div>
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

              {/* Үйлдвэрт илгээх — тусгай товч */}
              {(detail.status === 'file_review' || detail.status === 'confirmed' || detail.status === 'paid') && (
                <div style={{ marginBottom: 16, padding: 16, background: '#F0FDF4', borderRadius: 12, border: '1px solid #BBF7D0' }}>
                  <div style={{ fontSize: 14, fontWeight: 700, color: '#059669', marginBottom: 8 }}>🏭 Үйлдвэрлэлд бэлэн</div>
                  <div style={{ fontSize: 11, color: '#6B7280', marginBottom: 10 }}>Файл шалгалт дууссан бол үйлдвэрт илгээнэ</div>
                  <button onClick={async () => {
                    await updateStatus(detail.id, 'in_production')
                    setDetail({ ...detail, status: 'in_production' })
                    alert('Үйлдвэрлэлд илгээгдлээ!')
                  }} style={{ width: '100%', padding: '12px 0', borderRadius: 10, border: 'none', background: '#10B981', color: '#fff', fontSize: 14, fontWeight: 700, cursor: 'pointer' }}>
                    🏭 Үйлдвэрлэлд илгээх
                  </button>
                </div>
              )}

              {/* Quick Actions */}
              <div style={{ marginBottom: 20 }}>
                <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 8, color: 'var(--text2)' }}>Төлөв солих</div>
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
                <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 8, color: 'var(--text2)' }}>Ач холбогдол</div>
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
                  <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 6, color: 'var(--text2)' }}>Тэмдэглэл</div>
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
