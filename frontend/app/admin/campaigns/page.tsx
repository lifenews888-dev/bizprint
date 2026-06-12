'use client'

import { useEffect, useState, useCallback } from 'react'
import { apiFetch } from '@/lib/api'
import { AdminPageHeader } from '@/components/admin/AdminPageHeader'

const STATUS_CFG: Record<string, { label: string; color: string }> = {
  draft:               { label: 'Ноорог',           color: '#94A3B8' },
  submitted:           { label: 'Шинэ хүсэлт',       color: '#0EA5E9' },
  quoted:              { label: 'Үнийн санал явсан', color: '#F59E0B' },
  approved:            { label: 'Батлагдсан',        color: '#10B981' },
  in_production:       { label: 'Үйлдвэрлэлд',      color: '#8B5CF6' },
  partially_delivered: { label: 'Хэсэгчлэн',        color: '#0EA5E9' },
  completed:           { label: 'Дууссан',           color: '#10B981' },
  cancelled:           { label: 'Цуцалсан',          color: '#EF4444' },
}

interface CampaignSummary {
  total?: number
  byStatus?: Record<string, number>
  active?: number
  totalValue?: number | string
}

interface CampaignOrder {
  id: string
  product_name?: string
  quantity?: number | string
  unit_price?: number | string
  total_price?: number | string
}

interface Campaign {
  id: string
  code?: string
  customer_company?: string
  customer_contact_name?: string
  customer_contact_email?: string
  customer_contact_phone?: string
  title?: string
  description?: string
  recipient_count?: number | string
  total_amount?: number | string
  estimated_budget?: number | string
  status: string
  created_at: string
  start_date?: string
  deadline?: string
  admin_notes?: string
  orders?: CampaignOrder[]
}

interface QuoteLine {
  unit: number
  total: number
}

