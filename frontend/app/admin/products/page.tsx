'use client'
import { apiFetch, getToken } from '@/lib/api'
import React, { useState, useEffect, useCallback } from 'react'
import ProductMediaUploader from '@/components/ProductMediaUploader'

const PRINT_CATEGORIES = [
  { value: 'HADAG_REKLAM', label: 'Хаяг реклам' },
  { value: 'KHEVLEL', label: 'Хэвлэл' },
  { value: 'PROMO', label: 'Промо' },
  { value: 'AWARD', label: 'Шагнал' },
]
const UNIT_TYPES = [
  { value: 'PIECE', label: 'Ширхэг' },
  { value: 'M2', label: 'М²' },
  { value: 'METER', label: 'Метр' },
  { value: 'SET', label: 'Багц' },
]

const FONT = "'DM Sans','Segoe UI',system-ui,sans-serif"

const inp: React.CSSProperties = {
  width: '100%', padding: '10px 14px', background: 'var(--surface2)',
  border: '1px solid var(--border)', borderRadius: 8, fontSize: 13,
  color: 'var(--text)', outline: 'none', fontFamily: FONT, boxSizing: 'border-box',
}
const btnPrimary: React.CSSProperties = {
  padding: '10px 22px', background: '#FF6B00', color: '#fff', border: 'none',
  borderRadius: 8, cursor: 'pointer', fontSize: 13, fontWeight: 600, fontFamily: FONT,
}
const btnSecondary: React.CSSProperties = {
  padding: '10px 22px', background: 'var(--surface2)', color: 'var(--text2)',
  border: '1px solid var(--border)', borderRadius: 8, cursor: 'pointer', fontSize: 13, fontFamily: FONT,
}
const labelStyle: React.CSSProperties = {
  fontSize: 12, color: 'var(--text2)', marginBottom: 6, display: 'block', fontWeight: 500,
}
const thStyle: React.CSSProperties = {
  padding: '10px 14px', textAlign: 'left', color: 'var(--text2)', fontWeight: 500,
  fontSize: 12, borderBottom: '1px solid var(--border)',
}
const tdStyle: React.CSSProperties = {
  padding: '10px 14px', fontSize: 13, borderBottom: '1px solid var(--border)', color: 'var(--text)',
}

// ─── PRINT PRODUCTS TAB ───────────────────────────────────────────────────────
const emptyPrint = {
  name_mn: '', name_en: '', code: '', category: 'HADAG_REKLAM',
  subcategory: '', unit_type: 'PIECE', description: '', thumbnail_url: '',
  images: [] as string[], video_url: '',
}
const emptyMaterial = { material_code: '', material_name_mn: '', unit: '', base_cost: 0, display_name: '', is_default: false }
const emptySize = { size_code: '', size_label: '', width_mm: 0, height_mm: 0, base_price: 0, is_custom: false }

