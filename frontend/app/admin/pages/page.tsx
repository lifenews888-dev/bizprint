'use client'
import { useState, useEffect } from 'react'

const API = 'http://localhost:4000'
const tok = () => localStorage.getItem('access_token') || localStorage.getItem('token') || ''
const getHeaders = () => ({ 'Content-Type': 'application/json', Authorization: `Bearer ${tok()}` })

export default function AdminPagesPage() {
  const [items, setItems] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState<any>(null)
  const [form, setForm] = useState({ title: '', slug: '', content: '', isActive: true })

  const load = () => { fetch(`${API}/pages`, { headers: getHeaders() }).then(r => r.json()).then(d => setItems(Array.isArray(d) ? d : [])).catch(() => {}).finally(() => setLoading(false)) }
  useEffect(load, [])

  const reset = () => { setEditing(null); setForm({ title: '', slug: '', content: '', isActive: true }) }
  const save = async () => {
    const method = editing?.id ? 'PATCH' : 'POST'
    const url = editing?.id ? `${API}/pages/${editing.id}` : `${API}/pages`
    await fetch(url, { method, headers: getHeaders(), body: JSON.stringify(form) })
    reset(); load()
  }
  const del = async (id: string) => { if (!confirm('Устгах уу?')) return; await fetch(`${API}/pages/${id}`, { method: 'DELETE', headers: getHeaders() }); load() }
  const edit = (item: any) => { setEditing(item); setForm({ title: item.title || '', slug: item.slug || '', content: item.content || '', isActive: item.isActive !== false }) }

  const inp: React.CSSProperties = { width: '100%', padding: '10px 14px', background: 'var(--surface2)', border: '1px solid var(--border)', borderRadius: 8, fontSize: 13, color: 'var(--text)', outline: 'none' }

  return (
    <div style={{ padding: 24, fontFamily: "'DM Sans','Segoe UI',system-ui,sans-serif" }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 700, margin: 0 }}>Хуудсууд</h1>
          <p style={{ color: 'var(--text2)', fontSize: 13, margin: '4px 0 0' }}>Статик хуудсууд (Тухай, Нөхцөл г.м)</p>
        </div>
        <button onClick={() => { reset(); setEditing({}) }} style={{ padding: '10px 20px', background: '#FF6B00', color: '#fff', border: 'none', borderRadius: 8, cursor: 'pointer', fontSize: 13, fontWeight: 600 }}>+ Шинэ хуудас</button>
      </div>

      {editing !== null && (
        <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 14, padding: 24, marginBottom: 24 }}>
          <h3 style={{ fontSize: 16, fontWeight: 600, margin: '0 0 16px' }}>{editing?.id ? 'Засах' : 'Шинэ хуудас'}</h3>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }} className="form-row">
            <div><label style={{ fontSize: 12, color: 'var(--text2)', marginBottom: 6, display: 'block' }}>Гарчиг</label><input value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} style={inp} /></div>
            <div><label style={{ fontSize: 12, color: 'var(--text2)', marginBottom: 6, display: 'block' }}>Slug</label><input value={form.slug} onChange={e => setForm({ ...form, slug: e.target.value })} style={inp} placeholder="about-us" /></div>
            <div style={{ gridColumn: 'span 2' }}><label style={{ fontSize: 12, color: 'var(--text2)', marginBottom: 6, display: 'block' }}>Агуулга (HTML)</label><textarea value={form.content} onChange={e => setForm({ ...form, content: e.target.value })} style={{ ...inp, minHeight: 200, resize: 'vertical' }} /></div>
            <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13 }}><input type="checkbox" checked={form.isActive} onChange={e => setForm({ ...form, isActive: e.target.checked })} />Идэвхтэй</label>
          </div>
          <div style={{ display: 'flex', gap: 10, marginTop: 18 }}>
            <button onClick={save} style={{ padding: '10px 24px', background: '#FF6B00', color: '#fff', border: 'none', borderRadius: 8, cursor: 'pointer', fontSize: 13, fontWeight: 600 }}>Хадгалах</button>
            <button onClick={reset} style={{ padding: '10px 24px', background: 'var(--surface2)', color: 'var(--text2)', border: '1px solid var(--border)', borderRadius: 8, cursor: 'pointer', fontSize: 13 }}>Болих</button>
          </div>
        </div>
      )}

      <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 14, overflow: 'hidden' }} className="table-scroll">
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
          <thead><tr style={{ background: 'var(--surface2)' }}>{['Гарчиг', 'Slug', 'Төлөв', 'Үйлдэл'].map(h => <th key={h} style={{ padding: '10px 16px', textAlign: 'left', color: 'var(--text2)', fontWeight: 500 }}>{h}</th>)}</tr></thead>
          <tbody>
            {loading ? <tr><td colSpan={4} style={{ padding: 32, textAlign: 'center', color: 'var(--text2)' }}>Уншиж байна...</td></tr>
            : items.length === 0 ? <tr><td colSpan={4} style={{ padding: 32, textAlign: 'center', color: 'var(--text2)' }}>Хуудас байхгүй</td></tr>
            : items.map(item => (
              <tr key={item.id} style={{ borderTop: '1px solid var(--border)' }}>
                <td style={{ padding: '10px 16px', fontWeight: 500 }}>{item.title}</td>
                <td style={{ padding: '10px 16px', color: 'var(--text2)', fontFamily: 'monospace' }}>/{item.slug}</td>
                <td style={{ padding: '10px 16px' }}><span style={{ fontSize: 11, padding: '2px 8px', borderRadius: 99, background: item.isActive !== false ? 'rgba(16,185,129,0.1)' : 'rgba(239,68,68,0.1)', color: item.isActive !== false ? '#10B981' : '#EF4444', fontWeight: 600 }}>{item.isActive !== false ? 'Идэвхтэй' : 'Идэвхгүй'}</span></td>
                <td style={{ padding: '10px 16px' }}><div style={{ display: 'flex', gap: 6 }}>
                  <button onClick={() => edit(item)} style={{ padding: '5px 12px', background: 'rgba(59,130,246,0.1)', color: '#3B82F6', border: 'none', borderRadius: 6, cursor: 'pointer', fontSize: 12 }}>Засах</button>
                  <button onClick={() => del(item.id)} style={{ padding: '5px 12px', background: 'rgba(239,68,68,0.1)', color: '#EF4444', border: 'none', borderRadius: 6, cursor: 'pointer', fontSize: 12 }}>Устгах</button>
                </div></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

/* ═══════════════════════════════════════════════════════════
   Template-specific metadata editors
   ═══════════════════════════════════════════════════════════ */

type MetaProps = { form: PageForm; setForm: React.Dispatch<React.SetStateAction<PageForm>> }

function metaField(_form: PageForm, setForm: MetaProps['setForm'], key: string, value: string) {
  setForm(f => ({ ...f, metadata: { ...f.metadata, [key]: value } }))
}
function metaArr(form: PageForm): any { return form.metadata || {} }

/* ── About ── */
function AboutMetadata({ form, setForm }: MetaProps) {
  const m = metaArr(form)
  const values = (m.values || []) as any[]
  const team = (m.team || []) as any[]
  const timeline = (m.timeline || []) as any[]
  const partners = (m.partners || []) as string[]

  const setArr = (key: string, arr: any[]) => setForm(f => ({ ...f, metadata: { ...f.metadata, [key]: arr } }))
  const updateItem = (key: string, arr: any[], i: number, field: string, val: string) => {
    const next = [...arr]; next[i] = { ...next[i], [field]: val }; setArr(key, next)
  }

  return <>
    {/* Hero */}
    <div className="rounded-xl border bg-card p-5">
      <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-4">Hero хэсэг</h3>
      <div className="space-y-3">
        <div>
          <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Гарчиг</label>
          <Input value={m.hero_title || ''} onChange={e => metaField(form, setForm, 'hero_title', e.target.value)} placeholder="Хэвлэлийн ирээдүйг бүтээж байна" />
        </div>
        <div>
          <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Тайлбар</label>
          <textarea value={m.hero_desc || ''} onChange={e => metaField(form, setForm, 'hero_desc', e.target.value)}
            className="w-full min-h-[60px] resize-y rounded-lg border border-input bg-background px-3 py-2 text-sm" placeholder="BizPrint нь Монголын анхны..." />
        </div>
      </div>
    </div>

    {/* Mission & Vision */}
    <div className="rounded-xl border bg-card p-5">
      <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-4">Эрхэм зорилго & Алсын хараа</h3>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Эрхэм зорилго</label>
          <textarea value={m.mission || ''} onChange={e => metaField(form, setForm, 'mission', e.target.value)}
            className="w-full min-h-[60px] resize-y rounded-lg border border-input bg-background px-3 py-2 text-sm" />
        </div>
        <div>
          <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Алсын хараа</label>
          <textarea value={m.vision || ''} onChange={e => metaField(form, setForm, 'vision', e.target.value)}
            className="w-full min-h-[60px] resize-y rounded-lg border border-input bg-background px-3 py-2 text-sm" />
        </div>
      </div>
    </div>

    {/* Values */}
    <div className="rounded-xl border bg-card p-5">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Үнэт зүйлс</h3>
        <Button variant="outline" size="sm" onClick={() => setArr('values', [...values, { icon: '⭐', title: '', desc: '' }])} className="h-7 text-xs">
          <Plus className="w-3 h-3 mr-1" />Нэмэх
        </Button>
      </div>
      <div className="space-y-2">
        {values.map((v: any, i: number) => (
          <div key={i} className="grid grid-cols-[40px_1fr_2fr_32px] gap-2 items-center">
            <Input value={v.icon || ''} onChange={e => updateItem('values', values, i, 'icon', e.target.value)} className="text-center text-lg p-1" maxLength={2} />
            <Input value={v.title || ''} onChange={e => updateItem('values', values, i, 'title', e.target.value)} placeholder="Нэр" />
            <Input value={v.desc || ''} onChange={e => updateItem('values', values, i, 'desc', e.target.value)} placeholder="Тайлбар" />
            <button onClick={() => setArr('values', values.filter((_: any, j: number) => j !== i))} className="text-destructive hover:text-destructive/80 cursor-pointer text-sm">✕</button>
          </div>
        ))}
      </div>
    </div>

    {/* Team */}
    <div className="rounded-xl border bg-card p-5">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Манай баг</h3>
        <Button variant="outline" size="sm" onClick={() => setArr('team', [...team, { name: '', role: '', avatar: '👤', bio: '' }])} className="h-7 text-xs">
          <Plus className="w-3 h-3 mr-1" />Нэмэх
        </Button>
      </div>
      <div className="space-y-3">
        {team.map((t: any, i: number) => (
          <div key={i} className="grid grid-cols-[40px_1fr_1fr_1.5fr_32px] gap-2 items-center">
            <Input value={t.avatar || ''} onChange={e => updateItem('team', team, i, 'avatar', e.target.value)} className="text-center text-lg p-1" maxLength={2} />
            <Input value={t.name || ''} onChange={e => updateItem('team', team, i, 'name', e.target.value)} placeholder="Нэр" />
            <Input value={t.role || ''} onChange={e => updateItem('team', team, i, 'role', e.target.value)} placeholder="Албан тушаал" />
            <Input value={t.bio || ''} onChange={e => updateItem('team', team, i, 'bio', e.target.value)} placeholder="Товч танилцуулга" />
            <button onClick={() => setArr('team', team.filter((_: any, j: number) => j !== i))} className="text-destructive hover:text-destructive/80 cursor-pointer text-sm">✕</button>
          </div>
        ))}
      </div>
    </div>

    {/* Timeline */}
    <div className="rounded-xl border bg-card p-5">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Түүх / Timeline</h3>
        <Button variant="outline" size="sm" onClick={() => setArr('timeline', [...timeline, { year: '', title: '', desc: '', icon: '📌' }])} className="h-7 text-xs">
          <Plus className="w-3 h-3 mr-1" />Нэмэх
        </Button>
      </div>
      <div className="space-y-2">
        {timeline.map((t: any, i: number) => (
          <div key={i} className="grid grid-cols-[40px_80px_1fr_1.5fr_32px] gap-2 items-center">
            <Input value={t.icon || ''} onChange={e => updateItem('timeline', timeline, i, 'icon', e.target.value)} className="text-center text-lg p-1" maxLength={2} />
            <Input value={t.year || ''} onChange={e => updateItem('timeline', timeline, i, 'year', e.target.value)} placeholder="Он" />
            <Input value={t.title || ''} onChange={e => updateItem('timeline', timeline, i, 'title', e.target.value)} placeholder="Гарчиг" />
            <Input value={t.desc || ''} onChange={e => updateItem('timeline', timeline, i, 'desc', e.target.value)} placeholder="Тайлбар" />
            <button onClick={() => setArr('timeline', timeline.filter((_: any, j: number) => j !== i))} className="text-destructive hover:text-destructive/80 cursor-pointer text-sm">✕</button>
          </div>
        ))}
      </div>
    </div>

    {/* Partners */}
    <div className="rounded-xl border bg-card p-5">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Хамтрагчид</h3>
        <Button variant="outline" size="sm" onClick={() => setArr('partners', [...partners, ''])} className="h-7 text-xs">
          <Plus className="w-3 h-3 mr-1" />Нэмэх
        </Button>
      </div>
      <div className="space-y-2">
        {partners.map((p: string, i: number) => (
          <div key={i} className="flex gap-2 items-center">
            <Input value={p} onChange={e => { const next = [...partners]; next[i] = e.target.value; setArr('partners', next) }} placeholder="🏭 Компанийн нэр" className="flex-1" />
            <button onClick={() => setArr('partners', partners.filter((_: any, j: number) => j !== i))} className="text-destructive hover:text-destructive/80 cursor-pointer text-sm">✕</button>
          </div>
        ))}
      </div>
    </div>
  </>
}

/* ── Contact ── */
function ContactMetadata({ form, setForm }: MetaProps) {
  const m = metaArr(form)
  const info = (m.info || []) as any[]
  const social = (m.social || []) as any[]

  const setArr = (key: string, arr: any[]) => setForm(f => ({ ...f, metadata: { ...f.metadata, [key]: arr } }))
  const updateItem = (key: string, arr: any[], i: number, field: string, val: string) => {
    const next = [...arr]; next[i] = { ...next[i], [field]: val }; setArr(key, next)
  }

  return <>
    <div className="rounded-xl border bg-card p-5">
      <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-4">Hero хэсэг</h3>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Гарчиг</label>
          <Input value={m.hero_title || ''} onChange={e => metaField(form, setForm, 'hero_title', e.target.value)} placeholder="Холбоо барих" />
        </div>
        <div>
          <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Тайлбар</label>
          <Input value={m.hero_desc || ''} onChange={e => metaField(form, setForm, 'hero_desc', e.target.value)} placeholder="Бидэнтэй холбогдоорой" />
        </div>
      </div>
    </div>

    {/* Contact info */}
    <div className="rounded-xl border bg-card p-5">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Холбоо барих мэдээлэл</h3>
        <Button variant="outline" size="sm" onClick={() => setArr('info', [...info, { icon: '📌', title: '', value: '', link: '' }])} className="h-7 text-xs">
          <Plus className="w-3 h-3 mr-1" />Нэмэх
        </Button>
      </div>
      <div className="space-y-2">
        {info.map((item: any, i: number) => (
          <div key={i} className="grid grid-cols-[40px_1fr_1.5fr_1.5fr_32px] gap-2 items-center">
            <Input value={item.icon || ''} onChange={e => updateItem('info', info, i, 'icon', e.target.value)} className="text-center text-lg p-1" maxLength={2} />
            <Input value={item.title || ''} onChange={e => updateItem('info', info, i, 'title', e.target.value)} placeholder="Утас" />
            <Input value={item.value || ''} onChange={e => updateItem('info', info, i, 'value', e.target.value)} placeholder="+976 7711-7700" />
            <Input value={item.link || ''} onChange={e => updateItem('info', info, i, 'link', e.target.value)} placeholder="tel:+976... (хоосон ч болно)" className="font-mono text-xs" />
            <button onClick={() => setArr('info', info.filter((_: any, j: number) => j !== i))} className="text-destructive hover:text-destructive/80 cursor-pointer text-sm">✕</button>
          </div>
        ))}
      </div>
    </div>

    {/* Social */}
    <div className="rounded-xl border bg-card p-5">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Сошиал холбоос</h3>
        <Button variant="outline" size="sm" onClick={() => setArr('social', [...social, { icon: '🔵', label: '', url: '' }])} className="h-7 text-xs">
          <Plus className="w-3 h-3 mr-1" />Нэмэх
        </Button>
      </div>
      <div className="space-y-2">
        {social.map((s: any, i: number) => (
          <div key={i} className="grid grid-cols-[40px_1fr_2fr_32px] gap-2 items-center">
            <Input value={s.icon || ''} onChange={e => updateItem('social', social, i, 'icon', e.target.value)} className="text-center text-lg p-1" maxLength={2} />
            <Input value={s.label || ''} onChange={e => updateItem('social', social, i, 'label', e.target.value)} placeholder="Facebook" />
            <Input value={s.url || ''} onChange={e => updateItem('social', social, i, 'url', e.target.value)} placeholder="https://facebook.com/..." className="font-mono text-xs" />
            <button onClick={() => setArr('social', social.filter((_: any, j: number) => j !== i))} className="text-destructive hover:text-destructive/80 cursor-pointer text-sm">✕</button>
          </div>
        ))}
      </div>
    </div>

    {/* Map */}
    <div className="rounded-xl border bg-card p-5">
      <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-4">Google Map embed (optional)</h3>
      <textarea value={m.map_embed || ''} onChange={e => metaField(form, setForm, 'map_embed', e.target.value)}
        className="w-full min-h-[60px] resize-y rounded-lg border border-input bg-background px-3 py-2 text-xs font-mono"
        placeholder='<iframe src="https://maps.google.com/..." width="100%" height="300" ...></iframe>' />
    </div>
  </>
}

/* ── FAQ ── */
function FaqMetadata({ form, setForm }: MetaProps) {
  const m = metaArr(form)
  const items = (m.faq_items || []) as any[]
  const setArr = (arr: any[]) => setForm(f => ({ ...f, metadata: { ...f.metadata, faq_items: arr } }))

  return <>
    <div className="rounded-xl border bg-card p-5">
      <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-4">Hero хэсэг</h3>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Гарчиг</label>
          <Input value={m.hero_title || ''} onChange={e => metaField(form, setForm, 'hero_title', e.target.value)} placeholder="Түгээмэл асуултууд" />
        </div>
        <div>
          <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Тайлбар</label>
          <Input value={m.hero_desc || ''} onChange={e => metaField(form, setForm, 'hero_desc', e.target.value)} placeholder="Хэрэглэгчдийн байнга асуудаг асуултууд" />
        </div>
      </div>
    </div>

    <div className="rounded-xl border bg-card p-5">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Асуулт & Хариулт</h3>
        <Button variant="outline" size="sm" onClick={() => setArr([...items, { question: '', answer: '', category: 'other' }])} className="h-7 text-xs">
          <Plus className="w-3 h-3 mr-1" />Нэмэх
        </Button>
      </div>
      {items.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground text-sm">FAQ нэмэхийн тулд &quot;Нэмэх&quot; дарна уу</div>
      ) : (
        <div className="space-y-4">
          {items.map((item: any, i: number) => (
            <div key={i} className="p-3 rounded-lg border bg-background space-y-2">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-primary w-5">#{i + 1}</span>
                <select value={item.category || 'other'} onChange={e => { const next = [...items]; next[i] = { ...next[i], category: e.target.value }; setArr(next) }}
                  className="h-9 rounded-md border border-input bg-background px-2 text-xs">
                  <option value="order">📦 Захиалга</option>
                  <option value="payment">💳 Төлбөр</option>
                  <option value="delivery">🚚 Хүргэлт</option>
                  <option value="file">📁 Файл</option>
                  <option value="price">💰 Үнэ</option>
                  <option value="other">❓ Бусад</option>
                </select>
                <Input value={item.question || ''} onChange={e => { const next = [...items]; next[i] = { ...next[i], question: e.target.value }; setArr(next) }}
                  placeholder="Асуулт" className="flex-1 font-medium" />
                <button onClick={() => setArr(items.filter((_: any, j: number) => j !== i))} className="text-destructive hover:text-destructive/80 cursor-pointer text-sm">✕</button>
              </div>
              <textarea value={item.answer || ''} onChange={e => { const next = [...items]; next[i] = { ...next[i], answer: e.target.value }; setArr(next) }}
                className="w-full min-h-[60px] resize-y rounded-lg border border-input bg-background px-3 py-2 text-sm" placeholder="Хариулт" />
            </div>
          ))}
        </div>
      )}
    </div>
  </>
}

/* ── Delivery ── */
function DeliveryMetadata({ form, setForm }: MetaProps) {
  const m = metaArr(form)
  const zones = (m.zones || []) as any[]
  const policies = (m.policies || []) as any[]

  const setArr = (key: string, arr: any[]) => setForm(f => ({ ...f, metadata: { ...f.metadata, [key]: arr } }))
  const updateItem = (key: string, arr: any[], i: number, field: string, val: string) => {
    const next = [...arr]; next[i] = { ...next[i], [field]: val }; setArr(key, next)
  }

  return <>
    <div className="rounded-xl border bg-card p-5">
      <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-4">Hero хэсэг</h3>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Гарчиг</label>
          <Input value={m.hero_title || ''} onChange={e => metaField(form, setForm, 'hero_title', e.target.value)} placeholder="Хүргэлтийн мэдээлэл" />
        </div>
        <div>
          <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Тайлбар</label>
          <Input value={m.hero_desc || ''} onChange={e => metaField(form, setForm, 'hero_desc', e.target.value)} placeholder="Бид таны захиалгыг хурдан шуурхай хүргэнэ" />
        </div>
      </div>
    </div>

    {/* Delivery zones */}
    <div className="rounded-xl border bg-card p-5">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Хүргэлтийн бүсүүд</h3>
        <Button variant="outline" size="sm" onClick={() => setArr('zones', [...zones, { icon: '📦', name: '', time: '', price: '' }])} className="h-7 text-xs">
          <Plus className="w-3 h-3 mr-1" />Нэмэх
        </Button>
      </div>
      <div className="space-y-2">
        {zones.map((z: any, i: number) => (
          <div key={i} className="grid grid-cols-[40px_1fr_1fr_1fr_32px] gap-2 items-center">
            <Input value={z.icon || ''} onChange={e => updateItem('zones', zones, i, 'icon', e.target.value)} className="text-center text-lg p-1" maxLength={2} />
            <Input value={z.name || ''} onChange={e => updateItem('zones', zones, i, 'name', e.target.value)} placeholder="Улаанбаатар" />
            <Input value={z.time || ''} onChange={e => updateItem('zones', zones, i, 'time', e.target.value)} placeholder="1-2 өдөр" />
            <Input value={z.price || ''} onChange={e => updateItem('zones', zones, i, 'price', e.target.value)} placeholder="5,000₮" />
            <button onClick={() => setArr('zones', zones.filter((_: any, j: number) => j !== i))} className="text-destructive hover:text-destructive/80 cursor-pointer text-sm">✕</button>
          </div>
        ))}
      </div>
    </div>

    {/* Delivery policies */}
    <div className="rounded-xl border bg-card p-5">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Хүргэлтийн нөхцөл</h3>
        <Button variant="outline" size="sm" onClick={() => setArr('policies', [...policies, { icon: '📋', title: '', desc: '' }])} className="h-7 text-xs">
          <Plus className="w-3 h-3 mr-1" />Нэмэх
        </Button>
      </div>
      <div className="space-y-2">
        {policies.map((p: any, i: number) => (
          <div key={i} className="grid grid-cols-[40px_1fr_2fr_32px] gap-2 items-center">
            <Input value={p.icon || ''} onChange={e => updateItem('policies', policies, i, 'icon', e.target.value)} className="text-center text-lg p-1" maxLength={2} />
            <Input value={p.title || ''} onChange={e => updateItem('policies', policies, i, 'title', e.target.value)} placeholder="Нэр" />
            <Input value={p.desc || ''} onChange={e => updateItem('policies', policies, i, 'desc', e.target.value)} placeholder="Тайлбар" />
            <button onClick={() => setArr('policies', policies.filter((_: any, j: number) => j !== i))} className="text-destructive hover:text-destructive/80 cursor-pointer text-sm">✕</button>
          </div>
        ))}
      </div>
    </div>
  </>
}
