'use client'
import { useEffect, useState, useRef } from 'react'
import DashboardLayout from '@/components/layouts/DashboardLayout'
import KpiCard from '@/components/dashboard/KpiCard'
import EmptyState from '@/components/dashboard/EmptyState'
import { useRoleGuard } from '@/lib/use-role-guard'
import { DESIGNER_MENU } from '@/config/sidebar-config'

const API = 'http://localhost:4000'
function tok() { return localStorage.getItem('access_token') || '' }

interface Template {
  id: string; name: string; description?: string; price?: number
  category?: string; preview_url?: string; file_url?: string
  status: string; downloads?: number; created_at: string
}

export default function DesignerTemplatesPage() {
  const { user, loading: authLoading } = useRoleGuard(['designer', 'admin'])
  const [templates, setTemplates] = useState<Template[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ name: '', description: '', price: '', category: 'poster' })
  const [toast, setToast] = useState('')
  const fileRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (!authLoading && user) loadTemplates()
  }, [authLoading, user])

  async function loadTemplates() {
    setLoading(true)
    try {
      const r = await fetch(`${API}/templates`, { headers: { Authorization: 'Bearer ' + tok() } })
      const data = await r.json()
      setTemplates(Array.isArray(data) ? data : [])
    } catch {}
    setLoading(false)
  }

  async function createTemplate() {
    if (!form.name) { setToast('Нэр оруулна уу'); return }
    try {
      await fetch(`${API}/templates`, {
        method: 'POST',
        headers: { Authorization: 'Bearer ' + tok(), 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: form.name, description: form.description, price: Number(form.price) || 0, category: form.category }),
      })
      setToast('Загвар нэмэгдлээ')
      setShowForm(false)
      setForm({ name: '', description: '', price: '', category: 'poster' })
      loadTemplates()
    } catch { setToast('Алдаа гарлаа') }
    setTimeout(() => setToast(''), 3000)
  }

  const active = templates.filter(t => t.status === 'active' || t.status === 'approved')
  const pending = templates.filter(t => t.status === 'pending' || t.status === 'draft')
  const totalRevenue = templates.reduce((s, t) => s + (t.downloads || 0) * (t.price || 0), 0)

  if (authLoading) return <div style={{ minHeight: '100vh', background: 'var(--bg)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text2)' }}>Ачааллаж байна...</div>

  const CATEGORIES = [
    { key: 'poster', label: 'Постер' }, { key: 'flyer', label: 'Флаер' },
    { key: 'business_card', label: 'Нэрийн хуудас' }, { key: 'brochure', label: 'Брошур' },
    { key: 'social', label: 'Сошиал медиа' }, { key: 'banner', label: 'Баннер' },
    { key: 'menu', label: 'Меню' }, { key: 'certificate', label: 'Гэрчилгээ' },
  ]

  const inp: React.CSSProperties = { width: '100%', padding: '10px 14px', background: 'var(--surface2)', border: '1px solid var(--border)', borderRadius: 8, fontSize: 13, color: 'var(--text)', outline: 'none' }

  return (
    <DashboardLayout navGroups={DESIGNER_MENU} user={user || undefined}>
      {toast && <div style={{ position: 'fixed', top: 20, right: 20, zIndex: 9999, background: '#1D9E75', color: '#fff', padding: '12px 20px', borderRadius: 10, fontSize: 14, fontWeight: 600 }}>{toast}</div>}

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 700, margin: 0 }}>Загвар байршуулах</h1>
          <p style={{ color: 'var(--text2)', fontSize: 13, margin: '4px 0 0' }}>Бэлэн загвар дэлгүүрт байршуулж борлуулах</p>
        </div>
        <button onClick={() => setShowForm(!showForm)} style={{ padding: '10px 20px', background: '#FF6B00', color: '#fff', border: 'none', borderRadius: 8, cursor: 'pointer', fontSize: 13, fontWeight: 600 }}>
          + Шинэ загвар
        </button>
      </div>

      <KpiCard items={[
        { label: 'Нийт загвар', value: templates.length, color: 'purple', icon: '🎨' },
        { label: 'Идэвхтэй', value: active.length, color: 'green', icon: '✅' },
        { label: 'Хянагдаж буй', value: pending.length, color: 'orange', icon: '⏳' },
        { label: 'Нийт орлого', value: totalRevenue.toLocaleString() + '₮', color: 'blue', icon: '💰' },
      ]} />

      {/* New template form */}
      {showForm && (
        <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 14, padding: 24, marginBottom: 24 }}>
          <h3 style={{ fontSize: 16, fontWeight: 600, margin: '0 0 16px' }}>Шинэ загвар нэмэх</h3>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 14 }}>
            <div><label style={{ fontSize: 12, color: 'var(--text2)', marginBottom: 6, display: 'block' }}>Загварын нэр *</label><input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="Маркетинг постер" style={inp} /></div>
            <div><label style={{ fontSize: 12, color: 'var(--text2)', marginBottom: 6, display: 'block' }}>Ангилал</label>
              <select value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))} style={inp}>
                {CATEGORIES.map(c => <option key={c.key} value={c.key}>{c.label}</option>)}
              </select>
            </div>
            <div><label style={{ fontSize: 12, color: 'var(--text2)', marginBottom: 6, display: 'block' }}>Үнэ (₮)</label><input type="number" value={form.price} onChange={e => setForm(f => ({ ...f, price: e.target.value }))} placeholder="15000" style={inp} /></div>
            <div><label style={{ fontSize: 12, color: 'var(--text2)', marginBottom: 6, display: 'block' }}>Тайлбар</label><input value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} placeholder="Загварын тодорхойлолт" style={inp} /></div>
          </div>
          <div style={{ fontSize: 12, color: 'var(--text3)', marginBottom: 14, padding: '10px 14px', background: 'var(--surface2)', borderRadius: 8 }}>
            ℹ️ Загварын үнийг BizPrint админ баталгаажуулна. Борлуулалтын тохирсон хувь таны хэтэвчинд байршина.
          </div>
          <div style={{ display: 'flex', gap: 10 }}>
            <button onClick={createTemplate} style={{ padding: '10px 20px', background: '#8B5CF6', color: '#fff', border: 'none', borderRadius: 8, cursor: 'pointer', fontSize: 13, fontWeight: 600 }}>Байршуулах</button>
            <button onClick={() => setShowForm(false)} style={{ padding: '10px 20px', background: 'var(--surface2)', color: 'var(--text2)', border: '1px solid var(--border)', borderRadius: 8, cursor: 'pointer', fontSize: 13 }}>Болих</button>
          </div>
        </div>
      )}

      {/* Templates grid */}
      {loading ? (
        <div style={{ padding: 48, textAlign: 'center', color: 'var(--text2)' }}>Ачааллаж байна...</div>
      ) : templates.length === 0 ? (
        <EmptyState icon="🖼️" title="Загвар байхгүй" message="Бэлэн загвараа байршуулж, дэлгүүрээр дамжуулан борлуулаарай" ctaText="Загвар нэмэх" onCtaClick={() => setShowForm(true)} />
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 16 }}>
          {templates.map(t => {
            const statusColor = t.status === 'active' || t.status === 'approved' ? '#10B981' : t.status === 'pending' || t.status === 'draft' ? '#F59E0B' : '#888'
            const statusLabel = t.status === 'active' || t.status === 'approved' ? 'Идэвхтэй' : t.status === 'pending' || t.status === 'draft' ? 'Хянагдаж буй' : t.status
            return (
              <div key={t.id} style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 14, overflow: 'hidden' }}>
                <div style={{ height: 140, background: 'var(--surface2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 48 }}>
                  {t.preview_url ? <img src={t.preview_url} alt={t.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : '🎨'}
                </div>
                <div style={{ padding: 16 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                    <span style={{ fontSize: 14, fontWeight: 600, color: 'var(--text)' }}>{t.name}</span>
                    <span style={{ background: statusColor + '20', color: statusColor, borderRadius: 20, padding: '2px 8px', fontSize: 10, fontWeight: 600 }}>{statusLabel}</span>
                  </div>
                  {t.description && <div style={{ fontSize: 12, color: 'var(--text2)', marginBottom: 8, lineHeight: 1.4 }}>{t.description}</div>}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: 16, fontWeight: 700, color: '#FF6B00' }}>{(t.price || 0).toLocaleString()}₮</span>
                    <span style={{ fontSize: 11, color: 'var(--text3)' }}>{t.downloads || 0} татагдсан</span>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </DashboardLayout>
  )
}
