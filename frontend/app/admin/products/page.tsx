'use client'
import { useState, useEffect } from 'react'

const API = 'http://localhost:4000'
const H = () => ({ 'Content-Type': 'application/json', Authorization: `Bearer ${localStorage.getItem('token')}` })

// ─── Standard print attribute presets ────────────────────────────────────────

const PRINT_PRESETS = [
  { name: 'width_mm',   name_mn: 'Өргөн',            type: 'number', unit: 'мм',     options: null,  default_value: '210', required: true,  sort_order: 1 },
  { name: 'height_mm',  name_mn: 'Өндөр',            type: 'number', unit: 'мм',     options: null,  default_value: '297', required: true,  sort_order: 2 },
  { name: 'pages',      name_mn: 'Хуудас',           type: 'number', unit: 'хуудас', options: null,  default_value: '4',   required: true,  sort_order: 3 },
  { name: 'sides',      name_mn: 'Хэвлэх тал',      type: 'select', unit: '',       options: ['single', 'double'],                          default_value: 'double', required: true,  sort_order: 4 },
  { name: 'color_mode', name_mn: 'Өнгийн горим',    type: 'select', unit: '',       options: ['CMYK', '1-color', '2-color', '3-color'],     default_value: 'CMYK',   required: true,  sort_order: 5 },
  { name: 'paper_gsm',  name_mn: 'Цаасны граммаж', type: 'select', unit: 'г/м²',   options: ['80', '100', '115', '130', '150', '200', '250', '300'], default_value: '130', required: true,  sort_order: 6 },
  { name: 'finishing',  name_mn: 'Боловсруулалт',   type: 'select', unit: '',       options: ['none', 'laminate-gloss', 'laminate-matte', 'uv-spot', 'emboss'], default_value: 'none', required: false, sort_order: 7 },
]

const EMPTY_ATTR = { name: '', name_mn: '', type: 'select', unit: '', options: '', default_value: '', required: false, sort_order: 0 }

// ─── Component ────────────────────────────────────────────────────────────────

