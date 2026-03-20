'use client'
import { useState, useEffect, useCallback } from 'react'

const API = 'http://localhost:4000'
const getHeaders = () => ({
  'Content-Type': 'application/json',
  Authorization: `Bearer ${localStorage.getItem('token')}`,
})

const CATEGORIES = [
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

const categoryLabel = (val: string) => CATEGORIES.find(c => c.value === val)?.label || val
const categoryColor = (val: string) => {
  switch (val) {
    case 'HADAG_REKLAM': return { bg: 'rgba(59,130,246,0.1)', color: '#3B82F6' }
    case 'KHEVLEL': return { bg: 'rgba(139,92,246,0.1)', color: '#8B5CF6' }
    case 'PROMO': return { bg: 'rgba(245,158,11,0.1)', color: '#F59E0B' }
    case 'AWARD': return { bg: 'rgba(16,185,129,0.1)', color: '#10B981' }
    default: return { bg: 'rgba(107,114,128,0.1)', color: '#6B7280' }
  }
}

const FONT = "'DM Sans','Segoe UI',system-ui,sans-serif"

const emptyProduct = {
  name_mn: '',
  name_en: '',
  code: '',
  category: 'HADAG_REKLAM',
  subcategory: '',
  unit_type: 'PIECE',
  description: '',
  thumbnail_url: '',
}

const emptyMaterial = {
  material_code: '',
  material_name_mn: '',
  unit: '',
  base_cost: 0,
  display_name: '',
  is_default: false,
}

const emptySize = {
  size_code: '',
  size_label: '',
  width_mm: 0,
  height_mm: 0,
  base_price: 0,
  is_custom: false,
}

export default function AdminProductsPage() {
  const [items, setItems] = useState<any[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('')
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState<any>(null)
  const [form, setForm] = useState({ ...emptyProduct })
  const [activeTab, setActiveTab] = useState(0)

  // Materials & sizes for the product being edited
  const [materials, setMaterials] = useState<any[]>([])
  const [sizes, setSizes] = useState<any[]>([])
  const [materialForm, setMaterialForm] = useState({ ...emptyMaterial })
  const [sizeForm, setSizeForm] = useState({ ...emptySize })
  const [editingMaterial, setEditingMaterial] = useState<any>(null)
  const [editingSize, setEditingSize] = useState<any>(null)

  // Finishings & addons (reference)
  const [finishings, setFinishings] = useState<any[]>([])
  const [addons, setAddons] = useState<any[]>([])

  const [saving, setSaving] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (search) params.set('search', search)
      if (categoryFilter) params.set('category', categoryFilter)
      const res = await fetch(`${API}/admin/products-master?${params}`, { headers: getHeaders() })
      const data = await res.json()
      setItems(data.items || [])
      setTotal(data.total || 0)
    } catch {
      setItems([])
    } finally {
      setLoading(false)
    }
  }, [search, categoryFilter])

  useEffect(() => { load() }, [load])

  const loadFinishingsAndAddons = async () => {
    try {
      const [fRes, aRes] = await Promise.all([
        fetch(`${API}/admin/products-master/finishings/all`, { headers: getHeaders() }),
        fetch(`${API}/admin/products-master/addons/all`, { headers: getHeaders() }),
      ])
      setFinishings(await fRes.json())
      setAddons(await aRes.json())
    } catch {
      setFinishings([])
      setAddons([])
    }
  }

  const openCreate = () => {
    setEditing(null)
    setForm({ ...emptyProduct })
    setMaterials([])
    setSizes([])
    setMaterialForm({ ...emptyMaterial })
    setSizeForm({ ...emptySize })
    setEditingMaterial(null)
    setEditingSize(null)
    setActiveTab(0)
    setModalOpen(true)
    loadFinishingsAndAddons()
  }

  const openEdit = (item: any) => {
    setEditing(item)
    setForm({
      name_mn: item.name_mn || '',
      name_en: item.name_en || '',
      code: item.code || '',
      category: item.category || 'HADAG_REKLAM',
      subcategory: item.subcategory || '',
      unit_type: item.unit_type || 'PIECE',
      description: item.description || '',
      thumbnail_url: item.thumbnail_url || '',
    })
    setMaterials(item.materials || [])
    setSizes(item.sizes || [])
    setMaterialForm({ ...emptyMaterial })
    setSizeForm({ ...emptySize })
    setEditingMaterial(null)
    setEditingSize(null)
    setActiveTab(0)
    setModalOpen(true)
    loadFinishingsAndAddons()
  }

  const closeModal = () => {
    setModalOpen(false)
    setEditing(null)
  }

  const saveProduct = async () => {
    setSaving(true)
    try {
      if (editing?.id) {
        await fetch(`${API}/admin/products-master/${editing.id}`, {
          method: 'PUT',
          headers: getHeaders(),
          body: JSON.stringify(form),
        })
      } else {
        const res = await fetch(`${API}/admin/products-master`, {
          method: 'POST',
          headers: getHeaders(),
          body: JSON.stringify(form),
        })
        const created = await res.json()
        setEditing(created)
      }
      await load()
    } catch { /* */ } finally {
      setSaving(false)
    }
  }

  const toggleActive = async (item: any) => {
    try {
      if (item.is_active) {
        await fetch(`${API}/admin/products-master/${item.id}`, { method: 'DELETE', headers: getHeaders() })
      } else {
        await fetch(`${API}/admin/products-master/${item.id}`, {
          method: 'PUT',
          headers: getHeaders(),
          body: JSON.stringify({ is_active: true }),
        })
      }
      await load()
    } catch { /* */ }
  }

  const deactivate = async (id: string) => {
    if (!confirm('Идэвхгүй болгох уу?')) return
    await fetch(`${API}/admin/products-master/${id}`, { method: 'DELETE', headers: getHeaders() })
    await load()
  }

  // Material CRUD
  const saveMaterial = async () => {
    if (!editing?.id) return
    setSaving(true)
    try {
      if (editingMaterial?.id) {
        const res = await fetch(`${API}/admin/products-master/materials/${editingMaterial.id}`, {
          method: 'PUT',
          headers: getHeaders(),
          body: JSON.stringify(materialForm),
        })
        const updated = await res.json()
        setMaterials(prev => prev.map(m => m.id === updated.id ? updated : m))
      } else {
        const res = await fetch(`${API}/admin/products-master/${editing.id}/materials`, {
          method: 'POST',
          headers: getHeaders(),
          body: JSON.stringify(materialForm),
        })
        const created = await res.json()
        setMaterials(prev => [...prev, created])
      }
      setMaterialForm({ ...emptyMaterial })
      setEditingMaterial(null)
    } catch { /* */ } finally {
      setSaving(false)
    }
  }

  // Size CRUD
  const saveSize = async () => {
    if (!editing?.id) return
    setSaving(true)
    try {
      if (editingSize?.id) {
        const res = await fetch(`${API}/admin/products-master/sizes/${editingSize.id}`, {
          method: 'PUT',
          headers: getHeaders(),
          body: JSON.stringify(sizeForm),
        })
        const updated = await res.json()
        setSizes(prev => prev.map(s => s.id === updated.id ? updated : s))
      } else {
        const res = await fetch(`${API}/admin/products-master/${editing.id}/sizes`, {
          method: 'POST',
          headers: getHeaders(),
          body: JSON.stringify(sizeForm),
        })
        const created = await res.json()
        setSizes(prev => [...prev, created])
      }
      setSizeForm({ ...emptySize })
      setEditingSize(null)
    } catch { /* */ } finally {
      setSaving(false)
    }
  }

  // Styles
  const inp: React.CSSProperties = {
    width: '100%',
    padding: '10px 14px',
    background: 'var(--surface2)',
    border: '1px solid var(--border)',
    borderRadius: 8,
    fontSize: 13,
    color: 'var(--text)',
    outline: 'none',
    fontFamily: FONT,
  }

  const btnPrimary: React.CSSProperties = {
    padding: '10px 22px',
    background: '#FF6B00',
    color: '#fff',
    border: 'none',
    borderRadius: 8,
    cursor: 'pointer',
    fontSize: 13,
    fontWeight: 600,
    fontFamily: FONT,
  }

  const btnSecondary: React.CSSProperties = {
    padding: '10px 22px',
    background: 'var(--surface2)',
    color: 'var(--text2)',
    border: '1px solid var(--border)',
    borderRadius: 8,
    cursor: 'pointer',
    fontSize: 13,
    fontFamily: FONT,
  }

  const btnDanger: React.CSSProperties = {
    padding: '6px 14px',
    background: 'rgba(239,68,68,0.1)',
    color: '#EF4444',
    border: 'none',
    borderRadius: 6,
    cursor: 'pointer',
    fontSize: 12,
    fontFamily: FONT,
  }

  const btnSuccess: React.CSSProperties = {
    padding: '6px 14px',
    background: 'rgba(16,185,129,0.1)',
    color: '#10B981',
    border: 'none',
    borderRadius: 6,
    cursor: 'pointer',
    fontSize: 12,
    fontFamily: FONT,
  }

  const btnSmallPrimary: React.CSSProperties = {
    padding: '8px 16px',
    background: '#FF6B00',
    color: '#fff',
    border: 'none',
    borderRadius: 6,
    cursor: 'pointer',
    fontSize: 12,
    fontWeight: 600,
    fontFamily: FONT,
  }

  const labelStyle: React.CSSProperties = {
    fontSize: 12,
    color: 'var(--text2)',
    marginBottom: 6,
    display: 'block',
    fontWeight: 500,
  }

  const thStyle: React.CSSProperties = {
    padding: '10px 14px',
    textAlign: 'left',
    color: 'var(--text2)',
    fontWeight: 500,
    fontSize: 12,
    borderBottom: '1px solid var(--border)',
  }

  const tdStyle: React.CSSProperties = {
    padding: '10px 14px',
    fontSize: 13,
    borderBottom: '1px solid var(--border)',
  }

  const tabStyle = (active: boolean): React.CSSProperties => ({
    padding: '10px 20px',
    fontSize: 13,
    fontWeight: active ? 600 : 400,
    color: active ? '#FF6B00' : 'var(--text2)',
    background: 'none',
    border: 'none',
    borderBottom: active ? '2px solid #FF6B00' : '2px solid transparent',
    cursor: 'pointer',
    fontFamily: FONT,
  })

  const tabs = ['Үндсэн мэдээлэл', 'Материал', 'Хэмжээ / Үнэ', 'Finishing & Addon']

  const filteredItems = items

  return (
    <div style={{ padding: 24, fontFamily: FONT }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24, flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 700, margin: 0, color: 'var(--text)' }}>Бүтээгдэхүүн</h1>
          <p style={{ color: 'var(--text2)', fontSize: 13, margin: '4px 0 0' }}>Нийт {total} бүтээгдэхүүн</p>
        </div>
        <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Хайх..."
            style={{ ...inp, width: 220 }}
          />
          <select
            value={categoryFilter}
            onChange={e => setCategoryFilter(e.target.value)}
            style={{ ...inp, width: 160, cursor: 'pointer' }}
          >
            <option value="">Бүх ангилал</option>
            {CATEGORIES.map(c => (
              <option key={c.value} value={c.value}>{c.label}</option>
            ))}
          </select>
          <button onClick={openCreate} style={btnPrimary}>+ Бүтээгдэхүүн нэмэх</button>
        </div>
      </div>

      {/* Product Grid */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: 60, color: 'var(--text2)', fontSize: 14 }}>Уншиж байна...</div>
      ) : filteredItems.length === 0 ? (
        <div style={{ textAlign: 'center', padding: 60, color: 'var(--text3)', fontSize: 14 }}>Бүтээгдэхүүн олдсонгүй</div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 16 }}>
          {filteredItems.map(item => {
            const catCol = categoryColor(item.category)
            return (
              <div
                key={item.id}
                style={{
                  background: 'var(--surface)',
                  border: '1px solid var(--border)',
                  borderRadius: 14,
                  padding: 20,
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 12,
                  opacity: item.is_active === false ? 0.6 : 1,
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 15, fontWeight: 600, color: 'var(--text)', marginBottom: 4 }}>{item.name_mn || item.name_en || '—'}</div>
                    {item.code && <div style={{ fontSize: 11, color: 'var(--text3)', fontFamily: 'monospace' }}>{item.code}</div>}
                  </div>
                  {item.thumbnail_url && (
                    <img
                      src={item.thumbnail_url}
                      alt=""
                      style={{ width: 48, height: 48, borderRadius: 8, objectFit: 'cover', marginLeft: 12 }}
                    />
                  )}
                </div>

                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
                  <span style={{
                    fontSize: 11,
                    padding: '3px 10px',
                    borderRadius: 99,
                    background: catCol.bg,
                    color: catCol.color,
                    fontWeight: 600,
                  }}>
                    {categoryLabel(item.category)}
                  </span>
                  <span style={{ fontSize: 11, color: 'var(--text3)' }}>
                    {(item.materials?.length || 0)} материал
                  </span>
                  <span style={{ fontSize: 11, color: 'var(--text3)' }}>
                    {(item.sizes?.length || 0)} хэмжээ
                  </span>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 'auto' }}>
                  {/* Toggle */}
                  <button
                    onClick={() => toggleActive(item)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 6,
                      padding: '4px 10px',
                      borderRadius: 99,
                      border: 'none',
                      cursor: 'pointer',
                      fontSize: 11,
                      fontWeight: 600,
                      background: item.is_active !== false ? 'rgba(16,185,129,0.1)' : 'rgba(239,68,68,0.1)',
                      color: item.is_active !== false ? '#10B981' : '#EF4444',
                      fontFamily: FONT,
                    }}
                  >
                    <span style={{
                      width: 8,
                      height: 8,
                      borderRadius: '50%',
                      background: item.is_active !== false ? '#10B981' : '#EF4444',
                    }} />
                    {item.is_active !== false ? 'Идэвхтэй' : 'Идэвхгүй'}
                  </button>

                  <div style={{ display: 'flex', gap: 6 }}>
                    <button onClick={() => openEdit(item)} style={{
                      padding: '6px 14px',
                      background: 'rgba(59,130,246,0.1)',
                      color: '#3B82F6',
                      border: 'none',
                      borderRadius: 6,
                      cursor: 'pointer',
                      fontSize: 12,
                      fontFamily: FONT,
                    }}>Засах</button>
                    <button onClick={() => deactivate(item.id)} style={btnDanger}>Устгах</button>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Modal Overlay */}
      {modalOpen && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            padding: 20,
          }}
          onClick={e => { if (e.target === e.currentTarget) closeModal() }}
        >
          <div
            style={{
              background: 'var(--surface)',
              borderRadius: 16,
              width: '100%',
              maxWidth: 780,
              maxHeight: '90vh',
              display: 'flex',
              flexDirection: 'column',
              overflow: 'hidden',
              border: '1px solid var(--border)',
            }}
          >
            {/* Modal Header */}
            <div style={{
              padding: '20px 24px',
              borderBottom: '1px solid var(--border)',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}>
              <h2 style={{ fontSize: 18, fontWeight: 700, margin: 0, color: 'var(--text)' }}>
                {editing?.id ? 'Бүтээгдэхүүн засах' : 'Бүтээгдэхүүн нэмэх'}
              </h2>
              <button
                onClick={closeModal}
                style={{ background: 'none', border: 'none', fontSize: 20, color: 'var(--text3)', cursor: 'pointer', padding: 4 }}
              >
                ✕
              </button>
            </div>

            {/* Tabs */}
            <div style={{ display: 'flex', borderBottom: '1px solid var(--border)', paddingLeft: 24 }}>
              {tabs.map((t, i) => (
                <button
                  key={t}
                  onClick={() => setActiveTab(i)}
                  style={tabStyle(activeTab === i)}
                  disabled={i > 0 && !editing?.id}
                  title={i > 0 && !editing?.id ? 'Эхлээд бүтээгдэхүүнийг хадгална уу' : undefined}
                >
                  {t}
                </button>
              ))}
            </div>

            {/* Tab Content */}
            <div style={{ padding: 24, overflowY: 'auto', flex: 1 }}>
              {/* Tab 1: Basic Info */}
              {activeTab === 0 && (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                  <div>
                    <label style={labelStyle}>Нэр (МН) *</label>
                    <input value={form.name_mn} onChange={e => setForm({ ...form, name_mn: e.target.value })} style={inp} placeholder="Визит карт" />
                  </div>
                  <div>
                    <label style={labelStyle}>Нэр (EN)</label>
                    <input value={form.name_en} onChange={e => setForm({ ...form, name_en: e.target.value })} style={inp} placeholder="Business Card" />
                  </div>
                  <div>
                    <label style={labelStyle}>Код *</label>
                    <input value={form.code} onChange={e => setForm({ ...form, code: e.target.value })} style={inp} placeholder="BC-001" />
                  </div>
                  <div>
                    <label style={labelStyle}>Ангилал</label>
                    <select value={form.category} onChange={e => setForm({ ...form, category: e.target.value })} style={{ ...inp, cursor: 'pointer' }}>
                      {CATEGORIES.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
                    </select>
                  </div>
                  <div>
                    <label style={labelStyle}>Дэд ангилал</label>
                    <input value={form.subcategory} onChange={e => setForm({ ...form, subcategory: e.target.value })} style={inp} placeholder="Дэд ангилал" />
                  </div>
                  <div>
                    <label style={labelStyle}>Хэмжих нэгж</label>
                    <select value={form.unit_type} onChange={e => setForm({ ...form, unit_type: e.target.value })} style={{ ...inp, cursor: 'pointer' }}>
                      {UNIT_TYPES.map(u => <option key={u.value} value={u.value}>{u.label}</option>)}
                    </select>
                  </div>
                  <div>
                    <label style={labelStyle}>Зургийн URL</label>
                    <input value={form.thumbnail_url} onChange={e => setForm({ ...form, thumbnail_url: e.target.value })} style={inp} placeholder="https://..." />
                  </div>
                  <div style={{ gridColumn: 'span 2' }}>
                    <label style={labelStyle}>Тайлбар</label>
                    <textarea
                      value={form.description}
                      onChange={e => setForm({ ...form, description: e.target.value })}
                      style={{ ...inp, minHeight: 80, resize: 'vertical' }}
                      placeholder="Бүтээгдэхүүний тайлбар..."
                    />
                  </div>
                </div>
              )}

              {/* Tab 2: Materials */}
              {activeTab === 1 && (
                <div>
                  <div style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                      <thead>
                        <tr style={{ background: 'var(--surface2)' }}>
                          <th style={thStyle}>Код</th>
                          <th style={thStyle}>Нэр</th>
                          <th style={thStyle}>Нэгж</th>
                          <th style={thStyle}>Өртөг</th>
                          <th style={thStyle}>Харуулах нэр</th>
                          <th style={thStyle}>Үндсэн</th>
                          <th style={{ ...thStyle, width: 100 }}>Үйлдэл</th>
                        </tr>
                      </thead>
                      <tbody>
                        {materials.map(m => (
                          <tr key={m.id}>
                            <td style={tdStyle}><span style={{ fontFamily: 'monospace', fontSize: 12 }}>{m.material_code}</span></td>
                            <td style={tdStyle}>{m.material_name_mn}</td>
                            <td style={tdStyle}>{m.unit}</td>
                            <td style={tdStyle}>₮{Number(m.base_cost || 0).toLocaleString()}</td>
                            <td style={tdStyle}>{m.display_name || '—'}</td>
                            <td style={tdStyle}>
                              {m.is_default ? (
                                <span style={{ color: '#10B981', fontWeight: 600, fontSize: 12 }}>Тийм</span>
                              ) : (
                                <span style={{ color: 'var(--text3)', fontSize: 12 }}>Үгүй</span>
                              )}
                            </td>
                            <td style={tdStyle}>
                              <button
                                onClick={() => {
                                  setEditingMaterial(m)
                                  setMaterialForm({
                                    material_code: m.material_code || '',
                                    material_name_mn: m.material_name_mn || '',
                                    unit: m.unit || '',
                                    base_cost: m.base_cost || 0,
                                    display_name: m.display_name || '',
                                    is_default: m.is_default || false,
                                  })
                                }}
                                style={{ padding: '4px 10px', background: 'rgba(59,130,246,0.1)', color: '#3B82F6', border: 'none', borderRadius: 4, cursor: 'pointer', fontSize: 11, fontFamily: FONT }}
                              >
                                Засах
                              </button>
                            </td>
                          </tr>
                        ))}
                        {materials.length === 0 && (
                          <tr>
                            <td colSpan={7} style={{ ...tdStyle, textAlign: 'center', color: 'var(--text3)', padding: 24 }}>
                              Материал байхгүй
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>

                  {/* Material form */}
                  <div style={{
                    marginTop: 16,
                    padding: 16,
                    background: 'var(--surface2)',
                    borderRadius: 10,
                    border: '1px solid var(--border)',
                  }}>
                    <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 12, color: 'var(--text)' }}>
                      {editingMaterial ? 'Материал засах' : 'Материал нэмэх'}
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10 }}>
                      <div>
                        <label style={labelStyle}>Код</label>
                        <input value={materialForm.material_code} onChange={e => setMaterialForm({ ...materialForm, material_code: e.target.value })} style={inp} placeholder="MAT-001" />
                      </div>
                      <div>
                        <label style={labelStyle}>Нэр (МН)</label>
                        <input value={materialForm.material_name_mn} onChange={e => setMaterialForm({ ...materialForm, material_name_mn: e.target.value })} style={inp} placeholder="Винил" />
                      </div>
                      <div>
                        <label style={labelStyle}>Нэгж</label>
                        <input value={materialForm.unit} onChange={e => setMaterialForm({ ...materialForm, unit: e.target.value })} style={inp} placeholder="м²" />
                      </div>
                      <div>
                        <label style={labelStyle}>Өртөг</label>
                        <input type="number" value={materialForm.base_cost} onChange={e => setMaterialForm({ ...materialForm, base_cost: +e.target.value })} style={inp} />
                      </div>
                      <div>
                        <label style={labelStyle}>Харуулах нэр</label>
                        <input value={materialForm.display_name} onChange={e => setMaterialForm({ ...materialForm, display_name: e.target.value })} style={inp} placeholder="Стандарт винил" />
                      </div>
                      <div style={{ display: 'flex', alignItems: 'flex-end', paddingBottom: 2 }}>
                        <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, cursor: 'pointer' }}>
                          <input type="checkbox" checked={materialForm.is_default} onChange={e => setMaterialForm({ ...materialForm, is_default: e.target.checked })} />
                          Үндсэн материал
                        </label>
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
                      <button onClick={saveMaterial} disabled={saving} style={btnSmallPrimary}>
                        {saving ? '...' : editingMaterial ? 'Шинэчлэх' : 'Материал нэмэх'}
                      </button>
                      {editingMaterial && (
                        <button
                          onClick={() => { setEditingMaterial(null); setMaterialForm({ ...emptyMaterial }) }}
                          style={{ ...btnSecondary, padding: '8px 16px', fontSize: 12 }}
                        >
                          Болих
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Tab 3: Sizes / Prices */}
              {activeTab === 2 && (
                <div>
                  <div style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                      <thead>
                        <tr style={{ background: 'var(--surface2)' }}>
                          <th style={thStyle}>Код</th>
                          <th style={thStyle}>Шошго</th>
                          <th style={thStyle}>Өргөн (мм)</th>
                          <th style={thStyle}>Өндөр (мм)</th>
                          <th style={thStyle}>Үнэ</th>
                          <th style={thStyle}>Custom</th>
                          <th style={{ ...thStyle, width: 100 }}>Үйлдэл</th>
                        </tr>
                      </thead>
                      <tbody>
                        {sizes.map(s => (
                          <tr key={s.id}>
                            <td style={tdStyle}><span style={{ fontFamily: 'monospace', fontSize: 12 }}>{s.size_code}</span></td>
                            <td style={tdStyle}>{s.size_label}</td>
                            <td style={tdStyle}>{s.width_mm}</td>
                            <td style={tdStyle}>{s.height_mm}</td>
                            <td style={{ ...tdStyle, color: '#FF6B00', fontWeight: 600 }}>₮{Number(s.base_price || 0).toLocaleString()}</td>
                            <td style={tdStyle}>
                              {s.is_custom ? (
                                <span style={{ color: '#F59E0B', fontWeight: 600, fontSize: 12 }}>Тийм</span>
                              ) : (
                                <span style={{ color: 'var(--text3)', fontSize: 12 }}>Үгүй</span>
                              )}
                            </td>
                            <td style={tdStyle}>
                              <button
                                onClick={() => {
                                  setEditingSize(s)
                                  setSizeForm({
                                    size_code: s.size_code || '',
                                    size_label: s.size_label || '',
                                    width_mm: s.width_mm || 0,
                                    height_mm: s.height_mm || 0,
                                    base_price: s.base_price || 0,
                                    is_custom: s.is_custom || false,
                                  })
                                }}
                                style={{ padding: '4px 10px', background: 'rgba(59,130,246,0.1)', color: '#3B82F6', border: 'none', borderRadius: 4, cursor: 'pointer', fontSize: 11, fontFamily: FONT }}
                              >
                                Засах
                              </button>
                            </td>
                          </tr>
                        ))}
                        {sizes.length === 0 && (
                          <tr>
                            <td colSpan={7} style={{ ...tdStyle, textAlign: 'center', color: 'var(--text3)', padding: 24 }}>
                              Хэмжээ байхгүй
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>

                  {/* Size form */}
                  <div style={{
                    marginTop: 16,
                    padding: 16,
                    background: 'var(--surface2)',
                    borderRadius: 10,
                    border: '1px solid var(--border)',
                  }}>
                    <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 12, color: 'var(--text)' }}>
                      {editingSize ? 'Хэмжээ засах' : 'Хэмжээ нэмэх'}
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10 }}>
                      <div>
                        <label style={labelStyle}>Код</label>
                        <input value={sizeForm.size_code} onChange={e => setSizeForm({ ...sizeForm, size_code: e.target.value })} style={inp} placeholder="A4" />
                      </div>
                      <div>
                        <label style={labelStyle}>Шошго</label>
                        <input value={sizeForm.size_label} onChange={e => setSizeForm({ ...sizeForm, size_label: e.target.value })} style={inp} placeholder="A4 (210x297)" />
                      </div>
                      <div>
                        <label style={labelStyle}>Өргөн (мм)</label>
                        <input type="number" value={sizeForm.width_mm} onChange={e => setSizeForm({ ...sizeForm, width_mm: +e.target.value })} style={inp} />
                      </div>
                      <div>
                        <label style={labelStyle}>Өндөр (мм)</label>
                        <input type="number" value={sizeForm.height_mm} onChange={e => setSizeForm({ ...sizeForm, height_mm: +e.target.value })} style={inp} />
                      </div>
                      <div>
                        <label style={labelStyle}>Үнэ</label>
                        <input type="number" value={sizeForm.base_price} onChange={e => setSizeForm({ ...sizeForm, base_price: +e.target.value })} style={inp} />
                      </div>
                      <div style={{ display: 'flex', alignItems: 'flex-end', paddingBottom: 2 }}>
                        <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, cursor: 'pointer' }}>
                          <input type="checkbox" checked={sizeForm.is_custom} onChange={e => setSizeForm({ ...sizeForm, is_custom: e.target.checked })} />
                          Custom хэмжээ
                        </label>
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
                      <button onClick={saveSize} disabled={saving} style={btnSmallPrimary}>
                        {saving ? '...' : editingSize ? 'Шинэчлэх' : 'Хэмжээ нэмэх'}
                      </button>
                      {editingSize && (
                        <button
                          onClick={() => { setEditingSize(null); setSizeForm({ ...emptySize }) }}
                          style={{ ...btnSecondary, padding: '8px 16px', fontSize: 12 }}
                        >
                          Болих
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Tab 4: Finishing & Addon */}
              {activeTab === 3 && (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
                  <div>
                    <h3 style={{ fontSize: 15, fontWeight: 600, margin: '0 0 12px', color: 'var(--text)' }}>Finishing</h3>
                    {finishings.length === 0 ? (
                      <div style={{ padding: 24, textAlign: 'center', color: 'var(--text3)', fontSize: 13, background: 'var(--surface2)', borderRadius: 10 }}>
                        Finishing байхгүй
                      </div>
                    ) : (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                        {finishings.map((f: any) => (
                          <div key={f.id} style={{
                            padding: '12px 16px',
                            background: 'var(--surface2)',
                            borderRadius: 10,
                            border: '1px solid var(--border)',
                          }}>
                            <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)' }}>{f.name_mn || f.name}</div>
                            {f.code && <div style={{ fontSize: 11, color: 'var(--text3)', fontFamily: 'monospace', marginTop: 2 }}>{f.code}</div>}
                            {f.price != null && <div style={{ fontSize: 12, color: '#FF6B00', fontWeight: 600, marginTop: 4 }}>₮{Number(f.price).toLocaleString()}</div>}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                  <div>
                    <h3 style={{ fontSize: 15, fontWeight: 600, margin: '0 0 12px', color: 'var(--text)' }}>Addon</h3>
                    {addons.length === 0 ? (
                      <div style={{ padding: 24, textAlign: 'center', color: 'var(--text3)', fontSize: 13, background: 'var(--surface2)', borderRadius: 10 }}>
                        Addon байхгүй
                      </div>
                    ) : (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                        {addons.map((a: any) => (
                          <div key={a.id} style={{
                            padding: '12px 16px',
                            background: 'var(--surface2)',
                            borderRadius: 10,
                            border: '1px solid var(--border)',
                          }}>
                            <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)' }}>{a.name_mn || a.name}</div>
                            {a.code && <div style={{ fontSize: 11, color: 'var(--text3)', fontFamily: 'monospace', marginTop: 2 }}>{a.code}</div>}
                            {a.price != null && <div style={{ fontSize: 12, color: '#FF6B00', fontWeight: 600, marginTop: 4 }}>₮{Number(a.price).toLocaleString()}</div>}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div style={{
              padding: '16px 24px',
              borderTop: '1px solid var(--border)',
              display: 'flex',
              justifyContent: 'flex-end',
              gap: 10,
            }}>
              <button onClick={closeModal} style={btnSecondary}>Хаах</button>
              {activeTab === 0 && (
                <button onClick={saveProduct} disabled={saving || !form.name_mn || !form.code} style={{
                  ...btnPrimary,
                  opacity: saving || !form.name_mn || !form.code ? 0.5 : 1,
                }}>
                  {saving ? 'Хадгалж байна...' : 'Хадгалах'}
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
