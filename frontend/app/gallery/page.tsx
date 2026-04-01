'use client'
import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, ChevronLeft, ChevronRight, Download, ZoomIn } from 'lucide-react'
import Link from 'next/link'

interface GalleryImage {
  id: string
  public_id: string
  url: string
  caption: string
  alt: string
  width: number
  height: number
}

export default function GalleryPage() {
  const [images, setImages] = useState<GalleryImage[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedIdx, setSelectedIdx] = useState<number | null>(null)

  useEffect(() => {
    const api = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'
    fetch(`${api}/gallery?active=true`)
      .then(r => r.json())
      .then(data => { if (Array.isArray(data)) setImages(data) })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  const selected = selectedIdx !== null ? images[selectedIdx] : null

  const goPrev = () => {
    if (selectedIdx === null) return
    setSelectedIdx(selectedIdx > 0 ? selectedIdx - 1 : images.length - 1)
  }
  const goNext = () => {
    if (selectedIdx === null) return
    setSelectedIdx(selectedIdx < images.length - 1 ? selectedIdx + 1 : 0)
  }

  // Keyboard navigation
  useEffect(() => {
    if (selectedIdx === null) return
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setSelectedIdx(null)
      if (e.key === 'ArrowLeft') goPrev()
      if (e.key === 'ArrowRight') goNext()
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [selectedIdx, images.length])

  return (
    <div className="min-h-screen bg-[var(--bg)]">
      {/* Header */}
      <div className="max-w-7xl mx-auto px-4 pt-8 pb-6">
        <nav className="text-xs text-[var(--text3)] mb-4">
          <Link href="/" className="hover:text-[#FF6B00] transition">Нүүр</Link>
          <span className="mx-2">/</span>
          <span className="text-[var(--text)]">Галерей</span>
        </nav>
        <h1 className="text-3xl font-extrabold text-[var(--text)]">Галерей</h1>
        <p className="text-sm text-[var(--text3)] mt-2">Манай бүтээлүүдийн цуглуулга</p>
      </div>

      {/* Grid */}
      <div className="max-w-7xl mx-auto px-4 pb-16">
        {loading ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="aspect-square rounded-xl bg-[var(--surface2)] animate-pulse" />
            ))}
          </div>
        ) : images.length === 0 ? (
          <div className="text-center py-20 text-[var(--text3)]">
            <div className="text-5xl mb-4 opacity-30">🖼️</div>
            <div className="font-semibold">Галерей хоосон байна</div>
          </div>
        ) : (
          <div className="columns-2 md:columns-3 lg:columns-4 gap-3 space-y-3">
            {images.map((img, idx) => (
              <motion.div
                key={img.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.05 }}
                className="break-inside-avoid group cursor-pointer"
                onClick={() => setSelectedIdx(idx)}
              >
                <div className="relative rounded-xl overflow-hidden bg-[var(--surface2)]">
                  <img
                    src={img.url}
                    alt={img.alt || img.caption || ''}
                    width={img.width}
                    height={img.height}
                    className="w-full h-auto object-cover transition-transform duration-300 group-hover:scale-[1.03]"
                    loading="lazy"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                    <div className="absolute bottom-0 left-0 right-0 p-3">
                      {img.caption && (
                        <p className="text-white text-xs font-semibold drop-shadow-lg">{img.caption}</p>
                      )}
                    </div>
                    <div className="absolute top-3 right-3">
                      <div className="w-8 h-8 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center">
                        <ZoomIn className="w-4 h-4 text-white" strokeWidth={1.5} />
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      {/* Lightbox Modal */}
      <AnimatePresence>
        {selected && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center"
            onClick={() => setSelectedIdx(null)}
          >
            {/* Close */}
            <button onClick={() => setSelectedIdx(null)}
              className="absolute top-4 right-4 z-10 w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition cursor-pointer">
              <X className="w-5 h-5" />
            </button>

            {/* Prev */}
            <button onClick={e => { e.stopPropagation(); goPrev() }}
              className="absolute left-4 top-1/2 -translate-y-1/2 z-10 w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition cursor-pointer">
              <ChevronLeft className="w-5 h-5" />
            </button>

            {/* Next */}
            <button onClick={e => { e.stopPropagation(); goNext() }}
              className="absolute right-4 top-1/2 -translate-y-1/2 z-10 w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition cursor-pointer">
              <ChevronRight className="w-5 h-5" />
            </button>

            {/* Image */}
            <motion.div
              key={selected.id}
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              transition={{ type: 'spring', damping: 25 }}
              className="max-w-[90vw] max-h-[85vh] relative"
              onClick={e => e.stopPropagation()}
            >
              <img
                src={selected.url}
                alt={selected.alt || selected.caption || ''}
                className="max-w-full max-h-[85vh] object-contain rounded-lg shadow-2xl"
              />
              {selected.caption && (
                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-4 rounded-b-lg">
                  <p className="text-white text-sm font-medium">{selected.caption}</p>
                </div>
              )}
            </motion.div>

            {/* Counter */}
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 text-white/60 text-xs font-medium">
              {(selectedIdx ?? 0) + 1} / {images.length}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
