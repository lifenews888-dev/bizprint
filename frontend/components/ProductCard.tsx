'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import ProductImage from './ProductImage'
import { optimizeImage } from '@/lib/image'
import { apiFetch } from '@/lib/api'

const fmt = (n: number) => '₮' + n.toLocaleString('mn-MN')

interface Props {
  product: any
  categoryLabel?: string
  onAddToCart?: (productId: string) => void
}

export default function ProductCard({ product, categoryLabel, onAddToCart }: Props) {
  const p = product
  const imgs: string[] = []
  if (p.thumbnail_url) imgs.push(p.thumbnail_url)
  if (Array.isArray(p.images)) p.images.forEach((img: string) => { if (img && !imgs.includes(img)) imgs.push(img) })

  const [activeImg, setActiveImg] = useState(0)
  const [hovered, setHovered] = useState(false)
  const [liked, setLiked] = useState(false)
  const [adopted, setAdopted] = useState<boolean | null>(null) // null = unknown / not sales agent
  const [adopting, setAdopting] = useState(false)
  const autoRef = useRef<ReturnType<typeof setInterval> | null>(null)

  // Sales-only: check whether this product is already in my storefront so we
  // can render the right toggle state. Skips silently for any other role.
  useEffect(() => {
    let cancelled = false
    try {
      const u = JSON.parse(localStorage.getItem('user') || 'null')
      if (!u || (u.role !== 'sales' && u.role !== 'admin')) return
      apiFetch<{ adopted: boolean }>(`/products/${p.id}/adopt/me`)
        .then(r => { if (!cancelled) setAdopted(!!r?.adopted) })
        .catch(() => {})
    } catch {}
    return () => { cancelled = true }
  }, [p.id])

  const toggleAdopt = useCallback(async (e: React.MouseEvent) => {
    e.preventDefault(); e.stopPropagation()
    if (adopting) return
    setAdopting(true)
    try {
      if (adopted) {
        await apiFetch(`/products/${p.id}/adopt`, { method: 'DELETE' })
        setAdopted(false)
      } else {
        await apiFetch(`/products/${p.id}/adopt`, { method: 'POST', body: {} })
        setAdopted(true)
      }
    } catch {} finally { setAdopting(false) }
  }, [adopted, adopting, p.id])

  const price = Number(p.sale_price ?? p.base_price ?? p.price ?? 0)
  const oldPrice = p.sale_price && p.base_price && Number(p.sale_price) < Number(p.base_price) ? Number(p.base_price) : null
  const discount = oldPrice ? Math.round((1 - price / oldPrice) * 100) : null
  const slug = p.slug || p.id
  const isOutOfStock = p.is_out_of_stock || (p.stock_quantity != null && p.stock_quantity <= 0)

  // Autoplay when not hovered
  useEffect(() => {
    if (imgs.length <= 1) return
    if (!hovered) {
      autoRef.current = setInterval(() => setActiveImg(prev => (prev + 1) % imgs.length), 4000)
    }
    return () => { if (autoRef.current) clearInterval(autoRef.current) }
  }, [hovered, imgs.length])

  // Hover zone slider — divide card width into equal zones per image
  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (imgs.length <= 1) return
    const rect = e.currentTarget.getBoundingClientRect()
    const x = e.clientX - rect.left
    const zone = Math.floor((x / rect.width) * imgs.length)
    setActiveImg(Math.min(zone, imgs.length - 1))
  }, [imgs.length])

  return (
    <div className="group relative">
      <a href={`/product/${slug}`} className="block no-underline text-inherit">
        {/* ═══ IMAGE AREA ═══ */}
        <div
          className="relative rounded-2xl overflow-hidden bg-[var(--surface2)]"
          style={{ aspectRatio: '1 / 1' }}
          onMouseEnter={() => setHovered(true)}
          onMouseLeave={() => { setHovered(false); setActiveImg(0) }}
          onMouseMove={handleMouseMove}
        >
          {/* Images — crossfade. Cloudinary URLs get auto-resized and served
              in webp/avif via optimizeImage(); local /uploads pass through. */}
          {imgs.length > 0 ? (
            imgs.map((img, i) => (
              <img key={i}
                src={optimizeImage(img, { w: 400, h: 400 })}
                srcSet={`${optimizeImage(img, { w: 240, h: 240 })} 240w, ${optimizeImage(img, { w: 400, h: 400 })} 400w, ${optimizeImage(img, { w: 600, h: 600 })} 600w`}
                sizes="(max-width: 480px) 50vw, (max-width: 1024px) 33vw, 240px"
                alt={p.name_mn || p.name}
                width={400} height={400}
                className="absolute inset-0 w-full h-full object-cover transition-opacity duration-500"
                style={{ opacity: i === activeImg ? 1 : 0 }}
                loading={i === 0 ? 'eager' : 'lazy'}
                decoding="async"
                onError={e => { (e.target as HTMLImageElement).style.display = 'none' }} />
            ))
          ) : null}
          {/* Fallback — always rendered behind images, visible when no images or all fail */}
          {imgs.length === 0 && (
            <ProductImage src={null} alt={p.name_mn || p.name || 'Бүтээгдэхүүн'} category={p.category} className="w-full h-full" />
          )}
          {imgs.length > 0 && (
            <div className="absolute inset-0 -z-10">
              <ProductImage src={null} alt={p.name_mn || p.name || 'Бүтээгдэхүүн'} category={p.category} className="w-full h-full" />
            </div>
          )}

          {/* Progress bars — top */}
          {imgs.length > 1 && hovered && (
            <div className="absolute top-2 left-2 right-2 flex gap-1 z-10">
              {imgs.map((_, i) => (
                <div key={i} className="flex-1 h-[3px] rounded-full overflow-hidden bg-white/30">
                  <div className={`h-full rounded-full transition-all duration-300 ${i === activeImg ? 'bg-white w-full' : i < activeImg ? 'bg-white/60 w-full' : 'w-0'}`} />
                </div>
              ))}
            </div>
          )}

          {/* Badges — top left */}
          <div className="absolute top-2.5 left-2.5 flex flex-col gap-1 z-10">
            {discount && <span className="bg-red-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-md">-{discount}%</span>}
            {p.badge === 'NEW' && <span className="bg-emerald-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-md">ШИНЭ</span>}
            {p.badge === 'HOT' && <span className="bg-red-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-md">ХИТ</span>}
            {p.is_bestseller && !p.badge && <span className="bg-[#FF6B00] text-white text-[10px] font-bold px-2 py-0.5 rounded-md">Bestseller</span>}
            {p.is_featured && <span className="bg-violet-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-md">⭐</span>}
            {p.video_url && <span className="bg-blue-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-md">🎬</span>}
            {isOutOfStock && <span className="bg-gray-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-md">Дууссан</span>}
            {(p.requires_dimensions || p.pricing_mode === 'formula' || p.pricing_mode === 'tier')
              ? <span className="bg-orange-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-md">🖨️ Тооцоолох</span>
              : <span className="bg-emerald-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-md">📦 Шууд</span>
            }
          </div>

          {/* Sales-only adopt toggle — top right, always visible when applicable */}
          {adopted !== null && (
            <button
              onClick={toggleAdopt}
              disabled={adopting}
              title={adopted ? 'Дэлгүүрээс хасах' : 'Миний дэлгүүрт нэмэх'}
              className="absolute top-2.5 right-2.5 z-10 px-3 h-8 rounded-full text-[11px] font-bold border-none cursor-pointer shadow-md transition-colors"
              style={{
                background: adopted ? '#10B981' : 'rgba(255,255,255,0.92)',
                color: adopted ? '#fff' : '#FF6B00',
              }}>
              {adopting ? '…' : adopted ? '✓ Миний дэлгүүрт' : '💼 Би борлуулна'}
            </button>
          )}

          {/* Quick actions — reveal on hover */}
          <div className={`absolute bottom-3 right-3 flex gap-2 z-10 transition-all duration-300 ${hovered ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2'}`}>
            {/* Wishlist */}
            <button
              onClick={e => { e.preventDefault(); e.stopPropagation(); setLiked(!liked) }}
              className={`w-9 h-9 rounded-full flex items-center justify-center border-none cursor-pointer transition-all shadow-md ${
                liked ? 'bg-red-500 text-white' : 'bg-white/90 text-gray-600 hover:bg-white hover:text-red-500'
              }`}
            >
              <svg width="16" height="16" fill={liked ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z" />
              </svg>
            </button>
            {/* Add to cart */}
            <button
              onClick={e => { e.preventDefault(); e.stopPropagation(); onAddToCart?.(p.id) }}
              aria-label="Захиалах"
              title="Захиалах"
              className="w-9 h-9 rounded-full bg-[#FF6B00] text-white flex items-center justify-center border-none cursor-pointer shadow-lg shadow-[#FF6B00]/30 hover:bg-[#E55D00] transition-all"
            >
              <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24" aria-hidden="true"><path d="M12 5v14M5 12h14" /></svg>
            </button>
          </div>
        </div>

        {/* ═══ INFO ═══ */}
        <div className="pt-3 px-0.5">
          {/* Category */}
          {(categoryLabel || p.category) && (
            <div className="text-[10px] text-[var(--text3)] font-medium mb-0.5 truncate">{categoryLabel || p.category}</div>
          )}
          {/* Name */}
          <div className="text-[13px] font-semibold text-[var(--text)] mb-1.5 truncate leading-tight group-hover:text-[#FF6B00] transition-colors">
            {p.name_mn || p.name || 'Бүтээгдэхүүн'}
          </div>
          {/* Price row */}
          <div className="flex items-center gap-2 flex-wrap">
            {oldPrice ? (
              <>
                <span className="text-base font-extrabold text-[#FF6B00]">{fmt(price)}</span>
                <span className="text-xs text-[var(--text3)] line-through">{fmt(oldPrice)}</span>
                <span className="text-[10px] font-bold bg-red-100 text-red-600 px-1.5 py-0.5 rounded-full">-{discount}%</span>
              </>
            ) : price > 0 ? (
              <>
                <span className="text-[10px] text-[var(--text3)]">-аас</span>
                <span className="text-base font-extrabold text-[var(--text)]">{fmt(price)}</span>
              </>
            ) : (
              <span className="text-xs font-semibold text-[#FF6B00]">Үнэ авах</span>
            )}
          </div>
          {p.min_quantity > 1 && (
            <div className="text-[10px] text-[var(--text3)] mt-0.5">Мин. {p.min_quantity} ширхэг</div>
          )}
          {/* Lead time */}
          {p.lead_time_days && (
            <div className="flex items-center gap-1 mt-1.5 text-[10px] text-[var(--text3)]">
              <svg width="12" height="12" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/></svg>
              {p.lead_time_days} өдөр
            </div>
          )}
        </div>
      </a>
    </div>
  )
}
