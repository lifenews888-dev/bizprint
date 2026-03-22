'use client'
import { apiFetch } from '@/lib/api'
import { useState, useEffect, useCallback, useRef } from 'react'
import { useParams, useRouter } from 'next/navigation'

const F = "'DM Sans','Segoe UI',system-ui,sans-serif"

const BULK_TIERS = [
  { qty: 50,   label: '50 ш',   discount: 0 },
  { qty: 100,  label: '100 ш',  discount: 0.05 },
  { qty: 250,  label: '250 ш',  discount: 0.10 },
  { qty: 500,  label: '500 ш',  discount: 0.15 },
  { qty: 1000, label: '1000 ш', discount: 0.20 },
]

function StarRating({ rating }: { rating: number }) {
  return (
    <div style={{ display: 'flex', gap: 3 }}>
      {[1,2,3,4,5].map(s => <span key={s} style={{ fontSize: 14, color: s <= Math.round(rating) ? '#F59E0B' : '#DDD' }}>★</span>)}
      <span style={{ fontSize: 13, color: '#888', marginLeft: 4 }}>{rating.toFixed(1)}</span>
    </div>
  )
}

export default function ProductConfiguratorPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()

  const [product, setProduct] = useState<any>(null)
  const [attributes, setAttributes] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [activeImg, setActiveImg] = useState(0)

  // Configurator state
  const [selectedOptions, setSelectedOptions] = useState<Record<string, any>>({})
  const [quantity, setQuantity] = useState(100)
  const [activeTier, setActiveTier] = useState<number | null>(1) // default 100

  // Price state
  const [priceResult, setPriceResult] = useState<any>(null)
  const [priceLoading, setPriceLoading] = useState(false)
  const priceTimer = useRef<NodeJS.Timeout | null>(null)

  // Upload state
  const [uploadFile, setUploadFile] = useState<File | null>(null)
  const [uploadResult, setUploadResult] = useState<any>(null)
  const [uploading, setUploading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Load product + attributes
  useEffect(() => {
    if (!id) return
    setLoading(true)
    Promise.all([
      apiFetch(`/products/${id}`, { auth: false }).catch(() => null),
      apiFetch(`/product-attributes?product_id=${id}`, { auth: false }).catch(() => []),
    ]).then(([p, attrs]) => {
      setProduct(p)
      const attrList = Array.isArray(attrs) ? attrs : []
      setAttributes(attrList)
      // Set defaults
      const defaults: Record<string, any> = {}
      attrList.forEach((a: any) => {
        const opts = Array.isArray(a.options) ? a.options : (a.options?.values ?? [])
        if (opts.length > 0) defaults[a.name] = opts[0]
      })
      setSelectedOptions(defaults)
    }).finally(() => setLoading(false))
  }, [id])

  // Real-time price calc (debounced 600ms)
  const calcPrice = useCallback(() => {
    if (!product) return
    if (priceTimer.current) clearTimeout(priceTimer.current)
    setPriceLoading(true)
    priceTimer.current = setTimeout(async () => {
      try {
        const sizeAttr = attributes.find(a => a.type === 'dimensions' || a.name?.toLowerCase().includes('хэмжээ'))
        const body = {
          product_type: product.category || product.type,
          quantity,
          width_mm: selectedOptions[sizeAttr?.name]?.width || product.width_mm || 90,
          height_mm: selectedOptions[sizeAttr?.name]?.height || product.height_mm || 50,
          apply_vat: true,
        }
        const res = await apiFetch('/pricing-catalog/quote', { method: 'POST', body: body })
        setPriceResult(res)
      } catch {}
      setPriceLoading(false)
    }, 600)
  }, [product, quantity, selectedOptions, attributes])

  useEffect(() => { calcPrice() }, [calcPrice])

  // File upload handler
  const handleFileUpload = async (file: File) => {
    setUploadFile(file)
    setUploading(true)
    setUploadResult(null)
    try {
      const fd = new FormData()
      fd.append('file', file)
      fd.append('quantity', String(quantity))
      const res = await apiFetch(`/ai/smart-quote/from-pdf`, {
        method: 'POST',
        body: fd,
      })
      setUploadResult(res)
    } catch {}
    setUploading(false)
  }

  const getRiskColor = (risk: string) => ({ LOW: '#10B981', MEDIUM: '#F59E0B', HIGH: '#EF4444', CRITICAL: '#DC2626' }[risk] || '#888')
  const formatPrice = (n: number) => `₮${Math.round(n).toLocaleString()}`

  const images = product ? [product.thumbnail_url, ...(product.images || [])].filter(Boolean) : []
  const displayPrice = uploadResult?.quote?.total_price ?? priceResult?.total ?? product?.base_price

  if (loading) return (
    <div style={{ fontFamily: F, maxWidth: 1200, margin: '0 auto', padding: '40px 20px', display: 'flex', gap: 40 }}>
      {[0,1].map(i => <div key={i} style={{ flex: i === 0 ? '0 0 480px' : 1, height: 500, background: '#F0F0EC', borderRadius: 16, animation: 'pulse 1.5s ease-in-out infinite' }} />)}
      <style>{`@keyframes pulse{0%,100%{opacity:1}50%{opacity:.5}}`}</style>
    </div>
  )

  if (!product) return (
    <div style={{ fontFamily: F, textAlign: 'center', padding: '80px 20px', color: '#888' }}>
      <div style={{ fontSize: 48, marginBottom: 16 }}>😕</div>
      <div style={{ fontSize: 18, fontWeight: 600, color: '#444', marginBottom: 8 }}>Бүтээгдэхүүн олдсонгүй</div>
      <button onClick={() => router.back()} style={{ padding: '10px 24px', background: '#FF6B00', color: '#fff', border: 'none', borderRadius: 9, cursor: 'pointer', fontSize: 14, fontWeight: 600, fontFamily: F }}>← Буцах</button>
    </div>
  )

  return (
    <div style={{ fontFamily: F, background: '#F8F8F5', minHeight: '100vh' }}>
      {/* Breadcrumb */}
      <div style={{ background: '#fff', borderBottom: '1px solid #EBEBEB' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto', padding: '12px 20px', fontSize: 13, color: '#888', display: 'flex', gap: 8, alignItems: 'center' }}>
          <a href="/" style={{ color: '#888', textDecoration: 'none' }}>Нүүр</a>
          <span>›</span>
          <a href="/shop" style={{ color: '#888', textDecoration: 'none' }}>Дэлгүүр</a>
          <span>›</span>
          <span style={{ color: '#111', fontWeight: 500 }}>{product.name}</span>
        </div>
      </div>

      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '32px 20px 60px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 40, alignItems: 'start' }} className="config-grid">

        {/* LEFT: Image gallery */}
        <div>
          <div style={{ borderRadius: 16, overflow: 'hidden', background: '#fff', border: '1px solid #EBEBEB', height: 420, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 12 }}>
            {images.length > 0
              ? <img src={images[activeImg]} alt={product.name} style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
              : <span style={{ fontSize: 80 }}>{product.icon || '🖨️'}</span>}
          </div>
          {images.length > 1 && (
            <div style={{ display: 'flex', gap: 8 }}>
              {images.map((img: string, i: number) => (
                <button key={i} onClick={() => setActiveImg(i)} style={{ width: 72, height: 72, borderRadius: 10, overflow: 'hidden', border: activeImg === i ? '2px solid #FF6B00' : '2px solid #EBEBEB', background: '#fff', cursor: 'pointer', padding: 0 }}>
                  <img src={img} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* RIGHT: Configurator */}
        <div>
          {/* Product header */}
          <div style={{ marginBottom: 24 }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: '#FF6B00', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 8 }}>
              {product.category || 'Хэвлэл'}
            </div>
            <h1 style={{ fontSize: 26, fontWeight: 800, color: '#111', margin: '0 0 10px', lineHeight: 1.2, letterSpacing: '-0.3px' }}>{product.name}</h1>
            {product.rating != null && <StarRating rating={product.rating} />}
            {product.description && <p style={{ fontSize: 14, color: '#666', lineHeight: 1.6, margin: '12px 0 0' }}>{product.description}</p>}
          </div>

          {/* Attributes */}
          {attributes.map((attr: any) => {
            const options = Array.isArray(attr.options) ? attr.options : (attr.options?.values ?? [])
            if (!options.length && attr.type !== 'dimensions') return null
            return (
              <div key={attr.id || attr.name} style={{ marginBottom: 20 }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: '#111', marginBottom: 10 }}>
                  {attr.name_mn || attr.name}
                  {selectedOptions[attr.name] && (
                    <span style={{ fontWeight: 400, color: '#FF6B00', marginLeft: 8 }}>{String(selectedOptions[attr.name])}</span>
                  )}
                </div>
                {attr.type === 'dimensions' ? (
                  <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                    <input type="number" placeholder="Өргөн (мм)" value={selectedOptions[attr.name]?.width || ''} onChange={e => setSelectedOptions(p => ({ ...p, [attr.name]: { ...p[attr.name], width: Number(e.target.value) } }))}
                      style={{ width: 110, padding: '8px 12px', border: '1.5px solid #DDD', borderRadius: 8, fontSize: 13, fontFamily: F }} />
                    <span style={{ color: '#888' }}>×</span>
                    <input type="number" placeholder="Өндөр (мм)" value={selectedOptions[attr.name]?.height || ''} onChange={e => setSelectedOptions(p => ({ ...p, [attr.name]: { ...p[attr.name], height: Number(e.target.value) } }))}
                      style={{ width: 110, padding: '8px 12px', border: '1.5px solid #DDD', borderRadius: 8, fontSize: 13, fontFamily: F }} />
                    <span style={{ fontSize: 13, color: '#888' }}>мм</span>
                  </div>
                ) : (
                  <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                    {options.map((opt: any) => {
                      const val = typeof opt === 'object' ? opt.value || opt.label || opt : opt
                      const isActive = selectedOptions[attr.name] === val
                      return (
                        <button key={val} onClick={() => setSelectedOptions(p => ({ ...p, [attr.name]: val }))}
                          style={{ padding: '8px 16px', borderRadius: 999, border: isActive ? '2px solid #FF6B00' : '1.5px solid #DDDDDD', background: isActive ? '#FFF3EC' : '#fff', color: isActive ? '#FF6B00' : '#444', fontSize: 13, fontWeight: isActive ? 700 : 500, cursor: 'pointer', fontFamily: F, transition: 'all 0.15s' }}>
                          {String(val)}
                        </button>
                      )
                    })}
                  </div>
                )}
              </div>
            )
          })}

          {/* Quantity + bulk tiers */}
          <div style={{ marginBottom: 24 }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: '#111', marginBottom: 10 }}>Тоо хэмжээ</div>
            <div style={{ display: 'flex', gap: 6, marginBottom: 10, flexWrap: 'wrap' }}>
              {BULK_TIERS.map(tier => (
                <button key={tier.qty} onClick={() => { setQuantity(tier.qty); setActiveTier(tier.qty) }}
                  style={{ padding: '7px 14px', borderRadius: 8, border: activeTier === tier.qty ? '2px solid #FF6B00' : '1.5px solid #DDD', background: activeTier === tier.qty ? '#FFF3EC' : '#fff', color: activeTier === tier.qty ? '#FF6B00' : '#555', fontSize: 12, fontWeight: activeTier === tier.qty ? 700 : 500, cursor: 'pointer', fontFamily: F, position: 'relative' }}>
                  {tier.label}
                  {tier.discount > 0 && <span style={{ position: 'absolute', top: -8, right: -6, background: '#E53E3E', color: '#fff', fontSize: 9, fontWeight: 700, padding: '1px 5px', borderRadius: 999 }}>-{tier.discount * 100}%</span>}
                </button>
              ))}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <input type="number" value={quantity} min={1} onChange={e => { setQuantity(Number(e.target.value)); setActiveTier(null) }}
                style={{ width: 100, padding: '9px 12px', border: '1.5px solid #DDD', borderRadius: 8, fontSize: 14, fontWeight: 600, fontFamily: F }} />
              <span style={{ fontSize: 13, color: '#888' }}>ширхэг</span>
            </div>
          </div>

          {/* Price display */}
          <div style={{ background: 'linear-gradient(135deg, #FFF3EC, #FFF8F5)', border: '1.5px solid #FFCCA8', borderRadius: 14, padding: '20px 22px', marginBottom: 24 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
              <span style={{ fontSize: 13, color: '#888' }}>Нийт үнэ ({quantity} ш)</span>
              {priceLoading && <span style={{ fontSize: 12, color: '#FF6B00' }}>Тооцоолж байна...</span>}
            </div>
            <div style={{ fontSize: 32, fontWeight: 800, color: '#FF6B00', letterSpacing: '-0.5px' }}>
              {priceLoading ? '—' : displayPrice != null ? formatPrice(displayPrice) : '—'}
            </div>
            {priceResult?.unit_price && !priceLoading && (
              <div style={{ fontSize: 13, color: '#888', marginTop: 4 }}>
                1 ширхэг = {formatPrice(priceResult.unit_price)} · НӨАТ орсон
              </div>
            )}
            {product.lead_time_days && (
              <div style={{ fontSize: 12, color: '#10B981', marginTop: 8, fontWeight: 600 }}>
                ✓ {product.lead_time_days} хоногт бэлэн
              </div>
            )}
          </div>

          {/* Dual CTA: Design online vs Upload */}
          <div style={{ marginBottom: 20 }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: '#111', marginBottom: 12 }}>Дизайн хэрхэн хийх вэ?</div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 14 }}>
              <a href={`/designer?product_id=${id}`} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, padding: '16px 14px', background: '#FF6B00', borderRadius: 12, textDecoration: 'none', color: '#fff', textAlign: 'center', transition: 'background 0.15s' }}
                onMouseEnter={e => (e.currentTarget.style.background = '#e05500')}
                onMouseLeave={e => (e.currentTarget.style.background = '#FF6B00')}
              >
                <span style={{ fontSize: 24 }}>🎨</span>
                <span style={{ fontSize: 13, fontWeight: 700 }}>Онлайн дизайн хийх</span>
                <span style={{ fontSize: 11, opacity: 0.85 }}>Загвар сангаас сонгох</span>
              </a>
              <button onClick={() => fileInputRef.current?.click()} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, padding: '16px 14px', background: '#fff', border: '2px dashed #DDD', borderRadius: 12, cursor: 'pointer', color: '#555', fontFamily: F, transition: 'border-color 0.15s, background 0.15s' }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = '#FF6B00'; e.currentTarget.style.background = '#FFFAF7' }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = '#DDD'; e.currentTarget.style.background = '#fff' }}
              >
                <span style={{ fontSize: 24 }}>📤</span>
                <span style={{ fontSize: 13, fontWeight: 700, color: '#333' }}>Файл байршуулах</span>
                <span style={{ fontSize: 11, color: '#888' }}>PDF, AI, EPS, PNG</span>
              </button>
            </div>
            <input ref={fileInputRef} type="file" accept=".pdf,.ai,.eps,.png,.jpg,.jpeg,.psd" style={{ display: 'none' }}
              onChange={e => { const f = e.target.files?.[0]; if (f) handleFileUpload(f) }} />
          </div>

          {/* Upload result */}
          {(uploading || uploadResult) && (
            <div style={{ background: '#F8F8F5', border: '1px solid #EBEBEB', borderRadius: 12, padding: 16, marginBottom: 20 }}>
              {uploading ? (
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, color: '#888', fontSize: 13 }}>
                  <div style={{ width: 16, height: 16, border: '2px solid #FF6B00', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
                  PDF шалгаж байна...
                </div>
              ) : uploadResult ? (
                <div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: '#111', marginBottom: 10 }}>
                    📄 {uploadFile?.name}
                  </div>
                  {uploadResult.preflight && (
                    <div style={{ marginBottom: 10 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                        <span style={{ fontSize: 12, color: '#888' }}>Чанарын оноо:</span>
                        <span style={{ fontSize: 14, fontWeight: 700, color: getRiskColor(uploadResult.preflight.risk) }}>
                          {uploadResult.preflight.score}/100 ({uploadResult.preflight.risk})
                        </span>
                      </div>
                      {uploadResult.preflight.issues?.length > 0 && (
                        <ul style={{ margin: 0, paddingLeft: 16 }}>
                          {uploadResult.preflight.issues.slice(0, 3).map((issue: string, i: number) => (
                            <li key={i} style={{ fontSize: 12, color: '#EF4444', marginBottom: 3 }}>{issue}</li>
                          ))}
                        </ul>
                      )}
                    </div>
                  )}
                  {uploadResult.quote?.total_price && (
                    <div style={{ fontSize: 13, color: '#555' }}>
                      AI үнэ: <strong style={{ color: '#FF6B00', fontSize: 16 }}>{formatPrice(uploadResult.quote.total_price)}</strong>
                      {uploadResult.surcharge?.total_amount > 0 && <span style={{ color: '#F59E0B', marginLeft: 8 }}>+{formatPrice(uploadResult.surcharge.total_amount)} нэмэгдэл</span>}
                    </div>
                  )}
                </div>
              ) : null}
            </div>
          )}

          {/* Add to cart */}
          <div style={{ display: 'flex', gap: 10 }}>
            <button style={{ flex: 1, padding: '14px 0', background: '#FF6B00', color: '#fff', border: 'none', borderRadius: 12, fontSize: 15, fontWeight: 700, cursor: 'pointer', fontFamily: F, transition: 'background 0.15s' }}
              onMouseEnter={e => (e.currentTarget.style.background = '#e05500')}
              onMouseLeave={e => (e.currentTarget.style.background = '#FF6B00')}
              onClick={() => {
                const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null
                if (!token) { router.push('/login'); return }
                // TODO: POST /cart/items
                router.push(`/checkout?product_id=${id}&qty=${quantity}`)
              }}
            >
              Захиалах — {displayPrice != null ? formatPrice(displayPrice) : '...'}
            </button>
            <button style={{ padding: '14px 18px', background: '#fff', border: '1.5px solid #DDD', borderRadius: 12, fontSize: 20, cursor: 'pointer', transition: 'border-color 0.15s' }}
              onMouseEnter={e => (e.currentTarget.style.borderColor = '#FF6B00')}
              onMouseLeave={e => (e.currentTarget.style.borderColor = '#DDD')}
            >🤍</button>
          </div>

          {/* Trust signals */}
          <div style={{ display: 'flex', gap: 16, marginTop: 16, flexWrap: 'wrap' }}>
            {['✓ Чанарын баталгаа', '✓ Хурдан хүргэлт', '✓ AI үнэ тооцоо'].map(s => (
              <span key={s} style={{ fontSize: 12, color: '#10B981', fontWeight: 600 }}>{s}</span>
            ))}
          </div>
        </div>
      </div>

      <style>{`
        @media (max-width: 768px) { .config-grid { grid-template-columns: 1fr !important; } }
        @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:.5} }
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
    </div>
  )
}
