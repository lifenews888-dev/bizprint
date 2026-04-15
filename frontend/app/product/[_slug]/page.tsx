'use client'
import { apiFetch } from '@/lib/api'
import React, { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useStore } from '@/lib/store'
import { toast } from 'sonner'
import { Heart, Share2, GitCompareArrows, ShoppingCart, Zap, Link2, ExternalLink } from 'lucide-react'
import PriceCalculator from '@/components/PriceCalculator'
import BookPriceCalculator from '@/components/BookPriceCalculator'
import { fbPixel } from '@/components/FacebookPixel'

const fmt = (n: number) => '₮' + n.toLocaleString('mn-MN')

// ═══ GLASS GALLERY — autoplay + zone hover + zoom ═══
function Gallery({ product }: { product: any }) {
  const imgs: string[] = []
  if (product.thumbnail_url) imgs.push(product.thumbnail_url)
  if (Array.isArray(product.images)) product.images.forEach((img: string) => { if (img && !imgs.includes(img)) imgs.push(img) })

  const [active, setActive] = useState(0)
  const [hovered, setHovered] = useState(false)
  const [zoom, setZoom] = useState(false)
  const [mouse, setMouse] = useState({ x: 50, y: 50 })
  const ref = useRef<HTMLDivElement>(null)
  const autoRef = useRef<ReturnType<typeof setInterval> | null>(null)

  useEffect(() => {
    if (imgs.length <= 1) return
    if (!hovered) autoRef.current = setInterval(() => setActive(p => (p + 1) % imgs.length), 4000)
    return () => { if (autoRef.current) clearInterval(autoRef.current) }
  }, [hovered, imgs.length])

  const onMove = (e: React.MouseEvent) => {
    if (!ref.current) return
    const r = ref.current.getBoundingClientRect()
    setMouse({ x: ((e.clientX - r.left) / r.width) * 100, y: ((e.clientY - r.top) / r.height) * 100 })
    // Zone-based image switch
    if (imgs.length > 1) {
      const zone = Math.floor(((e.clientX - r.left) / r.width) * imgs.length)
      setActive(Math.min(zone, imgs.length - 1))
    }
  }

  return (
    <div>
      <div ref={ref}
        className="relative rounded-2xl overflow-hidden bg-[var(--surface2)] aspect-[4/3.5] cursor-crosshair mb-3 backdrop-blur-sm"
        style={{ boxShadow: '0 8px 32px rgba(0,0,0,0.06)' }}
        onMouseEnter={() => { setHovered(true); setZoom(true) }}
        onMouseLeave={() => { setHovered(false); setZoom(false) }}
        onMouseMove={onMove}>
        <AnimatePresence mode="wait">
          {imgs.length > 0 ? (
            <motion.img key={active} src={imgs[active]} alt=""
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.4 }}
              className="absolute inset-0 w-full h-full object-contain"
              style={zoom ? { transform: 'scale(2.2)', transformOrigin: `${mouse.x}% ${mouse.y}%`, transition: 'transform 0.15s ease-out' } : { transition: 'transform 0.3s ease' }}
              loading="lazy" />
          ) : (
            <div className="w-full h-full flex flex-col items-center justify-center">
              <span className="text-6xl mb-2">🖨️</span>
              <span className="text-sm text-[var(--text3)]">{product.category || 'Бүтээгдэхүүн'}</span>
            </div>
          )}
        </AnimatePresence>
        {/* Progress bars */}
        {imgs.length > 1 && (
          <div className="absolute bottom-3 left-3 right-3 flex gap-1 z-10">
            {imgs.map((_, i) => (
              <div key={i} className="flex-1 h-[3px] rounded-full overflow-hidden bg-white/20 backdrop-blur-sm">
                <motion.div className="h-full rounded-full bg-white" initial={{ width: 0 }}
                  animate={{ width: i === active ? '100%' : i < active ? '100%' : '0%' }}
                  transition={{ duration: i === active ? (hovered ? 0.2 : 4) : 0.3 }} />
              </div>
            ))}
          </div>
        )}
        {imgs.length > 1 && <>
          <button onClick={() => setActive((active - 1 + imgs.length) % imgs.length)} className="absolute left-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-white/10 hover:bg-white/25 text-white border-none cursor-pointer flex items-center justify-center backdrop-blur-md z-10 transition-colors">‹</button>
          <button onClick={() => setActive((active + 1) % imgs.length)} className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-white/10 hover:bg-white/25 text-white border-none cursor-pointer flex items-center justify-center backdrop-blur-md z-10 transition-colors">›</button>
        </>}
      </div>
      {/* Thumbnails */}
      {imgs.length > 1 && (
        <div className="flex gap-2 overflow-x-auto pb-1" style={{ scrollbarWidth: 'none' }}>
          {imgs.map((img, i) => (
            <motion.button key={i} onClick={() => { setActive(i); setHovered(true); setTimeout(() => setHovered(false), 100) }}
              whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
              className={`shrink-0 w-16 h-16 rounded-xl overflow-hidden border-2 cursor-pointer transition-all ${i === active ? 'border-[#FF6B00] shadow-md shadow-[#FF6B00]/20' : 'border-transparent hover:border-[var(--border2)]'}`}>
              <img src={img} alt="" className="w-full h-full object-cover" />
            </motion.button>
          ))}
        </div>
      )}
    </div>
  )
}

