'use client'
import { apiFetch, getToken } from '@/lib/api'
import React, { useState, useEffect, useCallback } from 'react'
import ProductMediaUploader from '@/components/ProductMediaUploader'
import { AdminPageHeader } from '@/components/admin/AdminPageHeader'

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
const SKU_PREFIXES: Record<string, string> = {
  'offset': 'OF', 'digital': 'DG', 'stickers': 'ST', 'banners': 'BN',
  'business-cards': 'BC', 'packaging': 'PK', 'book': 'BK', 'promo': 'PM',
  'wide_format': 'WF', 'shop': 'SH',
}

const emptyShop = {
  name_mn: '', name_en: '', category: '', description: '',
  base_price: 0, sale_price: '', discount_pct: '', stock_quantity: '', sku: '', thumbnail_url: '',
  images: [] as string[], video_url: '',
  is_featured: false, is_new: false, is_bestseller: false, is_out_of_stock: false,
  is_flash_deal: false, flash_deal_end: '',
  badge: '' as string,
  compare_specs: '' as string,
}

const BADGE_OPTIONS = [
  { value: '', label: 'Байхгүй' },
  { value: 'NEW', label: '🆕 Шинэ', color: '#10B981' },
  { value: 'HOT', label: '🔥 Хит', color: '#EF4444' },
  { value: 'SALE', label: '🏷️ Хямдрал', color: '#F59E0B' },
  { value: 'FEATURED', label: '⭐ Онцлох', color: '#8B5CF6' },
  { value: 'LIMITED', label: '⏰ Хязгаартай', color: '#3B82F6' },
]

