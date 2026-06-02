'use client'
import { useState, useMemo, useEffect } from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import PrintPreview from '@/components/PrintPreview'
import { API_URL } from '@/lib/api'
import { calcWideFallbackPrice, clampWideDimensionMm, clampWideQuantity, fetchWideServerPrice } from '@/lib/pricing/wide'

interface PrintType {
  id: string
  name: string
  icon: string
  sizes: Array<{ label: string; w: number; h: number }>
  materials: string[]
  finishing: string[]
  minQty: number
  // Admin-configurable pricing factors (fallback defaults)
  baseRate: number
  doubleSideMultiplier: number
  overheadRate: number
  platformRate: number
  inkCostPer500: number
  finishingCostEach: number
  volumeDiscounts?: Array<{ min_qty: number; discount_percent: number }>
}

interface QuotePrice {
  total: number
  unitPrice: number
  source?: 'local' | 'server'
  breakdown: {
    paper: number
    ink: number
    material?: number
    print?: number
    finishing: number
    setup?: number
    pages: number
    vat?: number
  }
  meta?: {
    materialName?: string
    areaM2?: number
    billableAreaM2?: number
    wastePct?: number
    materialRateM2?: number
    printRateM2?: number
    sideMultiplier?: number
  }
}

// ─── Fallback static config (used if API fails) ─────────────
const FALLBACK_TYPES: PrintType[] = [
  { id: 'business-card', name: 'Нэрийн хуудас', icon: '💳', sizes: [{ label: '90×54мм (стандарт)', w: 90, h: 54 }, { label: '90×50мм', w: 90, h: 50 }, { label: 'Захиалгат', w: 0, h: 0 }], materials: ['Art card 300gsm', 'Art card 350gsm', 'Металл', 'PVC тунгалаг'], finishing: ['Матт ламинат', 'Глосс ламинат', 'Soft-touch', 'УВ лак', 'Фольг тамга'], minQty: 100, baseRate: 340, doubleSideMultiplier: 1.7, overheadRate: 0.12, platformRate: 0.10, inkCostPer500: 7000, finishingCostEach: 5000 },
  { id: 'flyer', name: 'Флаер', icon: '📄', sizes: [{ label: 'A6 (105×148мм)', w: 105, h: 148 }, { label: 'A5 (148×210мм)', w: 148, h: 210 }, { label: 'A4 (210×297мм)', w: 210, h: 297 }, { label: 'DL (99×210мм)', w: 99, h: 210 }, { label: 'Захиалгат', w: 0, h: 0 }], materials: ['Glossy 130gsm', 'Glossy 170gsm', 'Matte 170gsm', 'Art card 250gsm'], finishing: ['Матт ламинат', 'Глосс ламинат', 'УВ лак'], minQty: 50, baseRate: 180, doubleSideMultiplier: 1.7, overheadRate: 0.12, platformRate: 0.10, inkCostPer500: 7000, finishingCostEach: 5000 },
  { id: 'brochure', name: 'Брошур', icon: '📋', sizes: [{ label: 'A5 — 2 нугалаа', w: 148, h: 210 }, { label: 'A4 — 3 нугалаа', w: 210, h: 297 }, { label: 'A4 — 2 нугалаа', w: 210, h: 297 }], materials: ['Glossy 170gsm', 'Matte 170gsm', 'Art card 250gsm'], finishing: ['Матт ламинат', 'Глосс ламинат'], minQty: 100, baseRate: 250, doubleSideMultiplier: 1.7, overheadRate: 0.12, platformRate: 0.10, inkCostPer500: 7000, finishingCostEach: 5000 },
  { id: 'poster', name: 'Постер', icon: '🖼️', sizes: [{ label: 'A3 (297×420мм)', w: 297, h: 420 }, { label: 'A2 (420×594мм)', w: 420, h: 594 }, { label: 'A1 (594×841мм)', w: 594, h: 841 }, { label: 'Захиалгат', w: 0, h: 0 }], materials: ['Glossy 170gsm', 'Matte 170gsm', 'Art card 250gsm'], finishing: ['Матт ламинат', 'Глосс ламинат', 'УВ лак'], minQty: 10, baseRate: 210, doubleSideMultiplier: 1.7, overheadRate: 0.12, platformRate: 0.10, inkCostPer500: 7000, finishingCostEach: 5000 },
  { id: 'sticker', name: 'Стикер', icon: '📎', sizes: [{ label: 'Дугуй 50мм', w: 50, h: 50 }, { label: 'Дугуй 100мм', w: 100, h: 100 }, { label: 'Дөрвөлжин A6', w: 105, h: 148 }, { label: 'Захиалгат', w: 0, h: 0 }], materials: ['Vinyl цагаан', 'Vinyl тунгалаг', 'Цаасан'], finishing: ['Ламинат', 'UV coating'], minQty: 100, baseRate: 280, doubleSideMultiplier: 1.7, overheadRate: 0.12, platformRate: 0.10, inkCostPer500: 7000, finishingCostEach: 5000 },
  { id: 'banner', name: 'Баннер', icon: '🏗️', sizes: [{ label: '1×2м', w: 1000, h: 2000 }, { label: '1×3м', w: 1000, h: 3000 }, { label: '2×3м', w: 2000, h: 3000 }, { label: '3×6м', w: 3000, h: 6000 }, { label: 'Захиалгат', w: 0, h: 0 }], materials: ['Vinyl 440gsm', 'Mesh баннер', 'Backlit хулдаас'], finishing: ['Гантиг гагнуур', 'Оосор нэмэх'], minQty: 1, baseRate: 1200, doubleSideMultiplier: 1.7, overheadRate: 0.12, platformRate: 0.10, inkCostPer500: 7000, finishingCostEach: 5000 },
  { id: 'book', name: 'Ном / Каталог', icon: '📕', sizes: [{ label: 'A5 (148×210мм)', w: 148, h: 210 }, { label: 'A4 (210×297мм)', w: 210, h: 297 }, { label: 'Square 200×200мм', w: 200, h: 200 }], materials: ['Glossy хавтас', 'Matte хавтас', 'Soft-touch хавтас'], finishing: ['Perfect bind', 'Saddle stitch', 'Wire-O', 'Хатуу хавтас'], minQty: 10, baseRate: 170, doubleSideMultiplier: 1.7, overheadRate: 0.12, platformRate: 0.10, inkCostPer500: 7000, finishingCostEach: 5000 },
]