// ═══ PROMO DRAWER ═══
function PromoDrawer() {
  const [open, setOpen] = useState(false)
  return <>
    <motion.button whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.98 }} onClick={() => setOpen(true)}
      className="w-full py-2.5 rounded-xl border border-[var(--border)] bg-[var(--surface)] text-sm font-semibold text-[var(--text)] cursor-pointer hover:border-[#FF6B00] hover:text-[#FF6B00] transition-colors flex items-center justify-center gap-2">
      🎁 Хөнгөлөлт & Урамшуулал
    </motion.button>
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-[1000]">
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setOpen(false)} />
          <motion.div initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }} transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="absolute right-0 top-0 bottom-0 w-full max-w-[380px] bg-[var(--surface)] shadow-2xl flex flex-col border-l border-[var(--border)]">
            <div className="flex items-center justify-between px-5 py-4 border-b border-[var(--border)]">
              <h3 className="text-base font-bold text-[var(--text)] m-0">🎁 Хөнгөлөлт</h3>
              <button onClick={() => setOpen(false)} className="w-8 h-8 rounded-full bg-[var(--surface2)] border-none cursor-pointer text-[var(--text3)] hover:bg-[var(--surface3)] text-lg flex items-center justify-center">×</button>
            </div>
            <div className="flex-1 overflow-y-auto p-5 space-y-4">
              <div className="rounded-xl bg-gradient-to-r from-[#FF6B00] to-[#F59E0B] p-4 text-white">
                <div className="text-xs font-bold uppercase tracking-wider opacity-70 mb-1">Энэ 7 хоногт</div>
                <div className="text-lg font-extrabold mb-1">₮50,000+ захиалгад хүргэлт ҮНЭГҮЙ</div>
              </div>
              <div className="rounded-xl border border-[var(--border)] p-4">
                <div className="text-sm font-bold text-[var(--text)] mb-2">💳 Хэсэгчлэн төлөх</div>
                <div className="flex gap-2">{['StorePay', 'Simple', 'LendMN'].map(p => <span key={p} className="text-[10px] font-semibold px-2.5 py-1.5 rounded-lg bg-[var(--surface2)] border border-[var(--border)] text-[var(--text2)]">{p}</span>)}</div>
              </div>
              <div className="rounded-xl border border-[var(--border)] p-4">
                <div className="text-sm font-bold text-[var(--text)] mb-2">🎟️ Ваучер</div>
                <div className="flex items-center gap-2">
                  <code className="text-sm font-bold text-[#FF6B00] bg-[#FF6B00]/8 px-3 py-1.5 rounded-lg border border-[#FF6B00]/20">PRINT10</code>
                  <button onClick={() => { navigator.clipboard.writeText('PRINT10'); alert('Хуулагдлаа!') }} className="text-xs text-[#FF6B00] font-semibold cursor-pointer bg-transparent border-none">Хуулах</button>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  </>
}

// ═══ ANIMATED PRICE ═══
function AnimPrice({ value }: { value: number }) {
  return <motion.span key={value} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="text-[26px] font-extrabold tracking-tight">{fmt(value)}</motion.span>
}

