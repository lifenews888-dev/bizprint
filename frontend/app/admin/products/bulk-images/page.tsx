'use client'

import { apiFetch, API_URL, getToken } from '@/lib/api'
import { useEffect, useMemo, useRef, useState } from 'react'

type Product = {
  id: string
  name_mn?: string
  name_en?: string
  code?: string
  category?: string
  thumbnail_url?: string
}

type Item = {
  id: string           // local id
  file: File
  preview: string      // object URL
  productId: string    // matched product
  status: 'idle' | 'uploading' | 'done' | 'error'
  error?: string
  uploadedUrl?: string
}

// Normalize string for matching (lowercase, strip punctuation)
function norm(s: string): string {
  return s.toLowerCase().replace(/[^a-zа-яөүё0-9]+/gi, ' ').trim()
}

// Score how well a filename matches a product (higher = better)
function matchScore(filename: string, p: Product): number {
  const fn = norm(filename.replace(/\.[^.]+$/, '')) // strip extension
  const candidates = [
    p.code || '',
    p.name_mn || '',
    p.name_en || '',
  ].map(norm).filter(Boolean)
  let score = 0
  for (const c of candidates) {
    if (!c) continue
    if (fn === c) score += 100
    else if (fn.includes(c) || c.includes(fn)) score += 50
    else {
      // Word-level overlap
      const fnWords = new Set(fn.split(' ').filter(w => w.length >= 3))
      const cWords = c.split(' ').filter(w => w.length >= 3)
      for (const w of cWords) if (fnWords.has(w)) score += 5
    }
  }
  return score
}