function PrintProductsTab() {
  const [items, setItems] = useState<any[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('')
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState<any>(null)
  const [form, setForm] = useState({ ...emptyPrint })
  const [formTab, setFormTab] = useState(0)
  const [materials, setMaterials] = useState<any[]>([])
  const [sizes, setSizes] = useState<any[]>([])
  const [materialForm, setMaterialForm] = useState({ ...emptyMaterial })
  const [sizeForm, setSizeForm] = useState({ ...emptySize })
  const [editingMaterial, setEditingMaterial] = useState<any>(null)
  const [editingSize, setEditingSize] = useState<any>(null)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (search) params.set('search', search)
      if (categoryFilter) params.set('category', categoryFilter)
      const data = await apiFetch<any>(`/admin/products-master?${params}`)
      setItems(data.items || [])
      setTotal(data.total || 0)
    } catch (e: any) {
      setItems([])
      setError('Бүтээгдэхүүн ачааллахад алдаа: ' + (e.message || ''))
    } finally {
      setLoading(false)
    }
  }, [search, categoryFilter])

  useEffect(() => { load() }, [load])

  const openCreate = () => {
    setEditing(null); setForm({ ...emptyPrint }); setMaterials([]); setSizes([])
    setMaterialForm({ ...emptyMaterial }); setSizeForm({ ...emptySize })
    setEditingMaterial(null); setEditingSize(null); setFormTab(0); setError(''); setModalOpen(true)
  }
  const openEdit = (item: any) => {
    setEditing(item)
    setForm({ name_mn: item.name_mn || '', name_en: item.name_en || '', code: item.code || '',
      category: item.category || 'HADAG_REKLAM', subcategory: item.subcategory || '',
      unit_type: item.unit_type || 'PIECE', description: item.description || '',
      thumbnail_url: item.thumbnail_url || '', images: item.images || [], video_url: item.video_url || '' })
    setMaterials(item.materials || []); setSizes(item.sizes || [])
    setMaterialForm({ ...emptyMaterial }); setSizeForm({ ...emptySize })
    setEditingMaterial(null); setEditingSize(null); setFormTab(0); setError(''); setModalOpen(true)
  }
  const closeModal = () => { setModalOpen(false); setEditing(null); setError('') }

  const saveProduct = async () => {
    if (!form.name_mn.trim()) { setError('Нэр (МН) оруулна уу'); return }
    setSaving(true); setError('')
    try {
      const payload = { ...form, thumbnail_url: form.images[0] || form.thumbnail_url }
      if (editing?.id) {
        await apiFetch<any>(`/admin/products-master/${editing.id}`, {
          method: 'PUT', body: payload,
        })
      } else {
        const res = await apiFetch<any>(`/admin/products-master`, {
          method: 'POST', body: payload,
        })
        const created = res
        setEditing(created)
        setFormTab(1)  // advance to Materials tab after creating
      }
      await load()
    } catch (e: any) {
      setError('Хадгалахад алдаа: ' + (e.message || ''))
    } finally { setSaving(false) }
  }

  const saveMaterial = async () => {
    if (!editing?.id) return
    if (!materialForm.material_code.trim()) { setError('Материалын код оруулна уу'); return }
    if (!materialForm.material_name_mn.trim()) { setError('Материалын нэр оруулна уу'); return }
    setSaving(true); setError('')
    try {
      if (editingMaterial?.id) {
        const res = await apiFetch<any>(`/admin/products-master/materials/${editingMaterial.id}`, {
          method: 'PUT', body: materialForm,
        })
        const updated = res
        setMaterials(prev => prev.map(m => m.id === updated.id ? updated : m))
      } else {
        const res = await apiFetch<any>(`/admin/products-master/${editing.id}/materials`, {
          method: 'POST', body: materialForm,
        })
        const created = res
        setMaterials(prev => [...prev, created])
      }
      setMaterialForm({ ...emptyMaterial }); setEditingMaterial(null)
    } catch (e: any) {
      setError('Материал хадгалахад алдаа: ' + (e.message || ''))
    } finally { setSaving(false) }
  }

  const saveSize = async () => {
    if (!editing?.id) return
    if (!sizeForm.size_code.trim()) { setError('Хэмжээний код оруулна уу'); return }
    if (!sizeForm.size_label.trim()) { setError('Хэмжээний шошго оруулна уу'); return }
    setSaving(true); setError('')
    try {
      if (editingSize?.id) {
        const res = await apiFetch<any>(`/admin/products-master/sizes/${editingSize.id}`, {
          method: 'PUT', body: sizeForm,
        })
        const updated = res
        setSizes(prev => prev.map(s => s.id === updated.id ? updated : s))
      } else {
        const res = await apiFetch<any>(`/admin/products-master/${editing.id}/sizes`, {
          method: 'POST', body: sizeForm,
        })
        const created = res
        setSizes(prev => [...prev, created])
      }
      setSizeForm({ ...emptySize }); setEditingSize(null)
    } catch (e: any) {
      setError('Хэмжээ хадгалахад алдаа: ' + (e.message || ''))
    } finally { setSaving(false) }
  }

  const deactivate = async (id: string) => {
    if (!confirm('Устгах уу?')) return
    await apiFetch<any>(`/admin/products-master/${id}`, { method: 'DELETE' })
    await load()
  }

  const PRINT_TABS = ['Үндсэн мэдээлэл', 'Материал', 'Хэмжээ / Үнэ']

  return (
    <div>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, flexWrap: 'wrap', gap: 10 }}>
        <p style={{ color: 'var(--text2)', fontSize: 13, margin: 0 }}>
          Захиалгат тооцоололттой хэвлэлийн бүтээгдэхүүн — нийт {total}
        </p>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Хайх..." style={{ ...inp, width: 200 }} />
          <select value={categoryFilter} onChange={e => setCategoryFilter(e.target.value)} style={{ ...inp, width: 150, cursor: 'pointer' }}>
            <option value="">Бүх ангилал</option>
            {PRINT_CATEGORIES.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
          </select>
          <button onClick={openCreate} style={btnPrimary}>+ Нэмэх</button>
        </div>
      </div>

      {error && <div style={{ background: 'rgba(239,68,68,0.1)', color: '#EF4444', padding: '10px 14px', borderRadius: 8, marginBottom: 12, fontSize: 13 }}>{error}</div>}

      {loading ? (
        <div style={{ textAlign: 'center', padding: 60, color: 'var(--text2)' }}>Уншиж байна...</div>
      ) : items.length === 0 ? (
        <div style={{ textAlign: 'center', padding: 60, color: 'var(--text3)', fontSize: 14 }}>
          <div style={{ fontSize: 32, marginBottom: 12 }}>📦</div>
          Хэвлэлийн бүтээгдэхүүн олдсонгүй
          <br /><br />
          <button onClick={openCreate} style={btnPrimary}>+ Эхний бүтээгдэхүүн нэмэх</button>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 16 }}>
          {items.map(item => (
            <div key={item.id} style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 14, padding: 18, display: 'flex', flexDirection: 'column', gap: 10, opacity: item.is_active === false ? 0.6 : 1 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                  <div style={{ fontSize: 15, fontWeight: 600, color: 'var(--text)', marginBottom: 2 }}>{item.name_mn || '—'}</div>
                  {item.code && <div style={{ fontSize: 11, color: 'var(--text3)', fontFamily: 'monospace' }}>{item.code}</div>}
                </div>
                {item.thumbnail_url && <img src={item.thumbnail_url} alt="" style={{ width: 44, height: 44, borderRadius: 8, objectFit: 'cover' }} />}
              </div>
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                <span style={{ fontSize: 11, padding: '2px 8px', borderRadius: 99, background: 'rgba(255,107,0,0.1)', color: '#FF6B00', fontWeight: 600 }}>
                  {PRINT_CATEGORIES.find(c => c.value === item.category)?.label || item.category}
                </span>
                <span style={{ fontSize: 11, color: 'var(--text3)' }}>{item.materials?.length || 0} материал</span>
                <span style={{ fontSize: 11, color: 'var(--text3)' }}>{item.sizes?.length || 0} хэмжээ</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 'auto' }}>
                <span style={{ fontSize: 11, color: item.is_active !== false ? '#10B981' : '#EF4444', fontWeight: 600 }}>
                  {item.is_active !== false ? '● Идэвхтэй' : '● Идэвхгүй'}
                </span>
                <div style={{ display: 'flex', gap: 6 }}>
                  <button onClick={() => openEdit(item)} style={{ padding: '5px 12px', background: 'rgba(59,130,246,0.1)', color: '#3B82F6', border: 'none', borderRadius: 6, cursor: 'pointer', fontSize: 12, fontFamily: FONT }}>Засах</button>
                  <button onClick={() => deactivate(item.id)} style={{ padding: '5px 12px', background: 'rgba(239,68,68,0.1)', color: '#EF4444', border: 'none', borderRadius: 6, cursor: 'pointer', fontSize: 12, fontFamily: FONT }}>Устгах</button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal */}
      {modalOpen && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: 20 }}
          onClick={e => { if (e.target === e.currentTarget) closeModal() }}>
          <div style={{ background: 'var(--surface)', borderRadius: 16, width: '100%', maxWidth: 760, maxHeight: '90vh', display: 'flex', flexDirection: 'column', overflow: 'hidden', border: '1px solid var(--border)' }}>
            <div style={{ padding: '18px 24px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h2 style={{ fontSize: 17, fontWeight: 700, margin: 0, color: 'var(--text)' }}>{editing?.id ? 'Хэвлэлийн бүтээгдэхүүн засах' : 'Хэвлэлийн бүтээгдэхүүн нэмэх'}</h2>
              <button onClick={closeModal} style={{ background: 'none', border: 'none', fontSize: 20, color: 'var(--text3)', cursor: 'pointer' }}>✕</button>
            </div>
            <div style={{ display: 'flex', borderBottom: '1px solid var(--border)', paddingLeft: 24 }}>
              {PRINT_TABS.map((t, i) => (
                <button key={t} onClick={() => setFormTab(i)} disabled={i > 0 && !editing?.id}
                  style={{ padding: '10px 18px', fontSize: 13, fontWeight: formTab === i ? 600 : 400, color: formTab === i ? '#FF6B00' : 'var(--text2)', background: 'none', border: 'none', borderBottom: formTab === i ? '2px solid #FF6B00' : '2px solid transparent', cursor: i > 0 && !editing?.id ? 'not-allowed' : 'pointer', fontFamily: FONT }}>
                  {t}
                </button>
              ))}
            </div>
            {error && <div style={{ margin: '0 24px', marginTop: 12, background: 'rgba(239,68,68,0.1)', color: '#EF4444', padding: '8px 12px', borderRadius: 8, fontSize: 13 }}>{error}</div>}
            <div style={{ padding: 24, overflowY: 'auto', flex: 1 }}>
              {/* Basic Info */}
              {formTab === 0 && (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                  <div>
                    <label style={labelStyle}>Нэр (МН) *</label>
                    <input value={form.name_mn} onChange={e => setForm({ ...form, name_mn: e.target.value })} style={inp} placeholder="Визит карт" />
                  </div>
                  <div>
                    <label style={labelStyle}>Нэр (EN)</label>
                    <input value={form.name_en} onChange={e => setForm({ ...form, name_en: e.target.value })} style={inp} placeholder="Business Card" />
                  </div>
                  <div>
                    <label style={labelStyle}>Код (заавал биш — автоматаар үүснэ)</label>
                    <input value={form.code} onChange={e => setForm({ ...form, code: e.target.value })} style={inp} placeholder="BC-001" />
                  </div>
                  <div>
                    <label style={labelStyle}>Ангилал</label>
                    <select value={form.category} onChange={e => setForm({ ...form, category: e.target.value })} style={{ ...inp, cursor: 'pointer' }}>
                      {PRINT_CATEGORIES.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
                    </select>
                  </div>
                  <div>
                    <label style={labelStyle}>Дэд ангилал</label>
                    <input value={form.subcategory} onChange={e => setForm({ ...form, subcategory: e.target.value })} style={inp} />
                  </div>
                  <div>
                    <label style={labelStyle}>Хэмжих нэгж</label>
                    <select value={form.unit_type} onChange={e => setForm({ ...form, unit_type: e.target.value })} style={{ ...inp, cursor: 'pointer' }}>
                      {UNIT_TYPES.map(u => <option key={u.value} value={u.value}>{u.label}</option>)}
                    </select>
                  </div>
                  <div style={{ gridColumn: 'span 2' }}>
                    <label style={labelStyle}>Тайлбар</label>
                    <textarea value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} style={{ ...inp, minHeight: 80, resize: 'vertical' }} />
                  </div>
                  <div style={{ gridColumn: 'span 2' }}>
                    <ProductMediaUploader
                      images={form.images}
                      videoUrl={form.video_url}
                      token={getToken() || ''}
                      onChange={(imgs, vid) => setForm(f => ({ ...f, images: imgs, thumbnail_url: imgs[0] || f.thumbnail_url, video_url: vid }))}
                    />
                  </div>
                </div>
              )}
              {/* Materials */}
              {formTab === 1 && (
                <div>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13, marginBottom: 16 }}>
                    <thead>
                      <tr style={{ background: 'var(--surface2)' }}>
                        {['Код', 'Нэр', 'Нэгж', 'Өртөг', 'Харуулах нэр', 'Үндсэн', ''].map(h => <th key={h} style={thStyle}>{h}</th>)}
                      </tr>
                    </thead>
                    <tbody>
                      {materials.map(m => (
                        <tr key={m.id}>
                          <td style={tdStyle}><span style={{ fontFamily: 'monospace' }}>{m.material_code}</span></td>
                          <td style={tdStyle}>{m.material_name_mn}</td>
                          <td style={tdStyle}>{m.unit}</td>
                          <td style={tdStyle}>₮{Number(m.base_cost || 0).toLocaleString()}</td>
                          <td style={tdStyle}>{m.display_name || '—'}</td>
                          <td style={tdStyle}>{m.is_default ? <span style={{ color: '#10B981', fontWeight: 600 }}>✓</span> : '—'}</td>
                          <td style={tdStyle}>
                            <button onClick={() => { setEditingMaterial(m); setMaterialForm({ material_code: m.material_code || '', material_name_mn: m.material_name_mn || '', unit: m.unit || '', base_cost: m.base_cost || 0, display_name: m.display_name || '', is_default: m.is_default || false }) }} style={{ background: 'none', border: 'none', color: '#3B82F6', cursor: 'pointer', fontSize: 12 }}>Засах</button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  <div style={{ background: 'var(--surface2)', borderRadius: 10, padding: 16 }}>
                    <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 10, color: 'var(--text)' }}>{editingMaterial ? 'Материал засах' : '+ Материал нэмэх'}</div>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10 }}>
                      <div><label style={labelStyle}>Код</label><input value={materialForm.material_code} onChange={e => setMaterialForm({ ...materialForm, material_code: e.target.value })} style={inp} /></div>
                      <div><label style={labelStyle}>Нэр (МН)</label><input value={materialForm.material_name_mn} onChange={e => setMaterialForm({ ...materialForm, material_name_mn: e.target.value })} style={inp} /></div>
                      <div><label style={labelStyle}>Нэгж</label><input value={materialForm.unit} onChange={e => setMaterialForm({ ...materialForm, unit: e.target.value })} style={inp} /></div>
                      <div><label style={labelStyle}>Үнэ өртөг (₮)</label><input type="number" value={materialForm.base_cost} onChange={e => setMaterialForm({ ...materialForm, base_cost: Number(e.target.value) })} style={inp} /></div>
                      <div><label style={labelStyle}>Харуулах нэр</label><input value={materialForm.display_name} onChange={e => setMaterialForm({ ...materialForm, display_name: e.target.value })} style={inp} /></div>
                      <div style={{ display: 'flex', alignItems: 'flex-end', paddingBottom: 2 }}>
                        <label style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer', fontSize: 13, color: 'var(--text)' }}>
                          <input type="checkbox" checked={materialForm.is_default} onChange={e => setMaterialForm({ ...materialForm, is_default: e.target.checked })} />
                          Үндсэн материал
                        </label>
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
                      <button onClick={saveMaterial} disabled={saving} style={{ ...btnPrimary, padding: '8px 18px', fontSize: 12 }}>Хадгалах</button>
                      {editingMaterial && <button onClick={() => { setEditingMaterial(null); setMaterialForm({ ...emptyMaterial }) }} style={{ ...btnSecondary, padding: '8px 18px', fontSize: 12 }}>Цуцлах</button>}
                    </div>
                  </div>
                </div>
              )}
              {/* Sizes */}
              {formTab === 2 && (
                <div>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13, marginBottom: 16 }}>
                    <thead>
                      <tr style={{ background: 'var(--surface2)' }}>
                        {['Код', 'Шошго', 'Өргөн (мм)', 'Өндөр (мм)', 'Суурь үнэ', ''].map(h => <th key={h} style={thStyle}>{h}</th>)}
                      </tr>
                    </thead>
                    <tbody>
                      {sizes.map(s => (
                        <tr key={s.id}>
                          <td style={tdStyle}><span style={{ fontFamily: 'monospace' }}>{s.size_code}</span></td>
                          <td style={tdStyle}>{s.size_label}</td>
                          <td style={tdStyle}>{s.width_mm}</td>
                          <td style={tdStyle}>{s.height_mm}</td>
                          <td style={tdStyle}>₮{Number(s.base_price || 0).toLocaleString()}</td>
                          <td style={tdStyle}>
                            <button onClick={() => { setEditingSize(s); setSizeForm({ size_code: s.size_code || '', size_label: s.size_label || '', width_mm: s.width_mm || 0, height_mm: s.height_mm || 0, base_price: s.base_price || 0, is_custom: s.is_custom || false }) }} style={{ background: 'none', border: 'none', color: '#3B82F6', cursor: 'pointer', fontSize: 12 }}>Засах</button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  <div style={{ background: 'var(--surface2)', borderRadius: 10, padding: 16 }}>
                    <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 10, color: 'var(--text)' }}>{editingSize ? 'Хэмжээ засах' : '+ Хэмжээ нэмэх'}</div>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10 }}>
                      <div><label style={labelStyle}>Код</label><input value={sizeForm.size_code} onChange={e => setSizeForm({ ...sizeForm, size_code: e.target.value })} style={inp} /></div>
                      <div><label style={labelStyle}>Шошго (A4, A5...)</label><input value={sizeForm.size_label} onChange={e => setSizeForm({ ...sizeForm, size_label: e.target.value })} style={inp} /></div>
                      <div><label style={labelStyle}>Суурь үнэ (₮)</label><input type="number" value={sizeForm.base_price} onChange={e => setSizeForm({ ...sizeForm, base_price: Number(e.target.value) })} style={inp} /></div>
                      <div><label style={labelStyle}>Өргөн (мм)</label><input type="number" value={sizeForm.width_mm} onChange={e => setSizeForm({ ...sizeForm, width_mm: Number(e.target.value) })} style={inp} /></div>
                      <div><label style={labelStyle}>Өндөр (мм)</label><input type="number" value={sizeForm.height_mm} onChange={e => setSizeForm({ ...sizeForm, height_mm: Number(e.target.value) })} style={inp} /></div>
                      <div style={{ display: 'flex', alignItems: 'flex-end', paddingBottom: 2 }}>
                        <label style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer', fontSize: 13, color: 'var(--text)' }}>
                          <input type="checkbox" checked={sizeForm.is_custom} onChange={e => setSizeForm({ ...sizeForm, is_custom: e.target.checked })} />
                          Захиалгат хэмжээ
                        </label>
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
                      <button onClick={saveSize} disabled={saving} style={{ ...btnPrimary, padding: '8px 18px', fontSize: 12 }}>Хадгалах</button>
                      {editingSize && <button onClick={() => { setEditingSize(null); setSizeForm({ ...emptySize }) }} style={{ ...btnSecondary, padding: '8px 18px', fontSize: 12 }}>Цуцлах</button>}
                    </div>
                  </div>
                </div>
              )}
            </div>
            <div style={{ padding: '16px 24px', borderTop: '1px solid var(--border)', display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
              <button onClick={closeModal} style={btnSecondary}>Хаах</button>
              {formTab === 0 && <button onClick={saveProduct} disabled={saving} style={btnPrimary}>{saving ? 'Хадгалж байна...' : editing?.id ? 'Шинэчлэх' : 'Бүтээгдэхүүн нэмэх'}</button>}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// ─── SHOP PRODUCTS TAB ────────────────────────────────────────────────────────
const emptyShop = {
  name_mn: '', name_en: '', category: '', description: '',
  base_price: 0, sale_price: '', stock_quantity: '', sku: '', thumbnail_url: '',
  images: [] as string[], video_url: '',
}

function ShopProductsTab() {
  const [items, setItems] = useState<any[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState<any>(null)
  const [form, setForm] = useState({ ...emptyShop })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const data = await apiFetch<any>('/admin/shop-products?product_type=ready')
      setItems(data.items || [])
      setTotal(data.total || 0)
    } catch (e: any) {
      setItems([]); setError('Алдаа: ' + (e.message || ''))
    } finally { setLoading(false) }
  }, [])

  useEffect(() => { load() }, [load])

  const openCreate = () => {
    setEditing(null); setForm({ ...emptyShop }); setError(''); setModalOpen(true)
  }
  const openEdit = (item: any) => {
    setEditing(item)
    setForm({ name_mn: item.name_mn || item.name || '', name_en: item.name || '', category: item.category || '',
      description: item.description || '', base_price: item.base_price || 0,
      sale_price: item.sale_price || '', stock_quantity: item.stock_quantity || '',
      sku: item.sku || '', thumbnail_url: item.thumbnail_url || '',
      images: item.images || [], video_url: item.video_url || '' })
    setError(''); setModalOpen(true)
  }
  const closeModal = () => { setModalOpen(false); setEditing(null); setError('') }

  const save = async () => {
    if (!form.name_mn.trim()) { setError('Нэр оруулна уу'); return }
    if (!form.base_price) { setError('Үнэ оруулна уу'); return }
    setSaving(true); setError('')
    try {
      const payload = {
        name: form.name_mn, name_mn: form.name_mn, category: form.category || 'shop',
        description: form.description, base_price: Number(form.base_price),
        sale_price: form.sale_price ? Number(form.sale_price) : null,
        stock_quantity: form.stock_quantity ? Number(form.stock_quantity) : null,
        sku: form.sku || null,
        thumbnail_url: form.images[0] || form.thumbnail_url || null,
        images: form.images, video_url: form.video_url || null,
        product_type: 'ready',
      }
      if (editing?.id) {
        await apiFetch<any>(`/admin/shop-products/${editing.id}`, { method: 'PATCH', body: payload })
      } else {
        await apiFetch<any>('/admin/shop-products', { method: 'POST', body: payload })
      }
      await load(); closeModal()
    } catch (e: any) { setError('Хадгалахад алдаа: ' + (e.message || '')) }
    finally { setSaving(false) }
  }

  const deleteItem = async (id: string) => {
    if (!confirm('Устгах уу?')) return
    await apiFetch<any>(`/admin/shop-products/${id}`, { method: 'DELETE' })
    await load()
  }

  const toggleActive = async (item: any) => {
    await apiFetch<any>(`/admin/shop-products/${item.id}`, { method: 'PATCH', body: { is_active: !item.is_active } })
    await load()
  }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, flexWrap: 'wrap', gap: 10 }}>
        <p style={{ color: 'var(--text2)', fontSize: 13, margin: 0 }}>Тогтмол үнэтэй дэлгүүрийн бүтээгдэхүүн — нийт {total}</p>
        <button onClick={openCreate} style={btnPrimary}>+ Нэмэх</button>
      </div>
      {error && <div style={{ background: 'rgba(239,68,68,0.1)', color: '#EF4444', padding: '10px 14px', borderRadius: 8, marginBottom: 12, fontSize: 13 }}>{error}</div>}
      {loading ? (
        <div style={{ textAlign: 'center', padding: 60, color: 'var(--text2)' }}>Уншиж байна...</div>
      ) : items.length === 0 ? (
        <div style={{ textAlign: 'center', padding: 60, color: 'var(--text3)', fontSize: 14 }}>
          <div style={{ fontSize: 32, marginBottom: 12 }}>🛍️</div>
          Дэлгүүрийн бүтээгдэхүүн олдсонгүй
          <br /><br />
          <button onClick={openCreate} style={btnPrimary}>+ Эхний бүтээгдэхүүн нэмэх</button>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 14 }}>
          {items.map(item => (
            <div key={item.id} style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 12, padding: 16, display: 'flex', flexDirection: 'column', gap: 8, opacity: item.is_active === false ? 0.55 : 1 }}>
              <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                {item.thumbnail_url ? <img src={item.thumbnail_url} alt="" style={{ width: 52, height: 52, objectFit: 'cover', borderRadius: 8, flexShrink: 0 }} /> : <div style={{ width: 52, height: 52, borderRadius: 8, background: 'var(--surface2)', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20 }}>🏷️</div>}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text)', marginBottom: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.name_mn || item.name || '—'}</div>
                  {item.sku && <div style={{ fontSize: 11, color: 'var(--text3)', fontFamily: 'monospace' }}>SKU: {item.sku}</div>}
                  <div style={{ fontSize: 13, fontWeight: 700, color: '#FF6B00', marginTop: 2 }}>
                    {item.sale_price ? (
                      <><span>₮{Number(item.sale_price).toLocaleString()}</span><span style={{ textDecoration: 'line-through', color: 'var(--text3)', marginLeft: 6, fontSize: 11 }}>₮{Number(item.base_price).toLocaleString()}</span></>
                    ) : (
                      <span>₮{Number(item.base_price).toLocaleString()}</span>
                    )}
                  </div>
                </div>
              </div>
              {item.stock_quantity != null && <div style={{ fontSize: 12, color: 'var(--text2)' }}>Үлдэгдэл: <strong>{item.stock_quantity}</strong></div>}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 4 }}>
                <button onClick={() => toggleActive(item)} style={{ fontSize: 11, padding: '3px 10px', borderRadius: 99, border: 'none', cursor: 'pointer', fontWeight: 600, fontFamily: FONT, background: item.is_active !== false ? 'rgba(16,185,129,0.1)' : 'rgba(239,68,68,0.1)', color: item.is_active !== false ? '#10B981' : '#EF4444' }}>
                  {item.is_active !== false ? '● Идэвхтэй' : '● Идэвхгүй'}
                </button>
                <div style={{ display: 'flex', gap: 6 }}>
                  <button onClick={() => openEdit(item)} style={{ padding: '4px 10px', background: 'rgba(59,130,246,0.1)', color: '#3B82F6', border: 'none', borderRadius: 6, cursor: 'pointer', fontSize: 12, fontFamily: FONT }}>Засах</button>
                  <button onClick={() => deleteItem(item.id)} style={{ padding: '4px 10px', background: 'rgba(239,68,68,0.1)', color: '#EF4444', border: 'none', borderRadius: 6, cursor: 'pointer', fontSize: 12, fontFamily: FONT }}>Устгах</button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {modalOpen && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: 20 }}
          onClick={e => { if (e.target === e.currentTarget) closeModal() }}>
          <div style={{ background: 'var(--surface)', borderRadius: 16, width: '100%', maxWidth: 520, maxHeight: '90vh', display: 'flex', flexDirection: 'column', overflow: 'hidden', border: '1px solid var(--border)' }}>
            <div style={{ padding: '18px 24px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h2 style={{ fontSize: 17, fontWeight: 700, margin: 0, color: 'var(--text)' }}>{editing?.id ? 'Бүтээгдэхүүн засах' : 'Дэлгүүрийн бүтээгдэхүүн нэмэх'}</h2>
              <button onClick={closeModal} style={{ background: 'none', border: 'none', fontSize: 20, color: 'var(--text3)', cursor: 'pointer' }}>✕</button>
            </div>
            {error && <div style={{ margin: '12px 24px 0', background: 'rgba(239,68,68,0.1)', color: '#EF4444', padding: '8px 12px', borderRadius: 8, fontSize: 13 }}>{error}</div>}
            <div style={{ padding: 24, overflowY: 'auto', flex: 1, display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div>
                <label style={labelStyle}>Нэр *</label>
                <input value={form.name_mn} onChange={e => setForm({ ...form, name_mn: e.target.value })} style={inp} placeholder="Бүтээгдэхүүний нэр" />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div>
                  <label style={labelStyle}>Суурь үнэ (₮) *</label>
                  <input type="number" value={form.base_price} onChange={e => setForm({ ...form, base_price: Number(e.target.value) })} style={inp} placeholder="0" />
                </div>
                <div>
                  <label style={labelStyle}>Хямдарсан үнэ (₮)</label>
                  <input type="number" value={form.sale_price} onChange={e => setForm({ ...form, sale_price: e.target.value })} style={inp} placeholder="Заавал биш" />
                </div>
                <div>
                  <label style={labelStyle}>Нөөцийн тоо</label>
                  <input type="number" value={form.stock_quantity} onChange={e => setForm({ ...form, stock_quantity: e.target.value })} style={inp} />
                </div>
                <div>
                  <label style={labelStyle}>SKU</label>
                  <input value={form.sku} onChange={e => setForm({ ...form, sku: e.target.value })} style={inp} />
                </div>
              </div>
              <div>
                <label style={labelStyle}>Ангилал</label>
                <input value={form.category} onChange={e => setForm({ ...form, category: e.target.value })} style={inp} placeholder="Жишээ: хэвлэл, промо..." />
              </div>
              <div>
                <label style={labelStyle}>Тайлбар</label>
                <textarea value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} style={{ ...inp, minHeight: 80, resize: 'vertical' }} />
              </div>
              <ProductMediaUploader
                images={form.images}
                videoUrl={form.video_url}
                token={getToken() || ''}
                onChange={(imgs, vid) => setForm(f => ({ ...f, images: imgs, thumbnail_url: imgs[0] || f.thumbnail_url, video_url: vid }))}
              />
            </div>
            <div style={{ padding: '14px 24px', borderTop: '1px solid var(--border)', display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
              <button onClick={closeModal} style={btnSecondary}>Цуцлах</button>
              <button onClick={save} disabled={saving} style={btnPrimary}>{saving ? 'Хадгалж байна...' : 'Хадгалах'}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// ─── DESIGNER TEMPLATES TAB ───────────────────────────────────────────────────
function TemplatesTab() {
  const [items, setItems] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState('pending')
  const [actionLoading, setActionLoading] = useState<string | null>(null)
  const [error, setError] = useState('')

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const params = statusFilter ? `?status=${statusFilter}` : ''
      const data = await apiFetch<any>(`/templates${params}`)
      setItems(Array.isArray(data) ? data : [])
    } catch (e: any) {
      setItems([]); setError('Алдаа: ' + (e.message || ''))
    } finally { setLoading(false) }
  }, [statusFilter])

  useEffect(() => { load() }, [load])

  const approve = async (id: string) => {
    setActionLoading(id)
    try {
      await apiFetch<any>(`/templates/${id}/approve`, { method: 'PATCH'})
      await load()
    } finally { setActionLoading(null) }
  }

  const reject = async (id: string) => {
    if (!confirm('Татгалзах уу?')) return
    setActionLoading(id)
    try {
      await apiFetch<any>(`/templates/${id}/reject`, { method: 'PATCH'})
      await load()
    } finally { setActionLoading(null) }
  }

  const statusLabel: Record<string, string> = {
    pending: '⏳ Хүлээгдэж буй',
    approved: '✅ Батлагдсан',
    rejected: '❌ Татгалзсан',
  }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <p style={{ color: 'var(--text2)', fontSize: 13, margin: 0 }}>
          Дизайнерын байршуулсан загварууд — батлагдсаны дараа нүүр хуудсанд харагдана
        </p>
        <div style={{ display: 'flex', gap: 8 }}>
          {(['pending', 'approved', 'rejected'] as const).map(s => (
            <button key={s} onClick={() => setStatusFilter(s)} style={{ padding: '6px 14px', borderRadius: 99, border: 'none', cursor: 'pointer', fontSize: 12, fontWeight: statusFilter === s ? 600 : 400, fontFamily: FONT, background: statusFilter === s ? '#FF6B00' : 'var(--surface2)', color: statusFilter === s ? '#fff' : 'var(--text2)' }}>
              {statusLabel[s]}
            </button>
          ))}
        </div>
      </div>
      {error && <div style={{ background: 'rgba(239,68,68,0.1)', color: '#EF4444', padding: '10px 14px', borderRadius: 8, marginBottom: 12, fontSize: 13 }}>{error}</div>}
      {loading ? (
        <div style={{ textAlign: 'center', padding: 60, color: 'var(--text2)' }}>Уншиж байна...</div>
      ) : items.length === 0 ? (
        <div style={{ textAlign: 'center', padding: 60, color: 'var(--text3)', fontSize: 14 }}>
          <div style={{ fontSize: 32, marginBottom: 12 }}>🎨</div>
          {statusFilter === 'pending' ? 'Хүлээгдэж буй загвар байхгүй' : 'Загвар олдсонгүй'}
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 14 }}>
          {items.map(item => (
            <div key={item.id} style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 12, overflow: 'hidden' }}>
              {item.preview_images?.[0] ? (
                <img src={item.preview_images[0]} alt="" style={{ width: '100%', height: 140, objectFit: 'cover' }} />
              ) : (
                <div style={{ width: '100%', height: 140, background: 'var(--surface2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 32 }}>🖼️</div>
              )}
              <div style={{ padding: 14 }}>
                <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text)', marginBottom: 4 }}>{item.title || item.name || '—'}</div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                  <span style={{ fontSize: 12, color: 'var(--text2)' }}>{item.category || '—'}</span>
                  <span style={{ fontSize: 13, fontWeight: 700, color: '#FF6B00' }}>₮{Number(item.price || 0).toLocaleString()}</span>
                </div>
                {item.designer_name && <div style={{ fontSize: 11, color: 'var(--text3)', marginBottom: 8 }}>Дизайнер: {item.designer_name}</div>}
                {statusFilter === 'pending' && (
                  <div style={{ display: 'flex', gap: 8 }}>
                    <button onClick={() => approve(item.id)} disabled={actionLoading === item.id} style={{ flex: 1, padding: '7px 0', background: 'rgba(16,185,129,0.1)', color: '#10B981', border: 'none', borderRadius: 7, cursor: 'pointer', fontSize: 12, fontWeight: 600, fontFamily: FONT }}>
                      {actionLoading === item.id ? '...' : '✓ Батлах'}
                    </button>
                    <button onClick={() => reject(item.id)} disabled={actionLoading === item.id} style={{ flex: 1, padding: '7px 0', background: 'rgba(239,68,68,0.1)', color: '#EF4444', border: 'none', borderRadius: 7, cursor: 'pointer', fontSize: 12, fontWeight: 600, fontFamily: FONT }}>
                      ✕ Татгалзах
                    </button>
                  </div>
                )}
                {statusFilter === 'approved' && (
                  <div style={{ display: 'flex', gap: 8 }}>
                    <button onClick={() => reject(item.id)} disabled={actionLoading === item.id} style={{ padding: '6px 12px', background: 'rgba(239,68,68,0.1)', color: '#EF4444', border: 'none', borderRadius: 7, cursor: 'pointer', fontSize: 12, fontFamily: FONT }}>
                      Цуцлах
                    </button>
                    <div style={{ flex: 1, padding: '6px 10px', background: 'rgba(16,185,129,0.1)', borderRadius: 7, fontSize: 12, color: '#10B981', fontWeight: 600, textAlign: 'center' }}>✓ Батлагдсан</div>
                  </div>
                )}
                {statusFilter === 'rejected' && (
                  <div style={{ display: 'flex', gap: 8 }}>
                    <button onClick={() => approve(item.id)} disabled={actionLoading === item.id} style={{ flex: 1, padding: '6px 0', background: 'rgba(16,185,129,0.1)', color: '#10B981', border: 'none', borderRadius: 7, cursor: 'pointer', fontSize: 12, fontFamily: FONT }}>
                      Дахин батлах
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// ─── MAIN PAGE ────────────────────────────────────────────────────────────────
const MAIN_TABS = [
  { key: 'print', label: '🖨️ Хэвлэлийн бүтээгдэхүүн', desc: 'Захиалгат тооцоолол' },
  { key: 'shop', label: '🛍️ Дэлгүүрийн бүтээгдэхүүн', desc: 'Тогтмол үнэ' },
  { key: 'templates', label: '🎨 Дизайны загварууд', desc: 'Дизайнер → Батлах' },
]

export default function AdminProductsPage() {
  const [activeTab, setActiveTab] = useState('print')

  return (
    <div style={{ padding: 24, fontFamily: FONT }}>
      {/* Header */}
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 22, fontWeight: 700, margin: 0, color: 'var(--text)' }}>Бүтээгдэхүүн</h1>
        <p style={{ color: 'var(--text2)', fontSize: 13, margin: '4px 0 0' }}>Бүх бүтээгдэхүүн, дэлгүүр болон загваруудыг удирдах</p>
      </div>

      {/* Type Tabs */}
      <div style={{ display: 'flex', gap: 0, borderBottom: '1px solid var(--border)', marginBottom: 24 }}>
        {MAIN_TABS.map(tab => (
          <button key={tab.key} onClick={() => setActiveTab(tab.key)} style={{ padding: '12px 24px', background: 'none', border: 'none', borderBottom: activeTab === tab.key ? '2px solid #FF6B00' : '2px solid transparent', cursor: 'pointer', fontFamily: FONT, display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: 2 }}>
            <span style={{ fontSize: 13, fontWeight: activeTab === tab.key ? 700 : 500, color: activeTab === tab.key ? '#FF6B00' : 'var(--text2)' }}>{tab.label}</span>
            <span style={{ fontSize: 11, color: 'var(--text3)' }}>{tab.desc}</span>
          </button>
        ))}
      </div>

      {/* Tab Content */}
      {activeTab === 'print' && <PrintProductsTab />}
      {activeTab === 'shop' && <ShopProductsTab />}
      {activeTab === 'templates' && <TemplatesTab />}
    </div>
  )
}