function ShopProductsTab() {
  const [items, setItems] = useState<any[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState<any>(null)
  const [form, setForm] = useState({ ...emptyShop })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [categories, setCategories] = useState<any[]>([])
  const [validation, setValidation] = useState<Record<string, boolean>>({})

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const data = await apiFetch<any>('/admin/shop-products?product_type=ready')
      setItems(data.items || data || [])
      setTotal(data.total || (data.items || data || []).length)
    } catch (e: any) {
      setItems([]); setError('Алдаа: ' + (e.message || ''))
    } finally { setLoading(false) }
  }, [])

  useEffect(() => {
    load()
    apiFetch<any>('/categories', { auth: false }).then(d => { if (Array.isArray(d)) setCategories(d.filter((c: any) => c.is_active)) }).catch(() => {})
  }, [load])

  // Auto-generate SKU when category changes
  const generateSku = (cat: string) => {
    const prefix = SKU_PREFIXES[cat] || cat.slice(0, 2).toUpperCase()
    const existing = items.filter(i => i.category === cat)
    const nextNum = String(existing.length + 1).padStart(3, '0')
    return `${prefix}-${nextNum}`
  }

  // Smart discount: percentage ↔ price sync
  const setDiscountByPrice = (salePrice: string) => {
    const sp = Number(salePrice)
    const bp = Number(form.base_price)
    const pct = bp > 0 && sp > 0 && sp < bp ? Math.round((1 - sp / bp) * 100) : ''
    setForm(f => ({ ...f, sale_price: salePrice, discount_pct: String(pct) }))
  }

  const setDiscountByPct = (pct: string) => {
    const p = Number(pct)
    const bp = Number(form.base_price)
    const sp = bp > 0 && p > 0 && p < 100 ? Math.round(bp * (1 - p / 100)) : ''
    setForm(f => ({ ...f, discount_pct: pct, sale_price: String(sp) }))
  }

  const openCreate = () => {
    setEditing(null); setForm({ ...emptyShop }); setError(''); setValidation({}); setModalOpen(true)
  }
  const openEdit = (item: any) => {
    setEditing(item)
    const bp = Number(item.base_price || 0)
    const sp = Number(item.sale_price || 0)
    const pct = bp > 0 && sp > 0 && sp < bp ? Math.round((1 - sp / bp) * 100) : ''
    setForm({ name_mn: item.name_mn || item.name || '', name_en: item.name || '', category: item.category || '',
      description: item.description || '', base_price: item.base_price || 0,
      sale_price: item.sale_price || '', discount_pct: String(pct),
      stock_quantity: item.stock_quantity || '', sku: item.sku || '', thumbnail_url: item.thumbnail_url || '',
      images: item.images || [], video_url: item.video_url || '',
      is_featured: item.is_featured || false, is_new: item.is_new || false,
      is_bestseller: item.is_bestseller || false, is_out_of_stock: item.is_out_of_stock || false,
      is_flash_deal: item.is_flash_deal || false,
      flash_deal_end: item.flash_deal_end ? new Date(item.flash_deal_end).toISOString().slice(0, 16) : '',
      badge: item.badge || '', compare_specs: item.compare_specs ? JSON.stringify(item.compare_specs, null, 2) : '' })
    setError(''); setValidation({}); setModalOpen(true)
  }
  const closeModal = () => { setModalOpen(false); setEditing(null); setError(''); setValidation({}) }

  const save = async () => {
    const v: Record<string, boolean> = {}
    if (!form.name_mn.trim()) v.name_mn = true
    if (!form.base_price || Number(form.base_price) <= 0) v.base_price = true
    if (!form.category) v.category = true
    if (form.sale_price && Number(form.sale_price) >= Number(form.base_price)) v.sale_price = true
    setValidation(v)
    if (Object.keys(v).length) { setError('Заавал бөглөх талбаруудыг бөглөнө үү'); return }

    setSaving(true); setError('')
    try {
      let specs = null
      try { if (form.compare_specs) specs = JSON.parse(form.compare_specs) } catch {}
      const payload = {
        name: form.name_mn, name_mn: form.name_mn, category: form.category,
        description: form.description, base_price: Number(form.base_price),
        sale_price: form.sale_price ? Number(form.sale_price) : null,
        stock_quantity: form.stock_quantity ? Number(form.stock_quantity) : null,
        sku: form.sku || null,
        thumbnail_url: form.images[0] || form.thumbnail_url || null,
        images: form.images, video_url: form.video_url || null,
        product_type: 'ready',
        is_featured: form.is_featured, is_new: form.is_new,
        is_bestseller: form.is_bestseller, is_out_of_stock: form.is_out_of_stock,
        is_flash_deal: form.is_flash_deal,
        flash_deal_end: form.flash_deal_end ? new Date(form.flash_deal_end).toISOString() : null,
        badge: form.badge || null, compare_specs: specs,
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
    await apiFetch<any>(`/admin/shop-products/${id}`, { method: 'DELETE' }); await load()
  }

  const toggleActive = async (item: any) => {
    await apiFetch<any>(`/admin/shop-products/${item.id}`, { method: 'PATCH', body: { is_active: !item.is_active } }); await load()
  }

  const vBorder = (field: string) => validation[field] ? { ...inp, borderColor: '#EF4444', background: 'rgba(239,68,68,0.03)' } : inp

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, flexWrap: 'wrap', gap: 10 }}>
        <p style={{ color: 'var(--text2)', fontSize: 13, margin: 0 }}>Тогтмол үнэтэй дэлгүүрийн бүтээгдэхүүн — нийт {total}</p>
        <button onClick={openCreate} style={btnPrimary}>+ Нэмэх</button>
      </div>
      {error && !modalOpen && <div style={{ background: 'rgba(239,68,68,0.1)', color: '#EF4444', padding: '10px 14px', borderRadius: 8, marginBottom: 12, fontSize: 13 }}>{error}</div>}
      {loading ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 14 }}>
          {[1,2,3,4,5,6].map(i => <div key={i} style={{ height: 160, background: 'var(--surface2)', borderRadius: 12 }} className="animate-pulse" />)}
        </div>
      ) : items.length === 0 ? (
        <div style={{ textAlign: 'center', padding: 60, color: 'var(--text3)', fontSize: 14 }}>
          <div style={{ fontSize: 32, marginBottom: 12 }}>🛍️</div>Бүтээгдэхүүн олдсонгүй<br /><br />
          <button onClick={openCreate} style={btnPrimary}>+ Эхний бүтээгдэхүүн нэмэх</button>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 14 }}>
          {items.map(item => {
            const sp = Number(item.sale_price || 0)
            const bp = Number(item.base_price || 0)
            const disc = bp > 0 && sp > 0 && sp < bp ? Math.round((1 - sp / bp) * 100) : 0
            return (
              <div key={item.id} style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 12, overflow: 'hidden', opacity: item.is_active === false ? 0.55 : 1 }}>
                {/* Thumbnail */}
                <div style={{ height: 140, background: 'var(--surface2)', position: 'relative', overflow: 'hidden' }}>
                  {item.thumbnail_url ? <img src={item.thumbnail_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> :
                    <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 36 }}>🏷️</div>}
                  <div style={{ position: 'absolute', top: 8, left: 8, display: 'flex', flexDirection: 'column', gap: 3 }}>
                    {disc > 0 && <span style={{ background: '#EF4444', color: '#fff', fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 6 }}>-{disc}%</span>}
                    {item.badge && <span style={{ background: BADGE_OPTIONS.find(b => b.value === item.badge)?.color || '#888', color: '#fff', fontSize: 9, fontWeight: 700, padding: '2px 6px', borderRadius: 6 }}>{BADGE_OPTIONS.find(b => b.value === item.badge)?.label?.replace(/^.\s/, '') || item.badge}</span>}
                    {item.is_featured && !item.badge && <span style={{ background: '#8B5CF6', color: '#fff', fontSize: 9, fontWeight: 700, padding: '2px 6px', borderRadius: 6 }}>Онцлох</span>}
                    {item.is_flash_deal && <span style={{ background: '#8B5CF6', color: '#fff', fontSize: 9, fontWeight: 700, padding: '2px 6px', borderRadius: 6 }}>⚡ Flash</span>}
                    {item.is_out_of_stock && <span style={{ background: '#6B7280', color: '#fff', fontSize: 9, fontWeight: 700, padding: '2px 6px', borderRadius: 6 }}>Дууссан</span>}
                  </div>
                  {item.sku && <span style={{ position: 'absolute', top: 8, right: 8, background: 'rgba(0,0,0,0.5)', color: '#fff', fontSize: 9, fontWeight: 600, padding: '2px 6px', borderRadius: 4, fontFamily: 'monospace' }}>{item.sku}</span>}
                </div>
                <div style={{ padding: '10px 14px' }}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)', marginBottom: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.name_mn || item.name || '—'}</div>
                  <div style={{ fontSize: 11, color: 'var(--text3)', marginBottom: 4 }}>{categories.find(c => c.slug === item.category)?.name_mn || item.category}</div>
                  <div style={{ fontSize: 14, fontWeight: 700, color: '#FF6B00' }}>
                    {item.sale_price ? <><span>₮{sp.toLocaleString()}</span><span style={{ textDecoration: 'line-through', color: 'var(--text3)', marginLeft: 6, fontSize: 11 }}>₮{bp.toLocaleString()}</span></> : <span>₮{bp.toLocaleString()}</span>}
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 8 }}>
                    <button onClick={() => toggleActive(item)} style={{ fontSize: 10, padding: '2px 8px', borderRadius: 99, border: 'none', cursor: 'pointer', fontWeight: 600, fontFamily: FONT, background: item.is_active !== false ? 'rgba(16,185,129,0.1)' : 'rgba(239,68,68,0.1)', color: item.is_active !== false ? '#10B981' : '#EF4444' }}>
                      {item.is_active !== false ? 'Идэвхтэй' : 'Идэвхгүй'}
                    </button>
                    <div style={{ display: 'flex', gap: 4 }}>
                      <button onClick={() => openEdit(item)} style={{ padding: '3px 8px', background: 'rgba(59,130,246,0.1)', color: '#3B82F6', border: 'none', borderRadius: 6, cursor: 'pointer', fontSize: 11, fontFamily: FONT }}>Засах</button>
                      <button onClick={() => deleteItem(item.id)} style={{ padding: '3px 8px', background: 'rgba(239,68,68,0.1)', color: '#EF4444', border: 'none', borderRadius: 6, cursor: 'pointer', fontSize: 11, fontFamily: FONT }}>Устгах</button>
                    </div>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* ═══ PRODUCT MODAL ═══ */}
      {modalOpen && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: 20 }}
          onClick={e => { if (e.target === e.currentTarget) closeModal() }}>
          <div style={{ background: 'var(--surface)', borderRadius: 16, width: '100%', maxWidth: 560, maxHeight: '90vh', display: 'flex', flexDirection: 'column', overflow: 'hidden', border: '1px solid var(--border)' }}>
            {/* Header */}
            <div style={{ padding: '18px 24px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexShrink: 0 }}>
              <h2 style={{ fontSize: 17, fontWeight: 700, margin: 0, color: 'var(--text)' }}>{editing?.id ? 'Бүтээгдэхүүн засах' : 'Шинэ бүтээгдэхүүн'}</h2>
              <button onClick={closeModal} style={{ background: 'none', border: 'none', fontSize: 20, color: 'var(--text3)', cursor: 'pointer' }}>✕</button>
            </div>
            {error && <div style={{ margin: '12px 24px 0', background: 'rgba(239,68,68,0.1)', color: '#EF4444', padding: '8px 12px', borderRadius: 8, fontSize: 13 }}>{error}</div>}

            {/* Scrollable form */}
            <div style={{ padding: 24, overflowY: 'auto', flex: 1, display: 'flex', flexDirection: 'column', gap: 16 }}>
              {/* Name */}
              <div>
                <label style={labelStyle}>Нэр *</label>
                <input value={form.name_mn} onChange={e => setForm({ ...form, name_mn: e.target.value })} style={vBorder('name_mn')} placeholder="Бүтээгдэхүүний нэр" />
              </div>

              {/* Category (dropdown from DB) */}
              <div>
                <label style={labelStyle}>Ангилал *</label>
                <select value={form.category} onChange={e => {
                  const cat = e.target.value
                  const sku = !editing && cat ? generateSku(cat) : form.sku
                  setForm({ ...form, category: cat, sku })
                }} style={vBorder('category')}>
                  <option value="">— Ангилал сонгох —</option>
                  {categories.map(c => <option key={c.id} value={c.slug}>{c.icon} {c.name_mn || c.name}</option>)}
                </select>
              </div>

              {/* Price + Discount */}
              <div>
                <label style={labelStyle}>Үнэ</label>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 80px', gap: 10 }}>
                  <div>
                    <div style={{ fontSize: 11, color: 'var(--text3)', marginBottom: 4 }}>Суурь үнэ (₮) *</div>
                    <input type="number" value={form.base_price} onChange={e => {
                      const bp = Number(e.target.value)
                      setForm(f => ({ ...f, base_price: bp }))
                      // Recalc sale price if pct exists
                      if (form.discount_pct) {
                        const sp = Math.round(bp * (1 - Number(form.discount_pct) / 100))
                        setForm(f => ({ ...f, base_price: bp, sale_price: String(sp > 0 ? sp : '') }))
                      }
                    }} style={vBorder('base_price')} placeholder="0" />
                  </div>
                  <div>
                    <div style={{ fontSize: 11, color: 'var(--text3)', marginBottom: 4 }}>Хямдрал үнэ (₮)</div>
                    <input type="number" value={form.sale_price} onChange={e => setDiscountByPrice(e.target.value)}
                      style={validation.sale_price ? { ...inp, borderColor: '#EF4444' } : inp} placeholder="Заавал биш" />
                  </div>
                  <div>
                    <div style={{ fontSize: 11, color: 'var(--text3)', marginBottom: 4 }}>Хувь %</div>
                    <input type="number" value={form.discount_pct} onChange={e => setDiscountByPct(e.target.value)}
                      style={{ ...inp, textAlign: 'center' as const }} placeholder="%" min={0} max={99} />
                  </div>
                </div>
                {form.sale_price && Number(form.sale_price) > 0 && Number(form.sale_price) < Number(form.base_price) && (
                  <div style={{ fontSize: 11, color: '#10B981', marginTop: 4, fontWeight: 600 }}>
                    ✓ Хэмнэлт: ₮{(Number(form.base_price) - Number(form.sale_price)).toLocaleString()} ({form.discount_pct}%)
                  </div>
                )}
                {validation.sale_price && <div style={{ fontSize: 11, color: '#EF4444', marginTop: 4 }}>Хямдрал үнэ суурь үнээс бага байх ёстой</div>}
              </div>

              {/* Stock + SKU */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div>
                  <label style={labelStyle}>Нөөцийн тоо</label>
                  <input type="number" value={form.stock_quantity} onChange={e => setForm({ ...form, stock_quantity: e.target.value })} style={inp} placeholder="0" />
                </div>
                <div>
                  <label style={labelStyle}>SKU <span style={{ fontSize: 10, color: 'var(--text3)' }}>(автомат)</span></label>
                  <input value={form.sku} onChange={e => setForm({ ...form, sku: e.target.value })} style={{ ...inp, fontFamily: 'monospace', background: form.sku ? 'rgba(16,185,129,0.05)' : 'var(--surface2)' }} placeholder="BC-001" />
                </div>
              </div>

              {/* Description */}
              <div>
                <label style={labelStyle}>Тайлбар</label>
                <textarea value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} style={{ ...inp, minHeight: 70, resize: 'vertical' }} placeholder="Бүтээгдэхүүний дэлгэрэнгүй тайлбар..." />
              </div>

              {/* ═══ BADGES & FLAGS ═══ */}
              <div>
                <label style={labelStyle}>Тэмдэглэгээ & Шошго</label>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 10 }}>
                  {BADGE_OPTIONS.map(b => (
                    <button key={b.value} type="button" onClick={() => setForm({ ...form, badge: form.badge === b.value ? '' : b.value })}
                      style={{ padding: '5px 12px', borderRadius: 8, fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: FONT,
                        border: form.badge === b.value ? `2px solid ${b.color || 'var(--border)'}` : '1px solid var(--border)',
                        background: form.badge === b.value ? (b.color || '#888') + '15' : 'var(--surface2)',
                        color: form.badge === b.value ? (b.color || 'var(--text)') : 'var(--text2)',
                      }}>{b.label}</button>
                  ))}
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                  {[
                    { key: 'is_featured', label: '⭐ Онцлох бараа', desc: 'Нүүр хуудасны онцлох хэсэгт' },
                    { key: 'is_new', label: '🆕 Шинэ бараа', desc: '7 хоногийн дотор нэмэгдсэн' },
                    { key: 'is_bestseller', label: '🔥 Илүү сонголттой', desc: 'Хамгийн эрэлттэй' },
                    { key: 'is_out_of_stock', label: '🚫 Дууссан', desc: 'Нөөц дууссан' },
                    { key: 'is_flash_deal', label: '⚡ Flash Deal', desc: 'Онцгой хямдрал хэсэгт' },
                  ].map(flag => (
                    <label key={flag.key} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 10px', borderRadius: 8, cursor: 'pointer',
                      border: '1px solid var(--border)', background: (form as any)[flag.key] ? 'rgba(255,107,0,0.05)' : 'transparent' }}>
                      <input type="checkbox" checked={(form as any)[flag.key] || false}
                        onChange={e => setForm({ ...form, [flag.key]: e.target.checked })}
                        style={{ accentColor: '#FF6B00', width: 16, height: 16 }} />
                      <div>
                        <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text)' }}>{flag.label}</div>
                        <div style={{ fontSize: 10, color: 'var(--text3)' }}>{flag.desc}</div>
                      </div>
                    </label>
                  ))}
                </div>
              </div>

              {/* Flash deal end date */}
              {form.is_flash_deal && (
                <div>
                  <label style={labelStyle}>⚡ Flash Deal дуусах хугацаа</label>
                  <input type="datetime-local" value={form.flash_deal_end} onChange={e => setForm({ ...form, flash_deal_end: e.target.value })} style={inp} />
                  <div style={{ fontSize: 10, color: 'var(--text3)', marginTop: 4 }}>Хугацаа дуусахад автоматаар Flash Deal-аас хасагдана</div>
                </div>
              )}

              {/* ═══ COMPARE SPECS ═══ */}
              <div>
                <label style={labelStyle}>Харьцуулах шинж чанар <span style={{ fontSize: 10, color: 'var(--text3)' }}>(JSON)</span></label>
                <textarea value={form.compare_specs} onChange={e => setForm({ ...form, compare_specs: e.target.value })}
                  style={{ ...inp, minHeight: 60, resize: 'vertical', fontFamily: 'monospace', fontSize: 12 }}
                  placeholder={'{\n  "Хэмжээ": "A4",\n  "Материал": "250gsm",\n  "Хэвлэл": "2 тал"\n}'} />
                <div style={{ fontSize: 10, color: 'var(--text3)', marginTop: 4 }}>Бүтээгдэхүүн харьцуулах хүснэгтэд энэ мэдээлэл харагдана</div>
              </div>

              {/* Images + Video */}
              <ProductMediaUploader
                images={form.images}
                videoUrl={form.video_url}
                token={getToken() || ''}
                onChange={(imgs, vid) => setForm(f => ({ ...f, images: imgs, thumbnail_url: imgs[0] || f.thumbnail_url, video_url: vid }))}
              />
            </div>

            {/* Fixed bottom actions */}
            <div style={{ padding: '14px 24px', borderTop: '1px solid var(--border)', display: 'flex', justifyContent: 'flex-end', gap: 10, flexShrink: 0, background: 'var(--surface)' }}>
              <button onClick={closeModal} style={btnSecondary}>Цуцлах</button>
              <button onClick={save} disabled={saving} style={{ ...btnPrimary, opacity: saving ? 0.6 : 1 }}>{saving ? 'Хадгалж байна...' : 'Хадгалах'}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// ─── SIGNAGE PRODUCTS TAB (Хаяг самбар) ──────────────────────────────────────
