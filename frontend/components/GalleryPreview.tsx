'use client'
import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import Link from 'next/link'
import { ArrowRight } from 'lucide-react'

interface GalleryImage {
  id: string
  url: string
  caption: string
  alt: string
  width: number
  height: number
}

export default function GalleryPreview() {
  const [images, setImages] = useState<GalleryImage[]>([])

  useEffect(() => {
    const api = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'
    fetch(`${api}/gallery/recent?limit=6`)
      .then(r => r.json())
      .then(data => { if (Array.isArray(data)) setImages(data) })
      .catch(() => {})
  }, [])

  if (images.length === 0) return null

  return (
    <section className="py-12 px-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-end justify-between mb-6">
          <div>
            <h2 className="text-2xl font-extrabold text-[var(--text)]">Манай бүтээлүүд</h2>
            <p className="text-sm text-[var(--text3)] mt-1">Хамгийн сүүлийн ажлуудаас</p>
          </div>
          <Link href="/gallery"
            className="flex items-center gap-1.5 text-sm font-semibold text-[#FF6B00] hover:underline">
            Бүгдийг харах <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        {/* Grid — 6 images in 2 rows */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {images.slice(0, 6).map((img, i) => (
            <motion.div
              key={img.id}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.08 }}
            >
              <Link href="/gallery" className="group block">
                <div className="relative rounded-xl overflow-hidden bg-[var(--surface2)]" style={{ aspectRatio: '4 / 3' }}>
                  <img
                    src={img.url}
                    alt={img.alt || img.caption || ''}
                    className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                    loading="lazy"
                  />
                  {img.caption && (
                    <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity">
                      <div className="absolute bottom-0 left-0 right-0 p-3">
                        <p className="text-white text-xs font-semibold drop-shadow">{img.caption}</p>
                      </div>
                    </div>
                  )}
                </div>
              </Link>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}
