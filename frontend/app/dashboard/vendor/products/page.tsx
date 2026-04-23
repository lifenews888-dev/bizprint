'use client'
import { apiFetch } from '@/lib/api'
import { useState, useEffect } from 'react'
import DashboardLayout from '@/components/layouts/DashboardLayout'
import KpiCard from '@/components/dashboard/KpiCard'
import { useRoleGuard } from '@/lib/use-role-guard'
import { VENDOR_MENU } from '@/config/sidebar-config'

interface Product {
  id: string
  name: string
  description?: string
  price: number
  isActive: boolean
  imageUrl?: string
  category?: { id: string; name: string }
  createdAt: string
}

const F = "'Segoe UI',system-ui,sans-serif"
const EMPTY_FORM = { name: '', description: '', price: '', isActive: true }

export default function VendorProductsPage() {
  const { user: guardUser, loading: authLoading } = useRoleGuard(['vendor', 'admin'])
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editing, setEditing] = useState<Product | null>(null)
  const [form, setForm] = useState(EMPTY_FORM)
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState<string | null>(null)
  const [search, setSearch] = useState('')

  useEffect(() => {
    if (authLoading) return
    fetchProducts()
  }, [authLoading])

  async function fetchProducts() {
    try {
      const data = await apiFetch<Product[]>('/vendor-store/products')
      setProducts(Array.isArray(data) ? data : [])
    } catch {
      setProducts([])
    } finally {
      setLoading(false)
    }
  }

  function openAdd() {
    setEditing(null)
    setForm(EMPTY_FORM)
    setShowModal(true)
  }

  function openEdit(p: Product) {
    setEditing(p)
    setForm({ name: p.name, description: p.description || '', price: String(p.price), isActive: p.isActive })
    setShowModal(true)
  }

  async function handleSave() {
    if (!form.name || !form.price) return
    setSaving(true)
    try {
      const body = { name: form.name, description: form.description, price: Number(form.price), isActive: form.isActive }
      if (editing) {
        await apiFetch('/vendor-store/products/' + editing.id, { method: 'PATCH', body })
      } else {
        await apiFetch('/vendor-store/products', { method: 'POST', body })
      }
      setShowModal(false)
      fetchProducts()
    } catch {}
    finally { setSaving(false) }
  }

  async function handleDelete(id: string) {
    if (!confirm('Устгахдаа итгэлтэй байна уу?')) return
    setDeleting(id)
    try {
      await apiFetch('/vendor-store/products/' + id, { method: 'DELETE' })
      fetchProducts()
    } catch {}
    finally { setDeleting(null) }
  }

  const filtered = products.filter(p => p.name.toLowerCase().includes(search.toLowerCase()))
  const active = products.filter(p => p.isActive).length
  const inactive = products.filter(p => !p.isActive).length

  if (authLoading) return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text2)' }}>
      Ачааллаж байна...
    </div>
  )

  return (
    <DashboardLayout navGroups={VENDOR_MENU} user={guardUser || undefined}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24, flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 700, margin: 0 }}>Миний бүтээгдэхүүн</h1>
          <p style={{ color: 'var(--text2)', fontSize: 13, margin: '4px 0 0' }}>Vendor дэлгүүрийн бүтээгдэхүүн удирдлага</p>
        </div>
        <button onClick={openAdd} style={{ padding: '10px 20px', background: 'var(--orange)', color: '#fff', border: 'none', borderRadius: 10, cursor: 'pointer', fontSize: 14, fontWeight: 600, fontFamily: F }}>
          + Бүтээгдэхүүн нэмэх
        </button>
      </div>

      <KpiCard items={[
        { label: 'Нийт', value: products.length, color: 'orange', icon: '📦' },
        { label: 'Идэвхтэй', value: active, color: 'green', icon: '✅' },
        { label: 'Идэвхгүй', value: inactive, color: 'gray', icon: '⏸️' },
      ]} />

      <div style={{ padding: '16px 0 8px' }}>
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Бүтээгдэхүүн хайх..." style={{ width: '100%', maxWidth: 320, padding: '10px 14px', background: '#0F0F0F', border: '1px solid #1A1A1A', borderRadius: 8, color: '#F1F5F9', fontSize: 14, fontFamily: F, outline: 'none', boxSizing: 'border-box' }} />
      </div>

      <div style={{ background: '#0F0F0F', border: '1px solid #1A1A1A', borderRadius: 16, overflow: 'hidden', marginTop: 8 }}>
        {loading ? (
          <div style={{ textAlign: 'center', padding: 40, color: '#666' }}>Уншиж байна...</div>
        ) : filtered.length === 0 ? (
          <div style={{ textAlign: 'center', padding: 60, color: '#666' }}>
            <div style={{ fontSize: 32, marginBottom: 12 }}>📦</div>
            <div style={{ fontWeight: 600, marginBottom: 8 }}>Бүтээгдэхүүн байхгүй</div>
            <div style={{ fontSize: 13 }}>"Бүтээгдэхүүн нэмэх" дарж эхлэнэ үү</div>
          </div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse', fontFamily: F }}>
            <thead>
              <tr style={{ borderBottom: '1px solid #1A1A1A' }}>
                {['Нэр', 'Үнэ', 'Ангилал', 'Статус', 'Үйлдэл'].map(h => (
                  <th key={h} style={{ padding: '14px 20px', textAlign: 'left', fontSize: 12, fontWeight: 600, color: '#666', textTransform: 'uppercase' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((p, i) => (
                <tr key={p.id} style={{ borderBottom: i < filtered.length - 1 ? '1px solid #111' : 'none' }}>
                  <td style={{ padding: '14px 20px' }}>
                    <div style={{ fontWeight: 600, color: '#F1F5F9', fontSize: 14 }}>{p.name}</div>
                    {p.description && <div style={{ fontSize: 12, color: '#666', marginTop: 2 }}>{p.description.slice(0, 60)}{p.description.length > 60 ? '...' : ''}</div>}
                  </td>
                  <td style={{ padding: '14px 20px', color: 'var(--orange)', fontWeight: 700, fontSize: 14 }}>₮{Number(p.price).toLocaleString()}</td>
                  <td style={{ padding: '14px 20px', color: '#888', fontSize: 13 }}>{p.category?.name || '—'}</td>
                  <td style={{ padding: '14px 20px' }}>
                    <span style={{ fontSize: 12, padding: '3px 10px', borderRadius: 99, fontWeight: 600, background: p.isActive ? 'rgba(16,185,129,0.12)' : 'rgba(100,100,100,0.12)', color: p.isActive ? '#10B981' : '#666' }}>
                      {p.isActive ? 'Идэвхтэй' : 'Идэвхгүй'}
                    </span>
                  </td>
                  <td style={{ padding: '14px 20px' }}>
                    <div style={{ display: 'flex', gap: 8 }}>
                      <button onClick={() => openEdit(p)} style={{ padding: '6px 14px', background: '#1A1A1A', color: '#F1F5F9', border: '1px solid #2A2A2A', borderRadius: 7, cursor: 'pointer', fontSize: 12, fontWeight: 600, fontFamily: F }}>Засах</button>
                      <button onClick={() => handleDelete(p.id)} disabled={deleting === p.id} style={{ padding: '6px 14px', background: 'rgba(239,68,68,0.1)', color: '#EF4444', border: '1px solid rgba(239,68,68,0.2)', borderRadius: 7, cursor: 'pointer', fontSize: 12, fontWeight: 600, fontFamily: F, opacity: deleting === p.id ? 0.6 : 1 }}>Устгах</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {showModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: 16 }} onClick={e => { if (e.target === e.currentTarget) setShowModal(false) }}>
          <div style={{ background: '#0F0F0F', border: '1px solid #1A1A1A', borderRadius: 20, padding: 28, width: '100%', maxWidth: 480, fontFamily: F }}>
            <h2 style={{ margin: '0 0 20px', fontSize: 18, fontWeight: 700 }}>{editing ? 'Бүтээгдэхүүн засах' : 'Бүтээгдэхүүн нэмэх'}</h2>
            {[{ label: 'Нэр *', key: 'name', type: 'text', placeholder: 'Бизнес карт, Флаер...' }, { label: 'Тайлбар', key: 'description', type: 'text', placeholder: 'Богино тайлбар' }, { label: 'Үнэ (₮) *', key: 'price', type: 'number', placeholder: '50000' }].map(field => (
              <div key={field.key} style={{ marginBottom: 16 }}>
                <label style={{ display: 'block', fontSize: 13, color: '#888', marginBottom: 6 }}>{field.label}</label>
                <input type={field.type} value={(form as any)[field.key]} onChange={e => setForm(f => ({ ...f, [field.key]: e.target.value }))} placeholder={field.placeholder} style={{ width: '100%', padding: '10px 14px', boxSizing: 'border-box', background: '#1A1A1A', border: '1px solid #2A2A2A', borderRadius: 8, color: '#F1F5F9', fontSize: 14, fontFamily: F, outline: 'none' }} />
              </div>
            ))}
            <div style={{ marginBottom: 20 }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer', fontSize: 14, color: '#F1F5F9' }}>
                <input type="checkbox" checked={form.isActive} onChange={e => setForm(f => ({ ...f, isActive: e.target.checked }))} />
                Идэвхтэй байлгах
              </label>
            </div>
            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
              <button onClick={() => setShowModal(false)} style={{ padding: '10px 20px', background: '#1A1A1A', color: '#888', border: '1px solid #2A2A2A', borderRadius: 8, cursor: 'pointer', fontSize: 14, fontFamily: F }}>Болих</button>
              <button onClick={handleSave} disabled={saving} style={{ padding: '10px 20px', background: 'var(--orange)', color: '#fff', border: 'none', borderRadius: 8, cursor: 'pointer', fontSize: 14, fontWeight: 600, fontFamily: F, opacity: saving ? 0.7 : 1 }}>{saving ? 'Хадгалж байна...' : 'Хадгалах'}</button>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  )
}