'use client'
import { apiFetch, getToken, API_URL } from '@/lib/api'
import React, { useState, useEffect, useCallback, useMemo } from 'react'
import ProductMediaUploader from '@/components/ProductMediaUploader'
import { QrButton } from '@/components/admin/QrModal'
import { AdminPageHeader } from '@/components/admin/AdminPageHeader'
import {
  type PricingConstants, type CalcInput, type CalcResult,
  DEFAULT_CONSTANTS, calculate,
} from '../print-calculator/pricing-engine'

// PRINT_CATEGORIES — legacy fallback, replaced by DB categories in component
const PRINT_CATEGORIES_FALLBACK = [
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
  base_price: 0, pricing_type: 'tier' as 'tier' | 'area',
  price_per_m2: 0, min_area_m2: 0.25,
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
  const [allAddons, setAllAddons] = useState<any[]>([])
  const [selectedAddonIds, setSelectedAddonIds] = useState<string[]>([])

  // Load all addons
  useEffect(() => {
    apiFetch<any>('/admin/products-master/addons/all').then(res => {
      if (Array.isArray(res)) setAllAddons(res)
    }).catch(() => {})
  }, [])

  // Dynamic categories from DB (root + children)
  const [allCats, setAllCats] = useState<any[]>([])
  useEffect(() => {
    apiFetch<any>('/categories', { auth: false }).then(cats => {
      if (Array.isArray(cats)) setAllCats(cats.filter((c: any) => c.is_active))
    }).catch(() => {})
  }, [])
  const rootCats = allCats.filter(c => !c.parent_id)
  const PRINT_CATEGORIES = rootCats.length > 0
    ? rootCats.map(c => ({ value: c.slug || c.name, label: `${c.icon || ''} ${c.name_mn || c.name}`.trim() }))
    : PRINT_CATEGORIES_FALLBACK
  // Sub-categories for selected parent
  const getSubCategories = (parentSlug: string) => {
    const parent = allCats.find(c => (c.slug || c.name) === parentSlug)
    if (!parent) return []
    return allCats.filter(c => c.parent_id === parent.id).map(c => ({ value: c.slug || c.name, label: c.name_mn || c.name }))
  }

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      params.set('product_type', 'print')
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
      thumbnail_url: item.thumbnail_url || '', images: item.images || [], video_url: item.video_url || '',
      base_price: item.base_price || 0, pricing_type: item.unit_type === 'M2' ? 'area' : 'tier',
      price_per_m2: item.price_per_m2 || 0, min_area_m2: item.min_area_m2 || 0.25 })
    setMaterials(item.materials || []); setSizes(item.sizes || [])
    // Load addons linked to this product
    setSelectedAddonIds(allAddons.filter(a => a.applicable_products?.includes(item.id)).map((a: any) => a.id))
    setMaterialForm({ ...emptyMaterial }); setSizeForm({ ...emptySize })
    setEditingMaterial(null); setEditingSize(null); setFormTab(0); setError(''); setModalOpen(true)
  }
  const closeModal = () => { setModalOpen(false); setEditing(null); setSelectedAddonIds([]); setError('') }

  const saveProduct = async () => {
    if (!form.name_mn.trim()) { setError('Нэр (МН) оруулна уу'); return }
    if (form.pricing_type === 'area' && !form.price_per_m2) { setError('М² үнэ оруулна уу'); return }
    if (form.pricing_type === 'tier' && !form.base_price) { setError('Нэгж үнэ оруулна уу'); return }
    setSaving(true); setError('')
    try {
      const payload = {
        ...form,
        product_type: 'print',
        thumbnail_url: form.images[0] || form.thumbnail_url,
        base_price: form.pricing_type === 'area' ? form.price_per_m2 : form.base_price,
      }
      if (editing?.id) {
        await apiFetch<any>(`/admin/products-master/${editing.id}`, {
          method: 'PUT', body: payload,
        })
        // Sync pricing to products table
        try {
          const isArea = form.pricing_type === 'area'
          await apiFetch<any>(`/admin/shop-products/${editing.id}`, { method: 'PATCH', body: {
            base_price: isArea ? form.price_per_m2 : form.base_price,
            pricing_mode: isArea ? 'formula' : 'tier',
            requires_dimensions: isArea,
            order_flow: isArea ? 'site_survey' : 'file_upload',
            price_formula: isArea ? { type: 'area_based', price_per_m2: form.price_per_m2, min_area_m2: form.min_area_m2 || 0.25, options: {} } : null,
          }}).catch(() => {}) // Ignore if no matching product
        } catch {}
      } else {
        const res = await apiFetch<any>(`/admin/products-master`, {
          method: 'POST', body: payload,
        })
        const created = res
        setEditing(created)
        setFormTab(1)  // advance to Materials tab after creating
      }
      // Sync addon applicable_products
      const productId = editing?.id || (await apiFetch<any>(`/admin/products-master?product_type=print&search=${encodeURIComponent(form.name_mn)}`)).items?.[0]?.id
      if (productId) {
        for (const addon of allAddons) {
          const isSelected = selectedAddonIds.includes(addon.id)
          const currentProducts: string[] = addon.applicable_products || []
          const alreadyLinked = currentProducts.includes(productId)
          if (isSelected && !alreadyLinked) {
            await apiFetch(`/admin/products-master/addons/${addon.id}`, {
              method: 'PUT', body: { applicable_products: [...currentProducts, productId] },
            }).catch(() => {})
          } else if (!isSelected && alreadyLinked) {
            await apiFetch(`/admin/products-master/addons/${addon.id}`, {
              method: 'PUT', body: { applicable_products: currentProducts.filter(p => p !== productId) },
            }).catch(() => {})
          }
        }
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

  const PRINT_TABS = ['Үндсэн мэдээлэл', 'Материал', 'Хэмжээ / Үнэ', 'Дагалдах']

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
                  <QrButton product={item} type="print" />
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
              {PRINT_TABS.map((t, i) => {
                const locked = i > 0 && !editing?.id
                return (
                  <button key={t} onClick={() => {
                    if (locked) { setError('Эхлээд "Хадгалах" дараад, дараа нь Материал/Хэмжээ нэмнэ үү'); return }
                    setFormTab(i)
                  }}
                    style={{ padding: '10px 18px', fontSize: 13, fontWeight: formTab === i ? 600 : 400, color: locked ? 'var(--text3)' : formTab === i ? '#FF6B00' : 'var(--text2)', background: 'none', border: 'none', borderBottom: formTab === i ? '2px solid #FF6B00' : '2px solid transparent', cursor: locked ? 'help' : 'pointer', fontFamily: FONT, opacity: locked ? 0.5 : 1 }}
                    title={locked ? 'Эхлээд бүтээгдэхүүнийг хадгална уу' : ''}>
                    {t} {locked && '🔒'}
                  </button>
                )
              })}
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
                    {getSubCategories(form.category).length > 0 ? (
                      <select value={form.subcategory} onChange={e => setForm({ ...form, subcategory: e.target.value })} style={{ ...inp, cursor: 'pointer' }}>
                        <option value="">— Сонгох —</option>
                        {getSubCategories(form.category).map(sc => <option key={sc.value} value={sc.value}>{sc.label}</option>)}
                      </select>
                    ) : (
                      <input value={form.subcategory} onChange={e => setForm({ ...form, subcategory: e.target.value })} style={inp} placeholder="Дэд ангилал байхгүй — гараар бичих" />
                    )}
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
                  {/* ── PRICING CONFIG ── */}
                  <div style={{ gridColumn: 'span 2', background: 'var(--surface2)', border: '1px solid var(--border)', borderRadius: 10, padding: 14 }}>
                    <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 10, color: 'var(--text)' }}>💰 Үнийн тохиргоо</div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                      <div>
                        <label style={labelStyle}>Үнэ тооцох арга</label>
                        <select value={form.pricing_type} onChange={e => setForm({ ...form, pricing_type: e.target.value as any, unit_type: e.target.value === 'area' ? 'M2' : form.unit_type })} style={{ ...inp, cursor: 'pointer' }}>
                          <option value="tier">📦 Ширхэгээр (Tier)</option>
                          <option value="area">📐 М²-аар (Талбай)</option>
                        </select>
                      </div>
                      {form.pricing_type === 'tier' ? (
                        <div>
                          <label style={labelStyle}>Нэгж үнэ (₮) *</label>
                          <input type="number" value={form.base_price} onChange={e => setForm({ ...form, base_price: Number(e.target.value) })} style={inp} placeholder="18500" />
                        </div>
                      ) : (
                        <>
                          <div>
                            <label style={labelStyle}>М² үнэ (₮) *</label>
                            <input type="number" value={form.price_per_m2} onChange={e => setForm({ ...form, price_per_m2: Number(e.target.value) })} style={inp} placeholder="18500" />
                          </div>
                          <div>
                            <label style={labelStyle}>Мин. талбай (м²)</label>
                            <input type="number" value={form.min_area_m2} onChange={e => setForm({ ...form, min_area_m2: Number(e.target.value) })} style={inp} placeholder="0.25" step="0.01" />
                          </div>
                          <div style={{ fontSize: 11, color: 'var(--text3)' }}>
                            💡 Жишээ: 2м × 3м = 6м² × ₮{(form.price_per_m2 || 0).toLocaleString()} = ₮{(6 * (form.price_per_m2 || 0)).toLocaleString()}
                          </div>
                        </>
                      )}
                    </div>
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

                  {/* ── TIER PRICE EDITOR ── */}
                  <div style={{ background: 'var(--surface2)', borderRadius: 10, padding: 16, marginTop: 16, border: '1px solid var(--border)' }}>
                    <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 8, color: 'var(--text)' }}>📊 Тоо ширхгийн шатлалт үнэ</div>
                    <p style={{ fontSize: 11, color: 'var(--text3)', margin: '0 0 12px' }}>Олноор авахад хямдардаг үнийн шатлал тохируулах</p>
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12, marginBottom: 10 }}>
                      <thead>
                        <tr style={{ background: 'var(--surface)' }}>
                          <th style={{ ...thStyle, fontSize: 11 }}>Тоо (min)</th>
                          <th style={{ ...thStyle, fontSize: 11 }}>Тоо (max)</th>
                          <th style={{ ...thStyle, fontSize: 11 }}>Үнийн коэффициент</th>
                          <th style={{ ...thStyle, fontSize: 11 }}>Хөнгөлөлт</th>
                          <th style={{ ...thStyle, fontSize: 11 }}>Шошго</th>
                        </tr>
                      </thead>
                      <tbody>
                        {[
                          { min: 1, max: 49, mult: 1.00, label: 'Стандарт' },
                          { min: 50, max: 99, mult: 0.90, label: '-10%' },
                          { min: 100, max: 499, mult: 0.80, label: '-20%' },
                          { min: 500, max: 999, mult: 0.65, label: '-35%' },
                          { min: 1000, max: null, mult: 0.50, label: '-50%' },
                        ].map((t, i) => (
                          <tr key={i}>
                            <td style={tdStyle}>{t.min}</td>
                            <td style={tdStyle}>{t.max ?? '∞'}</td>
                            <td style={tdStyle}>×{t.mult}</td>
                            <td style={{ ...tdStyle, color: t.mult < 1 ? '#10B981' : 'var(--text2)', fontWeight: 600 }}>{t.mult < 1 ? `-${((1-t.mult)*100).toFixed(0)}%` : '0%'}</td>
                            <td style={tdStyle}>{t.label}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                    <div style={{ fontSize: 10, color: 'var(--text3)' }}>💡 Жишээ: Суурь үнэ ₮500, 500ш → ₮500 × 0.65 = ₮325/ш (35% хөнгөлөлт)</div>
                  </div>
                </div>
              )}

              {/* ── Tab 3: Дагалдах бүтээгдэхүүн ── */}
              {formTab === 3 && (
                <div style={{ padding: 20 }}>
                  <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 12, color: 'var(--text)' }}>
                    🔗 Дагалдах бүтээгдэхүүн (Add-ons)
                  </div>
                  <p style={{ fontSize: 12, color: 'var(--text3)', marginBottom: 16 }}>
                    Хэрэглэгч энэ бүтээгдэхүүнийг захиалахад &quot;Хамт авах уу?&quot; гэж санал болгох бүтээгдэхүүнүүдийг сонгоно уу.
                  </p>
                  {allAddons.length === 0 ? (
                    <div style={{ padding: 20, textAlign: 'center', color: 'var(--text3)', fontSize: 13 }}>
                      Дагалдах бүтээгдэхүүн бүртгэгдээгүй байна. &quot;Seed&quot; хийж үүсгэнэ үү.
                    </div>
                  ) : (
                    <div style={{ display: 'grid', gap: 8 }}>
                      {allAddons.map(addon => {
                        const checked = selectedAddonIds.includes(addon.id)
                        return (
                          <label key={addon.id} style={{
                            display: 'flex', alignItems: 'center', gap: 12, padding: '10px 14px',
                            borderRadius: 8, cursor: 'pointer', transition: 'all 0.15s',
                            border: `1px solid ${checked ? '#FF6B00' : 'var(--border)'}`,
                            background: checked ? 'rgba(255,107,0,0.05)' : 'var(--surface2)',
                          }}>
                            <input type="checkbox" checked={checked}
                              onChange={() => setSelectedAddonIds(prev =>
                                checked ? prev.filter(id => id !== addon.id) : [...prev, addon.id]
                              )}
                              style={{ accentColor: '#FF6B00', width: 16, height: 16 }} />
                            <div style={{ flex: 1 }}>
                              <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)' }}>{addon.name_mn}</div>
                              <div style={{ fontSize: 11, color: 'var(--text3)' }}>
                                {addon.code} · {addon.price_type === 'FIXED' ? 'Тогтмол' : addon.price_type === 'PER_M2' ? 'М²' : addon.price_type === 'PER_PIECE' ? 'Ширхэг' : 'Цагийн'}
                              </div>
                            </div>
                            <div style={{ fontSize: 13, fontWeight: 700, color: '#FF6B00' }}>
                              ₮{Number(addon.price).toLocaleString()}
                            </div>
                          </label>
                        )
                      })}
                    </div>
                  )}
                </div>
              )}
            </div>
            <div style={{ padding: '16px 24px', borderTop: '1px solid var(--border)', display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
              <button onClick={closeModal} style={btnSecondary}>Хаах</button>
              {(formTab === 0 || formTab === 3) && <button onClick={saveProduct} disabled={saving} style={btnPrimary}>{saving ? 'Хадгалж байна...' : editing?.id ? 'Шинэчлэх' : 'Хадгалах'}</button>}
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
      const data = await apiFetch<any>('/admin/shop-products?product_type=shop')
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
        product_type: 'shop',
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
                      <QrButton product={item} type="shop" />
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
                  <QrButton product={item} type="signage" />
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

// ─── OFFSET PRODUCTS TAB ──────────────────────────────────────────────────────

interface OffsetPaperConfig {
  label: string
  gsm: number
  price: number
}

interface OffsetSizeConfig {
  code: string
  label: string
  width_mm: number
  height_mm: number
  pagesPerSig: number
}

interface SavedOffsetProduct {
  id: string
  name: string
  description: string
  images: string[]
  video_url: string
  // Book standards & recommendations
  book_info: {
    standard_sizes: string      // e.g. "A4, A5, B5"
    recommended_pages: string   // e.g. "64, 128, 256"
    recommended_paper: string   // e.g. "80gsm дотор, 250gsm хавтас"
    tips: string                // Markdown tips/recommendations
    video_intro_url: string     // Video introduction URL
  }
  // Custom paper config (overrides global defaults)
  paper_configs: OffsetPaperConfig[]
  size_configs: OffsetSizeConfig[]
  // Calculator
  marginPercent: number    // ашгийн хувь (0.25 = 25%)
  input: CalcInput
  overrides: Record<string, number>
  total: number
  unitPrice: number
  method: string
  createdAt: string
}

const DEFAULT_BOOK_INFO: SavedOffsetProduct['book_info'] = {
  standard_sizes: 'A4 (210×297мм), A5 (148×210мм), B5 (176×250мм)',
  recommended_pages: '32, 48, 64, 96, 128, 192, 256',
  recommended_paper: '80gsm дотор хуудас, 250gsm хавтас',
  tips: '• Нүүрний тоо 4, 8, 16-д хуваагдвал цаас хэмнэнэ\n• Зөөлөн хавтас: 200-250gsm, Хатуу хавтас: 300gsm+\n• UV лак хавтсанд л хэрэглэнэ\n• Офсет 300+ ширхэгт хямд, дижитал 1-299 ширхэгт тохиромжтой\n• ISBN бүртгэл шаардлагатай бол урьдчилан мэдэгдэнэ үү',
  video_intro_url: '',
}

const DEFAULT_PAPER_CONFIGS: OffsetPaperConfig[] = [
  { label: '60gsm (Нимгэн)', gsm: 60, price: 45 },
  { label: '70gsm (Сонин)', gsm: 70, price: 50 },
  { label: '80gsm (Энгийн)', gsm: 80, price: 60 },
  { label: '90gsm', gsm: 90, price: 70 },
  { label: '100gsm', gsm: 100, price: 80 },
  { label: '105gsm (Сэтгүүл)', gsm: 105, price: 85 },
  { label: '115gsm', gsm: 115, price: 95 },
  { label: '120gsm', gsm: 120, price: 100 },
  { label: '128gsm (Мелован)', gsm: 128, price: 110 },
  { label: '150gsm (Зузаан)', gsm: 150, price: 130 },
  { label: '157gsm (Арт)', gsm: 157, price: 145 },
  { label: '170gsm (Карт)', gsm: 170, price: 160 },
  { label: '200gsm', gsm: 200, price: 200 },
  { label: '210gsm (C1S)', gsm: 210, price: 220 },
  { label: '230gsm', gsm: 230, price: 250 },
  { label: '250gsm (Хавтас)', gsm: 250, price: 280 },
  { label: '270gsm', gsm: 270, price: 310 },
  { label: '300gsm (Картон)', gsm: 300, price: 350 },
  { label: '350gsm (Хатуу)', gsm: 350, price: 420 },
  { label: '400gsm (Хайрцаг)', gsm: 400, price: 500 },
]

const DEFAULT_SIZE_CONFIGS: OffsetSizeConfig[] = [
  { code: 'A3', label: 'A3 (297×420мм)', width_mm: 297, height_mm: 420, pagesPerSig: 2 },
  { code: 'B3', label: 'B3 (353×500мм)', width_mm: 353, height_mm: 500, pagesPerSig: 2 },
  { code: 'A4', label: 'A4 (210×297мм)', width_mm: 210, height_mm: 297, pagesPerSig: 4 },
  { code: 'B5', label: 'B5 (176×250мм)', width_mm: 176, height_mm: 250, pagesPerSig: 8 },
  { code: 'A5', label: 'A5 (148×210мм)', width_mm: 148, height_mm: 210, pagesPerSig: 8 },
  { code: 'A6', label: 'A6 (105×148мм)', width_mm: 105, height_mm: 148, pagesPerSig: 16 },
  { code: '70x100', label: '70×100см (Том)', width_mm: 700, height_mm: 1000, pagesPerSig: 1 },
  { code: 'CUSTOM', label: 'Захиалгат хэмжээ', width_mm: 0, height_mm: 0, pagesPerSig: 2 },
]

function OffsetProductsTab() {
  const [products, setProducts] = useState<SavedOffsetProduct[]>([])
  const [loading, setLoading] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)
  const [editingIdx, setEditingIdx] = useState<number | null>(null)

  const loadProducts = useCallback(async () => {
    try {
      const token = getToken()
      const res = await apiFetch('/admin/products-master?product_type=offset', { headers: { Authorization: `Bearer ${token}` } })
      if (Array.isArray(res)) {
        setProducts(res.map((item: any) => ({
          id: item.id,
          name: item.name_mn || item.name || '',
          description: item.description || '',
          images: item.images || [],
          video_url: item.video_url || '',
          book_info: item.book_info || { ...DEFAULT_BOOK_INFO },
          paper_configs: item.paper_configs || [...DEFAULT_PAPER_CONFIGS],
          size_configs: item.size_configs || [...DEFAULT_SIZE_CONFIGS],
          input: item.calc_input || { quantity: 500, totalPages: 64, paperSize: 'A3', paperGsm: 80, colorMode: 'color', folding: true, uvCoating: false, dieCutting: false, embossing: false, bindingType: 'Зөөлөн хавтас', hasCover: true, coverGsm: 250, coverColorMode: 'color' },
          overrides: item.calc_overrides || {},
          marginPercent: item.margin_percent ?? 0.25,
          total: item.base_price || 0,
          unitPrice: item.unit_price || 0,
          method: item.calc_method || 'offset',
          createdAt: item.created_at || new Date().toISOString(),
        })))
      }
    } catch {
      // Fallback to localStorage
      try { setProducts(JSON.parse(localStorage.getItem('bizprint_offset_products') || '[]')) } catch { setProducts([]) }
    }
    setLoading(false)
  }, [])

  useEffect(() => { loadProducts() }, [loadProducts])

  const saveToBackend = async (product: SavedOffsetProduct, isUpdate: boolean) => {
    const token = getToken()
    const body = {
      name: product.name, name_mn: product.name, product_type: 'offset', category: 'book',
      description: product.description, images: product.images, video_url: product.video_url,
      base_price: product.total, thumbnail_url: product.images[0] || null,
      book_info: product.book_info, paper_configs: product.paper_configs, size_configs: product.size_configs,
      calc_input: product.input, calc_overrides: product.overrides, calc_method: product.method,
      unit_price: product.unitPrice, pricing_mode: 'formula', margin_percent: product.marginPercent,
    }
    try {
      if (isUpdate) {
        await apiFetch(`/admin/products-master/${product.id}`, { method: 'PUT', headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
      } else {
        await apiFetch('/admin/products-master', { method: 'POST', headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
      }
    } catch {
      // Fallback localStorage
      const list = isUpdate ? products.map(p => p.id === product.id ? product : p) : [product, ...products]
      localStorage.setItem('bizprint_offset_products', JSON.stringify(list))
    }
  }

  const handleSave = async (product: SavedOffsetProduct) => {
    const isUpdate = editingIdx !== null
    if (isUpdate) {
      setProducts(prev => { const next = [...prev]; next[editingIdx!] = product; return next })
    } else {
      setProducts(prev => [product, ...prev])
    }
    setModalOpen(false); setEditingIdx(null)
    await saveToBackend(product, isUpdate)
    loadProducts()
  }

  const handleDelete = async (idx: number) => {
    if (!confirm('Устгах уу?')) return
    const p = products[idx]
    setProducts(prev => prev.filter((_, i) => i !== idx))
    try {
      const token = getToken()
      await apiFetch(`/admin/products-master/${p.id}`, { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } })
    } catch { /* silent */ }
  }

  const openEdit = (idx: number) => { setEditingIdx(idx); setModalOpen(true) }
  const openNew = () => { setEditingIdx(null); setModalOpen(true) }
  const fmt = (n: number) => '₮' + Math.round(n).toLocaleString('mn-MN')

  if (loading) return <div style={{ textAlign: 'center', padding: 60, color: 'var(--text3)' }}>Ачааллаж байна...</div>

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <p style={{ color: 'var(--text2)', fontSize: 13, margin: 0 }}>
          Офсет/Дижитал бүтээгдэхүүн — нийт {products.length}
        </p>
        <button onClick={openNew} style={btnPrimary}>+ Шинэ бүтээгдэхүүн</button>
      </div>

      {products.length === 0 ? (
        <div style={{ textAlign: 'center', padding: 60, color: 'var(--text3)', fontSize: 14 }}>
          <div style={{ fontSize: 48, marginBottom: 12 }}>📖</div>
          <div style={{ fontWeight: 600 }}>Офсет бүтээгдэхүүн байхгүй</div>
          <p style={{ fontSize: 13, marginTop: 8 }}>Ном, сэтгүүл, каталог зэрэг офсет бүтээгдэхүүн үүсгэнэ</p>
          <button onClick={openNew} style={{ ...btnPrimary, marginTop: 12 }}>+ Шинэ бүтээгдэхүүн</button>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 16 }}>
          {products.map((p, i) => (
            <div key={p.id} style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 12, overflow: 'hidden', cursor: 'pointer', transition: 'box-shadow 0.2s' }}
              onClick={() => openEdit(i)} onMouseOver={e => (e.currentTarget.style.boxShadow = '0 4px 20px rgba(0,0,0,0.1)')} onMouseOut={e => (e.currentTarget.style.boxShadow = 'none')}>
              {/* Image */}
              <div style={{ height: 160, background: 'var(--surface2)', position: 'relative', overflow: 'hidden' }}>
                {p.images?.[0] ? (
                  <img src={p.images[0]} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                ) : (
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', fontSize: 48, opacity: 0.3 }}>📖</div>
                )}
                <span style={{ position: 'absolute', top: 8, left: 8, padding: '3px 10px', borderRadius: 99, fontSize: 10, fontWeight: 700,
                  background: p.method === 'offset' ? 'rgba(139,92,246,0.9)' : 'rgba(59,130,246,0.9)', color: '#fff',
                }}>{p.method === 'offset' ? 'Офсет' : 'Дижитал'}</span>
                {p.images?.length > 1 && (
                  <span style={{ position: 'absolute', top: 8, right: 8, padding: '3px 8px', borderRadius: 99, fontSize: 10, fontWeight: 600, background: 'rgba(0,0,0,0.6)', color: '#fff' }}>
                    📷 {p.images.length}
                  </span>
                )}
              </div>
              {/* Info */}
              <div style={{ padding: '12px 14px' }}>
                <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text)', marginBottom: 4, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {p.name || 'Нэргүй бүтээгдэхүүн'}
                </div>
                {p.description && (
                  <div style={{ fontSize: 11, color: 'var(--text3)', marginBottom: 8, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.description}</div>
                )}
                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 8 }}>
                  <span style={{ fontSize: 10, padding: '2px 6px', borderRadius: 4, background: 'var(--surface2)', color: 'var(--text2)' }}>{p.input.paperSize}</span>
                  <span style={{ fontSize: 10, padding: '2px 6px', borderRadius: 4, background: 'var(--surface2)', color: 'var(--text2)' }}>{p.input.totalPages} нүүр</span>
                  <span style={{ fontSize: 10, padding: '2px 6px', borderRadius: 4, background: 'var(--surface2)', color: 'var(--text2)' }}>{p.input.quantity}ш</span>
                  <span style={{ fontSize: 10, padding: '2px 6px', borderRadius: 4, background: 'var(--surface2)', color: 'var(--text2)' }}>{p.input.paperGsm}gsm</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                  <span style={{ fontSize: 18, fontWeight: 800, color: '#FF6B00' }}>{fmt(p.total)}</span>
                  <span style={{ fontSize: 11, color: 'var(--text3)' }}>Нэгж: {fmt(p.unitPrice)}</span>
                </div>
              </div>
              {/* Actions */}
              <div style={{ padding: '8px 14px', borderTop: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', fontSize: 11 }}>
                <span style={{ color: 'var(--text3)' }}>{new Date(p.createdAt).toLocaleDateString('mn-MN')}</span>
                <div style={{ display: 'flex', gap: 10 }}>
                  <button onClick={e => { e.stopPropagation(); openEdit(i) }} style={{ background: 'none', border: 'none', color: '#3B82F6', cursor: 'pointer', fontSize: 11, fontFamily: FONT }}>Засах</button>
                  <button onClick={e => { e.stopPropagation(); handleDelete(i) }} style={{ background: 'none', border: 'none', color: '#EF4444', cursor: 'pointer', fontSize: 11, fontFamily: FONT }}>Устгах</button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {modalOpen && (
        <OffsetCalculatorModal
          initial={editingIdx !== null ? products[editingIdx] : undefined}
          onSave={handleSave}
          onClose={() => { setModalOpen(false); setEditingIdx(null) }}
        />
      )}
    </div>
  )
}

// ─── OFFSET CALCULATOR MODAL ─────────────────────────────────────────────────

const OFFSET_MODAL_TABS = [
  { key: 'info', label: '📋 Мэдээлэл', desc: 'Нэр, тайлбар, зураг, видео' },
  { key: 'calc', label: '🧮 Тооцоолуур', desc: 'Үнэ бодох, задаргаа' },
  { key: 'paper', label: '📄 Цаас & Хэмжээ', desc: 'Цаасны төрөл, үнэ тохируулах' },
  { key: 'book', label: '📖 Стандарт & Зөвлөгөө', desc: 'Номын мэдээлэл, видео' },
]

function OffsetCalculatorModal({ initial, onSave, onClose }: {
  initial?: SavedOffsetProduct
  onSave: (p: SavedOffsetProduct) => void
  onClose: () => void
}) {
  const [tab, setTab] = useState('info')

  // ── Product info fields ──
  const [name, setName] = useState(initial?.name || '')
  const [description, setDescription] = useState(initial?.description || '')
  const [images, setImages] = useState<string[]>(initial?.images || [])
  const [videoUrl, setVideoUrl] = useState(initial?.video_url || '')

  // ── Book info ──
  const [bookInfo, setBookInfo] = useState<SavedOffsetProduct['book_info']>(initial?.book_info || { ...DEFAULT_BOOK_INFO })

  // ── Paper & Size configs ──
  const [paperConfigs, setPaperConfigs] = useState<OffsetPaperConfig[]>(initial?.paper_configs || [...DEFAULT_PAPER_CONFIGS])
  const [sizeConfigs, setSizeConfigs] = useState<OffsetSizeConfig[]>(initial?.size_configs || [...DEFAULT_SIZE_CONFIGS])

  // ── Calculator ──
  const [marginPercent, setMarginPercent] = useState(initial?.marginPercent ?? 0.25)

  const customConstants = useMemo<PricingConstants>(() => ({
    ...DEFAULT_CONSTANTS,
    marginPercent,
    paperPrices: paperConfigs.map(p => ({ label: p.label, gsm: p.gsm, price: p.price })),
    pagesPerSignature: Object.fromEntries(sizeConfigs.filter(s => s.code !== 'CUSTOM').map(s => [s.code, s.pagesPerSig])),
  }), [paperConfigs, sizeConfigs, marginPercent])

  const [input, setInput] = useState<CalcInput>(initial?.input || {
    quantity: 500, totalPages: 64, paperSize: 'A3', paperGsm: 80, colorMode: 'color',
    folding: true, uvCoating: false, dieCutting: false, embossing: false,
    bindingType: 'Зөөлөн хавтас', hasCover: true, coverGsm: 250, coverColorMode: 'color',
  })
  const [overrides, setOverrides] = useState<Record<string, number>>(initial?.overrides || {})
  const [editingKey, setEditingKey] = useState<string | null>(null)

  const set = (k: keyof CalcInput, v: any) => setInput(prev => ({ ...prev, [k]: v }))
  const result = useMemo(() => calculate(input, customConstants), [input, customConstants])

  const finalLines = useMemo(() => result.lines.map(l => ({
    ...l,
    amount: overrides[l.key] !== undefined ? overrides[l.key] : l.amount,
    isOverridden: overrides[l.key] !== undefined,
  })), [result.lines, overrides])

  const finalTotal = finalLines.reduce((s, l) => s + l.amount, 0)
  const finalUnit = input.quantity > 0 ? Math.round(finalTotal / input.quantity) : 0
  const fmt = (n: number) => '₮' + Math.round(n).toLocaleString('mn-MN')

  // ── Paper config helpers ──
  const addPaper = () => setPaperConfigs(prev => [...prev, { label: '', gsm: 0, price: 0 }])
  const updatePaper = (idx: number, field: keyof OffsetPaperConfig, val: any) => {
    setPaperConfigs(prev => prev.map((p, i) => i === idx ? { ...p, [field]: val } : p))
  }
  const removePaper = (idx: number) => setPaperConfigs(prev => prev.filter((_, i) => i !== idx))

  const addSize = () => setSizeConfigs(prev => [...prev, { code: '', label: '', width_mm: 0, height_mm: 0, pagesPerSig: 2 }])
  const updateSize = (idx: number, field: keyof OffsetSizeConfig, val: any) => {
    setSizeConfigs(prev => prev.map((s, i) => i === idx ? { ...s, [field]: val } : s))
  }
  const removeSize = (idx: number) => setSizeConfigs(prev => prev.filter((_, i) => i !== idx))

  const handleSave = () => {
    onSave({
      id: initial?.id || crypto.randomUUID(),
      name: name || `${input.paperSize} ${input.totalPages}нүүр ${input.quantity}ш`,
      description, images, video_url: videoUrl, book_info: bookInfo,
      paper_configs: paperConfigs, size_configs: sizeConfigs,
      marginPercent, input, overrides, total: finalTotal, unitPrice: finalUnit,
      method: result.method,
      createdAt: initial?.createdAt || new Date().toISOString(),
    })
  }

  const token = typeof window !== 'undefined' ? getToken() : ''

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'flex-start', justifyContent: 'center', zIndex: 1000, padding: '20px', overflowY: 'auto' }}
      onClick={e => { if (e.target === e.currentTarget) onClose() }}>
      <div style={{ background: 'var(--surface)', borderRadius: 16, width: '100%', maxWidth: 1200, border: '1px solid var(--border)', overflow: 'hidden' }}>

        {/* Header */}
        <div style={{ padding: '16px 24px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h2 style={{ fontSize: 17, fontWeight: 700, margin: 0, color: 'var(--text)' }}>📖 Офсет бүтээгдэхүүн {initial ? '— Засах' : '— Шинэ'}</h2>
            <p style={{ fontSize: 12, color: 'var(--text3)', margin: '4px 0 0' }}>Бүрэн мэдээлэл, зураг, тооцоолуур, цаасны тохиргоо</p>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            {/* Mini price badge in header */}
            <div style={{ background: 'linear-gradient(135deg, #FF6B00, #FF8C42)', borderRadius: 10, padding: '8px 16px', color: '#fff', textAlign: 'right' }}>
              <div style={{ fontSize: 10, opacity: 0.8 }}>Нийт дүн</div>
              <div style={{ fontSize: 18, fontWeight: 800, letterSpacing: -0.5 }}>{fmt(finalTotal)}</div>
            </div>
            <button onClick={onClose} style={{ background: 'none', border: 'none', fontSize: 20, color: 'var(--text3)', cursor: 'pointer' }}>✕</button>
          </div>
        </div>

        {/* Tabs */}
        <div style={{ display: 'flex', borderBottom: '1px solid var(--border)', background: 'var(--surface2)', overflowX: 'auto' }}>
          {OFFSET_MODAL_TABS.map(t => (
            <button key={t.key} onClick={() => setTab(t.key)}
              style={{ padding: '10px 20px', background: 'none', border: 'none', borderBottom: tab === t.key ? '2px solid #FF6B00' : '2px solid transparent', cursor: 'pointer', fontFamily: FONT, whiteSpace: 'nowrap' }}>
              <div style={{ fontSize: 12, fontWeight: tab === t.key ? 700 : 500, color: tab === t.key ? '#FF6B00' : 'var(--text2)' }}>{t.label}</div>
              <div style={{ fontSize: 10, color: 'var(--text3)' }}>{t.desc}</div>
            </button>
          ))}
        </div>

        {/* Tab Content */}
        <div style={{ maxHeight: 'calc(100vh - 260px)', overflowY: 'auto' }}>

          {/* ═══ TAB: INFO ═══ */}
          {tab === 'info' && (
            <div style={{ padding: 24 }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 20 }}>
                <div>
                  <label style={labelStyle}>Бүтээгдэхүүний нэр *</label>
                  <input value={name} onChange={e => setName(e.target.value)} style={inp} placeholder="Ном, Сэтгүүл, Каталог, Брошур..." />
                </div>
                <div>
                  <label style={labelStyle}>Видео URL (YouTube, Vimeo)</label>
                  <input value={videoUrl} onChange={e => setVideoUrl(e.target.value)} style={inp} placeholder="https://youtube.com/watch?v=..." />
                </div>
              </div>

              <div style={{ marginBottom: 20 }}>
                <label style={labelStyle}>Дэлгэрэнгүй тайлбар</label>
                <textarea value={description} onChange={e => setDescription(e.target.value)}
                  style={{ ...inp, minHeight: 120, resize: 'vertical' }}
                  placeholder="Бүтээгдэхүүний дэлгэрэнгүй тайлбар, онцлог, давуу тал, хэрэглээ зэргийг бичнэ үү..." />
              </div>

              {/* Video preview */}
              {videoUrl && (
                <div style={{ marginBottom: 20 }}>
                  <label style={labelStyle}>Видео урьдчилсан харагдац</label>
                  <div style={{ borderRadius: 12, overflow: 'hidden', border: '1px solid var(--border)', aspectRatio: '16/9', maxWidth: 480 }}>
                    {videoUrl.includes('youtube.com') || videoUrl.includes('youtu.be') ? (
                      <iframe
                        src={`https://www.youtube.com/embed/${videoUrl.includes('youtu.be') ? videoUrl.split('/').pop() : new URLSearchParams(videoUrl.split('?')[1]).get('v')}`}
                        style={{ width: '100%', height: '100%', border: 'none' }} allowFullScreen />
                    ) : (
                      <video src={videoUrl} controls style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    )}
                  </div>
                </div>
              )}

              {/* Images — 8 images */}
              <div style={{ marginBottom: 16 }}>
                <label style={labelStyle}>Бүтээгдэхүүний зургууд (8 хүртэл)</label>
                <ProductMediaUploader
                  images={images}
                  videoUrl={videoUrl}
                  token={token || ''}
                  onChange={(imgs, vid) => { setImages(imgs); if (vid) setVideoUrl(vid) }}
                />
              </div>

              {/* Quick specs preview */}
              <div style={{ background: 'var(--surface2)', borderRadius: 10, padding: 16 }}>
                <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text2)', marginBottom: 10 }}>Товч мэдээлэл</div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10, fontSize: 12 }}>
                  <div><span style={{ color: 'var(--text3)' }}>Арга:</span> <strong>{result.method === 'offset' ? 'Офсет' : 'Дижитал'}</strong></div>
                  <div><span style={{ color: 'var(--text3)' }}>Тираж:</span> <strong>{input.quantity}ш</strong></div>
                  <div><span style={{ color: 'var(--text3)' }}>Нүүр:</span> <strong>{input.totalPages}</strong></div>
                  <div><span style={{ color: 'var(--text3)' }}>Нийт:</span> <strong style={{ color: '#FF6B00' }}>{fmt(finalTotal)}</strong></div>
                </div>
              </div>
            </div>
          )}

          {/* ═══ TAB: CALCULATOR ═══ */}
          {tab === 'calc' && (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 360px', overflow: 'hidden' }}>
              {/* LEFT: Inputs */}
              <div style={{ padding: 24, overflowY: 'auto', borderRight: '1px solid var(--border)', maxHeight: 'calc(100vh - 320px)' }}>
                {/* Method badge */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px', borderRadius: 10, marginBottom: 14,
                  background: result.method === 'offset' ? 'rgba(139,92,246,0.08)' : 'rgba(59,130,246,0.08)',
                  border: `1px solid ${result.method === 'offset' ? 'rgba(139,92,246,0.2)' : 'rgba(59,130,246,0.2)'}`,
                }}>
                  <span style={{ fontSize: 18 }}>{result.method === 'offset' ? '🖨️' : '⚡'}</span>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 700, color: result.method === 'offset' ? '#7C3AED' : '#2563EB' }}>
                      {result.method === 'offset' ? 'Офсет хэвлэл' : 'Дижитал хэвлэл (Шуурхай)'}
                    </div>
                    <div style={{ fontSize: 11, color: 'var(--text3)' }}>
                      {input.quantity}ш {result.method === 'offset' ? '≥ 300 → Офсет' : '< 300 → Дижитал'} · {result.signatures} багц × {result.pagesPerSig} нүүр{result.sizeMultiplier > 1 ? ` × ${result.sizeMultiplier} коэфф = ${result.effectiveSignatures} нийт багц` : ''}
                    </div>
                  </div>
                </div>

                {/* Core inputs */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 14 }}>
                  <div>
                    <label style={labelStyle}>Тоо ширхэг</label>
                    <input type="number" min={1} value={input.quantity} onChange={e => set('quantity', Math.max(1, +e.target.value))} style={inp} />
                  </div>
                  <div>
                    <label style={labelStyle}>Нийт нүүр</label>
                    <input type="number" min={1} value={input.totalPages} onChange={e => set('totalPages', Math.max(1, +e.target.value))} style={inp} />
                  </div>
                  <div>
                    <label style={labelStyle}>Хэмжээ</label>
                    <select value={input.paperSize} onChange={e => set('paperSize', e.target.value)} style={{ ...inp, cursor: 'pointer' }}>
                      {sizeConfigs.filter(s => s.code !== 'CUSTOM').map(s => <option key={s.code} value={s.code}>{s.label}</option>)}
                    </select>
                  </div>
                  <div>
                    <label style={labelStyle}>Цаасны GSM</label>
                    <select value={String(input.paperGsm)} onChange={e => set('paperGsm', +e.target.value)} style={{ ...inp, cursor: 'pointer' }}>
                      {paperConfigs.map(p => <option key={p.gsm} value={p.gsm}>{p.label} — {p.price}₮</option>)}
                    </select>
                  </div>
                  <div>
                    <label style={labelStyle}>Өнгө</label>
                    <select value={input.colorMode} onChange={e => set('colorMode', e.target.value)} style={{ ...inp, cursor: 'pointer' }}>
                      <option value="color">Өнгөт (4+4)</option>
                      <option value="bw">Хар цагаан (1+1)</option>
                    </select>
                  </div>
                  <div>
                    <label style={labelStyle}>Хавтаслалт</label>
                    <select value={input.bindingType} onChange={e => set('bindingType', e.target.value)} style={{ ...inp, cursor: 'pointer' }}>
                      <option value="">Байхгүй</option>
                      {Object.keys(customConstants.bindingPrices).map(k => <option key={k} value={k}>{k}</option>)}
                    </select>
                  </div>
                  <div style={{ gridColumn: '1 / -1' }}>
                    <label style={labelStyle}>Ашгийн хувь (%)</label>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <input type="number" min={0} max={100} value={Math.round(marginPercent * 100)}
                        onChange={e => setMarginPercent(Math.max(0, Math.min(100, +e.target.value)) / 100)}
                        style={{ ...inp, width: 100, fontWeight: 700, color: '#FF6B00' }} />
                      <span style={{ fontSize: 12, color: 'var(--text3)' }}>
                        Хэрэглэгчид харагдахгүй, нийт үнэд шингэнэ
                      </span>
                    </div>
                  </div>
                </div>

                {/* Post-press toggles */}
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 14 }}>
                  {[
                    { key: 'hasCover', label: '📄 Хавтас' },
                    ...(result.method === 'offset' ? [
                      { key: 'folding', label: '📑 Бүрэлт' },
                      { key: 'uvCoating', label: '✨ UV лак' },
                      { key: 'dieCutting', label: '✂️ Тигел' },
                      { key: 'embossing', label: '🔖 Эмбосс' },
                    ] : []),
                  ].map(opt => {
                    const val = (input as any)[opt.key]
                    return (
                      <button key={opt.key} onClick={() => set(opt.key as any, !val)}
                        style={{ padding: '6px 14px', borderRadius: 8, fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: FONT,
                          background: val ? 'rgba(255,107,0,0.08)' : 'var(--surface2)',
                          color: val ? '#FF6B00' : 'var(--text3)',
                          border: `1px solid ${val ? 'rgba(255,107,0,0.3)' : 'var(--border)'}`,
                        }}>
                        {opt.label}
                      </button>
                    )
                  })}
                </div>

                {/* Cover config */}
                {input.hasCover && (
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 14, background: 'var(--surface2)', borderRadius: 10, padding: 12 }}>
                    <div>
                      <label style={labelStyle}>Хавтас GSM</label>
                      <select value={String(input.coverGsm)} onChange={e => set('coverGsm', +e.target.value)} style={{ ...inp, cursor: 'pointer' }}>
                        {paperConfigs.filter(p => p.gsm >= 200).map(p => <option key={p.gsm} value={p.gsm}>{p.label} — {p.price}₮</option>)}
                      </select>
                    </div>
                    <div>
                      <label style={labelStyle}>Хавтас өнгө</label>
                      <select value={input.coverColorMode} onChange={e => set('coverColorMode', e.target.value)} style={{ ...inp, cursor: 'pointer' }}>
                        <option value="color">Өнгөт</option><option value="bw">Хар цагаан</option>
                      </select>
                    </div>
                  </div>
                )}

                {/* Warnings */}
                {result.warnings.length > 0 && (
                  <div style={{ background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.2)', borderRadius: 8, padding: '8px 12px', fontSize: 12, color: '#D97706' }}>
                    ⚠️ {result.warnings.join(' | ')}
                  </div>
                )}
              </div>

              {/* RIGHT: Results */}
              <div style={{ padding: 20, overflowY: 'auto', background: 'var(--surface2)', maxHeight: 'calc(100vh - 320px)' }}>
                {/* Total card */}
                <div style={{ background: 'linear-gradient(135deg, #FF6B00, #FF8C42)', borderRadius: 12, padding: '16px 18px', marginBottom: 16, color: '#fff' }}>
                  <div style={{ fontSize: 11, fontWeight: 600, opacity: 0.8 }}>Нийт дүн</div>
                  <div style={{ fontSize: 28, fontWeight: 800, letterSpacing: -1 }}>{fmt(finalTotal)}</div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 8, paddingTop: 8, borderTop: '1px solid rgba(255,255,255,0.2)', fontSize: 13 }}>
                    <span style={{ opacity: 0.8 }}>Нэгж үнэ</span><span style={{ fontWeight: 700 }}>{fmt(finalUnit)}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13 }}>
                    <span style={{ opacity: 0.8 }}>Тираж</span><span style={{ fontWeight: 700 }}>{input.quantity} ш</span>
                  </div>
                  {Object.keys(overrides).length > 0 && (
                    <div style={{ fontSize: 10, opacity: 0.7, marginTop: 6, cursor: 'pointer' }}
                      onClick={() => { setOverrides({}); setEditingKey(null) }}>
                      🖊 {Object.keys(overrides).length} гараар засагдсан · Арилгах
                    </div>
                  )}
                </div>

                {/* Line items */}
                <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text2)', marginBottom: 8 }}>Үнийн задаргаа</div>
                <div style={{ background: 'var(--surface)', borderRadius: 10, border: '1px solid var(--border)', overflow: 'hidden', marginBottom: 16 }}>
                  {finalLines.map((line, i) => (
                    <div key={line.key}
                      style={{ padding: '10px 12px', borderBottom: i < finalLines.length - 1 ? '1px solid var(--border)' : 'none', cursor: 'pointer',
                        background: line.isOverridden ? 'rgba(245,158,11,0.05)' : 'transparent',
                      }}
                      onClick={() => setEditingKey(editingKey === line.key ? null : line.key)}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text)', display: 'flex', alignItems: 'center', gap: 4 }}>
                          {line.label}
                          {line.isOverridden && <span style={{ fontSize: 9, color: '#D97706' }}>🖊</span>}
                        </div>
                        <div style={{ fontSize: 12, fontWeight: 700, color: line.isOverridden ? '#D97706' : 'var(--text)' }}>{fmt(line.amount)}</div>
                      </div>
                      <div style={{ fontSize: 10, color: 'var(--text3)', marginTop: 2 }}>{line.detail}</div>
                      {editingKey === line.key && (
                        <div style={{ marginTop: 6, display: 'flex', gap: 6, alignItems: 'center' }} onClick={e => e.stopPropagation()}>
                          <input type="number" defaultValue={line.amount} autoFocus
                            onKeyDown={e => {
                              if (e.key === 'Enter') { setOverrides(p => ({ ...p, [line.key]: +(e.target as HTMLInputElement).value })); setEditingKey(null) }
                              if (e.key === 'Escape') setEditingKey(null)
                            }}
                            style={{ ...inp, width: 120, padding: '5px 8px', fontSize: 12, border: '1px solid #F59E0B' }} />
                          <button onClick={e => {
                            const el = (e.target as HTMLElement).parentElement?.querySelector('input') as HTMLInputElement
                            if (el) { setOverrides(p => ({ ...p, [line.key]: +el.value })); setEditingKey(null) }
                          }} style={{ padding: '4px 10px', background: '#FF6B00', color: '#fff', border: 'none', borderRadius: 6, fontSize: 11, fontWeight: 600, cursor: 'pointer', fontFamily: FONT }}>OK</button>
                          {line.isOverridden && (
                            <button onClick={() => { setOverrides(p => { const n = { ...p }; delete n[line.key]; return n }); setEditingKey(null) }}
                              style={{ padding: '4px 8px', background: 'var(--surface2)', border: '1px solid var(--border)', borderRadius: 6, fontSize: 10, cursor: 'pointer', fontFamily: FONT, color: 'var(--text3)' }}>↩</button>
                          )}
                        </div>
                      )}
                    </div>
                  ))}
                  <div style={{ padding: '10px 12px', background: 'var(--surface2)', display: 'flex', justifyContent: 'space-between', borderTop: '2px solid rgba(255,107,0,0.2)' }}>
                    <span style={{ fontWeight: 700, fontSize: 13, color: 'var(--text)' }}>Нийт</span>
                    <span style={{ fontWeight: 800, fontSize: 15, color: '#FF6B00' }}>{fmt(finalTotal)}</span>
                  </div>
                </div>
                <div style={{ fontSize: 10, color: 'var(--text3)', lineHeight: 1.6 }}>
                  Арга: <strong>{result.method === 'offset' ? 'Офсет' : 'Дижитал'}</strong> · Багц: <strong>{result.signatures}</strong> ({result.pagesPerSig}нүүр){result.sizeMultiplier > 1 ? <> · Коэфф: <strong style={{ color: '#FF6B00' }}>×{result.sizeMultiplier}</strong> · Нийт: <strong style={{ color: '#FF6B00' }}>{result.effectiveSignatures}</strong></> : ''} · Хуудас: <strong>{result.sheetsNeeded.toLocaleString()}</strong>
                </div>
              </div>
            </div>
          )}

          {/* ═══ TAB: PAPER & SIZE CONFIG ═══ */}
          {tab === 'paper' && (
            <div style={{ padding: 24 }}>
              {/* Paper types */}
              <div style={{ marginBottom: 28 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text)' }}>📄 Цаасны төрөл & Үнэ</div>
                    <div style={{ fontSize: 11, color: 'var(--text3)', marginTop: 2 }}>Цаасны зузаан (GSM), нэр, хуудасны үнийг тохируулна</div>
                  </div>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <button onClick={() => { setPaperConfigs([...DEFAULT_PAPER_CONFIGS]); }} style={{ ...btnSecondary, fontSize: 11, padding: '6px 12px' }}>↩ Анхны утга</button>
                    <button onClick={addPaper} style={{ ...btnPrimary, fontSize: 11, padding: '6px 12px' }}>+ Цаас нэмэх</button>
                  </div>
                </div>
                <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 10, overflow: 'hidden' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
                    <thead>
                      <tr style={{ background: 'var(--surface2)' }}>
                        <th style={{ ...thStyle, width: 40 }}>#</th>
                        <th style={thStyle}>Нэр</th>
                        <th style={{ ...thStyle, width: 100 }}>GSM</th>
                        <th style={{ ...thStyle, width: 120 }}>Үнэ (₮/хуудас)</th>
                        <th style={{ ...thStyle, width: 60 }}></th>
                      </tr>
                    </thead>
                    <tbody>
                      {paperConfigs.map((p, i) => (
                        <tr key={i} style={{ borderBottom: '1px solid var(--border)' }}>
                          <td style={{ ...tdStyle, color: 'var(--text3)', fontSize: 11 }}>{i + 1}</td>
                          <td style={tdStyle}>
                            <input value={p.label} onChange={e => updatePaper(i, 'label', e.target.value)}
                              style={{ ...inp, padding: '6px 10px', fontSize: 12 }} placeholder="80gsm (Энгийн)" />
                          </td>
                          <td style={tdStyle}>
                            <input type="number" value={p.gsm} onChange={e => updatePaper(i, 'gsm', +e.target.value)}
                              style={{ ...inp, padding: '6px 10px', fontSize: 12, textAlign: 'center' }} />
                          </td>
                          <td style={tdStyle}>
                            <input type="number" value={p.price} onChange={e => updatePaper(i, 'price', +e.target.value)}
                              style={{ ...inp, padding: '6px 10px', fontSize: 12, textAlign: 'right', fontWeight: 700 }} />
                          </td>
                          <td style={{ ...tdStyle, textAlign: 'center' }}>
                            <button onClick={() => removePaper(i)} style={{ background: 'none', border: 'none', color: '#EF4444', cursor: 'pointer', fontSize: 14 }}>✕</button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <div style={{ fontSize: 10, color: 'var(--text3)', marginTop: 6 }}>
                  Нийт {paperConfigs.length} төрлийн цаас · GSM бага → том руу эрэмбэлнэ
                </div>
              </div>

              {/* Size configs */}
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text)' }}>📐 Хэмжээ & Багц тохиргоо</div>
                    <div style={{ fontSize: 11, color: 'var(--text3)', marginTop: 2 }}>Цаасны хэмжээ, мм, багц дахь нүүрний тоог тохируулна</div>
                  </div>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <button onClick={() => { setSizeConfigs([...DEFAULT_SIZE_CONFIGS]); }} style={{ ...btnSecondary, fontSize: 11, padding: '6px 12px' }}>↩ Анхны утга</button>
                    <button onClick={addSize} style={{ ...btnPrimary, fontSize: 11, padding: '6px 12px' }}>+ Хэмжээ нэмэх</button>
                  </div>
                </div>
                <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 10, overflow: 'hidden' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
                    <thead>
                      <tr style={{ background: 'var(--surface2)' }}>
                        <th style={{ ...thStyle, width: 40 }}>#</th>
                        <th style={{ ...thStyle, width: 80 }}>Код</th>
                        <th style={thStyle}>Нэр</th>
                        <th style={{ ...thStyle, width: 90 }}>Өргөн (мм)</th>
                        <th style={{ ...thStyle, width: 90 }}>Өндөр (мм)</th>
                        <th style={{ ...thStyle, width: 100 }}>Нүүр/Багц</th>
                        <th style={{ ...thStyle, width: 60 }}></th>
                      </tr>
                    </thead>
                    <tbody>
                      {sizeConfigs.map((s, i) => (
                        <tr key={i} style={{ borderBottom: '1px solid var(--border)' }}>
                          <td style={{ ...tdStyle, color: 'var(--text3)', fontSize: 11 }}>{i + 1}</td>
                          <td style={tdStyle}>
                            <input value={s.code} onChange={e => updateSize(i, 'code', e.target.value)}
                              style={{ ...inp, padding: '6px 10px', fontSize: 12, fontWeight: 700 }} placeholder="A4" />
                          </td>
                          <td style={tdStyle}>
                            <input value={s.label} onChange={e => updateSize(i, 'label', e.target.value)}
                              style={{ ...inp, padding: '6px 10px', fontSize: 12 }} placeholder="A4 (210×297мм)" />
                          </td>
                          <td style={tdStyle}>
                            <input type="number" value={s.width_mm} onChange={e => updateSize(i, 'width_mm', +e.target.value)}
                              style={{ ...inp, padding: '6px 10px', fontSize: 12, textAlign: 'center' }} />
                          </td>
                          <td style={tdStyle}>
                            <input type="number" value={s.height_mm} onChange={e => updateSize(i, 'height_mm', +e.target.value)}
                              style={{ ...inp, padding: '6px 10px', fontSize: 12, textAlign: 'center' }} />
                          </td>
                          <td style={tdStyle}>
                            <input type="number" value={s.pagesPerSig} onChange={e => updateSize(i, 'pagesPerSig', Math.max(1, +e.target.value))}
                              style={{ ...inp, padding: '6px 10px', fontSize: 12, textAlign: 'center', fontWeight: 700 }} />
                          </td>
                          <td style={{ ...tdStyle, textAlign: 'center' }}>
                            <button onClick={() => removeSize(i)} style={{ background: 'none', border: 'none', color: '#EF4444', cursor: 'pointer', fontSize: 14 }}>✕</button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <div style={{ fontSize: 10, color: 'var(--text3)', marginTop: 6 }}>
                  Нүүр/Багц = 1 signature дотор хичнээн нүүр багтах · A3=2, A4=4, B5=8, A5=8
                </div>
              </div>
            </div>
          )}

          {/* ═══ TAB: BOOK STANDARDS & TIPS ═══ */}
          {tab === 'book' && (
            <div style={{ padding: 24 }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
                {/* Left: Standards */}
                <div>
                  <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text)', marginBottom: 14 }}>📖 Номын стандарт мэдээлэл</div>

                  <div style={{ marginBottom: 14 }}>
                    <label style={labelStyle}>Стандарт хэмжээнүүд</label>
                    <input value={bookInfo.standard_sizes}
                      onChange={e => setBookInfo(prev => ({ ...prev, standard_sizes: e.target.value }))}
                      style={inp} placeholder="A4 (210×297мм), A5 (148×210мм), B5 (176×250мм)" />
                  </div>

                  <div style={{ marginBottom: 14 }}>
                    <label style={labelStyle}>Зөвлөмж нүүрний тоо</label>
                    <input value={bookInfo.recommended_pages}
                      onChange={e => setBookInfo(prev => ({ ...prev, recommended_pages: e.target.value }))}
                      style={inp} placeholder="32, 48, 64, 96, 128, 192, 256" />
                  </div>

                  <div style={{ marginBottom: 14 }}>
                    <label style={labelStyle}>Зөвлөмж цаас</label>
                    <input value={bookInfo.recommended_paper}
                      onChange={e => setBookInfo(prev => ({ ...prev, recommended_paper: e.target.value }))}
                      style={inp} placeholder="80gsm дотор хуудас, 250gsm хавтас" />
                  </div>

                  <div style={{ marginBottom: 14 }}>
                    <label style={labelStyle}>Видео танилцуулга URL</label>
                    <input value={bookInfo.video_intro_url}
                      onChange={e => setBookInfo(prev => ({ ...prev, video_intro_url: e.target.value }))}
                      style={inp} placeholder="https://youtube.com/watch?v=..." />
                  </div>

                  {/* Video preview */}
                  {bookInfo.video_intro_url && (
                    <div style={{ borderRadius: 10, overflow: 'hidden', border: '1px solid var(--border)', aspectRatio: '16/9' }}>
                      {bookInfo.video_intro_url.includes('youtube.com') || bookInfo.video_intro_url.includes('youtu.be') ? (
                        <iframe
                          src={`https://www.youtube.com/embed/${bookInfo.video_intro_url.includes('youtu.be') ? bookInfo.video_intro_url.split('/').pop() : new URLSearchParams(bookInfo.video_intro_url.split('?')[1]).get('v')}`}
                          style={{ width: '100%', height: '100%', border: 'none' }} allowFullScreen />
                      ) : (
                        <video src={bookInfo.video_intro_url} controls style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      )}
                    </div>
                  )}
                </div>

                {/* Right: Tips & Info */}
                <div>
                  <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text)', marginBottom: 14 }}>💡 Зөвлөгөө & Тайлбар</div>

                  <div style={{ marginBottom: 14 }}>
                    <label style={labelStyle}>Зөвлөгөө (мөр бүр шинэ зөвлөгөө)</label>
                    <textarea value={bookInfo.tips}
                      onChange={e => setBookInfo(prev => ({ ...prev, tips: e.target.value }))}
                      style={{ ...inp, minHeight: 200, resize: 'vertical', lineHeight: 1.8 }}
                      placeholder="• Нүүрний тоо 4, 8, 16-д хуваагдвал цаас хэмнэнэ..." />
                  </div>

                  {/* Tips preview */}
                  <div style={{ background: 'var(--surface2)', borderRadius: 10, padding: 16 }}>
                    <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--text2)', marginBottom: 8 }}>Урьдчилсан харагдац:</div>
                    <div style={{ fontSize: 12, color: 'var(--text)', lineHeight: 2, whiteSpace: 'pre-wrap' }}>{bookInfo.tips}</div>
                  </div>

                  {/* Quick info cards */}
                  <div style={{ marginTop: 16, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                    <div style={{ background: 'rgba(139,92,246,0.06)', border: '1px solid rgba(139,92,246,0.15)', borderRadius: 8, padding: 10 }}>
                      <div style={{ fontSize: 10, color: '#7C3AED', fontWeight: 700, marginBottom: 4 }}>🖨️ ОФСЕТ</div>
                      <div style={{ fontSize: 11, color: 'var(--text2)' }}>300+ ширхэг · Хавтан хэвлэл · 3-7 хоног</div>
                    </div>
                    <div style={{ background: 'rgba(59,130,246,0.06)', border: '1px solid rgba(59,130,246,0.15)', borderRadius: 8, padding: 10 }}>
                      <div style={{ fontSize: 10, color: '#2563EB', fontWeight: 700, marginBottom: 4 }}>⚡ ДИЖИТАЛ</div>
                      <div style={{ fontSize: 11, color: 'var(--text2)' }}>1-299 ширхэг · Шуурхай · 1-2 хоног</div>
                    </div>
                    <div style={{ background: 'rgba(16,185,129,0.06)', border: '1px solid rgba(16,185,129,0.15)', borderRadius: 8, padding: 10 }}>
                      <div style={{ fontSize: 10, color: '#059669', fontWeight: 700, marginBottom: 4 }}>📐 ХЭМЖЭЭ</div>
                      <div style={{ fontSize: 11, color: 'var(--text2)' }}>{bookInfo.standard_sizes}</div>
                    </div>
                    <div style={{ background: 'rgba(245,158,11,0.06)', border: '1px solid rgba(245,158,11,0.15)', borderRadius: 8, padding: 10 }}>
                      <div style={{ fontSize: 10, color: '#D97706', fontWeight: 700, marginBottom: 4 }}>📄 ЦААС</div>
                      <div style={{ fontSize: 11, color: 'var(--text2)' }}>{bookInfo.recommended_paper}</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div style={{ padding: '14px 24px', borderTop: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <button onClick={() => window.open('/admin/print-calculator', '_blank')}
            style={{ ...btnSecondary, fontSize: 12, display: 'flex', alignItems: 'center', gap: 6 }}>
            ⚙️ Global тохиргоо
          </button>
          <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
            <span style={{ fontSize: 12, color: 'var(--text3)' }}>
              {images.length} зураг · {paperConfigs.length} цаас · {sizeConfigs.length} хэмжээ
            </span>
            <button onClick={onClose} style={btnSecondary}>Хаах</button>
            <button onClick={handleSave} style={btnPrimary}>
              {initial ? '💾 Шинэчлэх' : '📖 Бүтээгдэхүүн үүсгэх'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── MAIN PAGE ────────────────────────────────────────────────────────────────
const MAIN_TABS = [
  { key: 'shop', label: '🛍️ Дэлгүүр', desc: 'Бэлэн бүтээгдэхүүн · Тогтмол үнэ' },
  { key: 'print', label: '🖨️ Хэвлэмэл', desc: 'Файл хавсаргах · Тооцоолол' },
  { key: 'offset', label: '📖 Офсет бүтээгдэхүүн', desc: 'Ном, Сэтгүүл · Ухаалаг тооцоолол' },
  { key: 'signage', label: '🪧 Хаяг самбар', desc: 'М² тооцоолол · Суурилуулалт' },
  { key: 'templates', label: '🎨 Дизайн загвар', desc: 'Загвар · Дижитал' },
]

export default function AdminProductsPage() {
  const [activeTab, setActiveTab] = useState('shop')

  return (
    <div className="p-4 md:p-6">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 12 }}>
        <AdminPageHeader title="Бүтээгдэхүүн" description="Бүх бүтээгдэхүүн, дэлгүүр болон загваруудыг удирдах" />
        <div style={{ display: 'flex', gap: 8 }}>
          <a href={`${API_URL}/api/products/export?productType=${activeTab === 'templates' ? 'design' : activeTab}`}
            style={{ ...btnSecondary, textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 4 }}>
            📥 Excel татах
          </a>
          <a href="/admin/import" style={{ ...btnPrimary, textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 4 }}>
            📤 Excel оруулах
          </a>
        </div>
      </div>

      {/* Type Tabs */}
      <div style={{ display: 'flex', gap: 0, borderBottom: '1px solid var(--border)', marginBottom: 24, overflowX: 'auto' }}>
        {MAIN_TABS.map(tab => (
          <button key={tab.key} onClick={() => setActiveTab(tab.key)} style={{ padding: '12px 24px', background: 'none', border: 'none', borderBottom: activeTab === tab.key ? '2px solid #FF6B00' : '2px solid transparent', cursor: 'pointer', fontFamily: FONT, display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: 2, whiteSpace: 'nowrap' }}>
            <span style={{ fontSize: 13, fontWeight: activeTab === tab.key ? 700 : 500, color: activeTab === tab.key ? '#FF6B00' : 'var(--text2)' }}>{tab.label}</span>
            <span style={{ fontSize: 11, color: 'var(--text3)' }}>{tab.desc}</span>
          </button>
        ))}
      </div>

      {/* Tab Content */}
      {activeTab === 'shop' && <ShopProductsTab />}
      {activeTab === 'print' && <PrintProductsTab />}
      {activeTab === 'offset' && <OffsetProductsTab />}
      {activeTab === 'signage' && <SignageProductsTab />}
      {activeTab === 'templates' && <TemplatesTab />}
    </div>
  )
}
