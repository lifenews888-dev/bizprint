'use client'
import { useState, useEffect, useCallback } from 'react'
import { CldUploadWidget } from 'next-cloudinary'
import { apiFetch, getToken } from '@/lib/api'
import { AdminPageHeader } from '@/components/admin/AdminPageHeader'
import { Trash2, Edit3, GripVertical, Upload, Eye, EyeOff, Plus } from 'lucide-react'

interface GalleryImage {
  id: string
  public_id: string
  url: string
  caption: string
  alt: string
  width: number
  height: number
  format: string
  sort_order: number
  is_active: boolean
  created_at: string
}

export default function AdminGalleryPage() {
  const [images, setImages] = useState<GalleryImage[]>([])
  const [loading, setLoading] = useState(true)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editCaption, setEditCaption] = useState('')
  const [editAlt, setEditAlt] = useState('')

  const load = useCallback(async () => {
    try {
      const data = await apiFetch<GalleryImage[]>('/admin/gallery')
      setImages(Array.isArray(data) ? data : [])
    } catch { setImages([]) }
    setLoading(false)
  }, [])

  useEffect(() => { load() }, [load])

  const handleUploadSuccess = async (result: any) => {
    const info = result.info
    if (!info?.public_id) return
    try {
      await apiFetch('/admin/gallery', {
        method: 'POST',
        body: {
          public_id: info.public_id,
          url: info.secure_url,
          width: info.width,
          height: info.height,
          format: info.format,
          caption: '',
          alt: info.original_filename || '',
        },
      })
      load()
    } catch (e: any) {
      console.error('Upload save error:', e)
    }
  }

  const handleDelete = async (img: GalleryImage) => {
    if (!confirm(`"${img.caption || img.alt || 'Зураг'}" устгах уу?`)) return
    try {
      await apiFetch(`/admin/gallery/${img.id}`, { method: 'DELETE' })
      setImages(prev => prev.filter(i => i.id !== img.id))
    } catch {}
  }

  const handleToggle = async (img: GalleryImage) => {
    try {
      await apiFetch(`/admin/gallery/${img.id}`, { method: 'PATCH', body: { is_active: !img.is_active } })
      setImages(prev => prev.map(i => i.id === img.id ? { ...i, is_active: !i.is_active } : i))
    } catch {}
  }

  const startEdit = (img: GalleryImage) => {
    setEditingId(img.id)
    setEditCaption(img.caption || '')
    setEditAlt(img.alt || '')
  }

  const saveEdit = async () => {
    if (!editingId) return
    try {
      await apiFetch(`/admin/gallery/${editingId}`, { method: 'PATCH', body: { caption: editCaption, alt: editAlt } })
      setImages(prev => prev.map(i => i.id === editingId ? { ...i, caption: editCaption, alt: editAlt } : i))
    } catch {}
    setEditingId(null)
  }

  return (
    <div className="p-4 md:p-6">
      <AdminPageHeader title="Галерей" description="Cloudinary зургийн галерей удирдлага" />

      <div className="flex items-center justify-between mb-6">
        <p className="text-sm text-[var(--text3)]">Нийт {images.length} зураг</p>
        <CldUploadWidget
          uploadPreset="ml_default"
          options={{
            folder: process.env.NEXT_PUBLIC_CLOUDINARY_FOLDER || 'bizprint-gallery',
            multiple: true,
            maxFiles: 20,
            resourceType: 'image',
            sources: ['local', 'url', 'camera'],
            styles: {
              palette: { window: '#1a1a1a', windowBorder: '#FF6B00', tabIcon: '#FF6B00', link: '#FF6B00', action: '#FF6B00', inactiveTabIcon: '#666', error: '#EF4444', textDark: '#000', textLight: '#fff' },
            },
          }}
          onSuccess={handleUploadSuccess}
        >
          {({ open }) => (
            <button onClick={() => open()}
              className="flex items-center gap-2 px-5 py-2.5 bg-[#FF6B00] text-white rounded-lg text-sm font-semibold hover:bg-[#e55f00] transition-colors cursor-pointer">
              <Upload className="w-4 h-4" strokeWidth={1.5} />
              Зураг оруулах
            </button>
          )}
        </CldUploadWidget>
      </div>

      {loading ? (
        <div className="text-center py-20 text-[var(--text3)]">Ачааллаж байна...</div>
      ) : images.length === 0 ? (
        <div className="text-center py-20">
          <div className="text-5xl mb-4 opacity-30">🖼️</div>
          <div className="text-[var(--text2)] font-semibold mb-2">Галерей хоосон байна</div>
          <p className="text-sm text-[var(--text3)]">Дээрх "Зураг оруулах" товчийг дарж эхлээрэй</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
          {images.map(img => (
            <div key={img.id}
              className={`group relative rounded-xl overflow-hidden border transition-all ${
                img.is_active ? 'border-[var(--border)]' : 'border-red-500/30 opacity-60'
              } bg-[var(--surface)] hover:shadow-lg`}>
              {/* Image */}
              <div className="aspect-square relative overflow-hidden bg-[var(--surface2)]">
                <img src={img.url} alt={img.alt || img.caption || ''}
                  className="w-full h-full object-cover transition-transform group-hover:scale-105" loading="lazy" />
                {!img.is_active && (
                  <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                    <span className="text-xs text-white font-bold bg-red-500 px-2 py-1 rounded">Нуугдсан</span>
                  </div>
                )}
                {/* Overlay actions */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-3">
                  <div className="flex gap-1.5 w-full">
                    <button onClick={() => startEdit(img)} title="Засах"
                      className="flex-1 flex items-center justify-center gap-1 py-1.5 bg-white/90 text-gray-800 rounded-md text-[11px] font-semibold hover:bg-white transition cursor-pointer">
                      <Edit3 className="w-3 h-3" /> Засах
                    </button>
                    <button onClick={() => handleToggle(img)} title={img.is_active ? 'Нуух' : 'Харуулах'}
                      className="py-1.5 px-2 bg-white/90 text-gray-800 rounded-md hover:bg-white transition cursor-pointer">
                      {img.is_active ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                    </button>
                    <button onClick={() => handleDelete(img)} title="Устгах"
                      className="py-1.5 px-2 bg-red-500/90 text-white rounded-md hover:bg-red-600 transition cursor-pointer">
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              </div>
              {/* Info */}
              <div className="p-2.5">
                <div className="text-xs font-semibold text-[var(--text)] truncate">{img.caption || img.alt || 'Тайлбаргүй'}</div>
                <div className="text-[10px] text-[var(--text3)] mt-0.5">{img.width}×{img.height} · {img.format}</div>
              </div>
            </div>
          ))}

          {/* Add more card */}
          <CldUploadWidget
            uploadPreset="ml_default"
            options={{ folder: process.env.NEXT_PUBLIC_CLOUDINARY_FOLDER || 'bizprint-gallery', multiple: true, maxFiles: 20, resourceType: 'image', sources: ['local', 'url', 'camera'] }}
            onSuccess={handleUploadSuccess}
          >
            {({ open }) => (
              <button onClick={() => open()}
                className="aspect-square rounded-xl border-2 border-dashed border-[var(--border)] flex flex-col items-center justify-center gap-2 text-[var(--text3)] hover:border-[#FF6B00] hover:text-[#FF6B00] transition-colors cursor-pointer">
                <Plus className="w-8 h-8" strokeWidth={1} />
                <span className="text-xs font-semibold">Нэмэх</span>
              </button>
            )}
          </CldUploadWidget>
        </div>
      )}

      {/* Edit Modal */}
      {editingId && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setEditingId(null)}>
          <div className="bg-[var(--surface)] rounded-xl border border-[var(--border)] p-6 w-full max-w-md" onClick={e => e.stopPropagation()}>
            <h3 className="text-base font-bold text-[var(--text)] mb-4">Зургийн мэдээлэл засах</h3>
            <div className="space-y-3">
              <div>
                <label className="text-xs font-semibold text-[var(--text2)] mb-1 block">Тайлбар (Caption)</label>
                <input value={editCaption} onChange={e => setEditCaption(e.target.value)}
                  className="w-full px-3 py-2.5 bg-[var(--surface2)] border border-[var(--border)] rounded-lg text-sm text-[var(--text)] outline-none focus:border-[#FF6B00]"
                  placeholder="Зургийн тайлбар..." />
              </div>
              <div>
                <label className="text-xs font-semibold text-[var(--text2)] mb-1 block">Alt текст (SEO)</label>
                <input value={editAlt} onChange={e => setEditAlt(e.target.value)}
                  className="w-full px-3 py-2.5 bg-[var(--surface2)] border border-[var(--border)] rounded-lg text-sm text-[var(--text)] outline-none focus:border-[#FF6B00]"
                  placeholder="Зургийн тайлбар (SEO)..." />
              </div>
            </div>
            <div className="flex justify-end gap-2 mt-5">
              <button onClick={() => setEditingId(null)} className="px-4 py-2 text-sm text-[var(--text2)] bg-[var(--surface2)] border border-[var(--border)] rounded-lg cursor-pointer">Болих</button>
              <button onClick={saveEdit} className="px-4 py-2 text-sm text-white bg-[#FF6B00] rounded-lg font-semibold cursor-pointer hover:bg-[#e55f00]">Хадгалах</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
