'use client'
import React, { useState } from 'react'
import React, { useRouter } from 'next/navigation'
import React, { apiFetch } from '@/lib/api'

const CATEGORIES = ['business-card', 'flyer', 'banner', 'sticker', 'book', 'packaging', 'signage', 'merchandise', 'office', 'events', 'apparel']

export default function NewProductPage() {
  const router = useRouter()
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({ name_mn: '', slug: '', category: 'flyer', description: '', base_price: '', stock_quantity: '', thumbnail_url: '', lead_time_days: '3', is_active: true, is_featured: false, product_type: 'shop', min_quantity: '1' })

  const set = (k: string, v: any) => setForm(p => ({ ...p, [k]: v }))

  const handleSave = async () => {
    if (!form.name_mn || !form.base_price) return
    setSaving(true)
    try {
      const slug = form.slug || form.name_mn.toLowerCase().replace(/\s+/g, '-').replace(/[^\w-]/g, '') + '-' + Date.now()
      await apiFetch('/products', { method: 'POST', body: { ...form, slug, name: form.name_mn, base_price: parseFloat(form.base_price), stock_quantity: form.stock_quantity ? parseInt(form.stock_quantity) : null, lead_time_days: parseInt(form.lead_time_days), min_quantity: parseInt(form.min_quantity), images: form.thumbnail_url ? [form.thumbnail_url] : [] } })
      router.push('/admin/products')
    } catch (e: any) { alert(e.message || 'Алдаа гарлаа') }
    setSaving(false)
  }

  const inputSt: React.CSSProperties = { width: '100%', padding: '10px 14px', borderRadius: 8, border: '1px solid var(--border)', background: 'var(--surface2)', fontSize: 13, color: 'var(--text)', outline: 'none', boxSizing: 'border-box' }

  return (
    <div style={{ padding: '24px 20px', maxWidth: 600, margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <h1 style={{ fontSize: 20, fontWeight: 700, color: 'var(--text)' }}>Шинэ бүтээгдэхүүн</h1>
        <div style={{ display: 'flex', gap: 8 }}>
          <button onClick={() => router.back()} style={{ padding: '8px 16px', borderRadius: 8, background: 'var(--surface2)', color: 'var(--text2)', border: '1px solid var(--border)', cursor: 'pointer', fontSize: 13 }}>Буцах</button>
          <button onClick={handleSave} disabled={saving} style={{ padding: '8px 20px', borderRadius: 8, background: '#FF6B00', color: '#fff', border: 'none', cursor: 'pointer', fontSize: 13, fontWeight: 600, opacity: saving ? 0.6 : 1 }}>{saving ? 'Хадгалж байна...' : 'Хадгалах'}</button>
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        <div><label style={{ fontSize: 12, color: 'var(--text2)', marginBottom: 6, display: 'block' }}>Нэр (Монгол) *</label><input value={form.name_mn} onChange={e => set('name_mn', e.target.value)} placeholder="Стандарт нэрийн хуудас" style={inputSt} /></div>

        <div><label style={{ fontSize: 12, color: 'var(--text2)', marginBottom: 6, display: 'block' }}>Ангилал</label>
          <select value={form.category} onChange={e => set('category', e.target.value)} style={inputSt}>{CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}</select>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <div><label style={{ fontSize: 12, color: 'var(--text2)', marginBottom: 6, display: 'block' }}>Үнэ (MNT) *</label><input type="number" value={form.base_price} onChange={e => set('base_price', e.target.value)} placeholder="3000" style={inputSt} /></div>
          <div><label style={{ fontSize: 12, color: 'var(--text2)', marginBottom: 6, display: 'block' }}>Нөөц</label><input type="number" value={form.stock_quantity} onChange={e => set('stock_quantity', e.target.value)} placeholder="100" style={inputSt} /></div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <div><label style={{ fontSize: 12, color: 'var(--text2)', marginBottom: 6, display: 'block' }}>Хүргэх хоног</label><input type="number" value={form.lead_time_days} onChange={e => set('lead_time_days', e.target.value)} style={inputSt} /></div>
          <div><label style={{ fontSize: 12, color: 'var(--text2)', marginBottom: 6, display: 'block' }}>Мин. тираж</label><input type="number" value={form.min_quantity} onChange={e => set('min_quantity', e.target.value)} style={inputSt} /></div>
        </div>

        <div><label style={{ fontSize: 12, color: 'var(--text2)', marginBottom: 6, display: 'block' }}>Зургийн URL</label><input value={form.thumbnail_url} onChange={e => set('thumbnail_url', e.target.value)} placeholder="https://..." style={inputSt} />
          {form.thumbnail_url && <img src={form.thumbnail_url} alt="" style={{ width: 64, height: 64, objectFit: 'cover', borderRadius: 8, marginTop: 8 }} />}
        </div>

        <div><label style={{ fontSize: 12, color: 'var(--text2)', marginBottom: 6, display: 'block' }}>Тайлбар</label><textarea value={form.description} onChange={e => set('description', e.target.value)} rows={3} placeholder="Тайлбар..." style={{ ...inputSt, resize: 'vertical' }} /></div>

        <div style={{ display: 'flex', gap: 16 }}>
          {[{ key: 'is_active', label: 'Идэвхтэй' }, { key: 'is_featured', label: 'Онцлох' }].map(t => (
            <label key={t.key} style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer', fontSize: 13, color: 'var(--text2)' }}>
              <input type="checkbox" checked={(form as any)[t.key]} onChange={e => set(t.key, e.target.checked)} style={{ accentColor: '#FF6B00' }} />{t.label}
            </label>
          ))}
        </div>
      </div>
    </div>
  )
}
