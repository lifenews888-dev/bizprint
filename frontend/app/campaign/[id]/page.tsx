'use client'

import { useEffect, useState, useCallback, useRef } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { apiFetch, apiUpload, getToken } from '@/lib/api'

const STATUS_LABEL: Record<string, { label: string; color: string }> = {
  draft:               { label: 'Ноорог',                   color: '#94A3B8' },
  submitted:           { label: 'Илгээгдсэн',                color: '#0EA5E9' },
  quoted:              { label: 'Үнийн санал ирсэн',         color: '#F59E0B' },
  approved:            { label: 'Батлагдсан',                color: '#10B981' },
  in_production:       { label: 'Үйлдвэрлэлд',               color: '#8B5CF6' },
  partially_delivered: { label: 'Хэсэгчлэн хүргэгдсэн',     color: '#0EA5E9' },
  completed:           { label: 'Дууссан',                   color: '#10B981' },
  cancelled:           { label: 'Цуцлагдсан',                color: '#EF4444' },
}

export default function CampaignDetailPage() {
  const params = useParams()
  const router = useRouter()
  const id = params?.id as string
  const [campaign, setCampaign] = useState<any>(null)
  const [recipientCount, setRecipientCount] = useState(0)
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState(false)
  const [uploadResult, setUploadResult] = useState<{ added: number; total: number; warnings: string[] } | null>(null)
  const fileRef = useRef<HTMLInputElement>(null)

  const load = useCallback(() => {
    if (!id) return
    Promise.all([
      apiFetch<any>(`/campaigns/${id}`),
      apiFetch<{ count?: number } | number>(`/campaigns/${id}/recipients/count`).catch(() => 0),
    ])
      .then(([c, cnt]) => {
        setCampaign(c)
        const n = typeof cnt === 'number' ? cnt : Number((cnt as any)?.count ?? 0)
        setRecipientCount(n)
      })
      .catch(() => setCampaign(null))
      .finally(() => setLoading(false))
  }, [id])

  const onUpload = async (file: File) => {
    setBusy(true); setUploadResult(null)
    try {
      const fd = new FormData()
      fd.append('file', file)
      const res = await apiUpload<any>(`/campaigns/${id}/recipients/upload`, fd)
      if (res?.error) throw new Error(res.error)
      setUploadResult({ added: res.added, total: res.total, warnings: res.warnings || [] })
      load()
    } catch (e) {
      setUploadResult({ added: 0, total: 0, warnings: [(e as any)?.message || 'Алдаа гарлаа'] })
    } finally { setBusy(false) }
  }

  const downloadSampleCsv = () => {
    const sample = 'Овог нэр,Албан тушаал,Хэлтэс,Утас,И-мэйл,Хүргэлтийн хаяг,Хот\n' +
      'Бат Болд,Маркетингийн менежер,Маркетинг,99887766,bat@company.mn,СБД 1-р хороо,Улаанбаатар\n' +
      'Сайн Ариунаа,Борлуулалтын ажилтан,Борлуулалт,99112233,sain@company.mn,БГД 7-р хороо,Улаанбаатар\n'
    const blob = new Blob(['﻿' + sample], { type: 'text/csv;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url; a.download = 'campaign-recipients-sample.csv'; a.click()
    URL.revokeObjectURL(url)
  }

  useEffect(() => {
    if (!getToken()) { router.push('/login'); return }
    load()
  }, [load, router])

  if (loading) return <div style={{ minHeight: '60vh', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text2)' }}>Уншиж байна...</div>
  if (!campaign) return <div style={{ minHeight: '60vh', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text2)' }}>Кампанит ажил олдсонгүй</div>

  const status = STATUS_LABEL[campaign.status] || { label: campaign.status, color: '#888' }

  const approve = async () => {
    if (busy) return
    setBusy(true)
    try {
      await apiFetch(`/campaigns/${id}/approve`, { method: 'POST' })
      load()
    } catch {} finally { setBusy(false) }
  }

  return (
    <div style={{ background: 'var(--bg)', minHeight: '100vh', padding: '32px 20px' }}>
      <div style={{ maxWidth: 920, margin: '0 auto' }}>
        <div style={{ marginBottom: 20 }}>
          <a href="/dashboard" style={{ fontSize: 12, color: 'var(--text3)', textDecoration: 'none' }}>← Нүүр</a>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginTop: 8 }}>
            <h1 style={{ fontSize: 24, fontWeight: 800, margin: 0 }}>{campaign.title}</h1>
            <span style={{ background: status.color + '22', color: status.color, padding: '4px 12px', borderRadius: 99, fontSize: 12, fontWeight: 700 }}>{status.label}</span>
          </div>
          <div style={{ fontSize: 13, color: 'var(--text2)', marginTop: 4 }}>{campaign.code} · {campaign.customer_company}</div>
        </div>

        {/* Summary cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 12, marginBottom: 20 }}>
          <Stat label="Хэрэглэгчид" value={(recipientCount || campaign.recipient_count || 0).toLocaleString()} icon="👥" />
          <Stat label="Бүтээгдэхүүн" value={(campaign.orders?.length || 0).toString()} icon="📦" />
          <Stat label="Төсөв" value={`₮${Number(campaign.estimated_budget || 0).toLocaleString()}`} icon="💰" />
          <Stat label="Нийт дүн" value={campaign.total_amount > 0 ? `₮${Number(campaign.total_amount).toLocaleString()}` : '—'} icon="🎯" />
        </div>

        {/* Recipient CSV upload */}
        {['draft', 'submitted', 'quoted'].includes(campaign.status) && (
          <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 12, padding: 18, marginBottom: 16 }}>
            <h3 style={{ fontSize: 14, fontWeight: 700, margin: '0 0 8px' }}>👥 Хэрэглэгчдийн жагсаалт (CSV)</h3>
            <p style={{ fontSize: 12, color: 'var(--text2)', margin: '0 0 12px' }}>
              Овог нэр, албан тушаал, утас, и-мэйл, хүргэлтийн хаяг бүхий CSV файл оруулна уу.
              Header нэр Монгол / Англи аль аль нь дэмжигдэнэ.
            </p>
            <input ref={fileRef} type="file" hidden accept=".csv,text/csv" onChange={e => {
              const f = e.target.files?.[0]; if (f) onUpload(f); e.target.value = ''
            }} />
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              <button onClick={() => fileRef.current?.click()} disabled={busy}
                style={{ padding: '10px 18px', background: '#FF6B00', color: '#fff', border: 'none', borderRadius: 8, fontWeight: 600, cursor: busy ? 'wait' : 'pointer', fontSize: 13 }}>
                {busy ? 'Оруулж байна...' : '📤 CSV оруулах'}
              </button>
              <button onClick={downloadSampleCsv} style={{ padding: '10px 18px', background: 'transparent', color: 'var(--text2)', border: '1px solid var(--border)', borderRadius: 8, fontWeight: 600, cursor: 'pointer', fontSize: 13 }}>
                📥 Жишээ татах
              </button>
            </div>
            {uploadResult && (
              <div style={{ marginTop: 12, padding: 12, background: uploadResult.added > 0 ? 'rgba(16,185,129,0.08)' : 'rgba(239,68,68,0.08)', border: '1px solid ' + (uploadResult.added > 0 ? '#10B981' : '#EF4444'), borderRadius: 8 }}>
                {uploadResult.added > 0 ? (
                  <div style={{ fontSize: 13, fontWeight: 600, color: '#10B981' }}>✅ {uploadResult.added} хэрэглэгч нэмэгдлээ (нийт {uploadResult.total})</div>
                ) : (
                  <div style={{ fontSize: 13, fontWeight: 600, color: '#EF4444' }}>❌ Алдаа гарлаа</div>
                )}
                {uploadResult.warnings.length > 0 && (
                  <div style={{ marginTop: 8, fontSize: 11, color: 'var(--text3)', maxHeight: 100, overflow: 'auto' }}>
                    {uploadResult.warnings.slice(0, 5).map((w, i) => <div key={i}>• {w}</div>)}
                    {uploadResult.warnings.length > 5 && <div>... болон бусад {uploadResult.warnings.length - 5}</div>}
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Brand kit */}
        {campaign.brand_kit && (
          <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 12, padding: 18, marginBottom: 16 }}>
            <h3 style={{ fontSize: 14, fontWeight: 700, margin: '0 0 12px' }}>Брэндийн мэдээлэл</h3>
            <div style={{ display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
              {campaign.brand_kit.logo_url && (
                <img src={campaign.brand_kit.logo_url} alt="" style={{ width: 60, height: 60, borderRadius: 8, objectFit: 'contain', background: '#fff' }} />
              )}
              {campaign.brand_kit.primary_color && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <div style={{ width: 28, height: 28, borderRadius: 6, background: campaign.brand_kit.primary_color, border: '1px solid var(--border)' }} />
                  <span style={{ fontSize: 12, fontFamily: 'monospace' }}>{campaign.brand_kit.primary_color}</span>
                </div>
              )}
              {campaign.brand_kit.slogan && (
                <span style={{ fontSize: 13, color: 'var(--text2)', fontStyle: 'italic' }}>"{campaign.brand_kit.slogan}"</span>
              )}
            </div>
          </div>
        )}

        {/* Product lines */}
        <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 12, padding: 18, marginBottom: 16 }}>
          <h3 style={{ fontSize: 14, fontWeight: 700, margin: '0 0 12px' }}>📦 Бүтээгдэхүүний жагсаалт</h3>
          {(!campaign.orders || campaign.orders.length === 0) ? (
            <div style={{ padding: 20, textAlign: 'center', color: 'var(--text3)', fontSize: 13 }}>Бүтээгдэхүүн оруулаагүй</div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {campaign.orders.map((o: any) => (
                <div key={o.id} style={{ display: 'grid', gridTemplateColumns: '1fr 100px 120px 140px', gap: 10, padding: '10px 14px', background: 'var(--surface2)', borderRadius: 8, fontSize: 13, alignItems: 'center' }}>
                  <span>{o.product_name}</span>
                  <span style={{ fontSize: 11, color: 'var(--text3)' }}>{o.type === 'personalised' ? 'Хүн бүрд' : 'Bulk'}</span>
                  <span style={{ textAlign: 'right' }}>{Number(o.quantity).toLocaleString()} ширхэг</span>
                  <span style={{ textAlign: 'right', fontWeight: 600, color: '#FF6B00' }}>
                    {o.total_price > 0 ? `₮${Number(o.total_price).toLocaleString()}` : '—'}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Admin notes (visible if quoted+) */}
        {campaign.admin_notes && (
          <div style={{ background: 'rgba(255,107,0,0.06)', border: '1px solid rgba(255,107,0,0.2)', borderRadius: 12, padding: 18, marginBottom: 16 }}>
            <h3 style={{ fontSize: 13, fontWeight: 700, margin: '0 0 8px', color: '#FF6B00' }}>Менежерийн тэмдэглэл</h3>
            <p style={{ fontSize: 13, color: 'var(--text2)', margin: 0, whiteSpace: 'pre-wrap' }}>{campaign.admin_notes}</p>
          </div>
        )}

        {/* Approve action */}
        {campaign.status === 'quoted' && (
          <div style={{ background: 'var(--surface)', border: '1px solid #10B981', borderRadius: 12, padding: 18, textAlign: 'center' }}>
            <div style={{ fontSize: 14, fontWeight: 700, color: '#10B981', marginBottom: 6 }}>✅ Үнийн санал ирлээ</div>
            <div style={{ fontSize: 13, color: 'var(--text2)', marginBottom: 12 }}>Нийт ₮{Number(campaign.total_amount).toLocaleString()} — батлахдаа үйлдвэрлэл шууд эхэлнэ</div>
            <button onClick={approve} disabled={busy} style={{ padding: '12px 32px', background: '#10B981', color: '#fff', border: 'none', borderRadius: 10, fontWeight: 700, fontSize: 14, cursor: busy ? 'wait' : 'pointer' }}>
              {busy ? 'Илгээж байна...' : 'Үнийн санал батлах'}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

function Stat({ label, value, icon }: { label: string; value: string; icon: string }) {
  return (
    <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 12, padding: 14 }}>
      <div style={{ fontSize: 11, color: 'var(--text3)' }}>{icon} {label}</div>
      <div style={{ fontSize: 18, fontWeight: 700, marginTop: 4 }}>{value}</div>
    </div>
  )
}