export default function AdminCampaignsPage() {
  const [campaigns, setCampaigns] = useState<Campaign[]>([])
  const [summary, setSummary] = useState<CampaignSummary | null>(null)
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<string>('')
  const [detail, setDetail] = useState<Campaign | null>(null)
  const [quoteForm, setQuoteForm] = useState<{ totalAmount: number; notes: string; lines: Record<string, QuoteLine> }>({ totalAmount: 0, notes: '', lines: {} })
  const [busy, setBusy] = useState(false)

  const load = useCallback(() => {
    Promise.all([
      apiFetch<Campaign[]>('/campaigns' + (filter ? `?status=${filter}` : '')),
      apiFetch<CampaignSummary | null>('/campaigns/summary').catch(() => null),
    ]).then(([list, sum]) => {
      setCampaigns(Array.isArray(list) ? list : [])
      setSummary(sum)
      setLoading(false)
    })
  }, [filter])

  useEffect(() => { load() }, [load])

  const openDetail = async (c: Campaign) => {
    const full = await apiFetch<Campaign>(`/campaigns/${c.id}`).catch(() => c)
    setDetail(full)
    // Pre-fill quote form
    const lines: Record<string, QuoteLine> = {}
    let tot = 0
    for (const o of full.orders || []) {
      lines[o.id] = { unit: Number(o.unit_price) || 0, total: Number(o.total_price) || 0 }
      tot += Number(o.total_price) || 0
    }
    setQuoteForm({ totalAmount: tot || Number(full.total_amount) || 0, notes: full.admin_notes || '', lines })
  }

  const submitQuote = async () => {
    if (!detail) return
    setBusy(true)
    try {
      const lines = Object.entries(quoteForm.lines).map(([id, v]) => ({ id, unit_price: v.unit, total_price: v.total }))
      await apiFetch(`/campaigns/${detail.id}/quote`, {
        method: 'POST',
        body: { lines, total_amount: quoteForm.totalAmount, admin_notes: quoteForm.notes },
      })
      setDetail(null)
      load()
    } catch {} finally { setBusy(false) }
  }

  const startProduction = async () => {
    if (!detail) return
    setBusy(true)
    try {
      await apiFetch(`/campaigns/${detail.id}/start-production`, { method: 'POST' })
      setDetail(null)
      load()
    } catch {} finally { setBusy(false) }
  }

  return (
    <div className="p-4 md:p-6">
      <AdminPageHeader title="🎯 Кампанит ажлууд" description={`B2B захиалгын бэйс — нэг газар бүх campaign · ${campaigns.length} хүсэлт`} />

      {summary && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 10, marginBottom: 20 }}>
          <Kpi label="Нийт" value={summary.total} color="#64748B" />
          <Kpi label="Шинэ" value={summary.byStatus?.submitted || 0} color="#0EA5E9" />
          <Kpi label="Идэвхтэй" value={summary.active} color="#8B5CF6" />
          <Kpi label="Нийт дүн" value={`₮${Number(summary.totalValue || 0).toLocaleString()}`} color="#10B981" />
        </div>
      )}

      <div style={{ display: 'flex', gap: 6, marginBottom: 16, flexWrap: 'wrap' }}>
        <FilterBtn active={filter === ''} onClick={() => setFilter('')}>Бүгд</FilterBtn>
        {Object.entries(STATUS_CFG).map(([k, v]) => (
          <FilterBtn key={k} active={filter === k} onClick={() => setFilter(k)} color={v.color}>{v.label}</FilterBtn>
        ))}
      </div>

      <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 12, overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
          <thead>
            <tr style={{ background: 'var(--surface2)' }}>
              {['Код', 'Компани', 'Гарчиг', 'Хэрэглэгч', 'Бүтээгдэхүүн', 'Дүн', 'Төлөв', 'Огноо'].map(h => (
                <th key={h} style={{ padding: '10px 12px', textAlign: 'left', fontSize: 11, fontWeight: 500, color: 'var(--text2)', textTransform: 'uppercase' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={8} style={{ padding: 40, textAlign: 'center', color: 'var(--text2)' }}>Уншиж байна...</td></tr>
            ) : campaigns.length === 0 ? (
              <tr><td colSpan={8} style={{ padding: 40, textAlign: 'center', color: 'var(--text2)' }}>Кампанит ажил байхгүй</td></tr>
            ) : campaigns.map(c => {
              const cfg = STATUS_CFG[c.status] || { label: c.status, color: '#888' }
              return (
                <tr key={c.id} onClick={() => openDetail(c)} style={{ cursor: 'pointer', borderTop: '1px solid var(--border)' }}>
                  <td style={{ padding: '10px 12px', fontFamily: 'monospace', fontSize: 11 }}>{c.code}</td>
                  <td style={{ padding: '10px 12px', fontWeight: 600 }}>{c.customer_company || '—'}</td>
                  <td style={{ padding: '10px 12px', color: 'var(--text2)' }}>{c.title}</td>
                  <td style={{ padding: '10px 12px', textAlign: 'right' }}>{Number(c.recipient_count || 0).toLocaleString()}</td>
                  <td style={{ padding: '10px 12px', textAlign: 'right' }}>{c.orders?.length || 0}</td>
                  <td style={{ padding: '10px 12px', textAlign: 'right', color: '#FF6B00', fontWeight: 600 }}>
                    {Number(c.total_amount || 0) > 0 ? `₮${Number(c.total_amount).toLocaleString()}` : '—'}
                  </td>
                  <td style={{ padding: '10px 12px' }}>
                    <span style={{ background: cfg.color + '22', color: cfg.color, padding: '3px 10px', borderRadius: 99, fontSize: 11, fontWeight: 600 }}>{cfg.label}</span>
                  </td>
                  <td style={{ padding: '10px 12px', color: 'var(--text3)', fontSize: 12 }}>{new Date(c.created_at).toLocaleDateString('mn-MN')}</td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      {/* Detail / quote drawer */}
      {detail && (
        <div onClick={() => setDetail(null)} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 999, display: 'flex', justifyContent: 'flex-end' }}>
          <div onClick={e => e.stopPropagation()} style={{ background: 'var(--surface)', width: '100%', maxWidth: 600, height: '100%', overflow: 'auto', borderLeft: '1px solid var(--border)', padding: 24 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
              <div>
                <div style={{ fontSize: 11, color: 'var(--text3)', fontFamily: 'monospace' }}>{detail.code}</div>
                <h2 style={{ fontSize: 18, fontWeight: 700, margin: '4px 0 0' }}>{detail.title}</h2>
                <div style={{ fontSize: 13, color: 'var(--text2)', marginTop: 2 }}>{detail.customer_company} · {detail.customer_contact_name}</div>
              </div>
              <button onClick={() => setDetail(null)} style={{ background: 'var(--surface2)', border: '1px solid var(--border)', borderRadius: 8, width: 32, height: 32, cursor: 'pointer' }}>✕</button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2,1fr)', gap: 10, marginBottom: 18, fontSize: 12 }}>
              <Info label="И-мэйл" value={detail.customer_contact_email} />
              <Info label="Утас" value={detail.customer_contact_phone} />
              <Info label="Хэрэглэгчид" value={Number(detail.recipient_count || 0).toLocaleString()} />
              <Info label="Төсөв" value={`₮${Number(detail.estimated_budget || 0).toLocaleString()}`} />
              <Info label="Эхлэх" value={detail.start_date ? new Date(detail.start_date).toLocaleDateString('mn-MN') : '—'} />
              <Info label="Дуусах" value={detail.deadline ? new Date(detail.deadline).toLocaleDateString('mn-MN') : '—'} />
            </div>

            {detail.description && (
              <div style={{ padding: 12, background: 'var(--surface2)', borderRadius: 8, marginBottom: 16, fontSize: 13 }}>{detail.description}</div>
            )}

            {/* Quote form per line */}
            <div style={{ marginBottom: 16 }}>
              <h3 style={{ fontSize: 14, fontWeight: 700, marginBottom: 10 }}>Бүтээгдэхүүн ба үнэ</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {(detail.orders || []).map((o) => (
                  <div key={o.id} style={{ display: 'grid', gridTemplateColumns: '1.5fr 80px 100px 110px', gap: 8, padding: '8px 10px', background: 'var(--surface2)', borderRadius: 6, alignItems: 'center', fontSize: 12 }}>
                    <span>{o.product_name}</span>
                    <span style={{ textAlign: 'right' }}>{Number(o.quantity).toLocaleString()}</span>
                    <input type="number" value={quoteForm.lines[o.id]?.unit ?? 0} onChange={e => {
                      const unit = Number(e.target.value)
                      const total = Math.round(unit * Number(o.quantity))
                      setQuoteForm(prev => ({
                        ...prev,
                        lines: { ...prev.lines, [o.id]: { unit, total } },
                        totalAmount: Object.entries({ ...prev.lines, [o.id]: { unit, total } })
                          .reduce((s, [, v]) => s + v.total, 0),
                      }))
                    }} placeholder="Нэгж үнэ" style={{ padding: '5px 8px', border: '1px solid var(--border)', borderRadius: 4, fontSize: 12, background: 'var(--surface)', color: 'var(--text)' }} />
                    <span style={{ textAlign: 'right', fontWeight: 600, color: '#FF6B00' }}>₮{Number(quoteForm.lines[o.id]?.total || 0).toLocaleString()}</span>
                  </div>
                ))}
              </div>
            </div>

            <div style={{ marginBottom: 16 }}>
              <label style={{ fontSize: 12, color: 'var(--text2)' }}>Менежерийн тэмдэглэл</label>
              <textarea value={quoteForm.notes} onChange={e => setQuoteForm(p => ({ ...p, notes: e.target.value }))} rows={3} style={{ width: '100%', padding: 10, marginTop: 6, background: 'var(--surface2)', border: '1px solid var(--border)', borderRadius: 8, fontSize: 13, color: 'var(--text)', resize: 'vertical', fontFamily: 'inherit', boxSizing: 'border-box' }} />
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: 12, background: 'rgba(255,107,0,0.08)', borderRadius: 8, marginBottom: 16 }}>
              <span style={{ fontSize: 13, fontWeight: 600 }}>Нийт дүн</span>
              <span style={{ fontSize: 18, fontWeight: 800, color: '#FF6B00' }}>₮{quoteForm.totalAmount.toLocaleString()}</span>
            </div>

            <div style={{ display: 'flex', gap: 8 }}>
              {detail.status === 'submitted' && (
                <button onClick={submitQuote} disabled={busy} style={{ flex: 1, padding: 12, background: '#FF6B00', color: '#fff', border: 'none', borderRadius: 8, fontWeight: 700, cursor: busy ? 'wait' : 'pointer' }}>
                  {busy ? 'Илгээж байна...' : '💼 Үнийн санал илгээх'}
                </button>
              )}
              {detail.status === 'approved' && (
                <button onClick={startProduction} disabled={busy} style={{ flex: 1, padding: 12, background: '#8B5CF6', color: '#fff', border: 'none', borderRadius: 8, fontWeight: 700, cursor: busy ? 'wait' : 'pointer' }}>
                  🏭 Үйлдвэрлэл эхлүүлэх
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function Kpi({ label, value, color }: { label: string; value: React.ReactNode; color: string }) {
  return (
    <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderLeft: `4px solid ${color}`, borderRadius: 10, padding: 12 }}>
      <div style={{ fontSize: 11, color: 'var(--text3)' }}>{label}</div>
      <div style={{ fontSize: 18, fontWeight: 700, color, marginTop: 2 }}>{value}</div>
    </div>
  )
}

function FilterBtn({ active, color, children, onClick }: { active: boolean; color?: string; children: React.ReactNode; onClick: () => void }) {
  const c = color || '#FF6B00'
  return (
    <button onClick={onClick} style={{ padding: '5px 12px', borderRadius: 99, border: 'none', background: active ? c : 'var(--surface2)', color: active ? '#fff' : 'var(--text2)', fontSize: 11, fontWeight: 600, cursor: 'pointer' }}>
      {children}
    </button>
  )
}

function Info({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div>
      <span style={{ color: 'var(--text3)' }}>{label}: </span>
      <span style={{ fontWeight: 500 }}>{value || '—'}</span>
    </div>
  )
}