function SignageProductsTab() {
  const [items, setItems] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState<any>(null)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [form, setForm] = useState({
    name_mn: '', description: '', category: 'signage', thumbnail_url: '', images: [] as string[],
    pricing_mode: 'formula', order_flow: 'site_survey', requires_dimensions: true, requires_quote_approval: true,
    price_formula: { type: 'area_based', price_per_m2: 0, min_area_m2: 0.25, options: {} as Record<string, { type: string; price: number }> },
    badge: '', is_featured: false, is_new: false, video_url: '',
  })
  const [newOptionKey, setNewOptionKey] = useState('')

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const data = await apiFetch<any>('/admin/shop-products?product_type=signage')
      setItems(data.items || data || [])
    } catch { setItems([]) } finally { setLoading(false) }
  }, [])

  useEffect(() => { load() }, [load])

  const save = async () => {
    if (!form.name_mn.trim()) { setError('Нэр оруулна уу'); return }
    setSaving(true); setError('')
    try {
      const payload = {
        name: form.name_mn, name_mn: form.name_mn, category: 'signage',
        description: form.description, product_type: 'signage',
        pricing_mode: 'formula', order_flow: 'site_survey',
        requires_dimensions: true, requires_quote_approval: true,
        price_formula: form.price_formula,
        base_price: form.price_formula.price_per_m2 || 0,
        thumbnail_url: form.images[0] || form.thumbnail_url || null,
        images: form.images, video_url: form.video_url || null,
        badge: form.badge || null, is_featured: form.is_featured, is_new: form.is_new,
      }
      if (editing?.id) await apiFetch(`/admin/shop-products/${editing.id}`, { method: 'PATCH', body: payload })
      else await apiFetch('/admin/shop-products', { method: 'POST', body: payload })
      await load(); setModalOpen(false); setEditing(null)
    } catch (e: any) { setError(e.message || 'Алдаа') } finally { setSaving(false) }
  }

  const editItem = (item: any) => {
    setEditing(item)
    setForm({
      name_mn: item.name_mn || item.name || '', description: item.description || '',
      category: 'signage', thumbnail_url: item.thumbnail_url || '', images: item.images || [],
      pricing_mode: 'formula', order_flow: 'site_survey', requires_dimensions: true, requires_quote_approval: true,
      price_formula: item.price_formula || { type: 'area_based', price_per_m2: 0, min_area_m2: 0.25, options: {} },
      badge: item.badge || '', is_featured: item.is_featured || false, is_new: item.is_new || false, video_url: item.video_url || '',
    })
    setModalOpen(true)
  }

  const pf = form.price_formula

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <p style={{ color: 'var(--text2)', fontSize: 13, margin: 0 }}>Гадна/дотор хаяг реклам, самбар — М² тооцоолол, суурилуулалт</p>
        <button onClick={() => { setEditing(null); setForm({ name_mn: '', description: '', category: 'signage', thumbnail_url: '', images: [], pricing_mode: 'formula', order_flow: 'site_survey', requires_dimensions: true, requires_quote_approval: true, price_formula: { type: 'area_based', price_per_m2: 0, min_area_m2: 0.25, options: {} }, badge: '', is_featured: false, is_new: false, video_url: '' }); setModalOpen(true) }} style={btnPrimary}>+ Шинэ самбар</button>
      </div>

      {loading ? <div style={{ textAlign: 'center', padding: 40, color: 'var(--text3)' }}>Уншиж байна...</div> :
      items.length === 0 ? (
        <div style={{ textAlign: 'center', padding: 60, color: 'var(--text3)' }}>
          <div style={{ fontSize: 40, marginBottom: 12 }}>🪧</div>
          <p>Хаяг самбар бүтээгдэхүүн бүртгэгдээгүй</p>
          <button onClick={() => setModalOpen(true)} style={btnPrimary}>+ Эхний бүтээгдэхүүн нэмэх</button>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 14 }}>
          {items.map(item => {
            const pf = item.price_formula || {}
            return (
              <div key={item.id} style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 12, padding: 16 }}>
                <div style={{ display: 'flex', gap: 10 }}>
                  {item.thumbnail_url ? <img src={item.thumbnail_url} alt="" style={{ width: 60, height: 60, objectFit: 'cover', borderRadius: 8 }} /> :
                    <div style={{ width: 60, height: 60, borderRadius: 8, background: 'var(--surface2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24 }}>🪧</div>}
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 600, fontSize: 14, color: 'var(--text)' }}>{item.name_mn || item.name}</div>
                    <div style={{ fontSize: 12, color: '#FF6B00', fontWeight: 700, marginTop: 2 }}>₮{Number(pf.price_per_m2 || item.base_price || 0).toLocaleString()} / м²</div>
                    {pf.options && Object.keys(pf.options).length > 0 && (
                      <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', marginTop: 4 }}>
                        {Object.keys(pf.options).map(k => <span key={k} style={{ fontSize: 10, padding: '1px 6px', borderRadius: 4, background: 'var(--surface2)', color: 'var(--text3)' }}>{k}</span>)}
                      </div>
                    )}
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 6, marginTop: 10 }}>
                  <button onClick={() => editItem(item)} style={{ flex: 1, padding: '6px', background: 'rgba(59,130,246,0.1)', color: '#3B82F6', border: 'none', borderRadius: 6, cursor: 'pointer', fontSize: 12, fontFamily: FONT }}>Засах</button>
                  <button onClick={async () => { if (!confirm('Устгах уу?')) return; await apiFetch(`/admin/shop-products/${item.id}`, { method: 'DELETE' }); load() }} style={{ padding: '6px 10px', background: 'rgba(239,68,68,0.1)', color: '#EF4444', border: 'none', borderRadius: 6, cursor: 'pointer', fontSize: 12, fontFamily: FONT }}>Устгах</button>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Modal */}
      {modalOpen && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: 20 }} onClick={e => { if (e.target === e.currentTarget) setModalOpen(false) }}>
          <div style={{ background: 'var(--surface)', borderRadius: 16, width: '100%', maxWidth: 600, maxHeight: '90vh', display: 'flex', flexDirection: 'column', overflow: 'hidden', border: '1px solid var(--border)' }}>
            <div style={{ padding: '18px 24px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h2 style={{ fontSize: 17, fontWeight: 700, margin: 0 }}>🪧 {editing?.id ? 'Самбар засах' : 'Шинэ хаяг самбар'}</h2>
              <button onClick={() => setModalOpen(false)} style={{ background: 'none', border: 'none', fontSize: 20, color: 'var(--text3)', cursor: 'pointer' }}>✕</button>
            </div>
            {error && <div style={{ margin: '12px 24px 0', background: 'rgba(239,68,68,0.1)', color: '#EF4444', padding: '8px 12px', borderRadius: 8, fontSize: 13 }}>{error}</div>}
            <div style={{ padding: 24, overflowY: 'auto', flex: 1, display: 'flex', flexDirection: 'column', gap: 16 }}>
              {/* Name */}
              <div><label style={labelStyle}>Нэр *</label><input value={form.name_mn} onChange={e => setForm({ ...form, name_mn: e.target.value })} style={inp} placeholder="3D нерж үсэг, Лайтбокс..." /></div>
              <div><label style={labelStyle}>Тайлбар</label><textarea value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} style={{ ...inp, minHeight: 60, resize: 'vertical' }} /></div>

              {/* Price Formula */}
              <div style={{ background: 'var(--surface2)', border: '1px solid var(--border)', borderRadius: 12, padding: 16 }}>
                <h3 style={{ fontSize: 14, fontWeight: 700, margin: '0 0 12px', color: 'var(--text)' }}>💰 Үнийн тооцоолол (М²)</h3>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  <div><label style={labelStyle}>М²-ын үнэ (₮) *</label><input type="number" value={pf.price_per_m2} onChange={e => setForm({ ...form, price_formula: { ...pf, price_per_m2: +e.target.value } })} style={inp} placeholder="280000" /></div>
                  <div><label style={labelStyle}>Мин. талбай (м²)</label><input type="number" value={pf.min_area_m2} onChange={e => setForm({ ...form, price_formula: { ...pf, min_area_m2: +e.target.value } })} style={inp} placeholder="0.25" step="0.01" /></div>
                </div>
                <div style={{ fontSize: 11, color: 'var(--text3)', marginTop: 8 }}>Томьёо: (Өргөн × Өндөр ÷ 1,000,000) × М² үнэ + Нэмэлт сонголтууд</div>
              </div>

              {/* Dynamic Options */}
              <div style={{ background: 'var(--surface2)', border: '1px solid var(--border)', borderRadius: 12, padding: 16 }}>
                <h3 style={{ fontSize: 14, fontWeight: 700, margin: '0 0 12px', color: 'var(--text)' }}>⚙️ Нэмэлт сонголтууд (Үнэд нөлөөлөх)</h3>
                {Object.entries(pf.options || {}).map(([key, opt]) => (
                  <div key={key} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8, padding: '8px 10px', background: 'var(--surface)', borderRadius: 8, border: '1px solid var(--border)' }}>
                    <span style={{ fontSize: 13, fontWeight: 600, flex: 1, color: 'var(--text)' }}>{key}</span>
                    <select value={(opt as any).type} onChange={e => setForm({ ...form, price_formula: { ...pf, options: { ...pf.options, [key]: { ...(opt as any), type: e.target.value } } } })} style={{ ...inp, width: 120 }}>
                      <option value="FIXED">Тогтмол (₮)</option>
                      <option value="PER_M2">М²-д (₮)</option>
                    </select>
                    <input type="number" value={(opt as any).price} onChange={e => setForm({ ...form, price_formula: { ...pf, options: { ...pf.options, [key]: { ...(opt as any), price: +e.target.value } } } })} style={{ ...inp, width: 100 }} placeholder="₮" />
                    <button onClick={() => { const next = { ...pf.options }; delete next[key]; setForm({ ...form, price_formula: { ...pf, options: next } }) }} style={{ background: 'none', border: 'none', color: '#EF4444', cursor: 'pointer', fontSize: 16 }}>✕</button>
                  </div>
                ))}
                <div style={{ display: 'flex', gap: 8, marginTop: 4 }}>
                  <input value={newOptionKey} onChange={e => setNewOptionKey(e.target.value)} style={{ ...inp, flex: 1 }} placeholder="Гэрэлтүүлэг, Төмөр рам, Суурилуулалт..." />
                  <button onClick={() => { if (!newOptionKey.trim()) return; setForm({ ...form, price_formula: { ...pf, options: { ...pf.options, [newOptionKey.trim()]: { type: 'FIXED', price: 0 } } } }); setNewOptionKey('') }} style={{ ...btnPrimary, padding: '8px 14px', fontSize: 12 }}>+ Нэмэх</button>
                </div>
              </div>

              {/* Images */}
              <ProductMediaUploader images={form.images} videoUrl={form.video_url} token={getToken() || ''}
                onChange={(imgs, vid) => setForm(f => ({ ...f, images: imgs, thumbnail_url: imgs[0] || f.thumbnail_url, video_url: vid }))} />
            </div>
            <div style={{ padding: '14px 24px', borderTop: '1px solid var(--border)', display: 'flex', justifyContent: 'flex-end', gap: 10, background: 'var(--surface)' }}>
              <button onClick={() => setModalOpen(false)} style={btnSecondary}>Цуцлах</button>
              <button onClick={save} disabled={saving} style={{ ...btnPrimary, opacity: saving ? 0.6 : 1 }}>{saving ? '...' : 'Хадгалах'}</button>
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
  { key: 'shop', label: '🛍️ Дэлгүүр', desc: 'Бэлэн бүтээгдэхүүн · Тогтмол үнэ' },
  { key: 'print', label: '🖨️ Хэвлэмэл', desc: 'Файл хавсаргах · Тооцоолол' },
  { key: 'signage', label: '🪧 Хаяг самбар', desc: 'М² тооцоолол · Суурилуулалт' },
  { key: 'templates', label: '🎨 Дизайн загвар', desc: 'Загвар · Дижитал' },
]

export default function AdminProductsPage() {
  const [activeTab, setActiveTab] = useState('shop')

  return (
    <div className="p-4 md:p-6">
      <AdminPageHeader title="Бүтээгдэхүүн" description="Бүх бүтээгдэхүүн, дэлгүүр болон загваруудыг удирдах" />

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
      {activeTab === 'shop' && <ShopProductsTab />}
      {activeTab === 'print' && <PrintProductsTab />}
      {activeTab === 'signage' && <SignageProductsTab />}
      {activeTab === 'templates' && <TemplatesTab />}
    </div>
  )
}
