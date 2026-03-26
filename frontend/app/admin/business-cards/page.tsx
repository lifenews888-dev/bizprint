'use client'
import { apiFetch } from '@/lib/api'
import { useState, useEffect, useCallback } from 'react'

const inp: React.CSSProperties = { padding: '8px 12px', background: 'var(--surface2)', border: '1px solid var(--border)', borderRadius: 8, color: 'var(--text)', fontSize: 13, width: '100%', outline: 'none' }
const lbl: React.CSSProperties = { fontSize: 11, fontWeight: 600, color: 'var(--text2)', marginBottom: 4, display: 'block', textTransform: 'uppercase', letterSpacing: '0.5px' }
const btn = (bg: string, color: string): React.CSSProperties => ({ padding: '8px 16px', background: bg, color, border: 'none', borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: 'pointer' })

const PRESET_COLORS = [
  { label: 'Classic Blue',   accent: '#0EA5E9', bg: '#FFFFFF', textDark: '#1E293B', textLight: '#64748B' },
  { label: 'Teal Modern',    accent: '#14B8A6', bg: '#FFFFFF', textDark: '#111827', textLight: '#6B7280' },
  { label: 'Dark Gold',      accent: '#F59E0B', bg: '#111111', textDark: '#FFFFFF', textLight: '#9CA3AF' },
  { label: 'Orange Bold',    accent: '#FF6B00', bg: '#1F2937', textDark: '#FFFFFF', textLight: '#9CA3AF' },
  { label: 'Minimal White',  accent: '#111111', bg: '#FFFFFF', textDark: '#111111', textLight: '#6B7280' },
  { label: 'Red Accent',     accent: '#EF4444', bg: '#FFFFFF', textDark: '#111111', textLight: '#6B7280' },
  { label: 'Purple',         accent: '#8B5CF6', bg: '#FFFFFF', textDark: '#1F1F1F', textLight: '#6B7280' },
  { label: 'Navy',           accent: '#1E3A8A', bg: '#FFFFFF', textDark: '#1E3A8A', textLight: '#64748B' },
  { label: 'Green Nature',   accent: '#16A34A', bg: '#F0FDF4', textDark: '#14532D', textLight: '#4B7A5E' },
  { label: 'Pink Modern',    accent: '#EC4899', bg: '#FFF1F2', textDark: '#831843', textLight: '#9D174D' },
  { label: 'Gold Luxury',    accent: '#D97706', bg: '#1C1917', textDark: '#FFFFFF', textLight: '#A8A29E' },
  { label: 'Sky Fresh',      accent: '#38BDF8', bg: '#F0F9FF', textDark: '#0C4A6E', textLight: '#0369A1' },
  { label: 'Dark Purple',    accent: '#A855F7', bg: '#0F0F1A', textDark: '#FFFFFF', textLight: '#9CA3AF' },
  { label: 'Cyan Tech',      accent: '#06B6D4', bg: '#0F1A2E', textDark: '#FFFFFF', textLight: '#94A3B8' },
  { label: 'Rose Gold',      accent: '#F43F5E', bg: '#FFF5F7', textDark: '#881337', textLight: '#BE123C' },
  { label: 'Forest Dark',    accent: '#22C55E', bg: '#0A1A0D', textDark: '#FFFFFF', textLight: '#86EFAC' },
  { label: 'Indigo Clean',   accent: '#4F46E5', bg: '#FFFFFF', textDark: '#312E81', textLight: '#6366F1' },
  { label: 'Midnight Blue',  accent: '#60A5FA', bg: '#0C1929', textDark: '#FFFFFF', textLight: '#93C5FD' },
  { label: 'Warm Brown',     accent: '#B45309', bg: '#FFFBEB', textDark: '#78350F', textLight: '#92400E' },
  { label: 'Slate Corp',     accent: '#475569', bg: '#F8FAFC', textDark: '#1E293B', textLight: '#64748B' },
]

const LAYOUT_TYPES = ['minimal', 'corporate', 'creative', 'dark', 'bold', 'business', 'full']

