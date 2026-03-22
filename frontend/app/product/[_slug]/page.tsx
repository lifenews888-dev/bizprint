'use client'
import { apiFetch } from '@/lib/api'
import { useState, useEffect } from 'react'
import { notFound } from 'next/navigation'

const FONT = "'DM Sans','Segoe UI',system-ui,sans-serif"

function getYoutubeEmbed(url: string) {
  const m = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&\s]+)/)
  if (m) return `https://www.youtube.com/embed/${m[1]}`
  return url
}
const isYoutube = (url: string) => url.includes('youtube') || url.includes('youtu.be')
const isVideo = (url: string) => /\.(mp4|webm|mov)/i.test(url) || isYoutube(url) || url.includes('vimeo')

function ProductGallery({ product }: { product: any }) {
  const rawImages: string[] = []
  if (product.thumbnail_url) rawImages.push(product.thumbnail_url)
  if (Array.isArray(product.images)) {
    product.images.forEach((img: string) => { if (img && !rawImages.includes(img)) rawImages.push(img) })
  }
  const images = rawImages.length > 0 ? rawImages : []
  const [active, setActive] = useState(0)
  const videoUrl = product.video_url || ''

  const prev = () => setActive(i => (i - 1 + images.length) % images.length)
  const next = () => setActive(i => (i + 1) % images.length)

  return (
    <div style={{ position: 'relative' }}>
      {/* Main image */}
      <div style={{ borderRadius: 16, overflow: 'hidden', background: '#F3F4F6', aspectRatio: '4/3', position: 'relative' }}>
        {images.length > 0 ? (
          <img
            src={images[active]}
            alt={product.name || product.name_mn}
            style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block', transition: 'opacity 0.2s' }}
          />
        ) : (
          <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#9CA3AF', fontSize: 14 }}>
            Зураг байхгүй
          </div>
        )}
        {images.length > 1 && (
          <>
            <button onClick={prev} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', width: 36, height: 36, borderRadius: '50%', background: 'rgba(0,0,0,0.45)', color: '#fff', border: 'none', cursor: 'pointer', fontSize: 16, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>‹</button>
            <button onClick={next} style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', width: 36, height: 36, borderRadius: '50%', background: 'rgba(0,0,0,0.45)', color: '#fff', border: 'none', cursor: 'pointer', fontSize: 16, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>›</button>
            <div style={{ position: 'absolute', bottom: 10, left: '50%', transform: 'translateX(-50%)', display: 'flex', gap: 5 }}>
              {images.map((_, i) => (
                <button key={i} onClick={() => setActive(i)} style={{ width: i === active ? 18 : 7, height: 7, borderRadius: 99, background: i === active ? '#FF6B00' : 'rgba(255,255,255,0.7)', border: 'none', cursor: 'pointer', padding: 0, transition: 'all 0.2s' }} />
              ))}
            </div>
          </>
        )}
      </div>

      {/* Thumbnail strip (slider) */}
      {images.length > 1 && (
        <div style={{ display: 'flex', gap: 8, marginTop: 10, overflowX: 'auto', paddingBottom: 4 }}>
          {images.map((img, i) => (
            <button
              key={i}
              onClick={() => setActive(i)}
              style={{
                flexShrink: 0, width: 64, height: 64, borderRadius: 10, overflow: 'hidden', padding: 0, border: `2px solid ${i === active ? '#FF6B00' : 'transparent'}`, cursor: 'pointer', background: '#F3F4F6', transition: 'border-color 0.15s',
              }}
            >
              <img src={img} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
            </button>
          ))}
        </div>
      )}

      {/* Small inline video */}
      {videoUrl && (
        <div style={{ marginTop: 12, borderRadius: 12, overflow: 'hidden', position: 'relative', background: '#000', height: 160 }}>
          <div style={{ position: 'absolute', top: 6, left: 8, background: 'rgba(0,0,0,0.55)', color: '#fff', fontSize: 10, fontWeight: 700, padding: '2px 7px', borderRadius: 99, zIndex: 2, letterSpacing: 0.5 }}>
            🎬 ВИДЕО
          </div>
          {isYoutube(videoUrl) ? (
            <iframe
              src={getYoutubeEmbed(videoUrl)}
              style={{ width: '100%', height: '100%', border: 'none' }}
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
          ) : (
            <video src={videoUrl} controls style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
          )}
        </div>
      )}
    </div>
  )
}

