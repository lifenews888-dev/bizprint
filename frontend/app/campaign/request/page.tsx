'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { apiFetch, getToken } from '@/lib/api'

/* ═══════════════════════════════════════════════
 *  CUSTOMER-FACING CAMPAIGN REQUEST FORM
 *  Single-page brief that turns into a Campaign (DRAFT) with 1+ product
 *  lines. Customer submits → admin gets notified → admin replies with
 *  quote → customer approves → production. No auto-pricing here yet
 *  (Phase 5 wizard will handle that). This form is intentionally simple
 *  so the first batch of B2B clients can start a conversation with us.
 * ═══════════════════════════════════════════════ */

const PRODUCT_TYPES = [
  { key: 'business-card', label: 'Нэрийн хуудас', perRecipient: true, defaultQty: 200 },
  { key: 'flyer',         label: 'Зурагт хуудас (flyer)', perRecipient: false, defaultQty: 5000 },
  { key: 'brochure',      label: 'Брошур', perRecipient: false, defaultQty: 1000 },
  { key: 'banner',        label: 'Реклам баннер', perRecipient: false, defaultQty: 50 },
  { key: 'sticker',       label: 'Шошго / Стикер', perRecipient: false, defaultQty: 5000 },
  { key: 'poster',        label: 'Постер', perRecipient: false, defaultQty: 500 },
  { key: 'invitation',    label: 'Урилга', perRecipient: false, defaultQty: 200 },
  { key: 'gift-box',      label: 'Бэлгийн хайрцаг', perRecipient: false, defaultQty: 200 },
  { key: 'other',         label: 'Бусад (тайлбар бичих)', perRecipient: false, defaultQty: 100 },
]

interface Line {
  product_category: string
  product_name: string
  type: 'personalised' | 'bulk'
  quantity: number
  per_recipient_qty?: number
  notes?: string
}