function MiniPreview({ cd }: { cd: any }) {
  const accent = cd?.accent || '#FF6B00'
  const bg = cd?.bg || '#fff'
  const tl = cd?.textLight || '#6B7280'
  const isDark = ['#111111','#1F2937','#0F0F1A','#0C1929','#0A1A0D','#0F1A2E','#1C1917'].includes(bg)
  return (
    <div style={{ width: 160, height: 95, background: bg, borderRadius: 4, position: 'relative', overflow: 'hidden', border: '1px solid var(--border)', flexShrink: 0 }}>
      <div style={{ position: 'absolute', left: 0, top: 0, width: '100%', height: 3, background: accent }} />
      <div style={{ position: 'absolute', left: 0, top: 0, width: 2, height: '100%', background: accent }} />
      <div style={{ position: 'absolute', left: 8, top: 10, fontSize: 7, fontWeight: 700, color: accent }}>Овог Нэр</div>
      <div style={{ position: 'absolute', left: 8, top: 20, fontSize: 5, color: tl }}>Захирал · Компани</div>
      <div style={{ position: 'absolute', left: 8, bottom: 18, fontSize: 5, color: tl }}>+976 9911 2233</div>
      <div style={{ position: 'absolute', left: 8, bottom: 10, fontSize: 5, color: tl }}>email@company.mn</div>
      <div style={{ position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)', width: 24, height: 24, background: isDark ? 'rgba(255,255,255,0.1)' : '#fff', border: `1px solid ${isDark ? 'rgba(255,255,255,0.2)' : '#ddd'}`, borderRadius: 3, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 4, color: isDark ? 'rgba(255,255,255,0.4)' : '#aaa' }}>QR</div>
    </div>
  )
}

export default function AdminBusinessCardsPage() {
  const [products, setProducts] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [modal, setModal] = useState(false)
  const [editing, setEditing] = useState<any>(null)
  const [tab, setTab] = useState<'info' | 'layouts' | 'pricing'>('info')
  const [saving, setSaving] = useState(false)

  const [form, setForm] = useState({ name: '', name_mn: '', description: '', base_price: '3000', vat_enabled: true, is_active: true })
  const [layouts, setLayouts] = useState<any[]>([])
  const [tiers, setTiers] = useState([{ quantity: 100, unit_price: 30 }, { quantity: 200, unit_price: 27.5 }, { quantity: 500, unit_price: 24 }, { quantity: 1000, unit_price: 20 }])
  const [calcQty, setCalcQty] = useState(100)

  const load = useCallback(async () => {
    setLoading(true)
    try { const d = await apiFetch('/admin/business-cards'); setProducts(Array.isArray(d) ? d : []) } catch {} finally { setLoading(false) }
  }, [])

  useEffect(() => { load() }, [load])

  const openCreate = () => {
    setEditing(null); setTab('info')
    setForm({ name: 'Business Card', name_mn: 'Нэрийн хуудас', description: '', base_price: '3000', vat_enabled: true, is_active: true })
    // Нэг default загвар (өвөр + ар тал) автоматаар нэмэх
    const defaultColor = PRESET_COLORS[0]
    setLayouts([{
      _new: true,
      name: defaultColor.label,
      name_mn: 'Загвар 1',
      type: 'business',
      canvas_data: { accent: defaultColor.accent, bg: defaultColor.bg, textDark: defaultColor.textDark, textLight: defaultColor.textLight },
      front_json: [],
      back_json: [],
    }])
    setTiers([{ quantity: 100, unit_price: 30 }, { quantity: 200, unit_price: 27.5 }, { quantity: 500, unit_price: 24 }, { quantity: 1000, unit_price: 20 }])
    setModal(true)
  }

  const openEdit = (p: any) => {
    setEditing(p); setTab('layouts')
    setForm({ name: p.name || '', name_mn: p.name_mn || '', description: p.description || '', base_price: String(p.base_price || 3000), vat_enabled: p.vat_enabled !== false, is_active: p.is_active !== false })
    setLayouts((p.layouts || []).map((l: any) => ({ ...l, _canvas: l.canvas_data ? { ...l.canvas_data } : undefined, backgrounds: l.backgrounds || [] })))
    setTiers(p.pricingTiers?.length ? p.pricingTiers.map((t: any) => ({ quantity: t.quantity, unit_price: Number(t.unit_price) })) : [{ quantity: 100, unit_price: 30 }, { quantity: 200, unit_price: 27.5 }, { quantity: 500, unit_price: 24 }, { quantity: 1000, unit_price: 20 }])
    setModal(true)
  }

  const addLayout = (preset?: any) => {
    const cd = preset || { accent: '#FF6B00', bg: '#FFFFFF', textDark: '#111111', textLight: '#6B7280' }
    setLayouts(prev => [...prev, { _new: true, name: preset?.label || 'Шинэ загвар', name_mn: preset?.label || 'Шинэ загвар', type: 'minimal', canvas_data: cd, _canvas: { ...cd } }])
  }

  const updateLayout = (idx: number, field: string, value: any) => {
    setLayouts(prev => { const c = [...prev]; c[idx] = { ...c[idx], [field]: value }; return c })
  }

  const updateCanvas = (idx: number, key: string, value: string) => {
    setLayouts(prev => {
      const c = [...prev]
      c[idx] = { ...c[idx], canvas_data: { ...c[idx].canvas_data, [key]: value }, _canvas: { ...c[idx]._canvas, [key]: value } }
      return c
    })
  }

  const applyPreset = (idx: number, preset: any) => {
    setLayouts(prev => {
      const c = [...prev]
      const cd = { accent: preset.accent, bg: preset.bg, textDark: preset.textDark, textLight: preset.textLight }
      c[idx] = { ...c[idx], name: preset.label, name_mn: preset.label, canvas_data: cd, _canvas: { ...cd } }
      return c
    })
  }

  const removeLayout = (idx: number) => {
    const l = layouts[idx]
    if (l.id && !l._new && editing) {
      apiFetch(`/admin/business-cards/${editing.id}/layouts/${l.id}`, { method: 'DELETE' }).catch(() => {})
    }
    setLayouts(prev => prev.filter((_, i) => i !== idx))
  }

  const saveProduct = async (publish = false) => {
    setSaving(true)
    try {
      let product: any
      const payload = { ...form, base_price: Number(form.base_price) }
      if (editing) {
        product = await apiFetch(`/admin/business-cards/${editing.id}`, { method: 'PATCH', body: payload })
      } else {
        product = await apiFetch('/admin/business-cards', { method: 'POST', body: payload })
      }
      const pid = product?.id || editing?.id
      // Pricing
      await apiFetch(`/admin/business-cards/${pid}/pricing`, { method: 'POST', body: { tiers } })
      // Layouts
      for (const l of layouts) {
        const body = { name: l.name, name_mn: l.name_mn || l.name, type: l.type, canvas_data: l.canvas_data, front_json: [], back_json: [] }
        if (l.id && !l._new) {
          await apiFetch(`/admin/business-cards/${pid}/layouts/${l.id}`, { method: 'PATCH', body })
        } else {
          await apiFetch(`/admin/business-cards/${pid}/layouts`, { method: 'POST', body })
        }
      }
      if (publish) await apiFetch(`/admin/business-cards/${pid}/publish`, { method: 'PATCH' })
      setModal(false); load()
    } catch (e: any) { alert(e?.message || 'Алдаа гарлаа') } finally { setSaving(false) }
  }

  const closestTier = [...tiers].sort((a, b) => a.quantity - b.quantity).filter(t => calcQty >= t.quantity).pop() || tiers[0]
  const calcUnit = closestTier?.unit_price || 30
  const calcSubtotal = calcUnit * calcQty
  const calcVat = form.vat_enabled ? Math.round(calcSubtotal * 0.1) : 0
  const calcTotal = calcSubtotal + calcVat

  return (
    <div style={{ padding: 24 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 800, color: 'var(--text)', margin: 0 }}>Нэрийн хуудас</h1>
          <p style={{ fontSize: 13, color: 'var(--text3)', margin: '4px 0 0' }}>Бүтээгдэхүүн · Layout · Үнэ удирдлага</p>
        </div>
        <button onClick={openCreate} style={btn('#FF6B00', '#fff')}>+ Шинэ бүтээгдэхүүн</button>
      </div>

      {loading ? (
        <div style={{ color: 'var(--text3)', padding: 40, textAlign: 'center' }}>Ачааллаж байна...</div>
      ) : products.length === 0 ? (
        <div style={{ textAlign: 'center', padding: 60, color: 'var(--text3)' }}>
          <div style={{ fontSize: 40, marginBottom: 12 }}>💳</div>
          <div style={{ fontSize: 14 }}>Бүтээгдэхүүн байхгүй</div>
          <button onClick={openCreate} style={{ ...btn('#FF6B00', '#fff'), marginTop: 16 }}>Эхний бүтээгдэхүүн үүсгэх</button>
        </div>
      ) : (
        products.map(p => (
          <div key={p.id} style={{ background: 'var(--surface)', borderRadius: 12, border: '1px solid var(--border)', marginBottom: 16, overflow: 'hidden' }}>
            {/* Product header */}
            <div style={{ padding: '14px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <span style={{ fontSize: 16, fontWeight: 700, color: 'var(--text)' }}>{p.name_mn || p.name}</span>
                <span style={{ fontSize: 11, padding: '2px 8px', borderRadius: 99, background: p.status === 'published' ? '#059669' : 'var(--surface2)', color: p.status === 'published' ? '#fff' : 'var(--text3)' }}>
                  {p.status === 'published' ? 'Нийтлэгдсэн' : 'Ноорог'}
                </span>
                <span style={{ fontSize: 12, color: 'var(--text3)' }}>{(p.layouts || []).filter((l: any) => l.canvas_data).length} layout</span>
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                <a href="/business-cards" target="_blank" style={{ ...btn('var(--surface2)', 'var(--text)'), textDecoration: 'none', fontSize: 12 }}>Харах ↗</a>
                <button onClick={() => openEdit(p)} style={{ ...btn('#FF6B00', '#fff'), fontSize: 12 }}>Засах</button>
              </div>
            </div>
            {/* Layout thumbnails */}
            <div style={{ padding: '12px 20px', display: 'flex', gap: 10, overflowX: 'auto' }}>
              {(p.layouts || []).filter((l: any) => l.canvas_data).map((l: any) => (
                <div key={l.id} style={{ flexShrink: 0 }}>
                  <MiniPreview cd={l.canvas_data} />
                  <div style={{ fontSize: 10, color: 'var(--text3)', marginTop: 4, textAlign: 'center', maxWidth: 160, overflow: 'hidden', whiteSpace: 'nowrap', textOverflow: 'ellipsis' }}>{l.name_mn || l.name}</div>
                </div>
              ))}
              <div onClick={() => openEdit(p)} style={{ flexShrink: 0, width: 160, height: 95, border: '2px dashed var(--border)', borderRadius: 4, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: 'var(--text3)', fontSize: 12 }}>
                + Layout нэмэх
              </div>
            </div>
          </div>
        ))
      )}

      {/* MODAL */}
      {modal && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 999, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.5)' }} onClick={() => setModal(false)} />
          <div style={{ position: 'relative', width: '95%', maxWidth: 1100, maxHeight: '92vh', background: 'var(--surface)', borderRadius: 16, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>

            <div style={{ padding: '14px 20px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h2 style={{ margin: 0, fontSize: 18, fontWeight: 700, color: 'var(--text)' }}>{editing ? `${editing.name_mn || editing.name} — засах` : 'Шинэ бүтээгдэхүүн'}</h2>
              <button onClick={() => setModal(false)} style={{ background: 'none', border: 'none', fontSize: 20, color: 'var(--text3)', cursor: 'pointer' }}>✕</button>
            </div>

            <div style={{ display: 'flex', borderBottom: '1px solid var(--border)', padding: '0 20px' }}>
              {([['info', 'Мэдээлэл'], ['layouts', `Layout (${layouts.length})`], ['pricing', 'Үнэ']] as const).map(([key, label]) => (
                <button key={key} onClick={() => setTab(key as any)} style={{ padding: '12px 16px', fontSize: 13, fontWeight: 600, border: 'none', background: 'none', cursor: 'pointer', color: tab === key ? '#FF6B00' : 'var(--text3)', borderBottom: tab === key ? '2px solid #FF6B00' : '2px solid transparent' }}>{label}</button>
              ))}
            </div>

            <div style={{ flex: 1, overflow: 'auto', padding: 20 }}>

              {/* INFO TAB */}
              {tab === 'info' && (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, maxWidth: 600 }}>
                  <div><label style={lbl}>Нэр (EN)</label><input style={inp} value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} /></div>
                  <div><label style={lbl}>Нэр (MN)</label><input style={inp} value={form.name_mn} onChange={e => setForm({ ...form, name_mn: e.target.value })} /></div>
                  <div style={{ gridColumn: '1/3' }}><label style={lbl}>Тайлбар</label><textarea style={{ ...inp, minHeight: 60, resize: 'vertical' }} value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} /></div>
                  <div><label style={lbl}>Суурь үнэ (₮)</label><input style={inp} type="number" value={form.base_price} onChange={e => setForm({ ...form, base_price: e.target.value })} /></div>
                  <div style={{ display: 'flex', gap: 20, alignItems: 'center', paddingTop: 20 }}>
                    <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: 'var(--text)', cursor: 'pointer' }}>
                      <input type="checkbox" checked={form.vat_enabled} onChange={e => setForm({ ...form, vat_enabled: e.target.checked })} /> НӨАТ (10%)
                    </label>
                    <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: 'var(--text)', cursor: 'pointer' }}>
                      <input type="checkbox" checked={form.is_active} onChange={e => setForm({ ...form, is_active: e.target.checked })} /> Идэвхтэй
                    </label>
                  </div>
                </div>
              )}

              {/* LAYOUTS TAB */}
              {tab === 'layouts' && (
                <div>
                  {/* Preset color buttons */}
                  <div style={{ marginBottom: 16 }}>
                    <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text2)', marginBottom: 8 }}>Бэлэн өнгөний схем нэмэх:</div>
                    <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                      {PRESET_COLORS.map(p => (
                        <button key={p.label} onClick={() => addLayout(p)} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '5px 10px', borderRadius: 8, border: '1px solid var(--border)', background: p.bg, cursor: 'pointer', fontSize: 11, color: p.textDark }}>
                          <span style={{ width: 10, height: 10, borderRadius: '50%', background: p.accent, flexShrink: 0 }} />
                          {p.label}
                        </button>
                      ))}
                      <button onClick={() => addLayout()} style={{ padding: '5px 12px', borderRadius: 8, border: '2px dashed var(--border)', background: 'transparent', cursor: 'pointer', fontSize: 11, color: 'var(--text3)' }}>
                        + Хоосон
                      </button>
                    </div>
                  </div>

                  {/* Layout list */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                    {layouts.map((l, i) => (
                      <div key={l.id || i} style={{ background: 'var(--surface2)', borderRadius: 12, padding: 16, border: '1px solid var(--border)' }}>
                        <div style={{ display: 'flex', gap: 16, alignItems: 'flex-start' }}>
                          {/* Mini preview */}
                          <MiniPreview cd={l.canvas_data} />

                          {/* Fields */}
                          <div style={{ flex: 1, display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10 }}>
                            <div>
                              <label style={lbl}>Нэр</label>
                              <input style={inp} value={l.name || ''} onChange={e => updateLayout(i, 'name', e.target.value)} />
                            </div>
                            <div>
                              <label style={lbl}>Төрөл</label>
                              <select style={inp} value={l.type || 'minimal'} onChange={e => updateLayout(i, 'type', e.target.value)}>
                                {LAYOUT_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                              </select>
                            </div>
                            <div>
                              <label style={lbl}>Бэлэн схем</label>
                              <select style={inp} onChange={e => { const p = PRESET_COLORS.find(c => c.label === e.target.value); if (p) applyPreset(i, p) }} defaultValue="">
                                <option value="">— сонгох —</option>
                                {PRESET_COLORS.map(p => <option key={p.label} value={p.label}>{p.label}</option>)}
                              </select>
                            </div>
                            <div>
                              <label style={lbl}>Accent өнгө</label>
                              <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                                <input type="color" value={l.canvas_data?.accent || '#FF6B00'} onChange={e => updateCanvas(i, 'accent', e.target.value)} style={{ width: 36, height: 36, borderRadius: 6, border: '1px solid var(--border)', cursor: 'pointer', padding: 2 }} />
                                <input style={{ ...inp, flex: 1 }} value={l.canvas_data?.accent || ''} onChange={e => updateCanvas(i, 'accent', e.target.value)} placeholder="#FF6B00" />
                              </div>
                            </div>
                            <div>
                              <label style={lbl}>Дэвсгэр өнгө</label>
                              <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                                <input type="color" value={l.canvas_data?.bg || '#FFFFFF'} onChange={e => updateCanvas(i, 'bg', e.target.value)} style={{ width: 36, height: 36, borderRadius: 6, border: '1px solid var(--border)', cursor: 'pointer', padding: 2 }} />
                                <input style={{ ...inp, flex: 1 }} value={l.canvas_data?.bg || ''} onChange={e => updateCanvas(i, 'bg', e.target.value)} placeholder="#FFFFFF" />
                              </div>
                            </div>
                            <div>
                              <label style={lbl}>Текст өнгө</label>
                              <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                                <input type="color" value={l.canvas_data?.textDark || '#111111'} onChange={e => updateCanvas(i, 'textDark', e.target.value)} style={{ width: 36, height: 36, borderRadius: 6, border: '1px solid var(--border)', cursor: 'pointer', padding: 2 }} />
                                <input style={{ ...inp, flex: 1 }} value={l.canvas_data?.textDark || ''} onChange={e => updateCanvas(i, 'textDark', e.target.value)} placeholder="#111111" />
                              </div>
                            </div>
                          </div>

                          <button onClick={() => removeLayout(i)} style={{ ...btn('#EF4444', '#fff'), fontSize: 11, padding: '6px 12px', flexShrink: 0 }}>Устгах</button>
                        </div>

                        {/* ── Background: Өвөр + Ар ── */}
                        <div style={{ marginTop: 12, paddingTop: 12, borderTop: '1px solid var(--border)', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                          {(['front', 'back'] as const).map(side => {
                            const sideBgs = (l.backgrounds || []).filter((bg: any) => bg.side === side || (!bg.side && side === 'front'))
                            const sideLabel = side === 'front' ? '📄 Өвөр тал' : '📄 Ар тал'
                            return (
                              <div key={side} style={{ background: 'var(--surface)', borderRadius: 8, border: '1px solid var(--border)', padding: 10 }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                                  <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--text)' }}>{sideLabel}</span>
                                  {l.id && !l._new && editing ? (
                                    <label style={{ fontSize: 10, fontWeight: 600, color: '#FF6B00', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 3 }}>
                                      📤 Upload
                                      <input type="file" accept="image/png,image/jpeg,image/webp" hidden onChange={async (e) => {
                                        const file = e.target.files?.[0]
                                        if (!file || !editing?.id || !l.id) return
                                        const fd = new FormData()
                                        fd.append('file', file)
                                        fd.append('name', `${side}-${file.name}`)
                                        fd.append('side', side)
                                        try {
                                          const result: any = await apiFetch(`/admin/business-cards/${editing.id}/layouts/${l.id}/backgrounds`, { method: 'POST', body: fd } as any)
                                          if (result) {
                                            result.side = side
                                            updateLayout(i, 'backgrounds', [...(l.backgrounds || []), result])
                                          }
                                        } catch (err: any) { alert('Upload алдаа: ' + (err?.message || '')) }
                                      }} />
                                    </label>
                                  ) : (
                                    <span style={{ fontSize: 9, color: 'var(--text3)' }}>Хадгалсны дараа</span>
                                  )}
                                </div>
                                {sideBgs.length > 0 ? (
                                  <div style={{ display: 'flex', gap: 6, overflowX: 'auto' }}>
                                    {sideBgs.map((bg: any) => (
                                      <div key={bg.id} style={{ flexShrink: 0, position: 'relative', width: 100, borderRadius: 4, overflow: 'hidden', border: '1px solid var(--border)' }}>
                                        <img src={bg.url?.startsWith('http') ? bg.url : `http://localhost:4000${bg.url}`} alt={bg.name} style={{ width: 100, height: 62, objectFit: 'cover' }} />
                                        <button onClick={async () => {
                                          if (!editing?.id || !l.id) return
                                          await apiFetch(`/admin/business-cards/${editing.id}/layouts/${l.id}/backgrounds/${bg.id}`, { method: 'DELETE' }).catch(() => {})
                                          updateLayout(i, 'backgrounds', (l.backgrounds || []).filter((b: any) => b.id !== bg.id))
                                        }} style={{ position: 'absolute', top: 2, right: 2, width: 16, height: 16, borderRadius: 8, background: '#EF4444', color: '#fff', border: 'none', fontSize: 10, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', lineHeight: 1 }}>×</button>
                                      </div>
                                    ))}
                                  </div>
                                ) : (
                                  <div style={{ height: 60, border: '1.5px dashed var(--border)', borderRadius: 6, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, color: 'var(--text3)' }}>
                                    Зураг байхгүй
                                  </div>
                                )}
                              </div>
                            )
                          })}
                        </div>
                      </div>
                    ))}
                    {layouts.length === 0 && (
                      <div style={{ textAlign: 'center', padding: 40, color: 'var(--text3)' }}>Дээрх өнгөний схемүүдээс нэмнэ үү</div>
                    )}
                  </div>
                </div>
              )}

              {/* PRICING TAB */}
              {tab === 'pricing' && (
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
                    <span style={{ fontSize: 13, color: 'var(--text3)' }}>Үнийн шатлал</span>
                    <button onClick={() => setTiers([...tiers, { quantity: 0, unit_price: 0 }])} style={btn('var(--surface2)', 'var(--text)')}>+ Шатлал нэмэх</button>
                  </div>
                  <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: 24 }}>
                    <thead>
                      <tr style={{ borderBottom: '1px solid var(--border)' }}>
                        {['Тоо хэмжээ', 'Нэгж үнэ (₮)', 'Нийт (₮)', ''].map(h => <th key={h} style={{ padding: '8px 12px', textAlign: 'left', fontSize: 11, color: 'var(--text3)' }}>{h}</th>)}
                      </tr>
                    </thead>
                    <tbody>
                      {tiers.map((t, i) => (
                        <tr key={i} style={{ borderBottom: '1px solid var(--border)' }}>
                          <td style={{ padding: '6px 12px' }}><input style={{ ...inp, maxWidth: 100 }} type="number" value={t.quantity} onChange={e => { const c = [...tiers]; c[i] = { ...c[i], quantity: Number(e.target.value) }; setTiers(c) }} /></td>
                          <td style={{ padding: '6px 12px' }}><input style={{ ...inp, maxWidth: 100 }} type="number" step="0.5" value={t.unit_price} onChange={e => { const c = [...tiers]; c[i] = { ...c[i], unit_price: Number(e.target.value) }; setTiers(c) }} /></td>
                          <td style={{ padding: '6px 12px', fontSize: 13, fontWeight: 600, color: '#FF6B00' }}>₮{(t.quantity * t.unit_price).toLocaleString()}</td>
                          <td style={{ padding: '6px 12px' }}><button onClick={() => setTiers(tiers.filter((_, j) => j !== i))} style={{ background: 'none', border: 'none', color: '#EF4444', cursor: 'pointer' }}>✕</button></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>

                  <div style={{ background: 'var(--surface2)', borderRadius: 12, padding: 16 }}>
                    <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)', marginBottom: 12 }}>Үнийн тооцоолуур</div>
                    <div style={{ display: 'flex', gap: 12, alignItems: 'center', marginBottom: 12 }}>
                      <label style={lbl}>Тоо хэмжээ</label>
                      <input style={{ ...inp, maxWidth: 120 }} type="number" value={calcQty} onChange={e => setCalcQty(Number(e.target.value) || 1)} />
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }}>
                      {[['Дүн', `₮${calcSubtotal.toLocaleString()}`], ['НӨАТ', `₮${calcVat.toLocaleString()}`]].map(([l, v]) => (
                        <div key={l} style={{ background: 'var(--surface)', borderRadius: 8, padding: 12, textAlign: 'center' }}>
                          <div style={{ fontSize: 10, color: 'var(--text3)', marginBottom: 4 }}>{l}</div>
                          <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--text)' }}>{v}</div>
                        </div>
                      ))}
                      <div style={{ background: '#FF6B00', borderRadius: 8, padding: 12, textAlign: 'center' }}>
                        <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.7)', marginBottom: 4 }}>Нийт</div>
                        <div style={{ fontSize: 16, fontWeight: 700, color: '#fff' }}>₮{calcTotal.toLocaleString()}</div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div style={{ padding: '12px 20px', borderTop: '1px solid var(--border)', display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
              <button onClick={() => setModal(false)} style={btn('var(--surface2)', 'var(--text)')}>Болих</button>
              <button onClick={() => saveProduct(false)} disabled={saving} style={{ ...btn('var(--surface2)', 'var(--text)'), opacity: saving ? 0.5 : 1 }}>{saving ? '...' : 'Ноорог хадгалах'}</button>
              <button onClick={() => saveProduct(true)} disabled={saving} style={{ ...btn('#FF6B00', '#fff'), opacity: saving ? 0.5 : 1 }}>{saving ? '...' : 'Нийтлэх'}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
