'use client'
import { apiFetch } from '@/lib/api'
import { useState, useEffect } from 'react'

const F = "'DM Sans','Segoe UI',system-ui,sans-serif"
const fmt = (n: number) => n.toLocaleString('mn-MN') + '₮'

function getYoutubeEmbed(url: string) {
  const m = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&\s]+)/)
  if (m) return `https://www.youtube.com/embed/${m[1]}`
  return url
}
const isYoutube = (url: string) => url.includes('youtube') || url.includes('youtu.be')

function ProductGallery({ product }: { product: any }) {
  const rawImages: string[] = []
  if (product.thumbnail_url) rawImages.push(product.thumbnail_url)
  if (Array.isArray(product.images)) {
    product.images.forEach((img: string) => { if (img && !rawImages.includes(img)) rawImages.push(img) })
  }
  const images = rawImages.length > 0 ? rawImages : []
  const [active, setActive] = useState(0)

  return (
    <div style={{ position: 'relative' }}>
      {/* Main image */}
      <div style={{
        borderRadius: 20, overflow: 'hidden', background: '#FFFFFF',
        aspectRatio: '4/5', position: 'relative',
      }}>
        {images.length > 0 ? (
          <img
            src={images[active]}
            alt={product.name || product.name_mn}
            style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block', transition: 'opacity 0.3s' }}
          />
        ) : (
          <div style={{
            width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center',
            background: 'linear-gradient(135deg, #e8a87c, #FF6B00)',
          }}>
            <span style={{ fontSize: 64, fontWeight: 800, color: 'rgba(255,255,255,0.3)' }}>
              {(product.name || 'B')[0].toUpperCase()}{(product.name || 'BP')[1]?.toUpperCase() || 'P'}
            </span>
          </div>
        )}

        {/* Navigation arrows */}
        {images.length > 1 && (
          <>
            <button onClick={() => setActive(i => (i - 1 + images.length) % images.length)}
              style={{
                position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)',
                width: 36, height: 36, borderRadius: '50%', background: 'rgba(255,255,255,0.9)',
                border: 'none', cursor: 'pointer', fontSize: 16, display: 'flex',
                alignItems: 'center', justifyContent: 'center', color: '#333',
                boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
              }}>‹</button>
            <button onClick={() => setActive(i => (i + 1) % images.length)}
              style={{
                position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)',
                width: 36, height: 36, borderRadius: '50%', background: 'rgba(255,255,255,0.9)',
                border: 'none', cursor: 'pointer', fontSize: 16, display: 'flex',
                alignItems: 'center', justifyContent: 'center', color: '#333',
                boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
              }}>›</button>
          </>
        )}
      </div>

      {/* Dots */}
      {images.length > 1 && (
        <div style={{ display: 'flex', justifyContent: 'center', gap: 6, marginTop: 14 }}>
          {images.map((_, i) => (
            <button key={i} onClick={() => setActive(i)} style={{
              width: i === active ? 24 : 8, height: 8, borderRadius: 99,
              background: i === active ? '#FF6B00' : '#DDD',
              border: 'none', cursor: 'pointer', padding: 0, transition: 'all 0.3s',
            }} />
          ))}
        </div>
      )}

      {/* Video */}
      {product.video_url && (
        <div style={{ marginTop: 14, borderRadius: 16, overflow: 'hidden', background: '#000', height: 180 }}>
          <div style={{
            position: 'absolute', top: 6, left: 8, background: 'rgba(0,0,0,0.55)', color: '#fff',
            fontSize: 10, fontWeight: 700, padding: '2px 7px', borderRadius: 99, zIndex: 2,
          }}>
            ВИДЕО
          </div>
          {isYoutube(product.video_url) ? (
            <iframe
              src={getYoutubeEmbed(product.video_url)}
              style={{ width: '100%', height: '100%', border: 'none' }}
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
          ) : (
            <video src={product.video_url} controls style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
          )}
        </div>
      )}
    </div>
  )
}

