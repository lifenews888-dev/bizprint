'use client'
import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'

const FONT = "'DM Sans','Segoe UI',system-ui,sans-serif"
const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'

export default function PublicProductQr() {
  const { slug } = useParams()
  const [product, setProduct] = useState<any>(null)
  const [reviews, setReviews] = useState<any[]>([])
  const [reviewStats, setReviewStats] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [showReviewForm, setShowReviewForm] = useState(false)
  const [reviewForm, setReviewForm] = useState({ reviewer_name: '', rating: 5, comment: '' })
  const [tab, setTab] = useState<'info' | 'specs' | 'reviews'>('info')

  // Reorder configurator
  const [showReorder, setShowReorder] = useState(false)
  const [reorderQty, setReorderQty] = useState(1)
  const [reorderNote, setReorderNote] = useState('')
  const [reorderSent, setReorderSent] = useState(false)

  // Gallery lightbox
  const [lightboxIdx, setLightboxIdx] = useState<number | null>(null)

  useEffect(() => {
    fetch(`${API}/p/${slug}`)
      .then(r => r.ok ? r.json() : null)
      .then(async p => {
        if (!p) { setLoading(false); return }
        setProduct(p)
        const [revs, stats] = await Promise.all([
          fetch(`${API}/p/${p.id}/reviews`).then(r => r.json()).catch(() => []),
          fetch(`${API}/p/${p.id}/reviews/stats`).then(r => r.json()).catch(() => null),
        ])
        setReviews(Array.isArray(revs) ? revs : [])
        setReviewStats(stats)
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [slug])

  const submitReview = async () => {
    if (!reviewForm.reviewer_name || !product) return
    const rev = await fetch(`${API}/p/${product.id}/reviews`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(reviewForm),
    }).then(r => r.json())
    setReviews([rev, ...reviews])
    setShowReviewForm(false)
    setReviewForm({ reviewer_name: '', rating: 5, comment: '' })
  }

  const trackReorder = () => {
    if (!product) return
    fetch(`${API}/p/${product.id}/reorder`, { method: 'POST' })
    // Navigate to checkout with product info pre-filled
    const params = new URLSearchParams({
      product_name: product.product_name || '',
      quantity: String(reorderQty),
      total_price: String(price * reorderQty),
      unit_price: String(price),
      source: 'product_qr',
      slug: String(slug),
      note: reorderNote,
    })
    if (product.reorder_url) {
      window.open(product.reorder_url, '_blank')
    } else {
      window.location.href = `/checkout?${params.toString()}`
    }
  }

  const shareProduct = () => {
    const url = window.location.href
    if (navigator.share) {
      navigator.share({ title: product?.product_name, url }).catch(() => {})
    } else {
      navigator.clipboard.writeText(url)
    }
  }

  if (loading) return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: FONT, background: '#FAFAFA' }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{ width: 32, height: 32, border: '3px solid #FF6B00', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.8s linear infinite', margin: '0 auto 12px' }} />
        <div style={{ color: '#9CA3AF', fontSize: 14 }}>Ачааллаж байна...</div>
      </div>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  )

  if (!product) return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: FONT, flexDirection: 'column', gap: 12, background: '#FAFAFA' }}>
      <div style={{ fontSize: 48 }}>🔍</div>
      <div style={{ fontSize: 18, fontWeight: 600, color: '#374151' }}>Бүтээгдэхүүн олдсонгүй</div>
    </div>
  )

  const accent = product.accent_color || '#FF6B00'
  const price = Number(product.price)
  const allImages = [product.main_image_url, ...(product.gallery_urls || [])].filter(Boolean)
  const avgRating = reviewStats?.average || 0
  const reviewCount = reviewStats?.count || 0

  return (
    <div style={{ minHeight: '100vh', fontFamily: FONT, background: product.bg_color || '#FAFAFA' }}>
      {/* Company header */}
      <div style={{ padding: '12px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: '#fff', borderBottom: '1px solid #E5E7EB', position: 'sticky', top: 0, zIndex: 20 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          {product.company_logo_url && <img src={product.company_logo_url} alt="" style={{ height: 28, borderRadius: 6 }} />}
          <span style={{ fontWeight: 600, color: '#1F2937', fontSize: 14 }}>{product.company_name || 'BizPrint'}</span>
        </div>
        <button onClick={shareProduct} style={{ background: 'none', border: 'none', fontSize: 18, cursor: 'pointer', padding: '4px 8px' }}>↗</button>
      </div>

      <div style={{ maxWidth: 600, margin: '0 auto', padding: '0 0 40px' }}>
        {/* Hero Image */}
        {allImages.length > 0 && (
          <div style={{ position: 'relative' }}>
            <img
              src={allImages[0]} alt={product.product_name}
              onClick={() => setLightboxIdx(0)}
              style={{ width: '100%', maxHeight: 400, objectFit: 'cover', cursor: 'pointer' }}
            />
            {/* Image counter */}
            {allImages.length > 1 && (
              <div style={{ position: 'absolute', bottom: 12, right: 12, background: 'rgba(0,0,0,0.6)', color: '#fff', padding: '4px 12px', borderRadius: 20, fontSize: 12, fontWeight: 600 }}>
                📷 {allImages.length} зураг
              </div>
            )}
            {/* Video badge */}
            {product.video_url && (
              <div style={{ position: 'absolute', bottom: 12, left: 12, background: 'rgba(0,0,0,0.6)', color: '#fff', padding: '4px 12px', borderRadius: 20, fontSize: 12, fontWeight: 600 }}>
                🎬 Видео
              </div>
            )}
          </div>
        )}

        {/* Thumbnails */}
        {allImages.length > 1 && (
          <div style={{ display: 'flex', gap: 6, padding: '8px 16px', overflowX: 'auto' }}>
            {allImages.map((url: string, i: number) => (
              <img key={i} src={url} alt="" onClick={() => setLightboxIdx(i)} style={{
                width: 56, height: 56, objectFit: 'cover', borderRadius: 8, cursor: 'pointer', flexShrink: 0,
                border: '2px solid transparent',
              }} />
            ))}
          </div>
        )}

        <div style={{ padding: '20px 16px' }}>
          {/* Product Info */}
          <div style={{ marginBottom: 20 }}>
            {product.brand && <div style={{ fontSize: 12, color: accent, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 4 }}>{product.brand}</div>}
            <h1 style={{ fontSize: 24, fontWeight: 700, color: '#1F2937', margin: '0 0 6px', lineHeight: 1.3 }}>{product.product_name}</h1>
            {product.category && <div style={{ fontSize: 13, color: '#6B7280', marginBottom: 8 }}>{product.category}</div>}

            {/* Rating */}
            {reviewCount > 0 && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 12 }}>
                <div style={{ display: 'flex', gap: 2 }}>
                  {[1, 2, 3, 4, 5].map(s => <span key={s} style={{ fontSize: 14, color: s <= Math.round(avgRating) ? '#F59E0B' : '#D1D5DB' }}>★</span>)}
                </div>
                <span style={{ fontSize: 13, color: '#6B7280' }}>{avgRating.toFixed(1)} ({reviewCount})</span>
              </div>
            )}

            {/* Price */}
            {price > 0 && (
              <div style={{ fontSize: 28, fontWeight: 800, color: accent }}>{price.toLocaleString()}₮</div>
            )}
          </div>

          {/* Stats bar */}
          <div style={{ display: 'flex', gap: 0, background: '#fff', borderRadius: 12, border: '1px solid #E5E7EB', marginBottom: 20, overflow: 'hidden' }}>
            {[
              { val: product.scan_count || 0, label: 'Скан', icon: '📱' },
              { val: product.view_count || 0, label: 'Үзсэн', icon: '👁' },
              { val: product.reorder_count || 0, label: 'Захиалга', icon: '🔄' },
            ].map((s, i) => (
              <div key={s.label} style={{ flex: 1, padding: '12px', textAlign: 'center', borderRight: i < 2 ? '1px solid #E5E7EB' : 'none' }}>
                <div style={{ fontSize: 18, fontWeight: 700, color: '#1F2937' }}>{s.val}</div>
                <div style={{ fontSize: 11, color: '#9CA3AF', marginTop: 2 }}>{s.icon} {s.label}</div>
              </div>
            ))}
          </div>

          {/* Tabs */}
          <div style={{ display: 'flex', gap: 0, marginBottom: 20, borderBottom: '2px solid #E5E7EB' }}>
            {[
              { key: 'info' as const, label: 'Мэдээлэл' },
              { key: 'specs' as const, label: 'Техникийн' },
              { key: 'reviews' as const, label: `Сэтгэгдэл (${reviewCount})` },
            ].map(t => (
              <button key={t.key} onClick={() => setTab(t.key)} style={{
                flex: 1, padding: '10px 8px', border: 'none', cursor: 'pointer', fontFamily: FONT,
                background: 'none', fontSize: 13, fontWeight: tab === t.key ? 700 : 400,
                color: tab === t.key ? accent : '#6B7280',
                borderBottom: tab === t.key ? `2px solid ${accent}` : '2px solid transparent',
                marginBottom: -2,
              }}>
                {t.label}
              </button>
            ))}
          </div>

          {/* Info tab */}
          {tab === 'info' && (
            <div>
              {product.description && <p style={{ fontSize: 15, color: '#4B5563', lineHeight: 1.7, margin: '0 0 20px' }}>{product.description}</p>}

              {product.features?.length > 0 && (
                <div style={{ marginBottom: 20 }}>
                  <h3 style={{ fontSize: 15, fontWeight: 600, margin: '0 0 10px' }}>Онцлогууд</h3>
                  {product.features.map((f: string, i: number) => (
                    <div key={i} style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 8 }}>
                      <div style={{ width: 20, height: 20, borderRadius: 6, background: `${accent}15`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, color: accent, fontWeight: 700, flexShrink: 0 }}>✓</div>
                      <span style={{ fontSize: 14, color: '#4B5563' }}>{f}</span>
                    </div>
                  ))}
                </div>
              )}

              {/* Video */}
              {product.video_url && (
                <div style={{ marginBottom: 20 }}>
                  <h3 style={{ fontSize: 15, fontWeight: 600, margin: '0 0 10px' }}>Видео</h3>
                  <div style={{ borderRadius: 12, overflow: 'hidden', border: '1px solid #E5E7EB' }}>
                    <video src={product.video_url} controls playsInline preload="metadata" style={{ width: '100%', display: 'block' }} />
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Specs tab */}
          {tab === 'specs' && (
            <div>
              {product.specifications && Object.keys(product.specifications).length > 0 ? (
                <div style={{ background: '#fff', borderRadius: 12, border: '1px solid #E5E7EB', overflow: 'hidden' }}>
                  {Object.entries(product.specifications).map(([k, v], i) => (
                    <div key={k} style={{ display: 'flex', justifyContent: 'space-between', padding: '12px 16px', borderBottom: '1px solid #F3F4F6', fontSize: 14, background: i % 2 === 0 ? '#FAFAFA' : '#fff' }}>
                      <span style={{ color: '#6B7280' }}>{k}</span>
                      <span style={{ fontWeight: 600, color: '#1F2937' }}>{v as string}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <div style={{ textAlign: 'center', padding: 40, color: '#9CA3AF' }}>Техникийн мэдээлэл байхгүй</div>
              )}

              {product.sku && (
                <div style={{ marginTop: 16, fontSize: 12, color: '#9CA3AF' }}>SKU: {product.sku}</div>
              )}
            </div>
          )}

          {/* Reviews tab */}
          {tab === 'reviews' && product.show_reviews && (
            <div>
              {/* Review summary */}
              {reviewStats && reviewCount > 0 && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 20, background: '#fff', borderRadius: 12, padding: '20px', border: '1px solid #E5E7EB', marginBottom: 16 }}>
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: 36, fontWeight: 800, color: '#1F2937' }}>{avgRating.toFixed(1)}</div>
                    <div style={{ display: 'flex', gap: 2, justifyContent: 'center', marginTop: 4 }}>
                      {[1, 2, 3, 4, 5].map(s => <span key={s} style={{ fontSize: 14, color: s <= Math.round(avgRating) ? '#F59E0B' : '#D1D5DB' }}>★</span>)}
                    </div>
                    <div style={{ fontSize: 12, color: '#9CA3AF', marginTop: 4 }}>{reviewCount} сэтгэгдэл</div>
                  </div>
                </div>
              )}

              {/* Add review button */}
              <button onClick={() => setShowReviewForm(!showReviewForm)} style={{
                width: '100%', padding: '12px', background: `${accent}10`, color: accent,
                border: `1px solid ${accent}30`, borderRadius: 10, fontSize: 14, fontWeight: 600,
                cursor: 'pointer', marginBottom: 16, fontFamily: FONT,
              }}>
                ✏️ Сэтгэгдэл бичих
              </button>

              {/* Review form */}
              {showReviewForm && (
                <div style={{ background: '#fff', borderRadius: 12, padding: 20, border: '1px solid #E5E7EB', marginBottom: 16 }}>
                  <input value={reviewForm.reviewer_name} onChange={e => setReviewForm({ ...reviewForm, reviewer_name: e.target.value })} placeholder="Таны нэр" style={{ width: '100%', padding: '10px 14px', borderRadius: 10, border: '1px solid #E5E7EB', fontSize: 14, marginBottom: 8, background: '#FAFAFA' }} />
                  <div style={{ display: 'flex', gap: 4, marginBottom: 8 }}>
                    {[1, 2, 3, 4, 5].map(n => (
                      <button key={n} onClick={() => setReviewForm({ ...reviewForm, rating: n })} style={{ fontSize: 28, background: 'none', border: 'none', cursor: 'pointer', color: n <= reviewForm.rating ? '#F59E0B' : '#D1D5DB' }}>★</button>
                    ))}
                  </div>
                  <textarea value={reviewForm.comment} onChange={e => setReviewForm({ ...reviewForm, comment: e.target.value })} placeholder="Сэтгэгдэл..." style={{ width: '100%', padding: '10px 14px', borderRadius: 10, border: '1px solid #E5E7EB', fontSize: 14, minHeight: 70, resize: 'vertical', background: '#FAFAFA' }} />
                  <button onClick={submitReview} style={{ marginTop: 8, padding: '10px 24px', background: accent, color: '#fff', border: 'none', borderRadius: 10, fontSize: 14, fontWeight: 600, cursor: 'pointer' }}>Илгээх</button>
                </div>
              )}

              {/* Review list */}
              {reviews.map((r: any) => (
                <div key={r.id} style={{ background: '#fff', borderRadius: 12, padding: 16, border: '1px solid #E5E7EB', marginBottom: 8 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                    <span style={{ fontWeight: 600, fontSize: 14, color: '#1F2937' }}>{r.reviewer_name}</span>
                    <span style={{ color: '#F59E0B', fontSize: 13 }}>{'★'.repeat(Math.round(Number(r.rating)))}</span>
                  </div>
                  {r.comment && <p style={{ fontSize: 14, color: '#4B5563', margin: '4px 0 0', lineHeight: 1.5 }}>{r.comment}</p>}
                </div>
              ))}
              {reviews.length === 0 && !showReviewForm && (
                <div style={{ textAlign: 'center', padding: 40, color: '#9CA3AF' }}>Сэтгэгдэл байхгүй</div>
              )}
            </div>
          )}

          {/* ═══ REORDER / CTA SECTION ═══ */}
          {product.show_reorder_button && (
            <div style={{ marginTop: 24 }}>
              {!showReorder && !reorderSent ? (
                <button onClick={() => setShowReorder(true)} style={{
                  width: '100%', padding: '16px', background: accent, color: '#fff', border: 'none',
                  borderRadius: 14, fontSize: 16, fontWeight: 700, cursor: 'pointer', fontFamily: FONT,
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                }}>
                  🔄 {product.cta_text || 'Дахин захиалах'}
                </button>
              ) : reorderSent ? (
                <div style={{ background: '#F0FDF4', border: '1px solid #BBF7D0', borderRadius: 14, padding: '20px', textAlign: 'center' }}>
                  <div style={{ fontSize: 32, marginBottom: 8 }}>✅</div>
                  <div style={{ fontSize: 16, fontWeight: 700, color: '#059669', marginBottom: 4 }}>Захиалга амжилттай!</div>
                  <div style={{ fontSize: 13, color: '#6B7280' }}>Тоо: {reorderQty} ш{reorderNote && ` · ${reorderNote}`}</div>
                </div>
              ) : (
                <div style={{ background: '#fff', border: '1px solid #E5E7EB', borderRadius: 14, padding: '20px' }}>
                  <div style={{ fontSize: 15, fontWeight: 700, color: '#1F2937', marginBottom: 14 }}>Дахин захиалах</div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
                    <span style={{ fontSize: 13, color: '#6B7280' }}>Тоо:</span>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <button onClick={() => setReorderQty(q => Math.max(1, q - 1))} style={qBtn}>−</button>
                      <input type="number" min={1} value={reorderQty} onChange={e => setReorderQty(Number(e.target.value) || 1)} style={{ width: 70, padding: '8px', border: '1px solid #E5E7EB', borderRadius: 8, fontSize: 15, fontWeight: 700, textAlign: 'center' }} />
                      <button onClick={() => setReorderQty(q => q + 1)} style={qBtn}>+</button>
                    </div>
                    {price > 0 && <span style={{ fontSize: 14, fontWeight: 700, color: accent, marginLeft: 'auto' }}>{(price * reorderQty).toLocaleString()}₮</span>}
                  </div>
                  <textarea value={reorderNote} onChange={e => setReorderNote(e.target.value)} placeholder="Нэмэлт тэмдэглэл (заавал биш)" rows={2} style={{ width: '100%', padding: '10px 14px', border: '1px solid #E5E7EB', borderRadius: 10, fontSize: 14, resize: 'none', marginBottom: 12, background: '#FAFAFA' }} />
                  <div style={{ display: 'flex', gap: 8 }}>
                    <button onClick={trackReorder} style={{ flex: 1, padding: '12px', background: accent, color: '#fff', border: 'none', borderRadius: 10, fontSize: 14, fontWeight: 700, cursor: 'pointer' }}>Захиалах</button>
                    <button onClick={() => setShowReorder(false)} style={{ padding: '12px 16px', background: '#F3F4F6', color: '#6B7280', border: 'none', borderRadius: 10, fontSize: 14, cursor: 'pointer' }}>Болих</button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Contact */}
          {product.company_phone && (
            <a href={`tel:${product.company_phone}`} style={{
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, marginTop: 16,
              padding: '14px', background: '#fff', borderRadius: 12, border: '1px solid #E5E7EB',
              color: '#374151', textDecoration: 'none', fontSize: 14, fontWeight: 600,
            }}>
              📞 {product.company_phone}
            </a>
          )}

          {product.company_website && (
            <a href={product.company_website} target="_blank" rel="noopener noreferrer" style={{
              display: 'block', textAlign: 'center', marginTop: 8,
              fontSize: 13, color: accent, textDecoration: 'none',
            }}>
              🌐 {product.company_website}
            </a>
          )}
        </div>
      </div>

      <div style={{ textAlign: 'center', padding: '16px', fontSize: 11, color: '#9CA3AF', borderTop: '1px solid #E5E7EB' }}>
        BizPrint Product QR · Powered by BizPrint.mn
      </div>

      {/* Lightbox */}
      {lightboxIdx !== null && allImages.length > 0 && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 100, background: 'rgba(0,0,0,0.9)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <img src={allImages[lightboxIdx]} alt="" style={{ maxWidth: '90vw', maxHeight: '85vh', objectFit: 'contain', borderRadius: 8 }} />
          <button onClick={() => setLightboxIdx(null)} style={{ position: 'absolute', top: 16, right: 16, background: 'rgba(255,255,255,0.2)', border: 'none', color: '#fff', fontSize: 24, width: 40, height: 40, borderRadius: '50%', cursor: 'pointer' }}>✕</button>
          {allImages.length > 1 && (
            <>
              <button onClick={() => setLightboxIdx((lightboxIdx - 1 + allImages.length) % allImages.length)} style={navBtn}>‹</button>
              <button onClick={() => setLightboxIdx((lightboxIdx + 1) % allImages.length)} style={{ ...navBtn, left: 'auto', right: 16 }}>›</button>
            </>
          )}
        </div>
      )}

      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  )
}

const qBtn: React.CSSProperties = { width: 32, height: 32, borderRadius: 8, border: '1px solid #E5E7EB', background: '#fff', cursor: 'pointer', fontSize: 16, fontWeight: 600, color: '#374151', display: 'flex', alignItems: 'center', justifyContent: 'center' }
const navBtn: React.CSSProperties = { position: 'absolute', left: 16, top: '50%', transform: 'translateY(-50%)', background: 'rgba(255,255,255,0.2)', border: 'none', color: '#fff', fontSize: 32, width: 48, height: 48, borderRadius: '50%', cursor: 'pointer' }