export default function AdminProductsPage() {
  // Products
  const [items, setItems]     = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState<any>(null)
  const [form, setForm]       = useState(defaultProductForm())

  // Attributes
  const [attrProduct, setAttrProduct] = useState<any>(null)  // product whose attrs are shown
  const [attrs, setAttrs]             = useState<any[]>([])
  const [attrLoading, setAttrLoading] = useState(false)
  const [editingAttr, setEditingAttr] = useState<any>(null)
  const [attrForm, setAttrForm]       = useState(EMPTY_ATTR)
  const [saving, setSaving]           = useState(false)

  // ── Products CRUD ──────────────────────────────────────────────────────────

  function defaultProductForm() {
    return { name: '', name_mn: '', slug: '', category: '', base_price: 0, min_quantity: 1, lead_time_days: 3, description: '', is_active: true }
  }

  const loadProducts = () => {
    setLoading(true)
    fetch(`${API}/products`, { headers: H() })
      .then(r => r.json()).then(d => setItems(Array.isArray(d) ? d : []))
      .catch(() => {}).finally(() => setLoading(false))
  }
  useEffect(loadProducts, [])

  const resetProduct = () => { setEditing(null); setForm(defaultProductForm()) }

  const saveProduct = async () => {
    const method = editing?.id ? 'PATCH' : 'POST'
    const url    = editing?.id ? `${API}/products/${editing.id}` : `${API}/products`
    await fetch(url, { method, headers: H(), body: JSON.stringify(form) })
    resetProduct(); loadProducts()
  }

  const deleteProduct = async (id: string) => {
    if (!confirm('Устгах уу?')) return
    await fetch(`${API}/products/${id}`, { method: 'DELETE', headers: H() })
    if (attrProduct?.id === id) setAttrProduct(null)
    loadProducts()
  }

  const startEditProduct = (item: any) => {
    setEditing(item)
    setForm({ name: item.name || '', name_mn: item.name_mn || '', slug: item.slug || '', category: item.category || '', base_price: item.base_price || 0, min_quantity: item.min_quantity || 1, lead_time_days: item.lead_time_days || 3, description: item.description || '', is_active: item.is_active !== false })
  }

  // ── Attributes CRUD ────────────────────────────────────────────────────────

  const loadAttrs = (product: any) => {
    setAttrProduct(product)
    setAttrLoading(true)
    setEditingAttr(null)
    setAttrForm(EMPTY_ATTR)
    fetch(`${API}/product-attributes?product_id=${product.id}`, { headers: H() })
      .then(r => r.json()).then(d => setAttrs(Array.isArray(d) ? d : []))
      .catch(() => setAttrs([])).finally(() => setAttrLoading(false))
  }

  const saveAttr = async () => {
    if (!attrProduct || !attrForm.name.trim()) return
    setSaving(true)
    const optArr = attrForm.options ? attrForm.options.split(',').map((s: string) => s.trim()).filter(Boolean) : null
    const payload = {
      product_id:    attrProduct.id,
      name:          attrForm.name.trim(),
      name_mn:       attrForm.name_mn.trim() || attrForm.name.trim(),
      type:          attrForm.type,
      unit:          attrForm.unit || null,
      options:       optArr?.length ? optArr : null,
      default_value: attrForm.default_value || null,
      required:      attrForm.required,
      sort_order:    Number(attrForm.sort_order) || 0,
    }
    if (editingAttr?.id) {
      await fetch(`${API}/product-attributes/${editingAttr.id}`, { method: 'PATCH', headers: H(), body: JSON.stringify(payload) })
    } else {
      await fetch(`${API}/product-attributes`, { method: 'POST', headers: H(), body: JSON.stringify(payload) })
    }
    setSaving(false)
    setEditingAttr(null)
    setAttrForm(EMPTY_ATTR)
    loadAttrs(attrProduct)
  }

  const deleteAttr = async (id: string) => {
    if (!confirm('Устгах уу?')) return
    await fetch(`${API}/product-attributes/${id}`, { method: 'DELETE', headers: H() })
    loadAttrs(attrProduct)
  }

  const startEditAttr = (a: any) => {
    setEditingAttr(a)
    setAttrForm({
      name: a.name || '', name_mn: a.name_mn || '', type: a.type || 'select',
      unit: a.unit || '', options: Array.isArray(a.options) ? a.options.join(', ') : (a.options || ''),
      default_value: a.default_value || '', required: a.required || false,
      sort_order: a.sort_order || 0,
    })
  }

  // Quick-add all standard print attributes that don't exist yet
  const quickAddPrintPresets = async () => {
    if (!attrProduct) return
    const existingNames = new Set(attrs.map((a: any) => a.name))
    const toAdd = PRINT_PRESETS.filter(p => !existingNames.has(p.name))
    if (toAdd.length === 0) { alert('Бүх стандарт параметр аль хэдийн нэмэгдсэн байна.'); return }
    setSaving(true)
    await Promise.all(toAdd.map(p =>
      fetch(`${API}/product-attributes`, {
        method: 'POST', headers: H(),
        body: JSON.stringify({ ...p, product_id: attrProduct.id, options: p.options || null }),
      })
    ))
    setSaving(false)
    loadAttrs(attrProduct)
  }

  // ── Styles ─────────────────────────────────────────────────────────────────

  const inp: React.CSSProperties = { width: '100%', padding: '9px 12px', background: 'var(--surface2)', border: '1px solid var(--border)', borderRadius: 8, fontSize: 13, color: 'var(--text)', outline: 'none', boxSizing: 'border-box' }
  const F = "'DM Sans','Segoe UI',system-ui,sans-serif"

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <div style={{ padding: 24, fontFamily: F }}>

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 700, margin: 0 }}>Бүтээгдэхүүн</h1>
          <p style={{ color: 'var(--text2)', fontSize: 13, margin: '4px 0 0' }}>Нийт {items.length} бүтээгдэхүүн</p>
        </div>
        <button
          onClick={() => { resetProduct(); setEditing({}) }}
          style={{ padding: '10px 20px', background: '#FF6B00', color: '#fff', border: 'none', borderRadius: 8, cursor: 'pointer', fontSize: 13, fontWeight: 600 }}
        >
          + Шинэ
        </button>
      </div>

      {/* ── Product form ── */}
      {editing !== null && (
        <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 14, padding: 24, marginBottom: 24 }}>
          <h3 style={{ fontSize: 16, fontWeight: 600, margin: '0 0 16px' }}>{editing?.id ? 'Засах' : 'Шинэ бүтээгдэхүүн'}</h3>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
            <Field label="Нэр (EN)"><input value={form.name}        onChange={e => setForm({ ...form, name: e.target.value })}        style={inp} placeholder="Business Card" /></Field>
            <Field label="Нэр (МН)"><input value={form.name_mn}     onChange={e => setForm({ ...form, name_mn: e.target.value })}     style={inp} placeholder="Визит карт" /></Field>
            <Field label="Slug">    <input value={form.slug}        onChange={e => setForm({ ...form, slug: e.target.value })}        style={inp} placeholder="business-card" /></Field>
            <Field label="Ангилал"> <input value={form.category}    onChange={e => setForm({ ...form, category: e.target.value })}   style={inp} /></Field>
            <Field label="Үндсэн үнэ">        <input type="number" value={form.base_price}    onChange={e => setForm({ ...form, base_price: +e.target.value })}    style={inp} /></Field>
            <Field label="Хамгийн бага тоо">  <input type="number" value={form.min_quantity}  onChange={e => setForm({ ...form, min_quantity: +e.target.value })}  style={inp} /></Field>
            <Field label="Хүргэх хугацаа (өдөр)"><input type="number" value={form.lead_time_days} onChange={e => setForm({ ...form, lead_time_days: +e.target.value })} style={inp} /></Field>
            <div style={{ display: 'flex', alignItems: 'flex-end', paddingBottom: 2 }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, cursor: 'pointer' }}>
                <input type="checkbox" checked={form.is_active} onChange={e => setForm({ ...form, is_active: e.target.checked })} />
                Идэвхтэй
              </label>
            </div>
            <div style={{ gridColumn: 'span 2' }}>
              <Field label="Тайлбар">
                <textarea value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} style={{ ...inp, minHeight: 80, resize: 'vertical' }} />
              </Field>
            </div>
          </div>
          <div style={{ display: 'flex', gap: 10, marginTop: 18 }}>
            <button onClick={saveProduct} style={{ padding: '10px 24px', background: '#FF6B00', color: '#fff', border: 'none', borderRadius: 8, cursor: 'pointer', fontSize: 13, fontWeight: 600 }}>Хадгалах</button>
            <button onClick={resetProduct} style={{ padding: '10px 24px', background: 'var(--surface2)', color: 'var(--text2)', border: '1px solid var(--border)', borderRadius: 8, cursor: 'pointer', fontSize: 13 }}>Болих</button>
          </div>
        </div>
      )}

      {/* ── Products table ── */}
      <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 14, overflow: 'hidden', marginBottom: attrProduct ? 24 : 0 }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
          <thead>
            <tr style={{ background: 'var(--surface2)' }}>
              {['Нэр', 'Ангилал', 'Үнэ', 'Тоо', 'Хугацаа', 'Төлөв', 'Үйлдэл'].map(h => (
                <th key={h} style={{ padding: '10px 16px', textAlign: 'left', color: 'var(--text2)', fontWeight: 500, whiteSpace: 'nowrap' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={7} style={{ padding: 32, textAlign: 'center', color: 'var(--text2)' }}>Уншиж байна...</td></tr>
            ) : items.length === 0 ? (
              <tr><td colSpan={7} style={{ padding: 32, textAlign: 'center', color: 'var(--text2)' }}>Бүтээгдэхүүн байхгүй</td></tr>
            ) : items.map(p => (
              <tr key={p.id} style={{ borderTop: '1px solid var(--border)', background: attrProduct?.id === p.id ? 'rgba(255,107,0,0.04)' : 'transparent' }}>
                <td style={{ padding: '10px 16px' }}>
                  <div style={{ fontWeight: 500 }}>{p.name_mn || p.name}</div>
                  <div style={{ fontSize: 11, color: 'var(--text3)' }}>{p.slug}</div>
                </td>
                <td style={{ padding: '10px 16px', color: 'var(--text2)' }}>{p.category || '—'}</td>
                <td style={{ padding: '10px 16px', color: '#FF6B00', fontWeight: 600 }}>₮{Number(p.base_price || 0).toLocaleString()}</td>
                <td style={{ padding: '10px 16px', color: 'var(--text2)' }}>{p.min_quantity}+</td>
                <td style={{ padding: '10px 16px', color: 'var(--text2)' }}>{p.lead_time_days} өдөр</td>
                <td style={{ padding: '10px 16px' }}>
                  <span style={{ fontSize: 11, padding: '2px 8px', borderRadius: 99, background: p.is_active !== false ? 'rgba(16,185,129,0.1)' : 'rgba(239,68,68,0.1)', color: p.is_active !== false ? '#10B981' : '#EF4444', fontWeight: 600 }}>
                    {p.is_active !== false ? 'On' : 'Off'}
                  </span>
                </td>
                <td style={{ padding: '10px 16px' }}>
                  <div style={{ display: 'flex', gap: 6, flexWrap: 'nowrap' }}>
                    <button onClick={() => startEditProduct(p)} style={btnSt('blue')}>Засах</button>
                    <button onClick={() => deleteProduct(p.id)} style={btnSt('red')}>Устгах</button>
                    <button
                      onClick={() => attrProduct?.id === p.id ? setAttrProduct(null) : loadAttrs(p)}
                      style={btnSt(attrProduct?.id === p.id ? 'orange' : 'gray')}
                    >
                      ⚙ Параметр
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* ── Attribute editor panel ── */}
      {attrProduct && (
        <div style={{ background: 'var(--surface)', border: '2px solid rgba(255,107,0,0.3)', borderRadius: 14, overflow: 'hidden' }}>
          {/* Panel header */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 20px', background: 'rgba(255,107,0,0.06)', borderBottom: '1px solid var(--border)' }}>
            <div>
              <span style={{ fontWeight: 700, fontSize: 15 }}>⚙ {attrProduct.name_mn || attrProduct.name}</span>
              <span style={{ fontSize: 13, color: 'var(--text2)', marginLeft: 10 }}>— Шинж чанарууд ({attrs.length})</span>
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <button
                onClick={quickAddPrintPresets}
                disabled={saving}
                style={{ padding: '7px 14px', background: '#FF6B00', color: '#fff', border: 'none', borderRadius: 8, cursor: 'pointer', fontSize: 12, fontWeight: 600, opacity: saving ? 0.6 : 1 }}
              >
                {saving ? '⏳' : '⚡'} Хэвлэлийн параметр нэмэх
              </button>
              <button
                onClick={() => { setAttrProduct(null); setEditingAttr(null); setAttrForm(EMPTY_ATTR) }}
                style={{ padding: '7px 12px', background: 'var(--surface2)', color: 'var(--text2)', border: '1px solid var(--border)', borderRadius: 8, cursor: 'pointer', fontSize: 13 }}
              >
                ✕
              </button>
            </div>
          </div>

          <div style={{ padding: 20 }}>
            {/* Attribute list */}
            {attrLoading ? (
              <div style={{ padding: 20, textAlign: 'center', color: 'var(--text2)', fontSize: 13 }}>Уншиж байна...</div>
            ) : attrs.length > 0 ? (
              <div style={{ marginBottom: 20 }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                  <thead>
                    <tr style={{ background: 'var(--surface2)' }}>
                      {['Нэр', 'МН нэр', 'Төрөл', 'Сонголт / Нэгж', 'Үндсэн', 'Заавал', ''].map(h => (
                        <th key={h} style={{ padding: '8px 12px', textAlign: 'left', color: 'var(--text2)', fontWeight: 500, fontSize: 12 }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {attrs.map(a => (
                      <tr key={a.id} style={{ borderTop: '1px solid var(--border)', background: editingAttr?.id === a.id ? 'rgba(255,107,0,0.04)' : 'transparent' }}>
                        <td style={{ padding: '8px 12px', fontWeight: 600, fontFamily: 'monospace', fontSize: 12 }}>{a.name}</td>
                        <td style={{ padding: '8px 12px', color: 'var(--text)' }}>{a.name_mn}</td>
                        <td style={{ padding: '8px 12px' }}>
                          <span style={{ fontSize: 11, padding: '2px 7px', borderRadius: 6, background: typeColor(a.type).bg, color: typeColor(a.type).fg, fontWeight: 600 }}>
                            {a.type}
                          </span>
                        </td>
                        <td style={{ padding: '8px 12px', color: 'var(--text2)', fontSize: 12, maxWidth: 180 }}>
                          {Array.isArray(a.options) ? a.options.join(', ') : (a.unit || '—')}
                        </td>
                        <td style={{ padding: '8px 12px', color: 'var(--text2)', fontSize: 12 }}>{a.default_value || '—'}</td>
                        <td style={{ padding: '8px 12px' }}>
                          {a.required
                            ? <span style={{ color: '#EF4444', fontWeight: 700, fontSize: 12 }}>✓</span>
                            : <span style={{ color: 'var(--text3)', fontSize: 12 }}>—</span>}
                        </td>
                        <td style={{ padding: '8px 12px' }}>
                          <div style={{ display: 'flex', gap: 6 }}>
                            <button onClick={() => startEditAttr(a)} style={btnSt('blue')}>Засах</button>
                            <button onClick={() => deleteAttr(a.id)} style={btnSt('red')}>✕</button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div style={{ padding: '16px 0', color: 'var(--text2)', fontSize: 13, marginBottom: 16 }}>
                Параметр байхгүй байна. ⚡ Хэвлэлийн параметр нэмэх товч ашиглан нэмж болно.
              </div>
            )}

            {/* Add / edit attribute form */}
            <div style={{ background: 'var(--surface2)', border: '1px solid var(--border)', borderRadius: 10, padding: 18 }}>
              <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 14, color: 'var(--text)' }}>
                {editingAttr ? '✏️ Шинж чанар засах' : '+ Шинж чанар нэмэх'}
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12, marginBottom: 12 }}>
                <Field label="Нэр (код)">
                  <input value={attrForm.name} onChange={e => setAttrForm({ ...attrForm, name: e.target.value })} placeholder="color_mode" style={inp} />
                </Field>
                <Field label="Нэр (МН)">
                  <input value={attrForm.name_mn} onChange={e => setAttrForm({ ...attrForm, name_mn: e.target.value })} placeholder="Өнгийн горим" style={inp} />
                </Field>
                <Field label="Төрөл">
                  <select value={attrForm.type} onChange={e => setAttrForm({ ...attrForm, type: e.target.value })} style={inp}>
                    <option value="select">select (сонголт)</option>
                    <option value="number">number (тоо)</option>
                    <option value="text">text (текст)</option>
                    <option value="boolean">boolean (тийм/үгүй)</option>
                    <option value="dimensions">dimensions (хэмжээ)</option>
                  </select>
                </Field>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 80px', gap: 12, marginBottom: 12 }}>
                <Field label="Сонголтууд (comma-separated)">
                  <input value={attrForm.options} onChange={e => setAttrForm({ ...attrForm, options: e.target.value })} placeholder="CMYK, 1-color, 2-color" style={inp} disabled={attrForm.type === 'number' || attrForm.type === 'boolean'} />
                </Field>
                <Field label="Нэгж">
                  <input value={attrForm.unit} onChange={e => setAttrForm({ ...attrForm, unit: e.target.value })} placeholder="мм" style={inp} />
                </Field>
                <Field label="Үндсэн утга">
                  <input value={attrForm.default_value} onChange={e => setAttrForm({ ...attrForm, default_value: e.target.value })} placeholder="CMYK" style={inp} />
                </Field>
                <Field label="Заавал">
                  <div style={{ paddingTop: 6 }}>
                    <label style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer', fontSize: 13 }}>
                      <input type="checkbox" checked={attrForm.required} onChange={e => setAttrForm({ ...attrForm, required: e.target.checked })} />
                      Тийм
                    </label>
                  </div>
                </Field>
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                <button
                  onClick={saveAttr}
                  disabled={saving || !attrForm.name.trim()}
                  style={{ padding: '9px 20px', background: saving || !attrForm.name.trim() ? 'var(--border)' : '#FF6B00', color: saving || !attrForm.name.trim() ? 'var(--text3)' : '#fff', border: 'none', borderRadius: 8, cursor: 'pointer', fontSize: 13, fontWeight: 600 }}
                >
                  {saving ? '⏳' : editingAttr ? 'Хадгалах' : '+ Нэмэх'}
                </button>
                {editingAttr && (
                  <button
                    onClick={() => { setEditingAttr(null); setAttrForm(EMPTY_ATTR) }}
                    style={{ padding: '9px 16px', background: 'var(--surface)', color: 'var(--text2)', border: '1px solid var(--border)', borderRadius: 8, cursor: 'pointer', fontSize: 13 }}
                  >
                    Болих
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label style={{ display: 'block', fontSize: 12, color: 'var(--text2)', marginBottom: 5, fontWeight: 500 }}>{label}</label>
      {children}
    </div>
  )
}

function btnSt(color: 'blue' | 'red' | 'orange' | 'gray'): React.CSSProperties {
  const map = {
    blue:   { bg: 'rgba(59,130,246,0.1)',  fg: '#3B82F6' },
    red:    { bg: 'rgba(239,68,68,0.1)',   fg: '#EF4444' },
    orange: { bg: 'rgba(255,107,0,0.15)',  fg: '#FF6B00' },
    gray:   { bg: 'rgba(107,114,128,0.1)', fg: '#6B7280' },
  }
  return { padding: '5px 10px', background: map[color].bg, color: map[color].fg, border: 'none', borderRadius: 6, cursor: 'pointer', fontSize: 12, fontWeight: 500, whiteSpace: 'nowrap' }
}

function typeColor(type: string) {
  const map: Record<string, { bg: string; fg: string }> = {
    select:     { bg: 'rgba(139,92,246,0.1)', fg: '#8B5CF6' },
    number:     { bg: 'rgba(59,130,246,0.1)', fg: '#3B82F6' },
    boolean:    { bg: 'rgba(16,185,129,0.1)', fg: '#10B981' },
    text:       { bg: 'rgba(107,114,128,0.1)',fg: '#6B7280' },
    dimensions: { bg: 'rgba(245,158,11,0.1)', fg: '#F59E0B' },
  }
  return map[type] ?? { bg: 'rgba(107,114,128,0.1)', fg: '#6B7280' }
}
