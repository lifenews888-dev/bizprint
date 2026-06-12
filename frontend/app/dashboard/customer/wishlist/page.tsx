'use client'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import { apiFetch } from '@/lib/api'
import { CLIENT_PRICING_SNAPSHOT_VERSION, PRICING_CONTRACT_VERSION } from '@/lib/pricing/snapshot'
import { useStore } from '@/lib/store'
import { Heart, ShoppingCart, Trash2, ShoppingBag } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { toast } from 'sonner'

const fmt = (n: number) => '₮' + n.toLocaleString('mn-MN')

interface WishlistProduct {
  id: string
  slug?: string
  name?: string
  name_mn?: string
  category?: string
  sale_price?: number | string
  base_price?: number | string
  pricing_mode?: string
  thumbnail_url?: string
}

export default function WishlistPage() {
  const { wishlist, toggleWishlist, addToCart } = useStore()
  const [products, setProducts] = useState<WishlistProduct[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!wishlist.length) {
      const timer = setTimeout(() => setLoading(false), 0)
      return () => clearTimeout(timer)
    }
    apiFetch<WishlistProduct[]>('/products', { auth: false }).then(all => {
      if (Array.isArray(all)) setProducts(all.filter(p => wishlist.includes(p.id)))
    }).catch(() => {}).finally(() => setLoading(false))
  }, [wishlist])

  const handleAddToCart = (p: WishlistProduct) => {
    const unitPrice = Math.round(Number(p.sale_price ?? p.base_price ?? 0))
    const productName = p.name_mn || p.name || ''
    const pricingEngine = p.pricing_mode ? `wishlist.catalog.${p.pricing_mode}` : 'wishlist.catalog.fixed'
    const pricingSnapshot = {
      source: 'catalog',
      clientSnapshotVersion: CLIENT_PRICING_SNAPSHOT_VERSION,
      pricingContractVersion: PRICING_CONTRACT_VERSION,
      pricingEngine,
      total: unitPrice,
      unitPrice,
      product: {
        id: p.id,
        name: productName,
        category: p.category || '',
      },
      spec: { quantity: 1 },
      generatedAt: new Date().toISOString(),
    }
    addToCart({
      id: p.id,
      productId: p.id,
      name: productName,
      price: unitPrice,
      image: p.thumbnail_url,
      specs: {
        product_name: productName,
        product_image: p.thumbnail_url,
        pricing: {
          unit_price: unitPrice,
          total_price: unitPrice,
          quantity: 1,
          vat_included: true,
          source: 'catalog',
          clientSnapshotVersion: CLIENT_PRICING_SNAPSHOT_VERSION,
          pricingContractVersion: PRICING_CONTRACT_VERSION,
          pricingEngine,
        },
        pricing_snapshot: pricingSnapshot,
      },
    })
    toast.success('Сагсанд нэмэгдлээ')
  }

  if (loading) return <div className="min-h-[50vh] flex items-center justify-center"><div className="w-10 h-10 border-[3px] border-[var(--border)] border-t-[#FF6B00] rounded-full animate-spin" /></div>

  if (products.length === 0) return (
    <div className="min-h-[50vh] flex flex-col items-center justify-center px-4">
      <div className="w-20 h-20 rounded-full bg-red-50 flex items-center justify-center mb-4">
        <Heart className="w-8 h-8 text-red-300" strokeWidth={1} />
      </div>
      <h2 className="text-xl font-bold text-[var(--text)] mb-2">Хадгалсан бараа байхгүй</h2>
      <p className="text-sm text-[var(--text3)] mb-6">Бүтээгдэхүүн дээрх ❤️ товчийг дарж хадгална уу</p>
      <Link href="/shop" className="inline-flex items-center gap-2 px-6 py-3 bg-[#FF6B00] text-white rounded-xl text-sm font-bold no-underline hover:bg-[#E55D00] transition-colors">
        <ShoppingBag className="w-4 h-4" strokeWidth={1.5} /> Дэлгүүр хэсэх
      </Link>
    </div>
  )

  return (
    <div className="p-4 md:p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold text-[var(--text)]">Хадгалсан бараанууд</h1>
          <p className="text-sm text-[var(--text3)]">{products.length} бүтээгдэхүүн</p>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        <AnimatePresence>
          {products.map(p => {
            const price = Number(p.sale_price ?? p.base_price ?? 0)
            return (
              <motion.div key={p.id} layout exit={{ opacity: 0, scale: 0.8 }} className="rounded-xl border border-[var(--border)] bg-[var(--surface)] overflow-hidden group">
                <Link href={`/product/${p.slug || p.id}`} className="block no-underline">
                  <div className="aspect-square bg-[var(--surface2)] relative overflow-hidden">
                    {p.thumbnail_url ? <img src={p.thumbnail_url} alt="" className="w-full h-full object-cover group-hover:scale-105 transition-transform" /> :
                      <div className="w-full h-full flex items-center justify-center text-4xl">🖨️</div>}
                  </div>
                </Link>
                <div className="p-3">
                  <Link href={`/product/${p.slug || p.id}`} className="text-sm font-semibold text-[var(--text)] no-underline hover:text-[#FF6B00] transition-colors line-clamp-2">{p.name_mn || p.name}</Link>
                  <div className="text-base font-extrabold text-[#FF6B00] mt-1">{fmt(price)}</div>
                  <div className="flex gap-2 mt-2">
                    <button onClick={() => handleAddToCart(p)} className="flex-1 flex items-center justify-center gap-1 py-2 rounded-lg bg-[#FF6B00] text-white text-xs font-bold border-none cursor-pointer hover:bg-[#E55D00] transition-colors">
                      <ShoppingCart className="w-3.5 h-3.5" strokeWidth={1.5} /> Сагслах
                    </button>
                    <button onClick={() => { toggleWishlist(p.id); toast('Хасагдлаа') }} className="w-9 h-9 rounded-lg border border-red-200 bg-red-50 flex items-center justify-center cursor-pointer text-red-500 hover:bg-red-100 transition-colors">
                      <Trash2 className="w-3.5 h-3.5" strokeWidth={1.5} />
                    </button>
                  </div>
                </div>
              </motion.div>
            )
          })}
        </AnimatePresence>
      </div>
    </div>
  )
}
