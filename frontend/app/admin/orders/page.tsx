'use client'
import { apiFetch } from '@/lib/api'
import { useState, useEffect } from 'react'

const STATUS_COLOR: Record<string, string> = {
  pending: '#F59E0B', paid: '#3B82F6', in_production: '#8B5CF6',
  designing: '#8B5CF6', prepress: '#06B6D4', printing: '#EC4899',
  finishing: '#3B82F6', qc: '#F97316', ready: '#10B981',
  delivering: '#6366F1', completed: '#059669', delivered: '#059669',
  shipped: '#10B981', cancelled: '#EF4444',
}
const STATUS_LABEL: Record<string, string> = {
  pending: 'Хүлээгдэж буй', paid: 'Төлөгдсөн', in_production: 'Үйлдвэрлэлд',
  designing: 'Дизайн', prepress: 'Prepress', printing: 'Хэвлэл',
  finishing: 'Finishing', qc: 'QC', ready: 'Бэлэн',
  delivering: 'Хүргэлтэнд', completed: 'Дууссан', delivered: 'Хүргэгдсэн',
  shipped: 'Хүргэгдсэн', cancelled: 'Цуцлагдсан',
}

export default function AdminOrdersPage() {
  const [items, setItems] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('')
  const [detail, setDetail] = useState<any>(null)
  const [orderFiles, setOrderFiles] = useState<any[]>([])

  const load = () => {
    apiFetch('/orders')
      .then(r => r.json())
      .then(d => setItems(Array.isArray(d) ? d : []))
      .catch(() => {})
      .finally(() => setLoading(false))
  }
  useEffect(load, [])

  const updateStatus = async (id: string, status: string) => {
    await apiFetch(`/orders/${id}/status`, { method: 'PATCH', body: { status } })
    load()
    if (detail?.id === id) setDetail((prev: any) => prev ? { ...prev, status } : null)
  }

  const loadFiles = async (orderId: string) => {
    try {
      const d = await apiFetch(`/order-files?order_id=${orderId}`)
      setOrderFiles(Array.isArray(d) ? d : [])
    } catch { setOrderFiles([]) }
  }

  const openDetail = (order: any) => {
    setDetail(order)
    loadFiles(order.id)
  }

  const filtered = items.filter(o => !filter || o.status === filter)

  const stLabel = (s: string) => STATUS_LABEL[s] || s
  const stColor = (s: string) => STATUS_COLOR[s] || '#888'

  return (
    <div style={{ padding: 24, fontFamily: "'DM Sans','Segoe UI',system-ui,sans-serif" }}>
      <style>{`
        @keyframes fadeIn{from{opacity:0}to{opacity:1}}
        @keyframes slideUp{from{opacity:0;transform:translateY(12px)}to{opacity:1;transform:translateY(0)}}
        .ord-row{transition:background .15s}.ord-row:hover{background:var(--surface2)!important}
      `}</style>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 700, margin: 0 }}>Захиалгууд</h1>
          <p style={{ color: 'var(--text2)', fontSize: 13, margin: '4px 0 0' }}>Нийт {items.length} захиалга</p>
        </div>
      </div>

      {/* KPI */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 20, flexWrap: 'wrap' }}>
        {[
          { label: 'Нийт', value: items.length, color: '#888' },
          { label: 'Хүлээгдэж буй', value: items.filter(o => o.status === 'pending').length, color: '#F59E0B' },
          { label: 'Төлөгдсөн', value: items.filter(o => o.status === 'paid').length, color: '#3B82F6' },
          { label: 'Үйлдвэрлэлд', value: items.filter(o => ['in_production', 'printing', 'prepress', 'finishing'].includes(o.status)).length, color: '#EC4899' },
          { label: 'Дууссан', value: items.filter(o => ['completed', 'delivered'].includes(o.status)).length, color: '#059669' },
        ].map(k => (
          <div key={k.label} style={{ background: 'var(--surface)', borderLeft: `3px solid ${k.color}`, borderRadius: '0 8px 8px 0', padding: '8px 14px', border: '1px solid var(--border)', borderLeftWidth: 3, borderLeftColor: k.color }}>
            <span style={{ fontSize: 20, fontWeight: 700, color: k.color, marginRight: 6 }}>{k.value}</span>
            <span style={{ fontSize: 12, color: 'var(--text3)' }}>{k.label}</span>
          </div>
        ))}
      </div>

      {/* Filter */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 20, flexWrap: 'wrap' }}>
        {['', 'pending', 'paid', 'in_production', 'printing', 'completed', 'delivered', 'cancelled'].map(s => (
          <button key={s} onClick={() => setFilter(s)} style={{ padding: '6px 14px', borderRadius: 6, border: 'none', fontSize: 12, cursor: 'pointer', background: filter === s ? '#FF6B00' : 'var(--surface2)', color: filter === s ? '#fff' : 'var(--text2)', fontWeight: filter === s ? 600 : 400 }}>
            {s ? stLabel(s) : 'Бүгд'}
          </button>
        ))}
      </div>

      {/* Table */}
      <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 14, overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
          <thead>
            <tr style={{ background: 'var(--surface2)' }}>
              {['ID', 'Хэрэглэгч', 'Бүтээгдэхүүн', 'Тоо', 'Дүн', 'Төлөв', 'Огноо', 'Үйлдэл'].map(h => (
                <th key={h} style={{ padding: '10px 16px', textAlign: 'left', color: 'var(--text2)', fontWeight: 500, whiteSpace: 'nowrap' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={8} style={{ padding: 32, textAlign: 'center', color: 'var(--text2)' }}>Уншиж байна...</td></tr>
            ) : filtered.length === 0 ? (
              <tr><td colSpan={8} style={{ padding: 32, textAlign: 'center', color: 'var(--text2)' }}>Захиалга байхгүй</td></tr>
            ) : filtered.map(o => (
              <tr key={o.id} className="ord-row" style={{ borderTop: '1px solid var(--border)', cursor: 'pointer' }} onClick={() => openDetail(o)}>
                <td style={{ padding: '10px 16px', fontFamily: 'monospace', color: 'var(--text2)', fontSize: 12 }}>#{o.id?.slice(0, 8)}</td>
                <td style={{ padding: '10px 16px', fontWeight: 500 }}>{o.customer_name || o.customer_email || '—'}</td>
                <td style={{ padding: '10px 16px', color: 'var(--text2)' }}>{o.product_name || '—'}</td>
                <td style={{ padding: '10px 16px', color: 'var(--text2)' }}>{o.quantity || '—'}</td>
                <td style={{ padding: '10px 16px', color: '#FF6B00', fontWeight: 600 }}>₮{Number(o.total_price || 0).toLocaleString()}</td>
                <td style={{ padding: '10px 16px' }}>
                  <span style={{ fontSize: 11, padding: '3px 10px', borderRadius: 99, background: stColor(o.status) + '15', color: stColor(o.status), fontWeight: 600 }}>
                    {stLabel(o.status)}
                  </span>
                </td>
                <td style={{ padding: '10px 16px', color: 'var(--text2)', fontSize: 12 }}>{o.created_at ? new Date(o.created_at).toLocaleDateString() : '—'}</td>
                <td style={{ padding: '10px 16px' }}>
                  <button onClick={e => { e.stopPropagation(); openDetail(o) }} style={{ padding: '5px 12px', background: 'rgba(59,130,246,0.1)', color: '#3B82F6', border: 'none', borderRadius: 6, cursor: 'pointer', fontSize: 12, fontWeight: 500 }}>Дэлгэрэнгүй</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* DETAIL MODAL */}
      {detail && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 999, display: 'flex', alignItems: 'center', justifyContent: 'center', animation: 'fadeIn 0.2s ease' }} onClick={() => setDetail(null)}>
          <div style={{ background: 'var(--surface)', borderRadius: 16, width: '100%', maxWidth: 580, border: '1px solid var(--border)', maxHeight: '85vh', display: 'flex', flexDirection: 'column', overflow: 'hidden', boxShadow: '0 20px 60px rgba(0,0,0,0.3)', animation: 'slideUp 0.25s ease' }} onClick={e => e.stopPropagation()}>

            {/* Modal Header */}
            <div style={{ padding: '20px 24px 16px', borderBottom: '1px solid var(--border)', flexShrink: 0 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                    <span style={{ fontSize: 12, fontFamily: 'monospace', color: 'var(--text3)' }}>#{detail.id?.slice(0, 12)}</span>
                    <span style={{ fontSize: 11, padding: '2px 10px', borderRadius: 99, background: stColor(detail.status) + '15', color: stColor(detail.status), fontWeight: 600 }}>{stLabel(detail.status)}</span>
                  </div>
                  <div style={{ fontSize: 18, fontWeight: 700, marginBottom: 2 }}>{detail.product_name || 'Захиалга'}</div>
                  <div style={{ fontSize: 13, color: 'var(--text2)' }}>
                    {detail.customer_name || detail.customer_email || '—'} · {detail.quantity || 0}ш · <span style={{ color: '#FF6B00', fontWeight: 600 }}>₮{Number(detail.total_price || 0).toLocaleString()}</span>
                  </div>
                </div>
                <button onClick={() => setDetail(null)} style={{ background: 'var(--surface2)', border: '1px solid var(--border)', color: 'var(--text2)', width: 32, height: 32, borderRadius: 8, cursor: 'pointer', fontSize: 16, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>✕</button>
              </div>
            </div>

            {/* Modal Body */}
            <div style={{ flex: 1, overflow: 'auto', padding: '16px 24px 24px' }}>

              {/* Үндсэн мэдээлэл */}
              <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 8, color: 'var(--text2)' }}>Захиалгын мэдээлэл</div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px 16px', marginBottom: 20 }}>
                {[
                  { label: 'Хэрэглэгч', value: detail.customer_name || '—' },
                  { label: 'Утас', value: detail.customer_phone || '—' },
                  { label: 'И-мэйл', value: detail.customer_email || '—' },
                  { label: 'Тоо ширхэг', value: detail.quantity || '—' },
                  { label: 'Нэгж үнэ', value: detail.unit_price ? `₮${Number(detail.unit_price).toLocaleString()}` : '—' },
                  { label: 'Нийт дүн', value: detail.total_price ? `₮${Number(detail.total_price).toLocaleString()}` : '—' },
                  { label: 'Хэмжээ', value: detail.width_mm && detail.height_mm ? `${detail.width_mm}×${detail.height_mm}мм` : '—' },
                  { label: 'Цаас', value: detail.paper_gsm ? `${detail.paper_gsm}gsm` : '—' },
                  { label: 'Өнгө', value: detail.color_mode || '—' },
                  { label: 'Тал', value: detail.sides || '—' },
                  { label: 'Finishing', value: detail.finishing || '—' },
                  { label: 'Төлбөр', value: detail.payment_status || '—' },
                  { label: 'Төлбөрийн хэлбэр', value: detail.payment_method || '—' },
                  { label: 'Огноо', value: detail.created_at ? new Date(detail.created_at).toLocaleString() : '—' },
                  { label: 'Хариуцагч', value: detail.assigned_to || '—' },
                  { label: 'Дуусах хугацаа', value: detail.deadline ? new Date(detail.deadline).toLocaleDateString() : '—' },
                ].map(item => (
                  <div key={item.label} style={{ fontSize: 12 }}>
                    <span style={{ color: 'var(--text3)', marginRight: 6 }}>{item.label}:</span>
                    <span style={{ fontWeight: 500 }}>{item.value}</span>
                  </div>
                ))}
              </div>

              {/* Тэмдэглэл */}
              {detail.notes && (
                <div style={{ marginBottom: 20 }}>
                  <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 6, color: 'var(--text2)' }}>Тэмдэглэл</div>
                  <div style={{ fontSize: 12, color: 'var(--text2)', background: 'var(--surface2)', padding: '10px 14px', borderRadius: 8, lineHeight: 1.5 }}>{detail.notes}</div>
                </div>
              )}

              {/* Файл */}
              {detail.file_url && (
                <div style={{ marginBottom: 20 }}>
                  <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 6, color: 'var(--text2)' }}>Хавсаргасан файл</div>
                  <a href={detail.file_url.startsWith('http') ? detail.file_url : `/${detail.file_url}`} target="_blank" rel="noreferrer" style={{ fontSize: 12, color: '#3B82F6', textDecoration: 'none' }}>
                    📎 {detail.file_url.split('/').pop() || 'Файл татах'}
                  </a>
                </div>
              )}

              {/* Order Files */}
              {orderFiles.length > 0 && (
                <div style={{ marginBottom: 20 }}>
                  <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 8, color: 'var(--text2)' }}>Файлууд ({orderFiles.length})</div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                    {orderFiles.map((f: any) => (
                      <div key={f.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 12px', border: '1px solid var(--border)', borderRadius: 8, background: f.is_final ? '#f0fdf4' : 'transparent' }}>
                        <div>
                          <div style={{ fontSize: 12, fontWeight: 500 }}>
                            {f.filename}
                            {f.is_final && <span style={{ fontSize: 9, background: '#10B981', color: '#fff', padding: '1px 6px', borderRadius: 4, fontWeight: 700, marginLeft: 6 }}>FINAL</span>}
                          </div>
                          <div style={{ fontSize: 10, color: 'var(--text3)', marginTop: 2 }}>
                            v{f.version} · {(f.size / 1024).toFixed(0)}KB · {f.file_type} · <span style={{ color: f.status === 'approved' ? '#10B981' : f.status === 'rejected' ? '#EF4444' : '#F59E0B', fontWeight: 600 }}>{f.status}</span>
                          </div>
                        </div>
                        {f.path && (
                          <a href={f.path.startsWith('http') ? f.path : `/${f.path}`} target="_blank" rel="noreferrer" style={{ fontSize: 11, padding: '4px 10px', background: 'rgba(59,130,246,0.1)', color: '#3B82F6', borderRadius: 5, textDecoration: 'none', fontWeight: 500 }}>Татах</a>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Төлөв солих */}
              <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 8, color: 'var(--text2)' }}>Төлөв солих</div>
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                {['pending', 'paid', 'designing', 'prepress', 'printing', 'finishing', 'qc', 'ready', 'delivering', 'completed', 'cancelled'].map(s => (
                  <button key={s} onClick={() => updateStatus(detail.id, s)} style={{ padding: '5px 12px', borderRadius: 6, border: 'none', fontSize: 11, cursor: 'pointer', background: detail.status === s ? stColor(s) : stColor(s) + '12', color: detail.status === s ? '#fff' : stColor(s), fontWeight: 500, transition: 'all 0.15s' }}>
                    {stLabel(s)}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
