'use client'
import { apiFetch, getToken } from '@/lib/api'
import { useState, useEffect, useCallback, useRef } from 'react'
import { useParams, useRouter } from 'next/navigation'

const F = "'DM Sans','Segoe UI',system-ui,sans-serif"
const O = '#FF6B00'

const BULK_TIERS = [
  { qty: 50, label: '50 ш', discount: 0 },
  { qty: 100, label: '100 ш', discount: 0.05 },
  { qty: 250, label: '250 ш', discount: 0.10 },
  { qty: 500, label: '500 ш', discount: 0.15 },
  { qty: 1000, label: '1000 ш', discount: 0.20 },
]

function Stars({ rating }: { rating: number }) {
  return (
    <div style={{ display: 'flex', gap: 3, alignItems: 'center' }}>
      {[1, 2, 3, 4, 5].map(s => <span key={s} style={{ fontSize: 14, color: s <= Math.round(rating) ? '#F59E0B' : '#DDD' }}>★</span>)}
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
  const [toast, setToast] = useState('')

  // Config state
  const [selectedOptions, setSelectedOptions] = useState<Record<string, any>>({})
  const [quantity, setQuantity] = useState(100)
  const [activeTier, setActiveTier] = useState<number | null>(1)

  // Price state
  const [priceResult, setPriceResult] = useState<any>(null)
  const [priceLoading, setPriceLoading] = useState(false)
  const priceTimer = useRef<NodeJS.Timeout | null>(null)
  const [showBreakdown, setShowBreakdown] = useState(false)

  // Upload state
  const [uploadFile, setUploadFile] = useState<File | null>(null)
  const [uploadResult, setUploadResult] = useState<any>(null)
  const [uploading, setUploading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Cart state
  const [addingToCart, setAddingToCart] = useState(false)

  // Tab
  const [tab, setTab] = useState<'config' | 'upload'>('config')
  const [creators, setCreators] = useState<any[]>([])

  const show = (m: string) => { setToast(m); setTimeout(() => setToast(''), 2500) }

  // Load product + attributes
  useEffect(() => {
    if (!id) return
    setLoading(true)
    Promise.all([
      apiFetch<any>(`/products/${id}`, { auth: false }).catch(() => null),
      apiFetch<any>(`/product-attributes?product_id=${id}`, { auth: false }).catch(() => []),
      apiFetch<any>('/creators?is_active=true&featured=true&limit=6', { auth: false }).catch(() => []),
    ]).then(([p, attrs, creatorList]) => {
      setProduct(p)
      const attrList = Array.isArray(attrs) ? attrs : []
      setAttributes(attrList)
      setCreators(Array.isArray(creatorList) ? creatorList : (creatorList?.data || []))
      const defaults: Record<string, any> = {}
      attrList.forEach((a: any) => {
        const opts = Array.isArray(a.options) ? a.options : (a.options?.values ?? [])
        if (a.type === 'dimensions') defaults[a.name] = { width: 90, height: 50 }
        else if (opts.length > 0) defaults[a.name] = opts[0]
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
        const res = await apiFetch<any>('/pricing-catalog/quote', { method: 'POST', body, auth: false })
        setPriceResult(res)
      } catch {}
      setPriceLoading(false)
    }, 600)
  }, [product, quantity, selectedOptions, attributes])

  useEffect(() => { calcPrice() }, [calcPrice])

  // File upload
  const handleFileUpload = async (file: File) => {
    setUploadFile(file)
    setUploading(true)
    setUploadResult(null)
    try {
      const fd = new FormData()
      fd.append('file', file)
      fd.append('quantity', String(quantity))
      const res = await apiFetch<any>('/ai/smart-quote/from-pdf', { method: 'POST', body: fd })
      setUploadResult(res)
    } catch {}
    setUploading(false)
  }

  // Add to cart
  const addToCart = async () => {
    const token = getToken()
    if (!token) { router.push('/login'); return }
    setAddingToCart(true)
    try {
      await apiFetch('/cart/items', {
        method: 'POST',
        body: {
          product_id: id,
          quantity,
          specs: {
            ...selectedOptions,
            uploaded_file: uploadResult?.file_url || null,
            ai_price: uploadResult?.quote?.total_price || null,
          },
        },
      })
      show('Сагсанд нэмэгдлээ ✓')
    } catch (err: any) {
      show(err.message || 'Алдаа гарлаа')
    }
    setAddingToCart(false)
  }

  const getRiskColor = (risk: string) => ({ LOW: '#10B981', MEDIUM: '#F59E0B', HIGH: '#EF4444', CRITICAL: '#DC2626' }[risk] || '#888')
  const fmt = (n: number) => `₮${Math.round(n).toLocaleString()}`

  const images = product ? [product.thumbnail_url, ...(product.images || [])].filter(Boolean) : []
  const displayPrice = uploadResult?.quote?.total_price ?? priceResult?.total ?? product?.base_price
  const unitPrice = uploadResult?.quote?.unit_price ?? priceResult?.unit_price ?? (displayPrice ? displayPrice / quantity : 0)

  if (loading) return (
    <div style={{ fontFamily: F, maxWidth: 1200, margin: '0 auto', padding: '40px 20px', display: 'flex', gap: 40 }}>
      {[0, 1].map(i => <div key={i} style={{ flex: i === 0 ? '0 0 480px' : 1, height: 500, background: '#F0F0EC', borderRadius: 16, animation: 'pulse 1.5s ease-in-out infinite' }} />)}
      <style>{`@keyframes pulse{0%,100%{opacity:1}50%{opacity:.5}}`}</style>
    </div>
  )

  if (!product) return (
    <div style={{ fontFamily: F, textAlign: 'center', padding: '80px 20px', color: '#888' }}>
      <div style={{ fontSize: 48, marginBottom: 16 }}>😕</div>
      <div style={{ fontSize: 18, fontWeight: 600, color: '#444', marginBottom: 8 }}>Бүтээгдэхүүн олдсонгүй</div>
      <button onClick={() => router.back()} style={{ padding: '10px 24px', background: O, color: '#fff', border: 'none', borderRadius: 9, cursor: 'pointer', fontSize: 14, fontWeight: 600, fontFamily: F }}>← Буцах</button>
    </div>
  )

  return (
    <div style={{ fontFamily: F, background: '#F8F8F5', minHeight: '100vh' }}>
      {/* Toast */}
      {toast && <div style={{ position: 'fixed', top: 20, left: '50%', transform: 'translateX(-50%)', background: '#1F2937', color: '#fff', padding: '10px 28px', borderRadius: 99, fontSize: 14, fontWeight: 500, zIndex: 9999, boxShadow: '0 8px 30px rgba(0,0,0,0.15)' }}>{toast}</div>}

      {/* Breadcrumb */}
      <div style={{ background: '#fff', borderBottom: '1px solid #EBEBEB' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto', padding: '12px 20px', fontSize: 13, color: '#888', display: 'flex', gap: 8, alignItems: 'center' }}>
          <a href="/" style={{ color: '#888', textDecoration: 'none' }}>Нүүр</a><span>›</span>
          <a href="/shop" style={{ color: '#888', textDecoration: 'none' }}>Дэлгүүр</a><span>›</span>
          <span style={{ color: '#111', fontWeight: 500 }}>{product.name}</span>
        </div>
      </div>

      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '32px 20px 60px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 40, alignItems: 'start' }} className="config-grid">

        {/* ═══ LEFT: Gallery ═══ */}
        <div>
          <div style={{ borderRadius: 16, overflow: 'hidden', background: '#fff', border: '1px solid #EBEBEB', height: 420, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 12, position: 'relative' }}>
            {images.length > 0
              ? <img src={images[activeImg]} alt={product.name} style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
              : <span style={{ fontSize: 80 }}>🖨️</span>}
            {/* Live config badge */}
            <div style={{ position: 'absolute', top: 12, left: 12, background: 'rgba(0,0,0,0.7)', color: '#fff', padding: '4px 12px', borderRadius: 20, fontSize: 11, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 6 }}>
              <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#10B981', animation: 'blink 1.5s infinite' }} />
              Тохируулга идэвхтэй
            </div>
          </div>
          {images.length > 1 && (
            <div style={{ display: 'flex', gap: 8 }}>
              {images.map((img: string, i: number) => (
                <button key={i} onClick={() => setActiveImg(i)} style={{ width: 72, height: 72, borderRadius: 10, overflow: 'hidden', border: activeImg === i ? `2px solid ${O}` : '2px solid #EBEBEB', background: '#fff', cursor: 'pointer', padding: 0 }}>
                  <img src={img} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                </button>
              ))}
            </div>
          )}

          {/* Production info */}
          <div style={{ background: '#fff', borderRadius: 14, padding: 20, border: '1px solid #EBEBEB', marginTop: 16 }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: '#111', marginBottom: 14 }}>Үйлдвэрлэлийн мэдээлэл</div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              {[
                { icon: '⏱️', label: 'Хүргэлт', value: `${product.lead_time_days || 3} хоног` },
                { icon: '📦', label: 'Хамгийн бага', value: `${product.min_quantity || 1} ш` },
                { icon: '🏭', label: 'Төрөл', value: product.type === 'PRINT' ? 'Хэвлэл' : 'Бэлэн' },
                { icon: '📐', label: 'Хэмжээ', value: `${selectedOptions[attributes.find(a => a.type === 'dimensions')?.name]?.width || 90}×${selectedOptions[attributes.find(a => a.type === 'dimensions')?.name]?.height || 50}мм` },
              ].map(item => (
                <div key={item.label} style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                  <span style={{ fontSize: 16 }}>{item.icon}</span>
                  <div>
                    <div style={{ fontSize: 11, color: '#9CA3AF' }}>{item.label}</div>
                    <div style={{ fontSize: 13, fontWeight: 600, color: '#111' }}>{item.value}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ═══ RIGHT: Configurator ═══ */}
        <div>
          {/* Header */}
          <div style={{ marginBottom: 20 }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: O, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 6 }}>{product.category || 'Хэвлэл'}</div>
            <h1 style={{ fontSize: 26, fontWeight: 800, color: '#111', margin: '0 0 8px', lineHeight: 1.2 }}>{product.name}</h1>
            {product.rating != null && <Stars rating={product.rating} />}
            {product.description && <p style={{ fontSize: 14, color: '#666', lineHeight: 1.6, margin: '10px 0 0' }}>{product.description}</p>}
          </div>

          {/* Tab: Config vs Upload */}
          <div style={{ display: 'flex', gap: 0, marginBottom: 20, borderBottom: '2px solid #EBEBEB' }}>
            {[
              { key: 'config' as const, label: '⚙️ Тохируулах', sub: 'Хэмжээ, тоо сонгох' },
              { key: 'upload' as const, label: '📤 Файл оруулах', sub: 'PDF, AI, EPS' },
            ].map(t => (
              <button key={t.key} onClick={() => setTab(t.key)} style={{
                flex: 1, padding: '12px 8px', border: 'none', cursor: 'pointer', fontFamily: F,
                background: 'none', borderBottom: tab === t.key ? `2px solid ${O}` : '2px solid transparent',
                marginBottom: -2, color: tab === t.key ? O : '#888', textAlign: 'center',
              }}>
                <div style={{ fontSize: 14, fontWeight: 700 }}>{t.label}</div>
                <div style={{ fontSize: 11, marginTop: 2, opacity: 0.7 }}>{t.sub}</div>
              </button>
            ))}
          </div>

          {/* Config Tab */}
          {tab === 'config' && (
            <>
              {/* Dynamic Attributes */}
              {attributes.map((attr: any) => {
                const options = Array.isArray(attr.options) ? attr.options : (attr.options?.values ?? [])
                if (!options.length && attr.type !== 'dimensions') return null
                return (
                  <div key={attr.id || attr.name} style={{ marginBottom: 18 }}>
                    <div style={{ fontSize: 13, fontWeight: 700, color: '#111', marginBottom: 8 }}>
                      {attr.name_mn || attr.name}
                      {attr.required && <span style={{ color: '#EF4444', marginLeft: 2 }}>*</span>}
                    </div>
                    {attr.type === 'dimensions' ? (
                      <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                        <input type="number" placeholder="Өргөн" value={selectedOptions[attr.name]?.width || ''} onChange={e => setSelectedOptions(p => ({ ...p, [attr.name]: { ...p[attr.name], width: Number(e.target.value) } }))} style={inputStyle} />
                        <span style={{ color: '#888', fontSize: 16, fontWeight: 300 }}>×</span>
                        <input type="number" placeholder="Өндөр" value={selectedOptions[attr.name]?.height || ''} onChange={e => setSelectedOptions(p => ({ ...p, [attr.name]: { ...p[attr.name], height: Number(e.target.value) } }))} style={inputStyle} />
                        <span style={{ fontSize: 13, color: '#888' }}>мм</span>
                      </div>
                    ) : (
                      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                        {options.map((opt: any) => {
                          const val = typeof opt === 'object' ? opt.value || opt.label || opt : opt
                          const isActive = selectedOptions[attr.name] === val
                          return (
                            <button key={val} onClick={() => setSelectedOptions(p => ({ ...p, [attr.name]: val }))} style={{
                              padding: '7px 16px', borderRadius: 999, fontSize: 13, fontFamily: F, cursor: 'pointer', transition: 'all 0.15s',
                              border: isActive ? `2px solid ${O}` : '1.5px solid #DDD',
                              background: isActive ? '#FFF3EC' : '#fff',
                              color: isActive ? O : '#444', fontWeight: isActive ? 700 : 500,
                            }}>{String(val)}</button>
                          )
                        })}
                      </div>
                    )}
                  </div>
                )
              })}

              {/* Quantity */}
              <div style={{ marginBottom: 20 }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: '#111', marginBottom: 8 }}>Тоо хэмжээ</div>
                <div style={{ display: 'flex', gap: 6, marginBottom: 10, flexWrap: 'wrap' }}>
                  {BULK_TIERS.map(tier => (
                    <button key={tier.qty} onClick={() => { setQuantity(tier.qty); setActiveTier(tier.qty) }} style={{
                      padding: '7px 14px', borderRadius: 8, fontSize: 12, fontFamily: F, cursor: 'pointer', position: 'relative',
                      border: activeTier === tier.qty ? `2px solid ${O}` : '1.5px solid #DDD',
                      background: activeTier === tier.qty ? '#FFF3EC' : '#fff',
                      color: activeTier === tier.qty ? O : '#555', fontWeight: activeTier === tier.qty ? 700 : 500,
                    }}>
                      {tier.label}
                      {tier.discount > 0 && <span style={{ position: 'absolute', top: -8, right: -6, background: '#E53E3E', color: '#fff', fontSize: 9, fontWeight: 700, padding: '1px 5px', borderRadius: 999 }}>-{tier.discount * 100}%</span>}
                    </button>
                  ))}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <button onClick={() => setQuantity(q => Math.max(1, q - 10))} style={qtyBtn}>−</button>
                  <input type="number" value={quantity} min={1} onChange={e => { setQuantity(Number(e.target.value)); setActiveTier(null) }} style={{ width: 90, padding: '9px 12px', border: '1.5px solid #DDD', borderRadius: 8, fontSize: 15, fontWeight: 700, fontFamily: F, textAlign: 'center' }} />
                  <button onClick={() => setQuantity(q => q + 10)} style={qtyBtn}>+</button>
                  <span style={{ fontSize: 13, color: '#888' }}>ширхэг</span>
                </div>
              </div>
            </>
          )}

          {/* Upload Tab */}
          {tab === 'upload' && (
            <div style={{ marginBottom: 20 }}>
              {/* Upload area */}
              <label style={{
                display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12, padding: '40px 24px',
                background: uploadFile ? '#F0FDF4' : '#FAFAFA', border: `2px dashed ${uploadFile ? '#10B981' : '#DDD'}`,
                borderRadius: 16, cursor: 'pointer', textAlign: 'center', transition: 'all 0.2s',
              }}
                onDragOver={e => { e.preventDefault(); e.currentTarget.style.borderColor = O }}
                onDragLeave={e => { e.currentTarget.style.borderColor = '#DDD' }}
                onDrop={e => { e.preventDefault(); const f = e.dataTransfer.files[0]; if (f) handleFileUpload(f) }}
              >
                <span style={{ fontSize: 40 }}>{uploadFile ? '✅' : '📤'}</span>
                <div style={{ fontSize: 15, fontWeight: 700, color: '#333' }}>{uploadFile ? uploadFile.name : 'Файл чирж оруулах эсвэл сонгох'}</div>
                <div style={{ fontSize: 12, color: '#888' }}>PDF, AI, EPS, PNG, JPG (50MB хүртэл)</div>
                <input ref={fileInputRef} type="file" accept=".pdf,.ai,.eps,.png,.jpg,.jpeg,.psd" style={{ display: 'none' }} onChange={e => { const f = e.target.files?.[0]; if (f) handleFileUpload(f) }} />
              </label>

              {/* Upload result */}
              {(uploading || uploadResult) && (
                <div style={{ background: '#fff', border: '1px solid #EBEBEB', borderRadius: 14, padding: 18, marginTop: 16 }}>
                  {uploading ? (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, color: '#888', fontSize: 13 }}>
                      <div style={{ width: 16, height: 16, border: `2px solid ${O}`, borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
                      AI шалгаж, үнэ тооцоолж байна...
                    </div>
                  ) : uploadResult ? (
                    <div>
                      {/* Preflight quality */}
                      {uploadResult.preflight && (
                        <div style={{ marginBottom: 12 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                            <span style={{ fontSize: 13, fontWeight: 700 }}>Чанарын шалгалт</span>
                            <span style={{ padding: '2px 10px', borderRadius: 20, fontSize: 12, fontWeight: 700, background: `${getRiskColor(uploadResult.preflight.risk)}15`, color: getRiskColor(uploadResult.preflight.risk) }}>
                              {uploadResult.preflight.score}/100
                            </span>
                          </div>
                          {uploadResult.preflight.issues?.length > 0 && (
                            <div style={{ background: '#FEF2F2', borderRadius: 8, padding: '8px 12px' }}>
                              {uploadResult.preflight.issues.slice(0, 4).map((issue: string, i: number) => (
                                <div key={i} style={{ fontSize: 12, color: '#DC2626', marginBottom: 2 }}>⚠ {issue}</div>
                              ))}
                            </div>
                          )}
                        </div>
                      )}
                      {/* AI price */}
                      {uploadResult.quote?.total_price && (
                        <div style={{ background: '#F0FDF4', borderRadius: 10, padding: '12px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <div>
                            <div style={{ fontSize: 12, color: '#059669' }}>AI тооцоолсон үнэ</div>
                            <div style={{ fontSize: 22, fontWeight: 800, color: '#059669' }}>{fmt(uploadResult.quote.total_price)}</div>
                          </div>
                          {uploadResult.surcharge?.total_amount > 0 && (
                            <div style={{ fontSize: 12, color: '#F59E0B', fontWeight: 600 }}>+{fmt(uploadResult.surcharge.total_amount)} нэмэгдэл</div>
                          )}
                        </div>
                      )}
                    </div>
                  ) : null}
                </div>
              )}

              {/* Also show designer option */}
              <a href={`/designer?product_id=${id}`} style={{
                display: 'flex', alignItems: 'center', gap: 12, marginTop: 16, padding: '16px 20px',
                background: '#fff', border: '1px solid #EBEBEB', borderRadius: 12, textDecoration: 'none', color: '#333',
              }}>
                <span style={{ fontSize: 28 }}>🎨</span>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 700 }}>Онлайн дизайн хийх</div>
                  <div style={{ fontSize: 12, color: '#888' }}>Загвар сангаас сонгож, шууд засварлах</div>
                </div>
              </a>
            </div>
          )}

          {/* ═══ PRICE DISPLAY ═══ */}
          <div style={{ background: 'linear-gradient(135deg, #FFF3EC, #FFF8F5)', border: `1.5px solid #FFCCA8`, borderRadius: 14, padding: '20px 22px', marginBottom: 20 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
              <span style={{ fontSize: 13, color: '#888' }}>Нийт үнэ ({quantity} ш)</span>
              {priceLoading && <span style={{ fontSize: 12, color: O }}>Тооцоолж байна...</span>}
            </div>
            <div style={{ fontSize: 34, fontWeight: 800, color: O, letterSpacing: '-0.5px' }}>
              {priceLoading ? '—' : displayPrice != null ? fmt(displayPrice) : '—'}
            </div>
            {unitPrice > 0 && !priceLoading && (
              <div style={{ fontSize: 13, color: '#888', marginTop: 2 }}>
                1 ширхэг = {fmt(unitPrice)} · НӨАТ орсон
              </div>
            )}
            {product.lead_time_days && (
              <div style={{ fontSize: 12, color: '#10B981', marginTop: 6, fontWeight: 600 }}>✓ {product.lead_time_days} хоногт бэлэн</div>
            )}
            {/* Breakdown toggle */}
            {priceResult?.breakdown && (
              <div style={{ marginTop: 10 }}>
                <button onClick={() => setShowBreakdown(!showBreakdown)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 12, color: O, fontWeight: 600, fontFamily: F, padding: 0 }}>
                  {showBreakdown ? '▲ Задаргаа нуух' : '▼ Үнийн задаргаа харах'}
                </button>
                {showBreakdown && (
                  <div style={{ marginTop: 8, background: 'rgba(255,255,255,0.6)', borderRadius: 8, padding: '10px 14px' }}>
                    {Object.entries(priceResult.breakdown).map(([key, val]: [string, any]) => (
                      <div key={key} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: '#666', padding: '3px 0' }}>
                        <span>{key}</span>
                        <span style={{ fontWeight: 600 }}>{typeof val === 'number' ? fmt(val) : String(val)}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* ═══ CTA BUTTONS ═══ */}
          <div style={{ display: 'flex', gap: 10, marginBottom: 16 }}>
            <button onClick={addToCart} disabled={addingToCart} style={{
              flex: 1, padding: '15px 0', background: '#fff', color: O, border: `2px solid ${O}`,
              borderRadius: 12, fontSize: 15, fontWeight: 700, cursor: addingToCart ? 'not-allowed' : 'pointer', fontFamily: F,
              opacity: addingToCart ? 0.6 : 1,
            }}>
              {addingToCart ? 'Нэмж байна...' : '🛒 Сагсанд нэмэх'}
            </button>
            <button onClick={() => {
              const token = getToken()
              if (!token) { router.push('/login'); return }
              router.push(`/checkout?product_id=${id}&qty=${quantity}`)
            }} style={{
              flex: 1, padding: '15px 0', background: O, color: '#fff', border: 'none',
              borderRadius: 12, fontSize: 15, fontWeight: 700, cursor: 'pointer', fontFamily: F,
            }}>
              Захиалах — {displayPrice != null ? fmt(displayPrice) : '...'}
            </button>
          </div>

          {/* Trust signals */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            {[
              { icon: '✅', text: 'Чанарын баталгаа' },
              { icon: '🚚', text: 'Хурдан хүргэлт' },
              { icon: '🤖', text: 'AI үнэ тооцоо' },
              { icon: '🔄', text: 'Буцаан олголт' },
            ].map(s => (
              <div key={s.text} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: '#666', background: '#fff', padding: '8px 12px', borderRadius: 8, border: '1px solid #EBEBEB' }}>
                <span>{s.icon}</span>{s.text}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Creators section */}
      <div style={{ marginTop: 48, paddingTop: 32, borderTop: '1px solid var(--border)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <div>
            <h2 style={{ fontSize: 18, fontWeight: 700, color: 'var(--text)', margin: 0 }}>
              🎨 Дизайн хийлгэх үү?
            </h2>
            <p style={{ fontSize: 13, color: 'var(--text3)', marginTop: 4 }}>
              Мэргэшсэн дизайнерууд таны захиалгад зориулж эх бэлтгэл хийнэ
            </p>
          </div>
          <a href="/creators" style={{ fontSize: 12, color: '#FF6B00', textDecoration: 'none', fontWeight: 600 }}>
            Бүгдийг харах →
          </a>
        </div>

        {creators.length > 0 ? (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: 12 }}>
            {creators.map((creator: any) => (
              <a key={creator.id} href={`/creators/${creator.id}`}
                style={{ textDecoration: 'none', display: 'block', border: '1px solid var(--border)', borderRadius: 12, padding: 14, background: 'var(--surface)', transition: 'border-color 0.15s' }}
                onMouseOver={e => (e.currentTarget.style.borderColor = '#FF6B00')}
                onMouseOut={e => (e.currentTarget.style.borderColor = 'var(--border)')}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                  <div style={{ width: 36, height: 36, borderRadius: '50%', overflow: 'hidden', background: 'var(--surface2)', flexShrink: 0 }}>
                    {creator.avatar_url
                      ? <img src={creator.avatar_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      : <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16 }}>🎨</div>
                    }
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {creator.display_name || creator.full_name}
                    </div>
                    {creator.rating > 0 && (
                      <div style={{ fontSize: 10, color: '#F59E0B' }}>
                        {'★'.repeat(Math.round(creator.rating))} {Number(creator.rating).toFixed(1)}
                      </div>
                    )}
                  </div>
                </div>
                {creator.specialties?.length > 0 && (
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                    {creator.specialties.slice(0, 2).map((s: string) => (
                      <span key={s} style={{ fontSize: 9, padding: '2px 6px', borderRadius: 99, background: 'rgba(255,107,0,0.1)', color: '#FF6B00' }}>
                        {s}
                      </span>
                    ))}
                  </div>
                )}
                {creator.starting_price > 0 && (
                  <div style={{ fontSize: 11, color: 'var(--text3)', marginTop: 6 }}>
                    Эхлэх үнэ: <strong style={{ color: '#FF6B00' }}>₮{Number(creator.starting_price).toLocaleString()}</strong>
                  </div>
                )}
              </a>
            ))}
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
            {[
              { icon: '🎨', title: 'Лого дизайн', desc: 'Брэндийн таних тэмдэг', price: '₮50,000-аас' },
              { icon: '📐', title: 'Хэвлэлийн макет', desc: 'Print-ready эх бэлтгэл', price: '₮30,000-аас' },
              { icon: '✍️', title: 'Бичвэр & Контент', desc: 'Маркетингийн текст', price: '₮20,000-аас' },
            ].map(s => (
              <a key={s.title} href="/creators"
                style={{ textDecoration: 'none', border: '1px solid var(--border)', borderRadius: 12, padding: 14, background: 'var(--surface)', display: 'block' }}>
                <div style={{ fontSize: 24, marginBottom: 8 }}>{s.icon}</div>
                <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)', marginBottom: 4 }}>{s.title}</div>
                <div style={{ fontSize: 11, color: 'var(--text3)', marginBottom: 6 }}>{s.desc}</div>
                <div style={{ fontSize: 11, color: '#FF6B00', fontWeight: 600 }}>{s.price}</div>
              </a>
            ))}
          </div>
        )}

        <div style={{ marginTop: 16, textAlign: 'center' }}>
          <a href={`/orders/new?productId=${id}&needsDesign=true`}
            style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '12px 24px', background: 'linear-gradient(135deg, #FF6B00, #E55D00)', color: '#fff', borderRadius: 12, textDecoration: 'none', fontSize: 14, fontWeight: 600 }}>
            🎨 Дизайн захиалах
          </a>
          <p style={{ fontSize: 11, color: 'var(--text3)', marginTop: 8 }}>
            Захиалга өгөхдөө &quot;Дизайн шийлгүүл&quot; сонголтыг идэвхжүүлнэ
          </p>
        </div>
      </div>

      <style>{`
        @media (max-width: 768px) { .config-grid { grid-template-columns: 1fr !important; } }
        @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:.5} }
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes blink { 0%,100%{opacity:1} 50%{opacity:.3} }
      `}</style>
    </div>
  )
}

const inputStyle: React.CSSProperties = { width: 110, padding: '8px 12px', border: '1.5px solid #DDD', borderRadius: 8, fontSize: 13, fontFamily: "'DM Sans',sans-serif" }
const qtyBtn: React.CSSProperties = { width: 36, height: 36, borderRadius: 8, border: '1.5px solid #DDD', background: '#fff', cursor: 'pointer', fontSize: 16, fontWeight: 600, color: '#555', display: 'flex', alignItems: 'center', justifyContent: 'center' }