const QTY_PRESETS = [50, 100, 250, 500, 1000, 2000, 5000]
const PRODUCT_ALIASES: Record<string, string> = {
  businesscard: 'business-card',
  businesscards: 'business-card',
  'business-cards': 'business-card',
  namecard: 'business-card',
  flyers: 'flyer',
  poster: 'poster',
  posters: 'poster',
  banners: 'banner',
  stickers: 'sticker',
}

const findSizeIndex = (pt: PrintType, value: string | null) => {
  if (!value) return -1
  const normalized = value.toLowerCase().replace('×', 'x')
  const byLabel = pt.sizes.findIndex(s => s.label.toLowerCase().replace('×', 'x') === normalized)
  if (byLabel >= 0) return byLabel
  const [w, h] = normalized.split('x').map(Number)
  if (!w || !h) return -1
  return pt.sizes.findIndex(s => Number(s.w) === w && Number(s.h) === h)
}

const clampQuotePages = (value: unknown) => {
  const parsed = Number(value)
  if (!Number.isFinite(parsed) || parsed < 4) return 4
  return Math.min(10_000, Math.max(4, Math.round(parsed / 4) * 4))
}

function calcPrice(pt: PrintType, size: { w: number; h: number }, finishing: string[], qty: number, sides: string, pages: number, materialName = ''): QuotePrice | null {
  if (!size.w || !size.h || qty < 1) return null
  const areaM2 = (size.w / 1000) * (size.h / 1000)
  if (pt.id === 'banner' || pt.id === 'sticker') {
    return calcWideFallbackPrice({
      productId: pt.id,
      widthMm: size.w,
      heightMm: size.h,
      quantity: qty,
      sides,
      materialName,
      finishing,
    })
  }
  const paperCost = pt.baseRate * qty * (areaM2 / 0.0623)
  const inkCost = pt.inkCostPer500 * qty / 500
  const finishingCost = finishing.length * pt.finishingCostEach
  const pagesCost = pt.id === 'book' ? pages * qty * 15 : 0
  const sidesMultiplier = sides === 'double' ? pt.doubleSideMultiplier : 1
  const subtotal = (paperCost + inkCost + finishingCost + pagesCost) * sidesMultiplier
  const overhead = subtotal * pt.overheadRate
  const platform = (subtotal + overhead) * pt.platformRate
  const total = Math.round(subtotal + overhead + platform)
  return { total, unitPrice: Math.round(total / qty), source: 'local' as const, breakdown: { paper: Math.round(paperCost), ink: Math.round(inkCost), finishing: Math.round(finishingCost), pages: Math.round(pagesCost) } }
}

