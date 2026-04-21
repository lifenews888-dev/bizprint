'use client'
import React, { useState, useRef, useCallback } from 'react'

const API = process.env.NEXT_PUBLIC_API_URL || 'https://bizprint-production.up.railway.app'
const MAX_IMAGES = 8
const FONT = "'DM Sans','Segoe UI',system-ui,sans-serif"

interface Props {
  images: string[]           // max 8 URLs
  videoUrl: string
  onChange: (images: string[], videoUrl: string) => void
  token: string
}

export default function ProductMediaUploader({ images, videoUrl, onChange, token }: Props) {
  const [uploading, setUploading] = useState<number | null>(null)  // slot index
  const [urlInputs, setUrlInputs] = useState<string[]>(Array(MAX_IMAGES).fill(''))
  const [videoInput, setVideoInput] = useState(videoUrl || '')
  const [showUrlInput, setShowUrlInput] = useState<number | null>(null)
  const fileRefs = useRef<(HTMLInputElement | null)[]>([])

  const safeImages = [...(images || []), ...Array(MAX_IMAGES).fill('')].slice(0, MAX_IMAGES)

  const [uploadError, setUploadError] = useState('')

  const uploadFile = async (file: File, slotIndex: number) => {
    setUploading(slotIndex)
    setUploadError('')
    try {
      // Try Cloudinary first
      const fd = new FormData(); fd.append('files', file)
      const res = await fetch(`${API}/api/upload/images`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: fd,
      })
      if (res.ok) {
        const data = await res.json()
        const url = data?.images?.[0]?.url || data?.urls?.[0] || ''
        if (url) { const n = [...safeImages]; n[slotIndex] = url; onChange(n.filter(Boolean), videoInput); return }
      }
      // Fallback to local upload
      const fd2 = new FormData(); fd2.append('file', file)
      const res2 = await fetch(`${API}/api/upload/file`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: fd2,
      })
      if (!res2.ok) {
        const txt = await res2.text().catch(() => '')
        setUploadError(`Upload алдаа (${res2.status}): ${txt.slice(0, 100)}`)
        return
      }
      const data2 = await res2.json()
      if (data2?.file_url) {
        const url = data2.file_url.startsWith('http') ? data2.file_url : `${API}${data2.file_url}`
        const n = [...safeImages]; n[slotIndex] = url; onChange(n.filter(Boolean), videoInput)
      } else if (data2?.error) {
        setUploadError(data2.error)
      }
    } catch (err: any) {
      setUploadError(err?.message || 'Upload алдаа')
    } finally {
      setUploading(null)
    }
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, slotIndex: number) => {
    const file = e.target.files?.[0]
    if (file) uploadFile(file, slotIndex)
    e.target.value = ''
  }

  const handleDrop = useCallback((e: React.DragEvent, slotIndex: number) => {
    e.preventDefault()
    const file = e.dataTransfer.files?.[0]
    if (file && file.type.startsWith('image/')) uploadFile(file, slotIndex)
  }, [safeImages, videoInput])

  const setUrlForSlot = (slotIndex: number) => {
    const url = urlInputs[slotIndex]?.trim()
    if (!url) return
    const newImages = [...safeImages]
    newImages[slotIndex] = url
    onChange(newImages.filter(Boolean), videoInput)
    setUrlInputs(prev => { const n = [...prev]; n[slotIndex] = ''; return n })
    setShowUrlInput(null)
  }

  const removeImage = (slotIndex: number) => {
    const newImages = [...safeImages]
    newImages[slotIndex] = ''
    // Compact: move non-empty to front
    const compacted = newImages.filter(Boolean)
    onChange(compacted, videoInput)
  }

  const handleVideoChange = (val: string) => {
    setVideoInput(val)
    onChange(safeImages.filter(Boolean), val)
  }

  const isVideo = (url: string) => /\.(mp4|webm|mov)/i.test(url) || url.includes('youtube') || url.includes('youtu.be') || url.includes('vimeo')

  const getYoutubeEmbed = (url: string) => {
    const m = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&\s]+)/)
    if (m) return `https://www.youtube.com/embed/${m[1]}`
    return url
  }

  return (
    <div style={{ fontFamily: FONT }}>
      {uploadError && (
        <div style={{ background: 'rgba(239,68,68,0.1)', color: '#EF4444', padding: '8px 12px', borderRadius: 8, fontSize: 12, marginBottom: 8 }}>
          ⚠ {uploadError}
        </div>
      )}
      {/* Image Grid */}
      <div style={{ marginBottom: 8 }}>
        <div style={{ fontSize: 12, color: 'var(--text2)', marginBottom: 8, display: 'flex', justifyContent: 'space-between' }}>
          <span>Зурагнууд (дээд тал {MAX_IMAGES} зураг)</span>
          <span style={{ color: 'var(--text3)' }}>{safeImages.filter(Boolean).length}/{MAX_IMAGES}</span>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8 }}>
          {Array.from({ length: MAX_IMAGES }, (_, i) => {
            const url = safeImages[i] || ''
            const isFirst = i === 0
            const isLoading = uploading === i

            return (
              <div
                key={i}
                style={{
                  position: 'relative',
                  aspectRatio: isFirst ? '16/10' : '1/1',
                  gridColumn: isFirst ? 'span 2' : 'span 1',
                  gridRow: isFirst ? 'span 2' : 'span 1',
                  borderRadius: 10,
                  border: `2px dashed ${url ? 'transparent' : 'var(--border)'}`,
                  background: url ? 'transparent' : 'var(--surface2)',
                  overflow: 'hidden',
                  cursor: 'pointer',
                }}
                onDragOver={e => e.preventDefault()}
                onDrop={e => handleDrop(e, i)}
                onClick={() => !url && fileRefs.current[i]?.click()}
              >
                {url ? (
                  <>
                    <img
                      src={url}
                      alt=""
                      style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
                    />
                    {isFirst && (
                      <div style={{ position: 'absolute', top: 6, left: 6, background: '#FF6B00', color: '#fff', fontSize: 10, fontWeight: 700, padding: '2px 7px', borderRadius: 99 }}>
                        ҮНДСЭН
                      </div>
                    )}
                    {/* Action buttons */}
                    <div style={{ position: 'absolute', top: 4, right: 4, display: 'flex', gap: 4 }}>
                      <button
                        onClick={e => { e.stopPropagation(); fileRefs.current[i]?.click() }}
                        style={{ width: 24, height: 24, borderRadius: '50%', background: 'rgba(0,0,0,0.6)', color: '#fff', border: 'none', cursor: 'pointer', fontSize: 12, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                        title="Солих"
                      >↑</button>
                      <button
                        onClick={e => { e.stopPropagation(); removeImage(i) }}
                        style={{ width: 24, height: 24, borderRadius: '50%', background: 'rgba(239,68,68,0.8)', color: '#fff', border: 'none', cursor: 'pointer', fontSize: 13, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                        title="Устгах"
                      >✕</button>
                    </div>
                  </>
                ) : isLoading ? (
                  <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 4 }}>
                    <div style={{ width: 20, height: 20, border: '2px solid #FF6B00', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
                    <span style={{ fontSize: 10, color: 'var(--text3)' }}>Uploading...</span>
                  </div>
                ) : (
                  <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 4, minHeight: isFirst ? 90 : 60 }}>
                    <div style={{ fontSize: isFirst ? 24 : 16, color: 'var(--text3)' }}>+</div>
                    <span style={{ fontSize: 10, color: 'var(--text3)', textAlign: 'center', lineHeight: 1.3 }}>
                      {isFirst ? 'Үндсэн зураг\nDrag & Drop' : 'Зураг'}
                    </span>
                    <button
                      onClick={e => { e.stopPropagation(); setShowUrlInput(showUrlInput === i ? null : i) }}
                      style={{ fontSize: 9, color: '#3B82F6', background: 'none', border: 'none', cursor: 'pointer', padding: 0, fontFamily: FONT }}
                    >
                      URL оруулах
                    </button>
                  </div>
                )}

                {/* URL input popup */}
                {showUrlInput === i && !url && (
                  <div
                    style={{ position: 'absolute', inset: 0, background: 'var(--surface)', padding: 8, display: 'flex', flexDirection: 'column', gap: 4, zIndex: 10 }}
                    onClick={e => e.stopPropagation()}
                  >
                    <input
                      value={urlInputs[i]}
                      onChange={e => setUrlInputs(prev => { const n = [...prev]; n[i] = e.target.value; return n })}
                      placeholder="https://..."
                      style={{ fontSize: 11, padding: '4px 6px', border: '1px solid var(--border)', borderRadius: 5, background: 'var(--surface2)', color: 'var(--text)', width: '100%', boxSizing: 'border-box' }}
                      autoFocus
                      onKeyDown={e => { if (e.key === 'Enter') setUrlForSlot(i) }}
                    />
                    <div style={{ display: 'flex', gap: 4 }}>
                      <button onClick={() => setUrlForSlot(i)} style={{ flex: 1, fontSize: 10, padding: '3px 0', background: '#FF6B00', color: '#fff', border: 'none', borderRadius: 4, cursor: 'pointer', fontFamily: FONT }}>OK</button>
                      <button onClick={() => setShowUrlInput(null)} style={{ flex: 1, fontSize: 10, padding: '3px 0', background: 'var(--surface2)', color: 'var(--text2)', border: '1px solid var(--border)', borderRadius: 4, cursor: 'pointer', fontFamily: FONT }}>✕</button>
                    </div>
                  </div>
                )}

                <input
                  ref={el => { fileRefs.current[i] = el }}
                  type="file"
                  accept="image/*"
                  style={{ display: 'none' }}
                  onChange={e => handleFileChange(e, i)}
                />
              </div>
            )
          })}
        </div>
      </div>

      {/* Video URL */}
      <div style={{ marginTop: 14, padding: 12, background: 'var(--surface2)', borderRadius: 10, border: '1px solid var(--border)' }}>
        <div style={{ fontSize: 12, color: 'var(--text2)', marginBottom: 6, fontWeight: 500, display: 'flex', alignItems: 'center', gap: 6 }}>
          🎬 Видео (заавал биш)
          <span style={{ fontSize: 10, color: 'var(--text3)', fontWeight: 400 }}>YouTube, Vimeo линк эсвэл .mp4 URL</span>
        </div>
        <input
          value={videoInput}
          onChange={e => handleVideoChange(e.target.value)}
          placeholder="https://youtube.com/watch?v=... эсвэл https://..."
          style={{ width: '100%', padding: '8px 12px', background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 7, fontSize: 12, color: 'var(--text)', outline: 'none', boxSizing: 'border-box', fontFamily: FONT }}
        />
        {videoInput && (
          <div style={{ marginTop: 8, borderRadius: 8, overflow: 'hidden', height: 120, background: '#000' }}>
            {videoInput.includes('youtube') || videoInput.includes('youtu.be') ? (
              <iframe
                src={getYoutubeEmbed(videoInput)}
                style={{ width: '100%', height: '100%', border: 'none' }}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            ) : (
              <video src={videoInput} controls style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
            )}
          </div>
        )}
      </div>

      <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
    </div>
  )
}
