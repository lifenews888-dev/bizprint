'use client'
import React, { apiFetch, API_URL } from '@/lib/api'
import React, { useEffect, useState, useRef } from 'react'
import DashboardLayout from '@/components/layouts/DashboardLayout'
import KpiCard from '@/components/dashboard/KpiCard'
import EmptyState from '@/components/dashboard/EmptyState'
import React, { useRoleGuard } from '@/lib/use-role-guard'
import React, { DESIGNER_MENU } from '@/config/sidebar-config'

interface Template {
  id: string; title: string; name?: string; description?: string; price?: number
  category?: string; preview_url?: string; file_url?: string
  preview_images?: string[]; status: string; downloads?: number; created_at: string
}

interface Category { id: string; name: string; slug?: string }

const STATUS_COLOR: Record<string, string> = {
  active: '#10B981', approved: '#10B981',
  pending: '#F59E0B', draft: '#F59E0B',
  rejected: '#EF4444',
}
const STATUS_LABEL: Record<string, string> = {
  active: 'Идэвхтэй', approved: 'Идэвхтэй',
  pending: 'Хянагдаж буй', draft: 'Хянагдаж буй',
  rejected: 'Татгалзсан',
}

export default function DesignerTemplatesPage() {
  const { user, loading: authLoading } = useRoleGuard(['designer', 'admin'])
  const [templates, setTemplates] = useState<Template[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)

  // Form state
  const [form, setForm] = useState({ title: '', description: '', price: '', category: '' })
  // Template download file
  const [templateFileUrl, setTemplateFileUrl] = useState('')
  const [uploadingTemplate, setUploadingTemplate] = useState(false)
  const templateFileRef = useRef<HTMLInputElement>(null)
  // Preview images (up to 10)
  const [previewImages, setPreviewImages] = useState<string[]>([])
  const [uploadingImg, setUploadingImg] = useState<number | null>(null) // index being uploaded
  const previewFileRef = useRef<HTMLInputElement>(null)
  const [addingImgSlot, setAddingImgSlot] = useState<number | null>(null)

  const [saving, setSaving] = useState(false)
  const [toast, setToast] = useState<{ msg: string; ok: boolean } | null>(null)

  useEffect(() => {
    if (!authLoading && user) {
      loadTemplates()
      loadCategories()
    }
  }, [authLoading, user])

  function showMsg(msg: string, ok = true) {
    setToast({ msg, ok })
    setTimeout(() => setToast(null), 3500)
  }

  async function loadCategories() {
    try {
      const data = await apiFetch<any>(`/categories`)
      if (Array.isArray(data)) setCategories(data)
    } catch {}
  }

  async function loadTemplates() {
    setLoading(true)
    try {
      const data = await apiFetch<any>('/templates')
      setTemplates(Array.isArray(data) ? data : [])
    } catch {}
    setLoading(false)
  }

  // Upload a file to /upload/file
  async function uploadFile(file: File): Promise<string | null> {
    const fd = new FormData()
    fd.append('file', file)
    const data = await apiFetch<any>(`/upload/file`, { method: 'POST', body: fd })
    if (!data) return null
    const url = data.url || data.file_url || null
    if (!url) return null
    return url.startsWith('http') ? url : `${API_URL}${url}`
  }

  async function handleTemplateFileUpload(file: File) {
    setUploadingTemplate(true)
    try {
      const url = await uploadFile(file)
      if (url) { setTemplateFileUrl(url); showMsg(`✅ ${file.name} байршуулагдлаа`) }
      else showMsg('Байршуулахад алдаа гарлаа', false)
    } catch { showMsg('Байршуулахад алдаа гарлаа', false) }
    setUploadingTemplate(false)
  }

  async function handlePreviewImageUpload(file: File, slotIdx: number) {
    setUploadingImg(slotIdx)
    try {
      const url = await uploadFile(file)
      if (url) {
        setPreviewImages(prev => {
          const next = [...prev]
          if (slotIdx < next.length) next[slotIdx] = url
          else next.push(url)
          return next
        })
        showMsg('Зураг байршуулагдлаа ✓')
      } else showMsg('Зураг байршуулахад алдаа', false)
    } catch { showMsg('Зураг байршуулахад алдаа', false) }
    setUploadingImg(null)
  }

  function removeImage(idx: number) {
    setPreviewImages(prev => prev.filter((_, i) => i !== idx))
  }

  function resetForm() {
    setForm({ title: '', description: '', price: '', category: '' })
    setTemplateFileUrl('')
    setPreviewImages([])
    setAddingImgSlot(null)
  }

  async function createTemplate() {
    if (!form.title.trim()) { showMsg('Нэр оруулна уу', false); return }
    setSaving(true)
    try {
      await apiFetch<any>(`/templates`, {
        method: 'POST',
        body: {
          title: form.title,
          description: form.description,
          price: Number(form.price || 0),
          category: form.category || undefined,
          file_url: templateFileUrl || undefined,
          preview_url: previewImages[0] || undefined,
          preview_images: previewImages.length > 0 ? previewImages : undefined,
        },
      })
      showMsg('Загвар нэмэгдлээ ✓')
      setShowForm(false)
      resetForm()
      loadTemplates()
    } catch { showMsg('Алдаа гарлаа', false) }
    setSaving(false)
  }

  const active = templates.filter(t => t.status === 'active' || t.status === 'approved')
  const pending = templates.filter(t => t.status === 'pending' || t.status === 'draft')
  const totalRevenue = templates.reduce((s, t) => s + (t.downloads || 0) * (t.price || 0), 0)

  if (authLoading) return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text2)' }}>
      Ачааллаж байна...
    </div>
  )

  const inp: React.CSSProperties = {
    width: '100%', padding: '10px 14px', background: 'var(--surface2)',
    border: '1px solid var(--border)', borderRadius: 8, fontSize: 13,
    color: 'var(--text)', outline: 'none', boxSizing: 'border-box',
  }

  return (
    <DashboardLayout navGroups={DESIGNER_MENU} user={user || undefined}>
      {toast && (
        <div style={{
          position: 'fixed', top: 20, right: 20, zIndex: 9999,
          background: toast.ok ? '#1D9E75' : '#e24b4a', color: '#fff',
          padding: '12px 20px', borderRadius: 10, fontSize: 14, fontWeight: 600,
          boxShadow: '0 4px 24px rgba(0,0,0,0.25)',
        }}>
          {toast.msg}
        </div>
      )}

      {/* Header */}
      <div style={{ padding: '24px 28px 0' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
          <div>
            <h1 style={{ fontSize: 22, fontWeight: 700, margin: 0 }}>Загвар байршуулах</h1>
            <p style={{ color: 'var(--text2)', fontSize: 13, margin: '4px 0 0' }}>
              Бэлэн загвар дэлгүүрт байршуулж борлуулах
            </p>
          </div>
          <button
            onClick={() => { setShowForm(!showForm); if (!showForm) resetForm() }}
            style={{ padding: '10px 20px', background: showForm ? 'var(--surface2)' : '#FF6B00', color: showForm ? 'var(--text2)' : '#fff', border: showForm ? '1px solid var(--border)' : 'none', borderRadius: 8, cursor: 'pointer', fontSize: 13, fontWeight: 600 }}
          >
            {showForm ? '✕ Болих' : '+ Шинэ загвар'}
          </button>
        </div>

        <KpiCard items={[
          { label: 'Нийт загвар', value: templates.length, color: 'purple', icon: '🎨' },
          { label: 'Идэвхтэй', value: active.length, color: 'green', icon: '✅' },
          { label: 'Хянагдаж буй', value: pending.length, color: 'orange', icon: '⏳' },
          { label: 'Нийт орлого', value: totalRevenue.toLocaleString() + '₮', color: 'blue', icon: '💰' },
        ]} />
      </div>

      <div style={{ padding: '0 28px 28px' }}>

        {/* ── New Template Form ── */}
        {showForm && (
          <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 14, padding: 24, marginBottom: 24 }}>
            <h3 style={{ fontSize: 16, fontWeight: 700, margin: '0 0 20px', color: 'var(--text)' }}>
              🎨 Шинэ загвар нэмэх
            </h3>

            {/* Row 1: Name + Category + Price */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 160px', gap: 14, marginBottom: 14 }}>
              <div>
                <label style={{ fontSize: 12, color: 'var(--text2)', marginBottom: 6, display: 'block', fontWeight: 600 }}>Загварын нэр *</label>
                <input
                  value={form.title}
                  onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                  placeholder="Маркетинг постер..."
                  style={inp}
                />
              </div>
              <div>
                <label style={{ fontSize: 12, color: 'var(--text2)', marginBottom: 6, display: 'block', fontWeight: 600 }}>Ангилал</label>
                <select
                  value={form.category}
                  onChange={e => setForm(f => ({ ...f, category: e.target.value }))}
                  style={inp}
                >
                  <option value="">— Ангилал сонгох —</option>
                  {categories.map(c => (
                    <option key={c.id} value={c.slug || c.name}>{c.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label style={{ fontSize: 12, color: 'var(--text2)', marginBottom: 6, display: 'block', fontWeight: 600 }}>Үнэ (₮)</label>
                <input
                  type="number"
                  value={form.price}
                  onChange={e => setForm(f => ({ ...f, price: e.target.value }))}
                  placeholder="15000"
                  style={inp}
                />
              </div>
            </div>

            {/* Description */}
            <div style={{ marginBottom: 20 }}>
              <label style={{ fontSize: 12, color: 'var(--text2)', marginBottom: 6, display: 'block', fontWeight: 600 }}>Тайлбар</label>
              <textarea
                value={form.description}
                onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                placeholder="Загварын тодорхойлолт, хэрэглээ..."
                rows={2}
                style={{ ...inp, resize: 'vertical' }}
              />
            </div>

            {/* Template file upload */}
            <div style={{ marginBottom: 20 }}>
              <label style={{ fontSize: 12, color: 'var(--text2)', marginBottom: 8, display: 'block', fontWeight: 600 }}>
                📦 Загварын файл (татан авах файл)
              </label>
              <input
                ref={templateFileRef}
                type="file"
                accept=".pdf,.ai,.psd,.eps,.zip,.fig,.sketch,.xd,.png,.jpg"
                style={{ display: 'none' }}
                onChange={e => { const f = e.target.files?.[0]; if (f) handleTemplateFileUpload(f) }}
              />
              <div
                onClick={() => templateFileRef.current?.click()}
                onDragOver={e => { e.preventDefault(); e.currentTarget.style.borderColor = '#FF6B00' }}
                onDragLeave={e => { e.currentTarget.style.borderColor = 'var(--border)' }}
                onDrop={e => {
                  e.preventDefault()
                  e.currentTarget.style.borderColor = 'var(--border)'
                  const f = e.dataTransfer.files?.[0]
                  if (f) handleTemplateFileUpload(f)
                }}
                style={{
                  border: '2px dashed var(--border)', borderRadius: 10, padding: '16px 20px',
                  cursor: 'pointer', background: 'var(--surface2)', transition: 'border-color 0.2s',
                  display: 'flex', alignItems: 'center', gap: 14,
                }}
              >
                {uploadingTemplate ? (
                  <div style={{ color: '#FF6B00', fontSize: 13 }}>⏳ Байршуулж байна...</div>
                ) : templateFileUrl ? (
                  <>
                    <span style={{ fontSize: 24 }}>📦</span>
                    <div>
                      <div style={{ fontSize: 13, color: '#10B981', fontWeight: 600 }}>✅ Файл бэлэн</div>
                      <div style={{ fontSize: 11, color: 'var(--text3)', wordBreak: 'break-all', marginTop: 2 }}>
                        {templateFileUrl.split('/').pop()}
                      </div>
                    </div>
                    <div style={{ marginLeft: 'auto', fontSize: 11, color: 'var(--text3)' }}>Солихын тулд дар</div>
                  </>
                ) : (
                  <>
                    <span style={{ fontSize: 24 }}>📤</span>
                    <div>
                      <div style={{ fontSize: 13, color: 'var(--text)', fontWeight: 500 }}>
                        Файл чирж тавих эсвэл <span style={{ color: '#FF6B00', fontWeight: 700 }}>энд дарна уу</span>
                      </div>
                      <div style={{ fontSize: 11, color: 'var(--text3)', marginTop: 3 }}>
                        PDF, AI, PSD, EPS, ZIP, FIG, SKETCH, XD — max 50MB
                      </div>
                    </div>
                  </>
                )}
              </div>
              {/* OR: manual URL */}
              <div style={{ marginTop: 8, display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ fontSize: 11, color: 'var(--text3)', whiteSpace: 'nowrap' }}>Эсвэл URL:</span>
                <input
                  value={templateFileUrl}
                  onChange={e => setTemplateFileUrl(e.target.value)}
                  placeholder="https://drive.google.com/..."
                  style={{ ...inp, padding: '8px 12px', fontSize: 12 }}
                />
              </div>
            </div>

            {/* Preview images (up to 10) */}
            <div style={{ marginBottom: 20 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                <label style={{ fontSize: 12, color: 'var(--text2)', fontWeight: 600 }}>
                  🖼️ Preview зурагнууд ({previewImages.length}/10)
                </label>
                {previewImages.length < 10 && (
                  <span style={{ fontSize: 11, color: 'var(--text3)' }}>Зурагнуудаас эхнийх нь гол preview болно</span>
                )}
              </div>

              <input
                ref={previewFileRef}
                type="file"
                accept="image/*"
                style={{ display: 'none' }}
                onChange={e => {
                  const f = e.target.files?.[0]
                  if (f && addingImgSlot !== null) {
                    handlePreviewImageUpload(f, addingImgSlot)
                  }
                  if (previewFileRef.current) previewFileRef.current.value = ''
                }}
              />

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(110px, 1fr))', gap: 10 }}>
                {/* Existing images */}
                {previewImages.map((url, idx) => (
                  <div key={idx} style={{ position: 'relative', paddingBottom: '100%', borderRadius: 10, overflow: 'hidden', background: 'var(--surface2)', border: '1px solid var(--border)' }}>
                    {uploadingImg === idx ? (
                      <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#FF6B00', fontSize: 12 }}>
                        ⏳
                      </div>
                    ) : (
                      <>
                        <img src={url} alt={`preview-${idx}`} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }} />
                        {idx === 0 && (
                          <div style={{ position: 'absolute', top: 4, left: 4, background: '#FF6B00', color: '#fff', fontSize: 10, fontWeight: 700, padding: '2px 6px', borderRadius: 4 }}>
                            MAIN
                          </div>
                        )}
                        <button
                          onClick={() => removeImage(idx)}
                          style={{ position: 'absolute', top: 4, right: 4, width: 22, height: 22, borderRadius: '50%', background: 'rgba(0,0,0,0.6)', color: '#fff', border: 'none', cursor: 'pointer', fontSize: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700 }}
                        >
                          ×
                        </button>
                        <button
                          onClick={() => {
                            setAddingImgSlot(idx)
                            setTimeout(() => previewFileRef.current?.click(), 50)
                          }}
                          style={{ position: 'absolute', bottom: 4, right: 4, fontSize: 10, padding: '2px 6px', background: 'rgba(0,0,0,0.6)', color: '#fff', border: 'none', borderRadius: 4, cursor: 'pointer' }}
                        >
                          Солих
                        </button>
                      </>
                    )}
                  </div>
                ))}

                {/* Add new image slot */}
                {previewImages.length < 10 && (
                  <div
                    onClick={() => {
                      setAddingImgSlot(previewImages.length)
                      setTimeout(() => previewFileRef.current?.click(), 50)
                    }}
                    style={{
                      paddingBottom: '100%', position: 'relative', borderRadius: 10,
                      border: '2px dashed var(--border)', cursor: 'pointer',
                      background: 'var(--surface2)', transition: 'border-color 0.2s',
                    }}
                    onMouseEnter={e => e.currentTarget.style.borderColor = '#FF6B00'}
                    onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--border)'}
                  >
                    <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 4 }}>
                      <span style={{ fontSize: 22, color: 'var(--text3)' }}>+</span>
                      <span style={{ fontSize: 10, color: 'var(--text3)' }}>Зураг нэмэх</span>
                    </div>
                  </div>
                )}
              </div>

              {/* URL input alternative for preview */}
              <div style={{ marginTop: 8, display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ fontSize: 11, color: 'var(--text3)', whiteSpace: 'nowrap' }}>URL-ээр нэмэх:</span>
                <input
                  placeholder="https://..."
                  onKeyDown={e => {
                    if (e.key === 'Enter' && e.currentTarget.value && previewImages.length < 10) {
                      setPreviewImages(prev => [...prev, e.currentTarget.value])
                      e.currentTarget.value = ''
                    }
                  }}
                  style={{ ...inp, padding: '8px 12px', fontSize: 12 }}
                />
                <span style={{ fontSize: 11, color: 'var(--text3)', whiteSpace: 'nowrap' }}>Enter дарна уу</span>
              </div>
            </div>

            {/* Info notice */}
            <div style={{ fontSize: 12, color: 'var(--text3)', marginBottom: 16, padding: '10px 14px', background: 'rgba(255,107,0,0.06)', border: '1px solid rgba(255,107,0,0.15)', borderRadius: 8 }}>
              ℹ️ Загварын үнийг BizPrint админ баталгаажуулна. Борлуулалтын тохирсон хувь таны хэтэвчинд байршина.
            </div>

            <div style={{ display: 'flex', gap: 10 }}>
              <button
                onClick={createTemplate}
                disabled={saving || !form.title.trim()}
                style={{ padding: '10px 24px', background: saving || !form.title.trim() ? 'var(--border)' : '#FF6B00', color: '#fff', border: 'none', borderRadius: 8, cursor: saving ? 'wait' : 'pointer', fontSize: 13, fontWeight: 700 }}
              >
                {saving ? 'Хадгалж байна...' : '🚀 Байршуулах'}
              </button>
              <button
                onClick={() => { setShowForm(false); resetForm() }}
                style={{ padding: '10px 20px', background: 'var(--surface2)', color: 'var(--text2)', border: '1px solid var(--border)', borderRadius: 8, cursor: 'pointer', fontSize: 13 }}
              >
                Болих
              </button>
            </div>
          </div>
        )}

        {/* ── Templates grid ── */}
        {loading ? (
          <div style={{ padding: 48, textAlign: 'center', color: 'var(--text2)' }}>Ачааллаж байна...</div>
        ) : templates.length === 0 ? (
          <EmptyState
            icon="🖼️"
            title="Загвар байхгүй"
            message="Бэлэн загвараа байршуулж, дэлгүүрээр дамжуулан борлуулаарай"
            ctaText="Загвар нэмэх"
            onCtaClick={() => setShowForm(true)}
          />
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 16 }}>
            {templates.map(t => {
              const sColor = STATUS_COLOR[t.status] || '#888'
              const sLabel = STATUS_LABEL[t.status] || t.status
              const images = t.preview_images || (t.preview_url ? [t.preview_url] : [])
              return (
                <div key={t.id} style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 14, overflow: 'hidden' }}>
                  {/* Preview area */}
                  <div style={{ position: 'relative', height: 160, background: 'var(--surface2)' }}>
                    {images.length > 0 ? (
                      <img src={images[0]} alt={t.title || t.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    ) : (
                      <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 48 }}>
                        🎨
                      </div>
                    )}
                    {images.length > 1 && (
                      <div style={{ position: 'absolute', bottom: 6, right: 6, background: 'rgba(0,0,0,0.6)', color: '#fff', fontSize: 10, fontWeight: 600, padding: '2px 7px', borderRadius: 8 }}>
                        +{images.length - 1} зураг
                      </div>
                    )}
                    <div style={{ position: 'absolute', top: 8, right: 8, background: sColor + '22', color: sColor, fontSize: 10, fontWeight: 700, padding: '3px 8px', borderRadius: 6, backdropFilter: 'blur(4px)' }}>
                      {sLabel}
                    </div>
                  </div>
                  <div style={{ padding: 16 }}>
                    <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text)', marginBottom: 4 }}>{t.title || t.name}</div>
                    {t.description && (
                      <div style={{ fontSize: 12, color: 'var(--text2)', marginBottom: 8, lineHeight: 1.4, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                        {t.description}
                      </div>
                    )}
                    {t.category && (
                      <div style={{ fontSize: 11, color: 'var(--text3)', marginBottom: 8 }}>
                        🏷️ {t.category}
                      </div>
                    )}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 8, paddingTop: 8, borderTop: '1px solid var(--border)' }}>
                      <span style={{ fontSize: 16, fontWeight: 700, color: '#FF6B00' }}>{(t.price || 0).toLocaleString()}₮</span>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <span style={{ fontSize: 11, color: 'var(--text3)' }}>📥 {t.downloads || 0}</span>
                        {t.file_url && <span style={{ fontSize: 11, color: '#10B981' }}>📦 Файл</span>}
                      </div>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </DashboardLayout>
  )
}