export default function InstantQuote() {
  const searchParams = useSearchParams()
  const requestedProduct = searchParams.get('product') || searchParams.get('type') || ''
  const requestedSize = searchParams.get('size')
  const requestedMaterial = searchParams.get('material')
  const requestedQty = Number(searchParams.get('qty') || '')
  const requestedSides = searchParams.get('sides')
  const requestedFinishing = searchParams.get('finishing')
  const [types, setTypes] = useState<PrintType[]>(FALLBACK_TYPES)
  const [typeIdx, setTypeIdx] = useState(0)
  const [sizeIdx, setSizeIdx] = useState(0)
  const [customW, setCustomW] = useState(0)
  const [customH, setCustomH] = useState(0)
  const [matIdx, setMatIdx] = useState(0)
  const [selectedFinishing, setSelectedFinishing] = useState<string[]>([])
  const [sides, setSides] = useState('double')
  const [qty, setQty] = useState(100)
  const [customQty, setCustomQty] = useState('')
  const [pages, setPages] = useState(32)
  const [showBreakdown, setShowBreakdown] = useState(false)
  const [serverPrice, setServerPrice] = useState<QuotePrice | null>(null)
  const [priceLoading, setPriceLoading] = useState(false)

  const selectType = (index: number) => {
    const nextType = types[index] || types[0]
    setTypeIdx(index)
    setSizeIdx(0)
    setMatIdx(0)
    setSelectedFinishing([])
    setCustomQty('')
    setQty(Math.max(1, nextType?.minQty || 1))
  }

  // Fetch admin-managed configs from API; keep fallback on error
  useEffect(() => {
    fetch(`${API_URL}/api/cms/quote-config`)
      .then(r => r.json())
      .then((data: any[]) => {
        if (!Array.isArray(data) || data.length === 0) return
        const mapped: PrintType[] = data.map(c => ({
          id: c.product_type,
          name: c.name_mn,
          icon: c.icon || '📦',
          sizes: c.sizes || [],
          materials: c.materials || [],
          finishing: c.finishing_options || [],
          minQty: c.min_qty || 1,
          baseRate: Number(c.base_rate) || 200,
          doubleSideMultiplier: Number(c.double_side_multiplier) || 1.7,
          overheadRate: Number(c.overhead_rate) || 0.12,
          platformRate: Number(c.platform_rate) || 0.10,
          inkCostPer500: Number(c.ink_cost_per_500) || 7000,
          finishingCostEach: Number(c.finishing_cost_each) || 5000,
          volumeDiscounts: c.volume_discounts || [],
        }))
        setTypes(mapped)
      })
      .catch(() => {})
  }, [])

  useEffect(() => {
    if (!requestedProduct) return
    const normalized = PRODUCT_ALIASES[requestedProduct.toLowerCase()] || requestedProduct.toLowerCase()
    const nextIdx = types.findIndex(t => t.id.toLowerCase() === normalized)
    if (nextIdx < 0) return

    const nextType = types[nextIdx]
    if (nextIdx !== typeIdx) setTypeIdx(nextIdx)
    const nextSizeIdx = findSizeIndex(nextType, requestedSize)
    setSizeIdx(nextSizeIdx >= 0 ? nextSizeIdx : 0)
    const nextMatIdx = requestedMaterial ? nextType.materials.findIndex(m => m === requestedMaterial) : -1
    setMatIdx(nextMatIdx >= 0 ? nextMatIdx : 0)
    setSelectedFinishing(
      (requestedFinishing || '')
        .split(',')
        .map(f => f.trim())
        .filter(f => nextType.finishing.includes(f)),
    )
    setSides(requestedSides === 'single' ? 'single' : 'double')
    setCustomQty('')
    setQty(clampWideQuantity(requestedQty || nextType.minQty || 1, Math.max(1, nextType.minQty || 1)))
  }, [requestedProduct, requestedSize, requestedMaterial, requestedQty, requestedSides, requestedFinishing, types, typeIdx])

  const pt = types[typeIdx] || types[0]
  const size = pt.sizes[sizeIdx] || { label: '', w: 0, h: 0 }
  const isCustom = size?.w === 0
  const effectiveSize = isCustom
    ? { w: clampWideDimensionMm(customW, 0), h: clampWideDimensionMm(customH, 0) }
    : { ...size, w: clampWideDimensionMm(size.w, 0), h: clampWideDimensionMm(size.h, 0) }
  const effectiveQty = customQty
    ? clampWideQuantity(customQty, Math.max(1, pt.minQty || 1))
    : clampWideQuantity(qty, Math.max(1, pt.minQty || 1))
  const effectivePages = clampQuotePages(pages)

  const localPrice = useMemo(() => calcPrice(pt, effectiveSize, selectedFinishing, effectiveQty, sides, effectivePages, pt.materials[matIdx]), [pt, effectiveSize.w, effectiveSize.h, selectedFinishing.length, effectiveQty, sides, effectivePages, matIdx])
  const useServerPricing = ['banner', 'sticker'].includes(pt.id)
  const price = useServerPricing ? (serverPrice || localPrice) : localPrice

  useEffect(() => {
    if (!useServerPricing || !effectiveSize.w || !effectiveSize.h || effectiveQty < 1) {
      setServerPrice(null)
      return
    }

    const controller = new AbortController()
    const t = setTimeout(() => {
      setPriceLoading(true)
      fetchWideServerPrice(API_URL, {
        productId: pt.id,
        widthMm: effectiveSize.w,
        heightMm: effectiveSize.h,
        quantity: effectiveQty,
        materialName: pt.materials[matIdx],
        finishing: selectedFinishing,
        sides,
      }, controller.signal)
        .then(setServerPrice)
        .catch(() => setServerPrice(null))
        .finally(() => setPriceLoading(false))
    }, 300)

    return () => {
      clearTimeout(t)
      controller.abort()
    }
  }, [useServerPricing, pt.id, pt.materials, matIdx, effectiveSize.w, effectiveSize.h, effectiveQty, selectedFinishing, sides])

  const toggleFinishing = (f: string) => setSelectedFinishing(prev => prev.includes(f) ? prev.filter(x => x !== f) : [...prev, f])

  const orderParams = new URLSearchParams({ type: pt.id, size: `${effectiveSize.w}x${effectiveSize.h}`, material: pt.materials[matIdx], finishing: selectedFinishing.join(','), qty: String(effectiveQty), sides, ...(pt.id === 'book' ? { pages: String(effectivePages) } : {}) }).toString()
  const orderValidationError = (() => {
    if (!effectiveSize.w || !effectiveSize.h) return 'Хэмжээ сонгох эсвэл захиалгат хэмжээг бүрэн оруулна уу.'
    if (['banner', 'sticker'].includes(pt.id) && !String(pt.materials[matIdx] || '').trim()) return 'Материал сонгоно уу.'
    if (!price) return 'Үнэ бодогдсоны дараа захиалах боломжтой.'
    return ''
  })()

  return (
    <div style={{ maxWidth: 800, margin: '0 auto', padding: '24px 20px' }}>
      {/* Product type selector */}
      <div style={{ marginBottom: 28 }}>
        <label style={labelSt}>Бүтээгдэхүүний төрөл</label>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(100px, 1fr))', gap: 8 }}>
          {types.map((t, i) => (
            <button key={t.id} onClick={() => selectType(i)}
              style={{ padding: '12px 8px', borderRadius: 10, border: `2px solid ${i === typeIdx ? '#FF6B00' : 'var(--border)'}`, background: i === typeIdx ? 'rgba(255,107,0,0.08)' : 'var(--surface)', cursor: 'pointer', textAlign: 'center' }}>
              <div style={{ fontSize: 24, marginBottom: 4 }}>{t.icon}</div>
              <div style={{ fontSize: 11, fontWeight: i === typeIdx ? 700 : 500, color: i === typeIdx ? '#FF6B00' : 'var(--text2)' }}>{t.name}</div>
            </button>
          ))}
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 20 }}>
        {/* Left column */}
        <div>
          {/* Size */}
          <div style={{ marginBottom: 20 }}>
            <label style={labelSt}>Хэмжээ</label>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
              {pt.sizes.map((s, i) => (
                <button key={s.label} onClick={() => setSizeIdx(i)} style={pillSt(i === sizeIdx)}>{s.label}</button>
              ))}
            </div>
            {isCustom && (
              <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
                <input type="number" placeholder="Өргөн мм" value={customW || ''} onChange={e => setCustomW(clampWideDimensionMm(e.target.value, 0))} style={inputSt} />
                <span style={{ color: 'var(--text3)', alignSelf: 'center' }}>×</span>
                <input type="number" placeholder="Өндөр мм" value={customH || ''} onChange={e => setCustomH(clampWideDimensionMm(e.target.value, 0))} style={inputSt} />
              </div>
            )}
          </div>

          {/* Material */}
          <div style={{ marginBottom: 20 }}>
            <label style={labelSt}>Материал</label>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
              {pt.materials.map((m, i) => (
                <button key={m} onClick={() => setMatIdx(i)} style={pillSt(i === matIdx)}>{m}</button>
              ))}
            </div>
          </div>

          {/* Color + Sides */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 20 }}>
            <div>
              <label style={labelSt}>Тал</label>
              <div style={{ display: 'flex', gap: 6 }}>
                <button onClick={() => setSides('single')} style={pillSt(sides === 'single')}>Нэг тал</button>
                <button onClick={() => setSides('double')} style={pillSt(sides === 'double')}>Хоёр тал</button>
              </div>
            </div>
            {pt.id === 'book' && (
              <div>
                <label style={labelSt}>Хуудасны тоо</label>
                <input type="number" value={pages} onChange={e => setPages(clampQuotePages(e.target.value))} min={4} step={4} style={inputSt} />
              </div>
            )}
          </div>

          {/* Finishing */}
          <div style={{ marginBottom: 20 }}>
            <label style={labelSt}>Боловсруулалт</label>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
              {pt.finishing.map(f => (
                <button key={f} onClick={() => toggleFinishing(f)} style={{ ...pillSt(selectedFinishing.includes(f)), fontSize: 12 }}>{selectedFinishing.includes(f) ? '✓ ' : ''}{f}</button>
              ))}
            </div>
          </div>

          {/* Quantity with slider */}
          <div style={{ marginBottom: 20 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
              <label style={{ ...labelSt, margin: 0 }}>Тоо ширхэг</label>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <input type="number" value={customQty || qty} min={pt.minQty} max={10000}
                  onChange={e => { const v = clampWideQuantity(e.target.value, Math.max(1, pt.minQty || 1)); setCustomQty(String(v)); setQty(Math.max(pt.minQty, v)) }}
                  style={{ ...inputSt, width: 80, textAlign: 'center', padding: '6px 8px' }} />
                <span style={{ fontSize: 11, color: 'var(--text3)' }}>ширхэг</span>
              </div>
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 10 }}>
              {QTY_PRESETS.filter(q => q >= pt.minQty).map(q => (
                <button key={q} onClick={() => { setQty(q); setCustomQty('') }} style={pillSt(qty === q && !customQty)}>{q.toLocaleString()}</button>
              ))}
            </div>
            {/* Range slider */}
            <input type="range" min={pt.minQty} max={5000} step={pt.minQty <= 50 ? 50 : 100}
              value={Math.min(effectiveQty, 5000)}
              onChange={e => { setQty(clampWideQuantity(e.target.value, Math.max(1, pt.minQty || 1))); setCustomQty('') }}
              className="qty-slider"
              style={{ width: '100%', height: 6, borderRadius: 3, outline: 'none', cursor: 'pointer',
                background: `linear-gradient(to right, #FF6B00 0%, #FF6B00 ${((Math.min(effectiveQty,5000)-pt.minQty)/(5000-pt.minQty))*100}%, var(--border) ${((Math.min(effectiveQty,5000)-pt.minQty)/(5000-pt.minQty))*100}%, var(--border) 100%)` }} />
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 4 }}>
              <span style={{ fontSize: 10, color: 'var(--text3)' }}>{pt.minQty}</span>
              <span style={{ fontSize: 11, color: '#FF6B00', fontWeight: 600 }}>{effectiveQty.toLocaleString()} ш</span>
              <span style={{ fontSize: 10, color: 'var(--text3)' }}>5,000+</span>
            </div>
            {effectiveQty >= 250 && (
              <div style={{ marginTop: 6, display: 'flex', alignItems: 'center', gap: 4, fontSize: 11, color: '#10B981' }}>
                <span>✓</span>
                <span>{effectiveQty >= 1000 ? '25%' : effectiveQty >= 500 ? '15%' : '10%'} хямдрал авах боломжтой</span>
              </div>
            )}
          </div>
        </div>

        {/* Right column — Preview + Price */}
        <div>
          <div style={{ position: 'sticky', top: 80 }}>
            {/* Print Preview */}
            <div style={{ padding: 20, borderRadius: 16, background: 'var(--surface)', border: '1px solid var(--border)', marginBottom: 12 }}>
              <PrintPreview productType={pt.id} width={effectiveSize.w} height={effectiveSize.h} sides={sides} material={pt.materials[matIdx]} qty={effectiveQty} />
            </div>

            {/* Price card */}
          <div style={{ padding: 24, borderRadius: 16, background: 'var(--surface)', border: '1px solid var(--border)' }}>
            <div style={{ textAlign: 'center', marginBottom: 20 }}>
              <div style={{ fontSize: 13, color: 'var(--text3)', marginBottom: 4 }}>Тооцоолсон үнэ</div>
              {price ? (
                <>
                  <div style={{ fontSize: 36, fontWeight: 800, color: '#FF6B00' }}>₮{price.total.toLocaleString()}</div>
                  <div style={{ fontSize: 13, color: 'var(--text3)', marginTop: 4 }}>Нэгжийн үнэ: ₮{price.unitPrice.toLocaleString()}</div>
                </>
              ) : (
                <div style={{ fontSize: 18, color: 'var(--text3)' }}>Хэмжээ сонгоно уу</div>
              )}
            </div>

            {/* Summary */}
            <div style={{ fontSize: 12, color: 'var(--text2)', lineHeight: 2, borderTop: '1px solid var(--border)', paddingTop: 12, marginBottom: 12 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>Төрөл</span><strong>{pt.name}</strong></div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>Хэмжээ</span><strong>{isCustom ? `${customW}×${customH}мм` : size?.label}</strong></div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>Материал</span><strong>{pt.materials[matIdx]}</strong></div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>Тал</span><strong>{sides === 'double' ? 'Хоёр тал' : 'Нэг тал'}</strong></div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>Тоо</span><strong>{effectiveQty.toLocaleString()} ш</strong></div>
              {selectedFinishing.length > 0 && <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>Боловсруулалт</span><strong>{selectedFinishing.length} сонголт</strong></div>}
              {pt.id === 'book' && <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>Хуудас</span><strong>{effectivePages}</strong></div>}
            </div>

            {price && useServerPricing && (
              <div style={{ marginBottom: 12, padding: 12, borderRadius: 10, background: 'var(--surface2)', border: '1px solid var(--border)', fontSize: 12, color: 'var(--text2)', lineHeight: 1.7 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12 }}>
                  <span>Үнэ бодолт</span>
                  <strong style={{ color: price.source === 'server' ? '#10B981' : '#F59E0B' }}>
                    {priceLoading ? 'Шинэчилж байна' : price.source === 'server' ? 'Backend engine' : 'Fallback'}
                  </strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12 }}>
                  <span>Талбай</span>
                  <strong>{(price.meta?.billableAreaM2 || price.meta?.areaM2 || 0).toLocaleString()} м²</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12 }}>
                  <span>Материал + хэвлэл</span>
                  <strong>₮{((price.breakdown.material || 0) + (price.breakdown.print || 0)).toLocaleString()}</strong>
                </div>
                {price.meta?.materialRateM2 != null && price.meta.materialRateM2 > 0 && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12 }}>
                    <span>Материалын тариф</span>
                    <strong>₮{price.meta.materialRateM2.toLocaleString()}/м²</strong>
                  </div>
                )}
                {price.meta?.printRateM2 != null && price.meta.printRateM2 > 0 && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12 }}>
                    <span>Хэвлэх тариф</span>
                    <strong>
                      ₮{price.meta.printRateM2.toLocaleString()}/м²{price.meta.sideMultiplier && price.meta.sideMultiplier > 1 ? ` × ${price.meta.sideMultiplier}` : ''}
                    </strong>
                  </div>
                )}
                {price.meta?.wastePct != null && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12 }}>
                    <span>Хаягдал тооцоо</span>
                    <strong>{price.meta.wastePct}%</strong>
                  </div>
                )}
              </div>
            )}

            {/* Breakdown */}
            {price && (
              <div style={{ marginBottom: 16 }}>
                <button onClick={() => setShowBreakdown(!showBreakdown)} style={{ width: '100%', padding: '8px 0', background: 'none', border: 'none', cursor: 'pointer', fontSize: 12, color: 'var(--text3)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span>Дэлгэрэнгүй задаргаа</span>
                  <span style={{ transform: showBreakdown ? 'rotate(180deg)' : '', transition: '0.2s' }}>▾</span>
                </button>
                {showBreakdown && (
                  <div style={{ fontSize: 12, color: 'var(--text3)', lineHeight: 2, paddingTop: 8, borderTop: '1px solid var(--border)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>{useServerPricing ? 'Материал' : 'Цаас'}</span><span>₮{price.breakdown.paper.toLocaleString()}</span></div>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>{useServerPricing ? 'Хэвлэл' : 'Бэх'}</span><span>₮{price.breakdown.ink.toLocaleString()}</span></div>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>Боловсруулалт</span><span>₮{price.breakdown.finishing.toLocaleString()}</span></div>
                    {useServerPricing && price.breakdown.setup != null && (
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>Тохируулга</span><span>₮{price.breakdown.setup.toLocaleString()}</span></div>
                    )}
                    {price.breakdown.pages > 0 && <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>Хуудас</span><span>₮{price.breakdown.pages.toLocaleString()}</span></div>}
                    {useServerPricing && price.breakdown.vat != null && (
                      <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px solid var(--border)', marginTop: 6, paddingTop: 6 }}><span>НӨАТ</span><span>₮{price.breakdown.vat.toLocaleString()}</span></div>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Volume discounts */}
            {price && effectiveQty < 1000 && (
              <div style={{ marginBottom: 12 }}>
                <div style={{ fontSize: 11, color: 'var(--text3)', marginBottom: 6 }}>Тирaжийн хямдрал:</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                  {[
                    { min: 250, disc: 10 },
                    { min: 500, disc: 15 },
                    { min: 1000, disc: 25 },
                  ].filter(t => t.min > effectiveQty).map(tier => (
                    <div key={tier.min} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, padding: '4px 8px', borderRadius: 6, background: 'var(--surface2)', color: 'var(--text3)' }}>
                      <span>{tier.min.toLocaleString()}+ ширхэг</span>
                      <span style={{ fontWeight: 600, color: '#10B981' }}>-{tier.disc}%</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* CTA */}
            <Link
              href={`/orders/new?${orderParams}`}
              onClick={(e) => { if (orderValidationError) e.preventDefault() }}
              style={{ display: 'block', textAlign: 'center', padding: '14px 0', borderRadius: 10, background: orderValidationError ? 'var(--border)' : '#FF6B00', color: orderValidationError ? 'var(--text3)' : '#fff', textDecoration: 'none', fontSize: 14, fontWeight: 700, marginBottom: 8, cursor: orderValidationError ? 'not-allowed' : 'pointer' }}
            >
              Захиалах →
            </Link>
            {orderValidationError && (
              <div style={{ marginBottom: 8, padding: 10, borderRadius: 8, background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.25)', color: '#DC2626', fontSize: 12, lineHeight: 1.5 }}>
                {orderValidationError}
              </div>
            )}
            <Link href={`/quote?tab=detailed`} style={{ display: 'block', textAlign: 'center', padding: '12px 0', borderRadius: 10, background: 'var(--surface2)', color: 'var(--text2)', textDecoration: 'none', fontSize: 13, border: '1px solid var(--border)' }}>
              Нарийвчилсан тооцоо
            </Link>
          </div>
          </div>{/* /sticky */}
        </div>
      </div>
    </div>
  )
}

const labelSt: React.CSSProperties = { display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--text2)', marginBottom: 8 }
const inputSt: React.CSSProperties = { width: '100%', padding: '10px 14px', borderRadius: 8, border: '1px solid var(--border)', background: 'var(--surface2)', fontSize: 13, color: 'var(--text)', outline: 'none', boxSizing: 'border-box' }
const pillSt = (active: boolean): React.CSSProperties => ({ padding: '7px 14px', borderRadius: 8, border: `1.5px solid ${active ? '#FF6B00' : 'var(--border)'}`, background: active ? 'rgba(255,107,0,0.08)' : 'var(--surface)', color: active ? '#FF6B00' : 'var(--text2)', fontSize: 12, fontWeight: active ? 600 : 400, cursor: 'pointer' })
