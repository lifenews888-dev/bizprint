'use client'

import { useState, useEffect, useRef } from 'react'
import { apiFetch, apiUpload } from '@/lib/api'

/* ═══════════════════════════════════════
 *  Creator Portfolio Management
 * ═══════════════════════════════════════ */

interface PortfolioItem {
  id: string
  type: 'image' | 'video'
  media_url: string
  title: string
  description?: string
  created_at?: string
}

interface CreatorStats {
  totalViews: number
  profileClicks: number
  orderCount: number
  rating: number
  level: string
}

const LEVEL_CONFIG: Record<string, { label: string; color: string; bg: string }> = {
  starter: { label: 'Starter', color: '#6B7280', bg: 'rgba(107,114,128,0.12)' },
  pro:     { label: 'Pro',     color: '#3B82F6', bg: 'rgba(59,130,246,0.12)' },
  expert:  { label: 'Expert',  color: '#8B5CF6', bg: 'rgba(139,92,246,0.12)' },
  elite:   { label: 'Elite',   color: '#FF6B00', bg: 'rgba(255,107,0,0.12)' },
}

export default function CreatorPortfolioPage() {
  const [items, setItems] = useState<PortfolioItem[]>([])
  const [stats, setStats] = useState<CreatorStats>({ totalViews: 0, profileClicks: 0, orderCount: 0, rating: 0, level: 'starter' })
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [editingItem, setEditingItem] = useState<PortfolioItem | null>(null)
  const [editTitle, setEditTitle] = useState('')
  const [editDesc, setEditDesc] = useState('')
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null)
  const fileRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    setLoading(true)
    Promise.all([
      apiFetch<PortfolioItem[]>('/creator/portfolio').catch(() => []),
      apiFetch<CreatorStats>('/creator/stats').catch(() => stats),
    ]).then(([p, s]) => {
      if (Array.isArray(p)) setItems(p)
      if (s) setStats(s)
    }).finally(() => setLoading(false))
  }, [])

  const handleUpload = async (files: FileList) => {
    setUploading(true)
    try {
      for (const file of Array.from(files)) {
        const fd = new FormData()
        fd.append('file', file)
        fd.append('title', file.name.replace(/\.[^.]+$/, ''))
        const result = await apiUpload<PortfolioItem>('/creator/portfolio/upload', fd)
        if (result?.id) setItems(prev => [result, ...prev])
      }
    } catch (e: any) {
      alert(e.message || 'Файл байршуулах алдаа')
    }
    setUploading(false)
  }

  const handleDelete = async (id: string) => {
    try {
      await apiFetch(`/creator/portfolio/${id}`, { method: 'DELETE' })
      setItems(prev => prev.filter(i => i.id !== id))
      setDeleteConfirm(null)
    } catch (e: any) {
      alert(e.message || 'Устгах алдаа')
    }
  }

  const handleSaveEdit = async () => {
    if (!editingItem) return
    try {
      await apiFetch(`/creator/portfolio/${editingItem.id}`, {
        method: 'PATCH',
        body: JSON.stringify({ title: editTitle, description: editDesc }),
      })
      setItems(prev => prev.map(i =>
        i.id === editingItem.id ? { ...i, title: editTitle, description: editDesc } : i
      ))
      setEditingItem(null)
    } catch (e: any) {
      alert(e.message || 'Хадгалах алдаа')
    }
  }

  const level = LEVEL_CONFIG[stats.level] || LEVEL_CONFIG.starter

  return (
    <div className="p-4 sm:p-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-xl font-bold" style={{ color: 'var(--text)' }}>Портфолио</h1>
          <p className="text-sm mt-1" style={{ color: 'var(--text3)' }}>
            Бүтээлүүдээ оруулж, захиалагчдад харуулна
          </p>
        </div>
        <div className="flex gap-2">
          <input
            ref={fileRef}
            type="file"
            multiple
            accept="image/*,video/*"
            className="hidden"
            onChange={e => e.target.files && handleUpload(e.target.files)}
          />
          <button
            onClick={() => fileRef.current?.click()}
            disabled={uploading}
            className="px-4 py-2.5 rounded-xl text-sm font-semibold text-white transition-opacity disabled:opacity-60"
            style={{ background: 'var(--primary)' }}
          >
            {uploading ? 'Байршуулж байна...' : '+ Бүтээл нэмэх'}
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 mb-6">
        <StatCard label="Түвшин" value={level.label} color={level.color} />
        <StatCard label="Үнэлгээ" value={stats.rating ? `★ ${stats.rating.toFixed(1)}` : '—'} color="#F59E0B" />
        <StatCard label="Профайл харалт" value={stats.profileClicks.toString()} />
        <StatCard label="Нийт харалт" value={stats.totalViews.toString()} />
        <StatCard label="Захиалга" value={stats.orderCount.toString()} />
      </div>

      {/* Portfolio grid */}
      {loading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="aspect-square rounded-xl animate-pulse" style={{ background: 'var(--surface)' }} />
          ))}
        </div>
      ) : items.length === 0 ? (
        <div
          className="text-center py-16 rounded-2xl"
          style={{ background: 'var(--surface)', border: '2px dashed var(--border)' }}
        >
          <p className="text-4xl mb-3">🎨</p>
          <p className="font-semibold" style={{ color: 'var(--text)' }}>Портфолио хоосон</p>
          <p className="text-sm mt-1 mb-4" style={{ color: 'var(--text3)' }}>
            Бүтээлүүдээ оруулж, захиалагчдад харуулаарай
          </p>
          <button
            onClick={() => fileRef.current?.click()}
            className="px-4 py-2 rounded-xl text-sm font-semibold text-white"
            style={{ background: 'var(--primary)' }}
          >
            Бүтээл нэмэх
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
          {items.map(item => (
            <div
              key={item.id}
              className="aspect-square rounded-xl overflow-hidden relative group"
              style={{ background: 'var(--surface2)', border: '1px solid var(--border)' }}
            >
              {item.media_url ? (
                item.type === 'video' ? (
                  <video src={item.media_url} className="w-full h-full object-cover" />
                ) : (
                  <img src={item.media_url} alt={item.title} className="w-full h-full object-cover" />
                )
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <span className="text-3xl">{item.type === 'video' ? '🎬' : '🖼️'}</span>
                </div>
              )}
              {/* Hover actions */}
              <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-2">
                <p className="text-white text-sm font-medium px-3 text-center">{item.title}</p>
                <div className="flex gap-2">
                  <button
                    onClick={() => { setEditingItem(item); setEditTitle(item.title); setEditDesc(item.description || '') }}
                    className="px-3 py-1.5 rounded-lg text-xs font-medium bg-white/20 text-white"
                  >
                    Засах
                  </button>
                  <button
                    onClick={() => setDeleteConfirm(item.id)}
                    className="px-3 py-1.5 rounded-lg text-xs font-medium bg-red-500/80 text-white"
                  >
                    Устгах
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Edit modal */}
      {editingItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50" onClick={() => setEditingItem(null)} />
          <div
            className="relative w-full max-w-md rounded-2xl p-6"
            style={{ background: 'var(--bg)', border: '1px solid var(--border)' }}
          >
            <h3 className="font-bold mb-4" style={{ color: 'var(--text)' }}>Бүтээл засах</h3>
            <label className="block text-sm font-medium mb-1" style={{ color: 'var(--text2)' }}>Гарчиг</label>
            <input
              value={editTitle}
              onChange={e => setEditTitle(e.target.value)}
              className="w-full px-3 py-2 rounded-xl text-sm mb-3"
              style={{ background: 'var(--surface)', border: '1px solid var(--border)', color: 'var(--text)' }}
            />
            <label className="block text-sm font-medium mb-1" style={{ color: 'var(--text2)' }}>Тайлбар</label>
            <textarea
              value={editDesc}
              onChange={e => setEditDesc(e.target.value)}
              rows={3}
              className="w-full px-3 py-2 rounded-xl text-sm resize-none"
              style={{ background: 'var(--surface)', border: '1px solid var(--border)', color: 'var(--text)' }}
            />
            <div className="flex justify-end gap-2 mt-4">
              <button
                onClick={() => setEditingItem(null)}
                className="px-4 py-2 rounded-xl text-sm"
                style={{ background: 'var(--surface2)', color: 'var(--text2)' }}
              >
                Болих
              </button>
              <button
                onClick={handleSaveEdit}
                className="px-4 py-2 rounded-xl text-sm font-semibold text-white"
                style={{ background: 'var(--primary)' }}
              >
                Хадгалах
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete confirm modal */}
      {deleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50" onClick={() => setDeleteConfirm(null)} />
          <div
            className="relative w-full max-w-sm rounded-2xl p-6 text-center"
            style={{ background: 'var(--bg)', border: '1px solid var(--border)' }}
          >
            <p className="text-3xl mb-3">🗑️</p>
            <p className="font-semibold" style={{ color: 'var(--text)' }}>Бүтээл устгах уу?</p>
            <p className="text-sm mt-1 mb-4" style={{ color: 'var(--text3)' }}>Энэ үйлдлийг буцаах боломжгүй</p>
            <div className="flex justify-center gap-2">
              <button
                onClick={() => setDeleteConfirm(null)}
                className="px-4 py-2 rounded-xl text-sm"
                style={{ background: 'var(--surface2)', color: 'var(--text2)' }}
              >
                Болих
              </button>
              <button
                onClick={() => handleDelete(deleteConfirm)}
                className="px-4 py-2 rounded-xl text-sm font-semibold text-white"
                style={{ background: '#EF4444' }}
              >
                Устгах
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function StatCard({ label, value, color }: { label: string; value: string; color?: string }) {
  return (
    <div
      className="rounded-xl p-3"
      style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}
    >
      <p className="text-xs" style={{ color: 'var(--text3)' }}>{label}</p>
      <p className="text-lg font-bold mt-0.5" style={{ color: color || 'var(--text)' }}>{value}</p>
    </div>
  )
}
