'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'

const API = 'http://localhost:4000'
const F = "'DM Sans','Segoe UI',system-ui,sans-serif"
const fmt = (n: number) => n.toLocaleString('mn-MN') + '₮'

export default function ProductPage({ params }: { params: { _slug: string } }) {
  const router = useRouter()
  const slug = params._slug
  const [product, setProduct] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [activeImg, setActiveImg] = useState(0)
  const [qty, setQty] = useState(1)
  const [addingCart, setAddingCart] = useState(false)
  const [toast, setToast] = useState('')
  const [imgErrors, setImgErrors] = useState<Set<number>>(new Set())

  // Smart lead time тооцоо (quantity, pages өөрчлөгдөх үед шинэчлэгдэнэ)
  useEffect(() => {
    if (!product?.id) return
    const q = liveBreakdown?.quantity || qty
    const pages = liveBreakdown?.pages || liveBreakdown?.totalPages || 0
    apiFetch<any>(`/products/${product.id}/estimate-lead-time?quantity=${q}&pages=${pages}`, { auth: false })
      .then(setLeadTime).catch(() => {})
  }, [product?.id, qty, liveBreakdown?.quantity])

  useEffect(() => {
    fetch(`${API}/products/${slug}`)
      .then(r => r.json())
      .then(d => { if (d?.id) setProduct(d) })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [slug])

  if (loading) return <div style={{ padding: 80, textAlign: 'center', color: 'var(--text2)', fontFamily: F }}>Уншиж байна...</div>
  if (!product) return <div style={{ padding: 80, textAlign: 'center', color: 'var(--text2)', fontFamily: F }}>Бүтээгдэхүүн олдсонгүй</div>

  // Build image list: deduplicated, skipping known broken ones
  const rawImgs: string[] = []
  if (product.thumbnail_url) rawImgs.push(product.thumbnail_url)
  if (Array.isArray(product.images)) {
    product.images.forEach((url: string) => {
      if (url && !rawImgs.includes(url)) rawImgs.push(url)
    })
  }
  const imgs = rawImgs.filter((_, i) => !imgErrors.has(i))
  const safeIdx = imgs.length === 0 ? -1 : Math.min(activeImg, imgs.length - 1)

  const price = Number(product.sale_price ?? product.base_price ?? product.price ?? 0)
  const lineTotal = price * qty

  const handleImgError = (rawIdx: number) => {
    setImgErrors(prev => new Set([...prev, rawIdx]))
    if (activeImg >= rawIdx) setActiveImg(Math.max(0, activeImg - 1))
  }

  const addToCart = async () => {
    const token = localStorage.getItem('access_token') || localStorage.getItem('access_token') || localStorage.getItem('token') || ''
    if (!token) { router.push('/login'); return }
    setAddingCart(true)
    try {
      const me = await fetch(`${API}/auth/me`, { headers: { Authorization: `Bearer ${token}` } }).then(r => r.json())
      if (!me?.id) { router.push('/login'); return }
      await fetch(`${API}/cart/items`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ user_id: me.id, product_id: product.id, quantity: qty }),
      })
      setToast('Сагсанд нэмэгдлээ ✓')
      setTimeout(() => setToast(''), 2500)
    } catch { setToast('Алдаа гарлаа') }
    setAddingCart(false)
  }

  return (
    <div style={{ maxWidth: 1100, margin: '0 auto', padding: '32px 24px', fontFamily: F }}>
      {toast && (
        <div style={{ position: 'fixed', top: 16, right: 16, background: '#10B981', color: '#fff', padding: '10px 16px', borderRadius: 10, boxShadow: '0 10px 30px rgba(0,0,0,0.2)', zIndex: 2000, fontSize: 13, fontWeight: 600 }}>
          {toast}
        </div>
      )}

      {/* Breadcrumb */}
      <div style={{ fontSize: 13, color: 'var(--text2)', marginBottom: 24, display: 'flex', gap: 6, alignItems: 'center' }}>
        <a href="/" style={{ color: 'var(--text2)', textDecoration: 'none' }}>Нүүр</a>
        <span>/</span>
        <a href="/shop" style={{ color: 'var(--text2)', textDecoration: 'none' }}>Дэлгүүр</a>
        {product.category && <>
          <span>/</span>
          <a href={`/shop?category=${encodeURIComponent(product.category)}`} style={{ color: 'var(--text2)', textDecoration: 'none' }}>{product.category}</a>
        </>}
        <span>/</span>
        <span style={{ color: 'var(--text)' }}>{product.name_mn || product.name}</span>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 40, alignItems: 'start' }}>
        {/* Image gallery */}
        <div>
          {/* Main image */}
          <div style={{ border: '1px solid var(--border)', borderRadius: 16, background: 'var(--surface)', overflow: 'hidden', aspectRatio: '4/3', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 12, position: 'relative' }}>
            {safeIdx >= 0 && imgs[safeIdx] ? (
              <img
                src={imgs[safeIdx]}
                alt={product.name}
                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                onError={() => handleImgError(rawImgs.indexOf(imgs[safeIdx]))}
              />
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, color: 'var(--text3)' }}>
                <span style={{ fontSize: 48 }}>📦</span>
                <span style={{ fontSize: 13 }}>Зураг байхгүй</span>
              </div>
            )}
            {imgs.length > 1 && (
              <>
                <button onClick={() => setActiveImg(i => (i - 1 + imgs.length) % imgs.length)}
                  style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', background: 'rgba(0,0,0,0.4)', border: 'none', color: '#fff', width: 32, height: 32, borderRadius: '50%', cursor: 'pointer', fontSize: 16 }}>‹</button>
                <button onClick={() => setActiveImg(i => (i + 1) % imgs.length)}
                  style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', background: 'rgba(0,0,0,0.4)', border: 'none', color: '#fff', width: 32, height: 32, borderRadius: '50%', cursor: 'pointer', fontSize: 16 }}>›</button>
              </>
            )}
          </div>

          {/* Thumbnails */}
          {imgs.length > 1 && (
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {imgs.map((url, i) => (
                <div key={i} onClick={() => setActiveImg(i)}
                  style={{ width: 60, height: 60, borderRadius: 8, overflow: 'hidden', border: `2px solid ${safeIdx === i ? '#FF6B00' : 'var(--border)'}`, cursor: 'pointer', background: 'var(--surface)', flexShrink: 0 }}>
                  <img src={url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    onError={() => handleImgError(rawImgs.indexOf(url))} />
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Product info */}
        <div>
          {product.category && (
            <div style={{ fontSize: 12, fontWeight: 600, color: '#FF6B00', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 8 }}>
              {product.category}
            </div>
          )}
          <h1 style={{ fontSize: 26, fontWeight: 800, margin: '0 0 16px', color: 'var(--text)', lineHeight: 1.2 }}>
            {product.name_mn || product.name}
          </h1>

          <div style={{ fontSize: 32, fontWeight: 800, color: '#FF6B00', marginBottom: 20 }}>
            {fmt(price)}
          </div>

          {product.description && (
            <p style={{ fontSize: 14, color: 'var(--text2)', lineHeight: 1.7, margin: '0 0 24px' }}>
              {product.description}
            </p>
          )}

          {/* Quantity */}
          <div style={{ marginBottom: 24 }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text2)', marginBottom: 8 }}>Тоо ширхэг</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{ display: 'flex', alignItems: 'center', border: '1px solid var(--border)', borderRadius: 10, overflow: 'hidden' }}>
                <button onClick={() => setQty(q => Math.max(product.min_quantity ?? 1, q - 1))}
                  style={{ width: 36, height: 36, border: 'none', background: 'var(--surface2)', color: 'var(--text)', fontSize: 18, cursor: 'pointer' }}>−</button>
                <span style={{ padding: '0 16px', fontSize: 15, fontWeight: 600, color: 'var(--text)', minWidth: 24, textAlign: 'center' }}>{qty}</span>
                <button onClick={() => setQty(q => q + 1)}
                  style={{ width: 36, height: 36, border: 'none', background: 'var(--surface2)', color: 'var(--text)', fontSize: 18, cursor: 'pointer' }}>+</button>
              </div>
              {price > 0 && <span style={{ fontSize: 15, fontWeight: 700, color: 'var(--text)' }}>= {fmt(lineTotal)}</span>}
            </div>
          </div>

          {/* Actions */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 20 }}>
            <button onClick={addToCart} disabled={addingCart}
              style={{ padding: '14px', background: '#111', color: '#fff', border: 'none', borderRadius: 12, fontSize: 15, fontWeight: 700, cursor: addingCart ? 'not-allowed' : 'pointer', fontFamily: F, opacity: addingCart ? 0.6 : 1 }}>
              🛒 {addingCart ? 'Нэмж байна...' : 'Сагсанд нэмэх'}
            </button>
            <button onClick={() => { addToCart().then(() => router.push('/checkout')) }}
              style={{ padding: '14px', background: '#FF6B00', color: '#fff', border: 'none', borderRadius: 12, fontSize: 15, fontWeight: 700, cursor: 'pointer', fontFamily: F }}>
              Худалдан авах →
            </button>
          </div>

          {/* Product attributes */}
          {product.attributes && Object.keys(product.attributes).length > 0 && (
            <div style={{ border: '1px solid var(--border)', borderRadius: 12, overflow: 'hidden' }}>
              {Object.entries(product.attributes).map(([key, val], i) => (
                <div key={key} style={{ display: 'flex', borderBottom: i < Object.keys(product.attributes).length - 1 ? '1px solid var(--border)' : 'none' }}>
                  <div style={{ width: 120, padding: '10px 14px', background: 'var(--surface2)', fontSize: 13, color: 'var(--text2)', fontWeight: 500, flexShrink: 0 }}>{key}</div>
                  <div style={{ padding: '10px 14px', fontSize: 13, color: 'var(--text)', flex: 1 }}>{String(val)}</div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