export default function BulkImagesPage() {
  const [products, setProducts] = useState<Product[]>([])
  const [items, setItems] = useState<Item[]>([])
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [toast, setToast] = useState('')
  const fileInputRef = useRef<HTMLInputElement>(null)

  const showToast = (m: string) => { setToast(m); setTimeout(() => setToast(''), 3000) }

  // Load all products
  useEffect(() => {
    (async () => {
      try {
        const d = await apiFetch<any>('/admin/products-master?limit=500')
        const list = (d.items || d || []) as Product[]
        setProducts(list)
      } catch (e: any) {
        showToast('Бүтээгдэхүүн ачаалахад алдаа: ' + e.message)
      } finally { setLoading(false) }
    })()
  }, [])

  // Products without a real thumbnail first — these are the ones needing images
  const prioritizedProducts = useMemo(() => {
    return [...products].sort((a, b) => {
      const aHas = a.thumbnail_url && a.thumbnail_url.includes('cloudinary')
      const bHas = b.thumbnail_url && b.thumbnail_url.includes('cloudinary')
      if (aHas === bHas) return (a.name_mn || a.name_en || '').localeCompare(b.name_mn || b.name_en || '')
      return aHas ? 1 : -1 // missing first
    })
  }, [products])

  const handleFiles = (files: FileList | null) => {
    if (!files) return
    const newItems: Item[] = Array.from(files).map((f, i) => {
      // Auto-match by filename
      const scores = products
        .map(p => ({ p, score: matchScore(f.name, p) }))
        .filter(x => x.score >= 10)
        .sort((a, b) => b.score - a.score)
      const best = scores[0]
      return {
        id: `${Date.now()}-${i}-${f.name}`,
        file: f,
        preview: URL.createObjectURL(f),
        productId: best?.p.id || '',
        status: 'idle' as const,
      }
    })
    setItems(prev => [...prev, ...newItems])
  }

  const removeItem = (id: string) => {
    setItems(prev => {
      const toRemove = prev.find(i => i.id === id)
      if (toRemove) URL.revokeObjectURL(toRemove.preview)
      return prev.filter(i => i.id !== id)
    })
  }

  const changeProduct = (id: string, productId: string) => {
    setItems(prev => prev.map(i => i.id === id ? { ...i, productId } : i))
  }

  const uploadOne = async (item: Item) => {
    if (!item.productId) throw new Error('Бүтээгдэхүүн сонгоогүй')
    const token = getToken()
    if (!token) throw new Error('Нэвтрэх шаардлагатай')

    const fd = new FormData()
    fd.append('files', item.file)
    const uploadRes = await fetch(`${API_URL}/api/upload/images`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
      body: fd,
    })
    if (!uploadRes.ok) throw new Error(`Upload failed: ${uploadRes.status}`)
    const uploadData = await uploadRes.json()
    const url = uploadData.urls?.[0]
    if (!url) throw new Error('Cloudinary URL not returned')

    await apiFetch(`/admin/products-master/${item.productId}`, {
      method: 'PUT',
      body: { thumbnail_url: url, images: [url] },
    })

    return url
  }

  const uploadAll = async () => {
    const pending = items.filter(i => i.status !== 'done' && i.productId)
    if (!pending.length) { showToast('Upload хийх зүйл байхгүй'); return }
    setUploading(true)
    let ok = 0, failed = 0
    for (const item of pending) {
      setItems(prev => prev.map(i => i.id === item.id ? { ...i, status: 'uploading' } : i))
      try {
        const url = await uploadOne(item)
        setItems(prev => prev.map(i => i.id === item.id ? { ...i, status: 'done', uploadedUrl: url } : i))
        ok++
      } catch (e: any) {
        setItems(prev => prev.map(i => i.id === item.id ? { ...i, status: 'error', error: e.message } : i))
        failed++
      }
    }
    setUploading(false)
    showToast(`✅ ${ok} upload хийгдсэн${failed ? ` · ❌ ${failed} алдаа` : ''}`)

    // Refresh products list
    try {
      const d = await apiFetch<any>('/admin/products-master?limit=500')
      setProducts((d.items || d || []) as Product[])
    } catch {}
  }

  const unmatched = items.filter(i => !i.productId).length
  const done = items.filter(i => i.status === 'done').length

  return (
    <div style={{ padding: '28px 32px', maxWidth: 1200, margin: '0 auto' }}>
      <div style={{ marginBottom: 20 }}>
        <h1 style={{ fontSize: 24, fontWeight: 700, margin: 0, color: 'var(--text)' }}>📸 Bulk image upload</h1>
        <p style={{ fontSize: 13, color: 'var(--text3)', marginTop: 4 }}>
          Олон зургийг нэг дор бүтээгдэхүүнд оноож Cloudinary-д байршуулна. Файлын нэрээр автомат таарах бүтээгдэхүүнийг сонгодог.
        </p>
      </div>

      {/* Drop zone */}
      <div
        onClick={() => fileInputRef.current?.click()}
        onDrop={e => { e.preventDefault(); handleFiles(e.dataTransfer.files) }}
        onDragOver={e => e.preventDefault()}
        style={{
          border: '2px dashed var(--border)', borderRadius: 12, padding: 40,
          textAlign: 'center', cursor: 'pointer', background: 'var(--surface2)',
          marginBottom: 20,
        }}>
        <div style={{ fontSize: 40, marginBottom: 8 }}>📥</div>
        <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text)' }}>Зураг оруулах</div>
        <div style={{ fontSize: 11, color: 'var(--text3)', marginTop: 4 }}>
          Олон зургыг дарах эсвэл чирэх · PNG, JPG, WebP · Дээд тал 10MB
        </div>
        <input ref={fileInputRef} type="file" accept="image/*" multiple style={{ display: 'none' }}
          onChange={e => handleFiles(e.target.files)} />
      </div>

      {/* Stats bar */}
      {items.length > 0 && (
        <div style={{ display: 'flex', gap: 16, marginBottom: 16, fontSize: 12, color: 'var(--text3)', flexWrap: 'wrap' }}>
          <span>📷 Нийт: <strong style={{ color: 'var(--text)' }}>{items.length}</strong></span>
          {done > 0 && <span style={{ color: '#10B981' }}>✅ Upload: <strong>{done}</strong></span>}
          {unmatched > 0 && <span style={{ color: '#F59E0B' }}>⚠️ Бүтээгдэхүүн сонгоогүй: <strong>{unmatched}</strong></span>}
          <button onClick={uploadAll} disabled={uploading || items.length === 0}
            style={{
              marginLeft: 'auto',
              padding: '8px 20px',
              background: uploading ? '#9CA3AF' : '#FF6B00',
              color: '#fff', border: 'none', borderRadius: 8,
              fontSize: 13, fontWeight: 600, cursor: uploading ? 'wait' : 'pointer',
            }}>
            {uploading ? 'Upload хийж байна...' : `🚀 Бүгдийг upload хийх (${items.filter(i => i.status !== 'done').length})`}
          </button>
        </div>
      )}

      {/* Items grid */}
      {items.length === 0 ? (
        loading ? <p style={{ color: 'var(--text3)' }}>Ачаалж байна...</p> : null
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 14 }}>
          {items.map(item => (
            <div key={item.id} style={{
              background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 10,
              padding: 10, display: 'flex', flexDirection: 'column', gap: 8,
              opacity: item.status === 'done' ? 0.7 : 1,
            }}>
              {/* Preview */}
              <div style={{ position: 'relative', aspectRatio: '4/3', background: 'var(--surface2)', borderRadius: 8, overflow: 'hidden' }}>
                <img src={item.preview} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                {item.status === 'done' && (
                  <div style={{ position: 'absolute', top: 6, right: 6, background: '#10B981', color: '#fff', fontSize: 11, padding: '3px 8px', borderRadius: 99, fontWeight: 700 }}>
                    ✓ Done
                  </div>
                )}
                {item.status === 'uploading' && (
                  <div style={{ position: 'absolute', inset: 0, background: 'rgba(255,107,0,0.8)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: 12 }}>
                    Uploading…
                  </div>
                )}
                {item.status === 'error' && (
                  <div style={{ position: 'absolute', inset: 0, background: 'rgba(239,68,68,0.9)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, textAlign: 'center', padding: 8 }}>
                    ❌ {item.error}
                  </div>
                )}
              </div>

              {/* Filename */}
              <div style={{ fontSize: 11, color: 'var(--text3)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                📄 {item.file.name}
              </div>

              {/* Product picker */}
              <select value={item.productId} onChange={e => changeProduct(item.id, e.target.value)}
                disabled={item.status === 'uploading' || item.status === 'done'}
                style={{
                  width: '100%', padding: '7px 10px', fontSize: 12,
                  background: 'var(--surface2)', border: '1px solid var(--border)', borderRadius: 6,
                  color: 'var(--text)', outline: 'none',
                }}>
                <option value="">— Бүтээгдэхүүн сонгох —</option>
                {prioritizedProducts.map(p => {
                  const hasImg = p.thumbnail_url && p.thumbnail_url.includes('cloudinary')
                  return (
                    <option key={p.id} value={p.id}>
                      {hasImg ? '✓ ' : '⏳ '}{p.name_mn || p.name_en || p.code || p.id.slice(0, 8)}
                    </option>
                  )
                })}
              </select>

              {/* Remove button */}
              {item.status !== 'uploading' && (
                <button onClick={() => removeItem(item.id)}
                  style={{
                    padding: '5px', fontSize: 11, background: 'transparent',
                    border: '1px solid var(--border)', borderRadius: 6,
                    color: 'var(--text3)', cursor: 'pointer',
                  }}>Устгах</button>
              )}
            </div>
          ))}
        </div>
      )}

      {toast && (
        <div style={{ position: 'fixed', top: 20, right: 20, background: '#1F2937', color: '#fff', padding: '10px 16px', borderRadius: 8, fontSize: 13, fontWeight: 600, zIndex: 2000, maxWidth: 360 }}>
          {toast}
        </div>
      )}
    </div>
  )
}