export default function ProductPage({ params }: { params: { slug: string } }) {
  const [product, setProduct] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    apiFetch(`//products`, { cache: 'no-store' } as any)
      .then(r => r.json())
      .then(list => {
        const found = Array.isArray(list) ? list.find((p: any) => p.slug === params.slug || p.id === params.slug) : null
        setProduct(found || null)
      })
      .finally(() => setLoading(false))
  }, [params.slug])

  if (loading) return (
    <div style={{ maxWidth: 1000, margin: '0 auto', padding: '80px 24px', textAlign: 'center', fontFamily: FONT, color: '#9CA3AF' }}>
      Уншиж байна...
    </div>
  )

  if (!product) return (
    <div style={{ maxWidth: 1000, margin: '0 auto', padding: '80px 24px', textAlign: 'center', fontFamily: FONT }}>
      <div style={{ fontSize: 48, marginBottom: 16 }}>😕</div>
      <h2 style={{ color: '#111', fontWeight: 700 }}>Бүтээгдэхүүн олдсонгүй</h2>
      <a href="/shop" style={{ color: '#FF6B00', textDecoration: 'none', fontSize: 14 }}>← Дэлгүүр рүү буцах</a>
    </div>
  )

  const price = Number(product.sale_price ?? product.base_price ?? product.price ?? 0).toLocaleString('mn-MN') + '₮'
  const oldPrice = product.sale_price ? Number(product.base_price ?? 0).toLocaleString('mn-MN') + '₮' : null

  return (
    <div style={{ maxWidth: 1000, margin: '0 auto', padding: '40px 24px', fontFamily: FONT }}>
      {/* Breadcrumb */}
      <div style={{ fontSize: 12, color: '#9CA3AF', marginBottom: 20 }}>
        <a href="/" style={{ color: '#9CA3AF', textDecoration: 'none' }}>Нүүр</a>
        {' / '}
        <a href="/shop" style={{ color: '#9CA3AF', textDecoration: 'none' }}>Дэлгүүр</a>
        {' / '}
        <span style={{ color: '#111' }}>{product.name || product.name_mn}</span>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.1fr', gap: 32, alignItems: 'start' }}>
        {/* Left — Gallery */}
        <ProductGallery product={product} />

        {/* Right — Info */}
        <div style={{ position: 'sticky', top: 24 }}>
          {product.category && (
            <div style={{ fontSize: 11, color: '#FF6B00', fontWeight: 700, letterSpacing: 1, textTransform: 'uppercase', marginBottom: 8 }}>
              {product.category}
            </div>
          )}
          <h1 style={{ fontSize: 26, fontWeight: 800, margin: '0 0 10px', color: '#111', lineHeight: 1.2 }}>
            {product.name || product.name_mn}
          </h1>

          {/* Price */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
            <span style={{ fontSize: 26, fontWeight: 800, color: '#FF6B00' }}>{price}</span>
            {oldPrice && <span style={{ fontSize: 15, color: '#9CA3AF', textDecoration: 'line-through' }}>{oldPrice}</span>}
          </div>

          {product.description && (
            <p style={{ color: '#4B5563', lineHeight: 1.65, fontSize: 14, margin: '0 0 20px' }}>
              {product.description}
            </p>
          )}

          {/* Stock */}
          {product.stock_quantity != null && (
            <div style={{ marginBottom: 16, fontSize: 13, color: product.stock_quantity > 0 ? '#10B981' : '#EF4444', fontWeight: 600 }}>
              {product.stock_quantity > 0 ? `✓ Нөөцөд байна (${product.stock_quantity} ш)` : '✕ Дууссан'}
            </div>
          )}

          {/* Actions */}
          <div style={{ display: 'flex', gap: 10, marginBottom: 16 }}>
            <button style={{ flex: 1, background: '#111', color: '#fff', border: 'none', padding: '13px 0', borderRadius: 10, fontWeight: 700, cursor: 'pointer', fontSize: 14, fontFamily: FONT }}>
              🛒 Сагслах
            </button>
            <button style={{ flex: 1, background: '#FF6B00', color: '#fff', border: 'none', padding: '13px 0', borderRadius: 10, fontWeight: 700, cursor: 'pointer', fontSize: 14, fontFamily: FONT }}>
              ⚡ Шууд захиалах
            </button>
          </div>

          <div style={{ padding: '12px 14px', background: '#F9FAFB', borderRadius: 10, fontSize: 12, color: '#6B7280', lineHeight: 1.6 }}>
            🚚 Хүргэлт: 1–3 ажлын өдөр
            <br />
            📦 Захиалгын минимум: {product.min_quantity || 1} ширхэг
            {product.lead_time_days && <><br />⏱ Хийх хугацаа: {product.lead_time_days} өдөр</>}
          </div>
        </div>
      </div>
    </div>
  )
}