// ═══ MAIN PAGE ═══
export default function ProductPage({ params }: { params: Promise<{ _slug: string }> }) {
  const { _slug } = React.use(params)
  const [product, setProduct] = useState<any>(null)
  const [related, setRelated] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedSize, setSelectedSize] = useState<string | null>(null)
  const [qty, setQty] = useState(1)
  const [tab, setTab] = useState('specs')
  const [adding, setAdding] = useState(false)
  const [shareOpen, setShareOpen] = useState(false)
  const [livePrice, setLivePrice] = useState<number | null>(null)
  const [liveBreakdown, setLiveBreakdown] = useState<any>(null)
  const { addToCart: storeAddToCart, cart, toggleWishlist, isWished, toggleCompare, isCompared } = useStore()
  const inCart = cart.some(c => c.id === product?.id)
  const wished = product ? isWished(product?.id) : false
  const compared = product ? isCompared(product?.id) : false

  const [addons, setAddons] = useState<any[]>([])
  const [selectedAddons, setSelectedAddons] = useState<string[]>([])

  useEffect(() => {
    apiFetch<any>(`/products/${_slug}`, { auth: false })
      .then(p => {
        if (p?.id) {
          setProduct(p)
          // Track FB Pixel ViewContent
          fbPixel.viewContent({
            productId: p.id,
            name: p.name_mn || p.name || 'Product',
            price: Number(p.sale_price ?? p.base_price ?? 0),
            category: p.category,
          })
          // Load addons for this product
          apiFetch<any>(`/products/${p.id}/addons`, { auth: false })
            .then(a => { if (Array.isArray(a)) setAddons(a) })
            .catch(() => {})
        } else throw new Error()
      })
      .catch(() => apiFetch<any>('/products', { auth: false }).then(list => {
        setProduct(Array.isArray(list) ? list.find((i: any) => i.slug === _slug || i.id === _slug) || null : null)
      }).catch(() => setProduct(null)))
      .finally(() => setLoading(false))
    apiFetch<any>('/products', { auth: false }).then(list => {
      if (Array.isArray(list)) setRelated(list.filter((i: any) => i.slug !== _slug && i.id !== _slug).slice(0, 8))
    }).catch(() => {})
  }, [_slug])

  const handleAddToCart = () => {
    if (!product) return
    setAdding(true)
    const unitPrice = liveBreakdown?.unit_price || Number(product.sale_price ?? product.base_price ?? 0)
    fbPixel.addToCart({
      productId: product.id,
      name: product.name_mn || product.name,
      price: unitPrice * qty,
    })
    storeAddToCart({
      id: product.id,
      name: product.name_mn || product.name,
      price: unitPrice,
      image: product.thumbnail_url,
    }, qty)
    // Add selected addons to cart
    for (const addonId of selectedAddons) {
      const addon = addons.find(a => a.id === addonId)
      if (addon) {
        storeAddToCart({
          id: `addon-${addon.id}`,
          name: `↳ ${addon.name_mn}`,
          price: Number(addon.price),
          image: product.thumbnail_url,
        }, qty)
      }
    }
    const addonCount = selectedAddons.length
    toast.success('Сагсанд нэмэгдлээ', { description: `${product.name_mn || product.name} × ${qty}${addonCount ? ` + ${addonCount} дагалдах` : ''}` })
    // Also try API
    try {
      const u = JSON.parse(localStorage.getItem('user') || '{}')
      if (u?.id) apiFetch('/cart/items', { method: 'POST', body: { user_id: u.id, product_id: product.id, quantity: qty, specs: { addons: selectedAddons } } }).catch(() => {})
    } catch {}
    setTimeout(() => setAdding(false), 500)
  }

  if (loading) return <div className="min-h-screen flex items-center justify-center bg-[var(--bg)]"><div className="w-10 h-10 border-[3px] border-[var(--border)] border-t-[#FF6B00] rounded-full animate-spin" /></div>
  if (!product) return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center bg-[var(--bg)]">
      <motion.span initial={{ scale: 0 }} animate={{ scale: 1 }} className="text-5xl mb-4">😕</motion.span>
      <h2 className="text-xl font-bold text-[var(--text)] mb-2">Бүтээгдэхүүн олдсонгүй</h2>
      <a href="/shop" className="text-[#FF6B00] text-sm font-semibold no-underline">← Дэлгүүр рүү буцах</a>
    </div>
  )

  const p = product
  const price = Number(p.sale_price ?? p.base_price ?? 0)
  const oldPrice = p.sale_price && p.base_price && Number(p.sale_price) < Number(p.base_price) ? Number(p.base_price) : null
  const disc = oldPrice ? Math.round((1 - price / oldPrice) * 100) : null
  const sizes: string[] = p.sizes || p.available_sizes || []
  const out = p.is_out_of_stock || (p.stock_quantity != null && p.stock_quantity <= 0)
  const HIDDEN_SPEC_KEYS = new Set(['features_html', 'shop_slug', 'shop_category', 'qty_condition', 'top_menu', 'seo_description', 'price_excl_vat', 'image_alt'])
  const rawSpecs = p.compare_specs || {}
  const specs: Record<string, any> = Object.fromEntries(
    Object.entries(rawSpecs).filter(([k]) => !HIDDEN_SPEC_KEYS.has(k))
  )
  const featuresHtml: string = rawSpecs.features_html || p.features_html || ''
  const qtyCondition: string = rawSpecs.qty_condition || p.qty_condition || ''

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="min-h-screen bg-[var(--bg)] text-[var(--text)]">
      {/* Breadcrumb */}
      <div className="max-w-[1200px] mx-auto px-4 pt-4">
        <nav className="flex items-center gap-1.5 text-[11px] text-[var(--text3)] flex-wrap">
          <a href="/" className="hover:text-[#FF6B00] no-underline text-[var(--text3)]">Нүүр</a><span className="opacity-40">›</span>
          <a href="/shop" className="hover:text-[#FF6B00] no-underline text-[var(--text3)]">Дэлгүүр</a>
          {p.category && <><span className="opacity-40">›</span><a href={`/shop?category=${p.category}`} className="hover:text-[#FF6B00] no-underline text-[var(--text3)]">{p.category}</a></>}
          <span className="opacity-40">›</span><span className="text-[var(--text2)]">{p.name_mn || p.name}</span>
        </nav>
      </div>

      <div className="max-w-[1200px] mx-auto px-4 py-5">
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_380px] gap-6 items-start">

          {/* ─── COL 1: Gallery ─── */}
          <div>
            <Gallery product={p} />
            <div className="flex items-center gap-2 mt-3">
              <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.9 }} onClick={() => setShareOpen(!shareOpen)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[var(--border)] bg-[var(--surface)] text-[11px] font-semibold text-[var(--text3)] cursor-pointer hover:border-[#FF6B00] hover:text-[#FF6B00] transition-all">
                <Share2 className="w-3.5 h-3.5" strokeWidth={1.5} /> Хуваалцах
              </motion.button>
              <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.9 }} onClick={() => { toggleWishlist(p.id); toast(wished ? 'Хасагдлаа' : 'Хадгалагдлаа ❤️') }}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-[11px] font-semibold cursor-pointer transition-all ${wished ? 'border-red-300 bg-red-50 text-red-500' : 'border-[var(--border)] bg-[var(--surface)] text-[var(--text3)] hover:border-red-300 hover:text-red-500'}`}>
                <Heart className="w-3.5 h-3.5" strokeWidth={1.5} fill={wished ? 'currentColor' : 'none'} /> {wished ? 'Хадгалсан' : 'Хадгалах'}
              </motion.button>
              <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.9 }} onClick={() => { toggleCompare(p.id); toast(compared ? 'Хасагдлаа' : 'Нэмэгдлээ 📊') }}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-[11px] font-semibold cursor-pointer transition-all ${compared ? 'border-[#FF6B00]/30 bg-[#FF6B00]/5 text-[#FF6B00]' : 'border-[var(--border)] bg-[var(--surface)] text-[var(--text3)] hover:border-[#FF6B00]/30 hover:text-[#FF6B00]'}`}>
                <GitCompareArrows className="w-3.5 h-3.5" strokeWidth={1.5} /> {compared ? 'Нэмсэн' : 'Харьцуулах'}
              </motion.button>
              {compared && <a href="/compare" className="text-[10px] text-[#FF6B00] font-semibold no-underline hover:underline ml-1">Харах →</a>}
            </div>
            {/* Share popup */}
            <AnimatePresence>
              {shareOpen && (
                <motion.div initial={{ opacity: 0, y: -8, scale: 0.95 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: -8, scale: 0.95 }}
                  className="mt-2 p-3 rounded-xl border border-[var(--border)] bg-[var(--surface)]/95 backdrop-blur-xl shadow-xl">
                  <div className="text-[11px] font-semibold text-[var(--text)] mb-2">Хуваалцах</div>
                  <div className="flex gap-2">
                    <button onClick={() => { navigator.clipboard.writeText(window.location.href); toast.success('Линк хуулагдлаа'); setShareOpen(false) }}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[var(--surface2)] border border-[var(--border)] text-[10px] font-semibold text-[var(--text2)] cursor-pointer hover:border-[#FF6B00] transition-colors">
                      <Link2 className="w-3 h-3" strokeWidth={1.5} /> Линк хуулах
                    </button>
                    <a href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(typeof window !== 'undefined' ? window.location.href : '')}`} target="_blank" rel="noopener noreferrer"
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#1877F2]/10 text-[10px] font-semibold text-[#1877F2] no-underline hover:bg-[#1877F2]/20 transition-colors">
                      <ExternalLink className="w-3 h-3" strokeWidth={1.5} /> Facebook
                    </a>
                    <a href={`https://twitter.com/intent/tweet?url=${encodeURIComponent(typeof window !== 'undefined' ? window.location.href : '')}`} target="_blank" rel="noopener noreferrer"
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-black/5 text-[10px] font-semibold text-[var(--text)] no-underline hover:bg-black/10 transition-colors">
                      <ExternalLink className="w-3 h-3" strokeWidth={1.5} /> X
                    </a>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* ─── COL 2: Product Info ─── */}
          <div className="lg:sticky lg:top-[130px] space-y-3">
            {/* Badges */}
            <div className="flex flex-wrap gap-1.5">
              {p.badge && <motion.span initial={{ scale: 0 }} animate={{ scale: 1 }} className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${p.badge === 'NEW' ? 'bg-emerald-100 text-emerald-700' : p.badge === 'HOT' ? 'bg-red-100 text-red-700' : p.badge === 'SALE' ? 'bg-amber-100 text-amber-700' : 'bg-violet-100 text-violet-700'}`}>{p.badge}</motion.span>}
              {p.is_bestseller && <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-red-100 text-red-700">🔥 Хит</span>}
              {p.is_featured && <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-violet-100 text-violet-700">⭐</span>}
              {p.is_flash_deal && <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-violet-100 text-violet-700">⚡ Flash Deal</span>}
              {p.video_url && <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-blue-100 text-blue-700">🎬 Видео</span>}
              {(p.requires_dimensions || p.pricing_mode === 'formula' || p.pricing_mode === 'tier')
                ? <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-orange-100 text-orange-700">🖨️ Тооцоолохуйц</span>
                : <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-700">📦 Шууд бараа</span>
              }
            </div>

            {p.category && <a href={`/shop?category=${p.category}`} className="text-[10px] font-bold text-[#FF6B00] uppercase tracking-widest no-underline">{p.category}</a>}
            <h1 className="text-lg font-extrabold leading-snug tracking-tight !mt-1">{p.name_mn || p.name}</h1>
            {p.sku && <div className="text-[10px] text-[var(--text3)] font-mono !mt-0">SKU: {p.sku}</div>}

            {/* Price — glass card (live from calculator) */}
            <div className="rounded-xl p-3 border border-[var(--border)] bg-[var(--surface2)]/80 backdrop-blur-sm" style={{ boxShadow: '0 4px 20px rgba(0,0,0,0.03)' }}>
              <div className="flex items-baseline gap-2.5">
                {!livePrice && !oldPrice && price > 0 && <span className="text-xs text-[var(--text3)] mr-0.5">-аас</span>}
                <AnimPrice value={livePrice ?? price} />
                {oldPrice && <><span className="text-xs text-[var(--text3)] line-through">{fmt(oldPrice)}</span><span className="text-[10px] font-bold text-emerald-600 bg-emerald-100 px-2 py-0.5 rounded-full">-{disc}%</span></>}
              </div>
              {oldPrice && !liveBreakdown && <div className="text-[10px] text-emerald-600 font-semibold mt-0.5">Хэмнэлт: {fmt(oldPrice - price)}</div>}
              {liveBreakdown?.volume_discount > 0 && <div className="text-[10px] text-emerald-600 font-semibold mt-0.5">📦 Хөнгөлөлт: -{fmt(liveBreakdown.volume_discount)} ({(liveBreakdown.discount_rate * 100).toFixed(0)}%)</div>}
              {liveBreakdown?.unit_price > 0 && liveBreakdown?.quantity > 1 && <div className="text-[10px] text-[var(--text3)] mt-0.5">Нэгж: {fmt(liveBreakdown.unit_price)} × {liveBreakdown.quantity}ш</div>}
              {p.min_quantity > 1 && !liveBreakdown && <div className="text-[10px] text-[var(--text3)] mt-0.5">Мин. {p.min_quantity} ширхэг</div>}
            </div>

            {/* Smart Price Calculator — book/offset uses BookPriceCalculator, others use PriceCalculator */}
            {p.category === 'book' || p.product_type === 'book' || p.category === 'offset' || p.name_mn?.includes('Ном') || p.name?.includes('Ном') || p.name_mn?.includes('Сэтгүүл') || p.name_mn?.includes('Календарь')
              ? <BookPriceCalculator product={p} onPriceChange={(total, breakdown) => { setLivePrice(total); setLiveBreakdown(breakdown) }} />
              : <PriceCalculator product={p} onPriceChange={(total, breakdown) => { setLivePrice(total); setLiveBreakdown(breakdown) }} />
            }

            {p.description && <p className="text-[11px] text-[var(--text2)] leading-relaxed line-clamp-3 m-0 !mt-1">{p.description}</p>}

            {/* Sizes — glow grid */}
            {sizes.length > 0 && (
              <div>
                <div className="text-[11px] font-semibold mb-1.5">Хэмжээ</div>
                <div className="grid grid-cols-4 gap-1.5">
                  {sizes.map((s: string) => (
                    <motion.button key={s} whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }} onClick={() => setSelectedSize(s)}
                      className={`py-2 rounded-lg text-[11px] font-semibold border-2 cursor-pointer transition-all ${
                        selectedSize === s ? 'border-[#FF6B00] bg-[#FF6B00]/8 text-[#FF6B00] shadow-md shadow-[#FF6B00]/15' : 'border-[var(--border)] text-[var(--text2)] hover:border-[var(--border2)]'
                      }`}>{s}</motion.button>
                  ))}
                </div>
              </div>
            )}

            {/* Qty */}
            <div className="flex items-center gap-3">
              <div className="flex items-center border border-[var(--border)] rounded-lg overflow-hidden">
                <button onClick={() => setQty(Math.max(1, qty - 1))} className="w-9 h-9 bg-[var(--surface2)] border-none cursor-pointer text-sm text-[var(--text2)] hover:bg-[var(--surface3)] transition-colors">−</button>
                <input type="number" value={qty} onChange={e => setQty(Math.max(1, +e.target.value))} className="w-10 h-9 border-none text-center text-xs font-bold bg-[var(--surface)] text-[var(--text)] outline-none [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none" />
                <button onClick={() => setQty(qty + 1)} className="w-9 h-9 bg-[var(--surface2)] border-none cursor-pointer text-sm text-[var(--text2)] hover:bg-[var(--surface3)] transition-colors">+</button>
              </div>
              <span className={`text-[11px] font-semibold ${out ? 'text-red-500' : 'text-emerald-600'}`}>{out ? '● Дууссан' : '● Боломжтой'}</span>
            </div>

            {/* CTAs */}
            <div className="grid grid-cols-2 gap-2">
              <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.96 }} onClick={handleAddToCart} disabled={out || adding}
                className={`py-3 rounded-lg border-2 font-bold text-[12px] cursor-pointer transition-all disabled:opacity-30 disabled:cursor-not-allowed ${
                  inCart ? 'border-emerald-500 bg-emerald-500/10 text-emerald-600' : 'border-[var(--text)] bg-transparent text-[var(--text)] hover:bg-[var(--text)] hover:text-[var(--surface)]'
                }`}>
                <ShoppingCart className="w-4 h-4 inline mr-1" strokeWidth={1.5} />{adding ? '...' : inCart ? 'САГСАНД БАЙГАА' : 'САГСАНД НЭМЭХ'}
              </motion.button>
              <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.96 }} disabled={out}
                onClick={() => { handleAddToCart(); window.location.href = '/checkout?source=cart' }}
                className="py-3 rounded-lg border-none bg-[#FF6B00] text-white font-bold text-[12px] cursor-pointer shadow-lg shadow-[#FF6B00]/20 hover:bg-[#E55D00] transition-all disabled:opacity-30 disabled:cursor-not-allowed disabled:shadow-none">
                <Zap className="w-4 h-4 inline mr-1" strokeWidth={1.5} />ХУДАЛДАН АВАХ
              </motion.button>
            </div>

            {/* Design editor link */}
            <a href={`/design/editor?type=${p.category || 'business-card'}&productId=${p.id}`}
              className="block w-full py-2.5 border-2 border-[#FF6B00]/30 text-[#FF6B00] text-center text-[12px] font-bold rounded-lg hover:bg-[#FF6B00]/5 transition-colors no-underline">
              🎨 ДИЗАЙН ХИЙХ
            </a>

            {/* Хамт авах уу? — Add-on upsell */}
            {addons.length > 0 && (
              <div className="mt-3 rounded-xl border border-[var(--border)] bg-[var(--surface)] overflow-hidden">
                <div className="px-4 py-2.5 bg-[var(--surface2)] border-b border-[var(--border)]">
                  <span className="text-xs font-bold text-[var(--text)]">🔗 Хамт авах уу?</span>
                </div>
                <div className="divide-y divide-[var(--border)]">
                  {addons.map(addon => {
                    const checked = selectedAddons.includes(addon.id)
                    return (
                      <label key={addon.id}
                        className={`flex items-center gap-3 px-4 py-3 cursor-pointer transition-colors ${checked ? 'bg-[#FF6B00]/5' : 'hover:bg-[var(--surface2)]'}`}>
                        <input type="checkbox" checked={checked}
                          onChange={() => setSelectedAddons(prev =>
                            checked ? prev.filter(id => id !== addon.id) : [...prev, addon.id]
                          )}
                          className="accent-[#FF6B00] w-4 h-4 shrink-0" />
                        <div className="flex-1 min-w-0">
                          <div className="text-[12px] font-semibold text-[var(--text)] truncate">{addon.name_mn}</div>
                          {addon.description && <div className="text-[10px] text-[var(--text3)] truncate">{addon.description}</div>}
                        </div>
                        <div className="text-[12px] font-bold text-[#FF6B00] whitespace-nowrap">
                          +₮{Number(addon.price).toLocaleString()}
                        </div>
                      </label>
                    )
                  })}
                </div>
                {selectedAddons.length > 0 && (
                  <div className="px-4 py-2 bg-[#FF6B00]/5 border-t border-[#FF6B00]/20 flex justify-between text-xs">
                    <span className="text-[var(--text2)]">{selectedAddons.length} дагалдах сонгосон</span>
                    <span className="font-bold text-[#FF6B00]">
                      +₮{addons.filter(a => selectedAddons.includes(a.id)).reduce((s, a) => s + Number(a.price), 0).toLocaleString()}
                    </span>
                  </div>
                )}
              </div>
            )}

            <PromoDrawer />

            {/* Trust + Payment — inline */}
            <div className="grid grid-cols-3 gap-2">
              {[
                { icon: '🚚', t: 'Хүргэлт', d: p.lead_time_days ? `${p.lead_time_days} өдөр` : '1–3 өдөр' },
                { icon: '🔒', t: 'Аюулгүй', d: 'SSL төлбөр' },
                { icon: '🔄', t: 'Буцаалт', d: '7 хоног' },
              ].map(i => (
                <div key={i.t} className="flex items-center gap-1.5 p-2 rounded-lg bg-[var(--surface2)] border border-[var(--border)]">
                  <span className="text-sm">{i.icon}</span>
                  <div><div className="text-[10px] font-semibold text-[var(--text)]">{i.t}</div><div className="text-[9px] text-[var(--text3)]">{i.d}</div></div>
                </div>
              ))}
            </div>

            {/* Payment + Installment */}
            <div className="flex items-center justify-between gap-3 p-3 rounded-xl border border-[var(--border)] bg-[var(--surface2)]/50">
              <div>
                <div className="text-[10px] font-bold text-[var(--text)] mb-1">Төлбөр</div>
                <div className="flex flex-wrap gap-1">{['QPay', 'SocialPay', 'Visa', 'Master'].map(m => <span key={m} className="text-[9px] font-medium px-1.5 py-0.5 rounded bg-[var(--surface)] border border-[var(--border)] text-[var(--text3)]">{m}</span>)}</div>
              </div>
              <div className="text-right shrink-0">
                <div className="text-[10px] font-bold text-[#FF6B00]">💳 Хэсэгчлэн</div>
                <div className="text-[11px] font-bold text-[var(--text)]">Сараас {fmt(Math.round(price / 12))}</div>
              </div>
            </div>
          </div>
        </div>

        {/* ═══ TABS ═══ */}
        <div className="mt-8 border-t border-[var(--border)] pt-6">
          <div className="flex gap-0 border-b border-[var(--border)] mb-5">
            {[{ key: 'specs', label: 'Үзүүлэлтүүд' }, { key: 'desc', label: p.video_url ? '🎬 Дэлгэрэнгүй' : 'Дэлгэрэнгүй' }, { key: 'reviews', label: 'Сэтгэгдэл' }].map(t => (
              <button key={t.key} onClick={() => setTab(t.key)} className={`px-5 py-2.5 text-[13px] font-semibold border-b-2 cursor-pointer bg-transparent border-t-0 border-x-0 transition-colors ${tab === t.key ? 'border-[#FF6B00] text-[#FF6B00]' : 'border-transparent text-[var(--text3)] hover:text-[var(--text)]'}`}>{t.label}</button>
            ))}
          </div>

          <AnimatePresence mode="wait">
            <motion.div key={tab} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }}>
              {tab === 'specs' && (
                <div className="max-w-[700px] rounded-xl border border-[var(--border)] overflow-hidden">
                  {(Object.keys(specs).length > 0 ? Object.entries(specs) : [['Ангилал', p.category], ['SKU', p.sku], ['Хугацаа', p.lead_time_days ? `${p.lead_time_days} өдөр` : '—'], ['Мин. тоо', p.min_quantity || '1'], ['Нөөц', p.stock_quantity ?? '—']]).map(([k, v], i) => (
                    <div key={String(k)} className={`grid grid-cols-[160px_1fr] ${i % 2 === 0 ? 'bg-[var(--surface2)]' : 'bg-[var(--surface)]'}`}>
                      <span className="px-4 py-2.5 text-[11px] text-[var(--text3)]">{String(k)}</span>
                      <span className="px-4 py-2.5 text-[11px] font-semibold text-[var(--text)]">{String(v) || '—'}</span>
                    </div>
                  ))}
                </div>
              )}
              {tab === 'desc' && (
                <div className="max-w-[700px]">
                  {p.description ? <p className="text-sm text-[var(--text2)] leading-relaxed">{p.description}</p> : !featuresHtml && !qtyCondition && <p className="text-sm text-[var(--text3)]">Тайлбар оруулаагүй.</p>}
                  {featuresHtml && (
                    <div className="mt-4">
                      <div className="text-xs font-bold text-[var(--text)] mb-2">✨ Онцлогууд</div>
                      <div className="text-sm text-[var(--text2)] leading-relaxed [&_ul]:list-disc [&_ul]:pl-5 [&_li]:mb-1" dangerouslySetInnerHTML={{ __html: featuresHtml }} />
                    </div>
                  )}
                  {qtyCondition && (
                    <div className="mt-4">
                      <div className="text-xs font-bold text-[var(--text)] mb-2">📋 Нөхцөл</div>
                      <p className="text-sm text-[var(--text2)] leading-relaxed whitespace-pre-wrap">{qtyCondition}</p>
                    </div>
                  )}
                  {p.video_url && (
                    <div className="mt-4 rounded-xl overflow-hidden aspect-video bg-black">
                      {p.video_url.includes('youtube.com') || p.video_url.includes('youtu.be') ? (
                        <iframe src={p.video_url.replace('watch?v=', 'embed/').replace('youtu.be/', 'youtube.com/embed/')} className="w-full h-full border-none" allowFullScreen />
                      ) : p.video_url.includes('facebook.com') ? (
                        <iframe src={`https://www.facebook.com/plugins/video.php?href=${encodeURIComponent(p.video_url)}&show_text=false&width=560`} className="w-full h-full border-none" allowFullScreen allow="autoplay; clipboard-write; encrypted-media; picture-in-picture; web-share" />
                      ) : p.video_url.includes('tiktok.com') ? (
                        <div className="w-full h-full flex flex-col items-center justify-center bg-[var(--surface2)]">
                          <span className="text-3xl mb-2">🎬</span>
                          <a href={p.video_url} target="_blank" rel="noopener noreferrer" className="text-sm font-semibold text-[#FF6B00] no-underline hover:underline">TikTok видео үзэх →</a>
                        </div>
                      ) : p.video_url.match(/\.(mp4|webm|mov)/) ? (
                        <video src={p.video_url} controls className="w-full h-full" />
                      ) : (
                        <div className="w-full h-full flex flex-col items-center justify-center bg-[var(--surface2)]">
                          <span className="text-3xl mb-2">🎬</span>
                          <a href={p.video_url} target="_blank" rel="noopener noreferrer" className="text-sm font-semibold text-[#FF6B00] no-underline hover:underline">Видео үзэх →</a>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}
              {tab === 'reviews' && <div className="max-w-[700px] text-center py-10"><span className="text-4xl block mb-3">💬</span><p className="text-sm text-[var(--text3)]">Сэтгэгдэл бичигдээгүй.</p></div>}
            </motion.div>
          </AnimatePresence>
        </div>

        {/* ═══ RELATED ═══ */}
        {related.length > 0 && (
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="mt-10 border-t border-[var(--border)] pt-8">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-base font-bold text-[var(--text)] m-0">Төстэй бараанууд</h2>
              <a href="/shop" className="text-xs font-semibold text-[#FF6B00] no-underline hover:underline">Бүгдийг →</a>
            </div>
            <div className="flex gap-3.5 overflow-x-auto pb-2" style={{ scrollbarWidth: 'none' }}>
              {related.map(r => {
                const rp = Number(r.sale_price ?? r.base_price ?? 0)
                const rop = r.sale_price && r.base_price && Number(r.sale_price) < Number(r.base_price) ? Number(r.base_price) : null
                const rd = rop ? Math.round((1 - rp / rop) * 100) : null
                return (
                  <motion.a key={r.id} href={`/product/${r.slug || r.id}`} whileHover={{ y: -3 }} className="shrink-0 w-[180px] no-underline text-inherit group">
                    <div className="aspect-square rounded-xl overflow-hidden bg-[var(--surface2)] mb-2 relative">
                      {r.thumbnail_url ? <img src={r.thumbnail_url} alt="" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" loading="lazy" /> : <div className="w-full h-full flex items-center justify-center text-3xl">🖨️</div>}
                      {rd && <span className="absolute top-2 left-2 bg-red-500 text-white text-[9px] font-bold px-1.5 py-0.5 rounded">-{rd}%</span>}
                    </div>
                    <div className="text-[10px] text-[var(--text3)] truncate">{r.category}</div>
                    <div className="text-[12px] font-semibold text-[var(--text)] truncate group-hover:text-[#FF6B00] transition-colors">{r.name_mn || r.name}</div>
                    <span className="text-[13px] font-extrabold">{fmt(rp)}</span>
                  </motion.a>
                )
              })}
            </div>
          </motion.div>
        )}
      </div>
    </motion.div>
  )
}