export default function CampaignRequestPage() {
  const router = useRouter()
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  const [form, setForm] = useState({
    title: '',
    description: '',
    customer_company: '',
    customer_contact_name: '',
    customer_contact_phone: '',
    customer_contact_email: '',
    estimated_budget: 0,
    recipient_count: 0,
    start_date: '',
    deadline: '',
    brand_logo_url: '',
    brand_primary_color: '#FF6B00',
    brand_slogan: '',
  })

  const [lines, setLines] = useState<Line[]>([
    { product_category: 'business-card', product_name: 'Нэрийн хуудас', type: 'personalised', quantity: 0, per_recipient_qty: 200 },
  ])

  const set = (k: keyof typeof form, v: any) => setForm(prev => ({ ...prev, [k]: v }))

  const addLine = () => setLines(prev => [...prev, { product_category: 'flyer', product_name: 'Зурагт хуудас (flyer)', type: 'bulk', quantity: 5000 }])
  const removeLine = (i: number) => setLines(prev => prev.filter((_, idx) => idx !== i))
  const updateLine = (i: number, patch: Partial<Line>) => setLines(prev => prev.map((l, idx) => idx === i ? { ...l, ...patch } : l))
  const onLineProduct = (i: number, key: string) => {
    const meta = PRODUCT_TYPES.find(p => p.key === key)
    updateLine(i, {
      product_category: key,
      product_name: meta?.label || key,
      type: meta?.perRecipient ? 'personalised' : 'bulk',
      per_recipient_qty: meta?.perRecipient ? meta.defaultQty : undefined,
      quantity: meta?.perRecipient ? 0 : (meta?.defaultQty || 0),
    })
  }

  const totalUnits = lines.reduce((s, l) => {
    if (l.type === 'personalised') return s + (form.recipient_count * (l.per_recipient_qty || 0))
    return s + (l.quantity || 0)
  }, 0)

  const submit = async (mode: 'draft' | 'submit') => {
    if (!getToken()) { router.push('/login?next=/campaign/request'); return }
    if (!form.title.trim()) { setError('Кампанит ажлын нэр оруулна уу'); return }
    if (!form.customer_company.trim()) { setError('Компанийн нэр оруулна уу'); return }
    if (lines.length === 0) { setError('Дор хаяж нэг бүтээгдэхүүн нэмнэ үү'); return }

    setSubmitting(true); setError('')
    try {
      const body = {
        title: form.title,
        description: form.description,
        customer_company: form.customer_company,
        customer_contact_name: form.customer_contact_name,
        customer_contact_phone: form.customer_contact_phone,
        customer_contact_email: form.customer_contact_email,
        estimated_budget: form.estimated_budget,
        recipient_count: form.recipient_count,
        start_date: form.start_date || undefined,
        deadline: form.deadline || undefined,
        brand_kit: {
          logo_url: form.brand_logo_url || undefined,
          primary_color: form.brand_primary_color,
          slogan: form.brand_slogan || undefined,
        },
        lines: lines.map(l => ({
          product_category: l.product_category,
          product_name: l.product_name,
          type: l.type,
          quantity: l.type === 'personalised' ? form.recipient_count * (l.per_recipient_qty || 0) : l.quantity,
          per_recipient_qty: l.per_recipient_qty,
          specs: { notes: l.notes },
        })),
      }
      const created = await apiFetch<{ id: string; code: string }>('/campaigns', { method: 'POST', body })
      if (mode === 'submit' && created?.id) {
        await apiFetch(`/campaigns/${created.id}/submit`, { method: 'POST' })
      }
      router.push(`/campaign/${created.id}`)
    } catch (e: any) {
      setError(e?.message || 'Алдаа гарлаа')
      setSubmitting(false)
    }
  }

  const inp: React.CSSProperties = { width: '100%', padding: '10px 14px', background: 'var(--surface2)', border: '1px solid var(--border)', borderRadius: 8, fontSize: 13, color: 'var(--text)', outline: 'none', boxSizing: 'border-box' }
  const lbl: React.CSSProperties = { display: 'block', fontSize: 11, fontWeight: 600, color: 'var(--text2)', marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.5px' }

  return (
    <div style={{ background: 'var(--bg)', minHeight: '100vh', padding: '40px 20px' }}>
      <div style={{ maxWidth: 920, margin: '0 auto' }}>
        <div style={{ marginBottom: 24 }}>
          <a href="/" style={{ fontSize: 12, color: 'var(--text3)', textDecoration: 'none' }}>← Нүүр хуудас</a>
          <h1 style={{ fontSize: 26, fontWeight: 800, margin: '8px 0 6px' }}>🎯 Кампанит ажлын хүсэлт</h1>
          <p style={{ color: 'var(--text2)', fontSize: 14, margin: 0 }}>
            Олон төрлийн бүтээгдэхүүн (нэрийн хуудас, флайер, баннер, постер...) нэг кампанит ажилд багц бүртгүүлж 100 хоногийн төлөвлөгөөтэй захиалгаа явуулна.
          </p>
        </div>

        {/* 1. Brief */}
        <Section title="1. Танилцуулга">
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 14 }}>
            <div>
              <label style={lbl}>Кампанит ажлын нэр *</label>
              <input style={inp} value={form.title} onChange={e => set('title', e.target.value)} placeholder="Жишээ: Q1 2026 Брэнд шинэчлэл" />
            </div>
            <div>
              <label style={lbl}>Компани *</label>
              <input style={inp} value={form.customer_company} onChange={e => set('customer_company', e.target.value)} placeholder="ХХК нэр" />
            </div>
            <div>
              <label style={lbl}>Холбоо барих нэр</label>
              <input style={inp} value={form.customer_contact_name} onChange={e => set('customer_contact_name', e.target.value)} />
            </div>
            <div>
              <label style={lbl}>Утас</label>
              <input style={inp} value={form.customer_contact_phone} onChange={e => set('customer_contact_phone', e.target.value)} placeholder="9999-9999" />
            </div>
            <div>
              <label style={lbl}>И-мэйл</label>
              <input style={inp} value={form.customer_contact_email} onChange={e => set('customer_contact_email', e.target.value)} placeholder="contact@company.mn" />
            </div>
          </div>
          <div style={{ marginTop: 14 }}>
            <label style={lbl}>Тайлбар</label>
            <textarea style={{ ...inp, minHeight: 80, resize: 'vertical', fontFamily: 'inherit' }} value={form.description} onChange={e => set('description', e.target.value)} placeholder="Зорилго, чиглэл, онцгой шаардлага..." />
          </div>
        </Section>

        {/* 2. Brand kit */}
        <Section title="2. Брэндийн мэдээлэл">
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 14 }}>
            <div>
              <label style={lbl}>Лого URL</label>
              <input style={inp} value={form.brand_logo_url} onChange={e => set('brand_logo_url', e.target.value)} placeholder="https://..." />
            </div>
            <div>
              <label style={lbl}>Үндсэн өнгө</label>
              <input type="color" value={form.brand_primary_color} onChange={e => set('brand_primary_color', e.target.value)} style={{ width: '100%', height: 40, borderRadius: 8, border: '1px solid var(--border)', background: 'var(--surface2)', cursor: 'pointer' }} />
            </div>
            <div>
              <label style={lbl}>Уриа үг</label>
              <input style={inp} value={form.brand_slogan} onChange={e => set('brand_slogan', e.target.value)} placeholder="Жишээ: Бизнес тань шинэчлэгдэнэ" />
            </div>
          </div>
        </Section>

        {/* 3. Scope */}
        <Section title="3. Хэмжээ ба хугацаа">
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 14 }}>
            <div>
              <label style={lbl}>Хэрэглэгчийн тоо (CSV-аар оруулна)</label>
              <input style={inp} type="number" value={form.recipient_count} onChange={e => set('recipient_count', Number(e.target.value))} placeholder="20000" />
            </div>
            <div>
              <label style={lbl}>Эхлэх огноо</label>
              <input style={inp} type="date" value={form.start_date} onChange={e => set('start_date', e.target.value)} />
            </div>
            <div>
              <label style={lbl}>Дуусах огноо</label>
              <input style={inp} type="date" value={form.deadline} onChange={e => set('deadline', e.target.value)} />
            </div>
            <div>
              <label style={lbl}>Төсөвт дүн (₮)</label>
              <input style={inp} type="number" value={form.estimated_budget} onChange={e => set('estimated_budget', Number(e.target.value))} placeholder="50000000" />
            </div>
          </div>
        </Section>

        {/* 4. Product lines */}
        <Section title="4. Бүтээгдэхүүн" right={<button onClick={addLine} style={{ background: 'transparent', color: '#FF6B00', border: '1px solid #FF6B00', borderRadius: 8, padding: '6px 12px', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>+ Нэмэх</button>}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {lines.map((l, i) => (
              <div key={i} style={{ background: 'var(--surface2)', border: '1px solid var(--border)', borderRadius: 10, padding: 14, display: 'grid', gridTemplateColumns: '2fr 1fr 1fr auto', gap: 10, alignItems: 'end' }}>
                <div>
                  <label style={lbl}>Төрөл</label>
                  <select style={inp} value={l.product_category} onChange={e => onLineProduct(i, e.target.value)}>
                    {PRODUCT_TYPES.map(p => <option key={p.key} value={p.key}>{p.label}</option>)}
                  </select>
                </div>
                <div>
                  <label style={lbl}>Төрөл</label>
                  <select style={inp} value={l.type} onChange={e => updateLine(i, { type: e.target.value as any })}>
                    <option value="bulk">Нэг загвар (bulk)</option>
                    <option value="personalised">Хүн бүрд (personalised)</option>
                  </select>
                </div>
                <div>
                  {l.type === 'personalised' ? (
                    <>
                      <label style={lbl}>Хүн бүрд тоо</label>
                      <input style={inp} type="number" value={l.per_recipient_qty || 0} onChange={e => updateLine(i, { per_recipient_qty: Number(e.target.value) })} />
                    </>
                  ) : (
                    <>
                      <label style={lbl}>Нийт ширхэг</label>
                      <input style={inp} type="number" value={l.quantity} onChange={e => updateLine(i, { quantity: Number(e.target.value) })} />
                    </>
                  )}
                </div>
                <button onClick={() => removeLine(i)} disabled={lines.length === 1} style={{ background: 'transparent', color: '#EF4444', border: '1px solid #EF4444', borderRadius: 8, padding: '8px 12px', cursor: 'pointer', height: 38 }}>✕</button>
              </div>
            ))}
          </div>
          <div style={{ marginTop: 14, padding: 14, background: 'rgba(255,107,0,0.06)', border: '1px solid rgba(255,107,0,0.2)', borderRadius: 8, fontSize: 13 }}>
            Тооцоолсон нийт ширхэг: <strong style={{ color: '#FF6B00' }}>{totalUnits.toLocaleString()}</strong>
          </div>
        </Section>

        {/* Errors + actions */}
        {error && (
          <div style={{ padding: 14, background: 'rgba(239,68,68,0.1)', border: '1px solid #EF4444', borderRadius: 8, color: '#EF4444', fontSize: 13, marginBottom: 14 }}>{error}</div>
        )}

        <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
          <button onClick={() => submit('draft')} disabled={submitting} style={{ padding: '12px 22px', background: 'var(--surface2)', color: 'var(--text)', border: '1px solid var(--border)', borderRadius: 8, fontSize: 14, fontWeight: 600, cursor: 'pointer' }}>
            Ноорог хадгалах
          </button>
          <button onClick={() => submit('submit')} disabled={submitting} style={{ padding: '12px 28px', background: '#FF6B00', color: '#fff', border: 'none', borderRadius: 8, fontSize: 14, fontWeight: 700, cursor: submitting ? 'wait' : 'pointer' }}>
            {submitting ? 'Илгээж байна...' : 'Захиалга илгээх →'}
          </button>
        </div>
        <p style={{ marginTop: 12, fontSize: 12, color: 'var(--text3)', textAlign: 'right' }}>
          Илгээсний дараа манай менежер 24 цагийн дотор үнийн саналаар холбогдоно.
        </p>
      </div>
    </div>
  )
}

function Section({ title, right, children }: { title: string; right?: React.ReactNode; children: React.ReactNode }) {
  return (
    <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 14, padding: 22, marginBottom: 16 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
        <h3 style={{ fontSize: 15, fontWeight: 700, margin: 0 }}>{title}</h3>
        {right}
      </div>
      {children}
    </div>
  )
}