export default function ProductPage({ params }: { params: { slug: string } }) {
  const [product, setProduct] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [selectedSize, setSelectedSize] = useState<string | null>(null)

  useEffect(() => {
    apiFetch<any>('/products', { cache: 'no-store' } as any)
      .then(list => {
        const found = Array.isArray(list) ? list.find((p: any) => p.slug === params.slug || p.id === params.slug) : null
        setProduct(found || null)
      })
      .finally(() => setLoading(false))
  }, [params.slug])

  if (loading) return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: F }}>
      <div style={{ width: 40, height: 40, border: '3px solid #F0F0F0', borderTopColor: '#FF6B00', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  )

  if (!product) return (
    <div style={{ minHeight: '60vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', fontFamily: F }}>
      <div style={{ fontSize: 48, marginBottom: 16 }}>😕</div>
      <h2 style={{ color: '#111', fontWeight: 700 }}>Бүтээгдэхүүн олдсонгүй</h2>
      <a href="/shop" style={{ color: '#FF6B00', textDecoration: 'none', fontSize: 14 }}>← Дэлгүүр рүү буцах</a>
    </div>
  )

  const price = Number(product.sale_price ?? product.base_price ?? product.price ?? 0)
  const oldPrice = product.sale_price && product.base_price && product.sale_price < product.base_price
    ? Number(product.base_price) : null
  const discount = oldPrice ? Math.round((1 - price / oldPrice) * 100) : null
  const rating = product.rating || 4.2
  const reviewCount = product.review_count || 0

  // Sizes from product or default print sizes
  const sizes: string[] = product.sizes || product.available_sizes || []

  return (
    <div style={{ fontFamily: F, background: '#fff', minHeight: '100vh' }}>
      <div style={{ maxWidth: 1000, margin: '0 auto', padding: '0 0 120px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 0, alignItems: 'start' }} className="product-detail-grid">

          {/* Left — Gallery */}
          <div style={{ padding: '20px' }} className="product-gallery-col">
            <ProductGallery product={product} />
          </div>

          {/* Right — Info */}
          <div style={{ padding: '24px 24px 24px 8px', position: 'sticky', top: 80 }} className="product-info-col">
            {/* Brand */}
            {product.vendor_name && (
              <div style={{
                fontSize: 12, color: '#999', fontWeight: 600, letterSpacing: '0.08em',
                textTransform: 'uppercase', marginBottom: 8,
              }}>
                {product.vendor_name}
              </div>
            )}

            {/* Category */}
            {product.category && (
              <div style={{
                fontSize: 11, color: '#FF6B00', fontWeight: 700, letterSpacing: '0.06em',
                textTransform: 'uppercase', marginBottom: 8,
              }}>
                {product.category}
              </div>
            )}

            {/* Title */}
            <h1 style={{
              fontSize: 28, fontWeight: 800, margin: '0 0 12px', color: '#111',
              lineHeight: 1.2, letterSpacing: '-0.5px',
            }}>
              {product.name || product.name_mn}
            </h1>

            {/* Rating */}
            {reviewCount > 0 && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 14 }}>
                <div style={{ display: 'flex', gap: 1 }}>
                  {[1,2,3,4,5].map(s => (
                    <span key={s} style={{ fontSize: 14, color: s <= Math.round(rating) ? '#F59E0B' : '#DDD' }}>★</span>
                  ))}
                </div>
                <span style={{ fontSize: 14, fontWeight: 600, color: '#111' }}>{Number(rating).toFixed(1)}</span>
                <span style={{ fontSize: 13, color: '#999' }}>({reviewCount} үнэлгээ)</span>
              </div>
            )}

            {/* Price */}
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 10, marginBottom: 20 }}>
              <span style={{ fontSize: 28, fontWeight: 800, color: '#111' }}>{fmt(price)}</span>
              {oldPrice && (
                <>
                  <span style={{ fontSize: 16, color: '#BBB', textDecoration: 'line-through' }}>{fmt(oldPrice)}</span>
                  <span style={{
                    fontSize: 13, fontWeight: 700, color: '#10B981',
                    background: '#ECFDF5', padding: '3px 10px', borderRadius: 99,
                  }}>
                    {discount}% хэмнэлт
                  </span>
                </>
              )}
            </div>

            {/* Sizes */}
            {sizes.length > 0 && (
              <div style={{ marginBottom: 20 }}>
                <div style={{ fontSize: 14, fontWeight: 600, color: '#111', marginBottom: 10 }}>Хэмжээ сонгох</div>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  {sizes.map((size: string) => (
                    <button key={size}
                      onClick={() => setSelectedSize(size)}
                      style={{
                        width: 48, height: 48, borderRadius: 12,
                        border: selectedSize === size ? '2px solid #111' : '1px solid #E5E7EB',
                        background: selectedSize === size ? '#111' : '#fff',
                        color: selectedSize === size ? '#fff' : '#333',
                        fontSize: 14, fontWeight: 600, cursor: 'pointer', fontFamily: F,
                        transition: 'all 0.15s',
                      }}
                    >
                      {size}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {product.description && (
              <p style={{ color: '#666', lineHeight: 1.7, fontSize: 14, margin: '0 0 20px' }}>
                {product.description}
              </p>
            )}

            {/* Stock */}
            {product.stock_quantity != null && (
              <div style={{
                marginBottom: 16, fontSize: 13, fontWeight: 600,
                color: product.stock_quantity > 0 ? '#10B981' : '#EF4444',
              }}>
                {product.stock_quantity > 0 ? `✓ Нөөцөд байна (${product.stock_quantity} ш)` : '✕ Дууссан'}
              </div>
            )}

            {/* Action buttons */}
            <div style={{ display: 'flex', gap: 12, marginBottom: 20 }}>
              <button style={{
                flex: 1, padding: '16px 0', borderRadius: 14,
                border: '2px solid #111', background: '#fff', color: '#111',
                fontSize: 15, fontWeight: 700, cursor: 'pointer', fontFamily: F,
                transition: 'all 0.2s',
              }}
                onMouseEnter={e => { e.currentTarget.style.background = '#FFFFFF' }}
                onMouseLeave={e => { e.currentTarget.style.background = '#fff' }}
              >
                Сагсанд нэмэх
              </button>
              <button style={{
                flex: 1, padding: '16px 0', borderRadius: 14,
                border: 'none', background: '#FF6B00', color: '#fff',
                fontSize: 15, fontWeight: 700, cursor: 'pointer', fontFamily: F,
                boxShadow: '0 4px 14px rgba(255,107,0,0.3)',
                transition: 'all 0.2s',
              }}
                onMouseEnter={e => { e.currentTarget.style.background = '#E55D00' }}
                onMouseLeave={e => { e.currentTarget.style.background = '#FF6B00' }}
              >
                Одоо авах
              </button>
            </div>

            {/* Info box */}
            <div style={{
              padding: '16px 18px', background: '#F9F9F7', borderRadius: 14,
              fontSize: 13, color: '#666', lineHeight: 1.8,
            }}>
              🚚 Хүргэлт: 1–3 ажлын өдөр<br />
              📦 Захиалгын минимум: {product.min_quantity || 1} ширхэг
              {product.lead_time_days && <><br />⏱ Хийх хугацаа: {product.lead_time_days} өдөр</>}
            </div>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @media (max-width: 768px) {
          .product-detail-grid { grid-template-columns: 1fr !important; }
          .product-gallery-col { padding: 0 !important; }
          .product-info-col { padding: 20px !important; position: static !important; }
        }
      `}</style>
    </div>
  )
}
