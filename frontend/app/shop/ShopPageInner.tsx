'use client'
import { apiFetch, getToken } from '@/lib/api'
import { CLIENT_PRICING_SNAPSHOT_VERSION, PRICING_CONTRACT_VERSION } from '@/lib/pricing/snapshot'
import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import ProductCard from '@/components/ProductCard'

const F = "'DM Sans','Segoe UI',system-ui,sans-serif"

const FALLBACK_LABELS: Record<string, { label: string; icon: string }> = {
  'business-cards': { label: 'Нэрийн хуудас', icon: '💼' },
  'business-card': { label: 'Нэрийн хуудас', icon: '💼' },
  'offset': { label: 'Офсет хэвлэл', icon: '🖨️' },
  'digital': { label: 'Дижитал хэвлэл', icon: '⚡' },
  'stickers': { label: 'Стикер & Шошго', icon: '🏷️' },
  'sticker': { label: 'Стикер & Шошго', icon: '🏷️' },
  'banners': { label: 'Баннер', icon: '🪧' },
  'banner': { label: 'Баннер', icon: '🪧' },
  'packaging': { label: 'Сав баглаа', icon: '📦' },
  'books': { label: 'Ном & Каталог', icon: '📖' },
  'book': { label: 'Ном & Каталог', icon: '📖' },
  'promo': { label: 'Промо бараа', icon: '🎁' },
  'merchandise': { label: 'Бэлэг дурсгал', icon: '🎁' },
  'signage': { label: 'Тэмдэг & Самбар', icon: '🪧' },
  'flyer': { label: 'Флаер & Постер', icon: '📄' },
  'wide_format': { label: 'Өргөн формат', icon: '🖼️' },
}

type Product = {
  id: string; name?: string | null; price?: number | string | null; base_price?: number | string | null; sale_price?: number | string | null
  category?: string | null; thumbnail_url?: string | null; description?: string | null; name_mn?: string | null
  vendor_name?: string | null; rating?: number; slug?: string | null; pricing_mode?: string | null
  images?: string[] | null; is_out_of_stock?: boolean; stock_quantity?: number | null
  badge?: string | null; is_bestseller?: boolean; is_featured?: boolean; video_url?: string | null
  requires_dimensions?: boolean; min_quantity?: number; lead_time_days?: number
}

interface ShopUser {
  id?: string
}

interface ShopCategory {
  slug?: string
  name?: string
  name_mn?: string
  icon?: string
}

const FALLBACK_PRODUCTS = [
  { icon: '💼', title: 'Нэрийн хуудас', desc: 'Стандарт болон премиум цаас, ламинат, 2 талт хэвлэл', href: '/quote?product=business-card', price: '₮35,000-аас' },
  { icon: '📄', title: 'Флаер & постер', desc: 'A5/A4 сурталчилгааны материал, олон тоогоор хурдан хэвлэл', href: '/quote?product=flyer', price: '₮120-аас' },
  { icon: '🪧', title: 'Баннер', desc: 'Гадна болон дотор сурталчилгааны баннер, хэмжээ сонголттой', href: '/quote?product=banner', price: '₮18,000/м²-аас' },
  { icon: '🏷️', title: 'Стикер & шошго', desc: 'Бүтээгдэхүүний шошго, наалт, хэлбэртэй тайралт', href: '/quote?product=sticker', price: '₮90-аас' },
]

export default function ShopPageInner() {
  const search = useSearchParams()
  const catFilter = search.get('category') || search.get('cat') || 'all'
  const dealsOnly = search.get('deals') === 'true'
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [user, setUser] = useState<ShopUser | null>(null)
  const [toast, setToast] = useState('')
  const [searchQuery, setSearchQuery] = useState('')
  const [dbCategories, setDbCategories] = useState<Record<string, { label: string; icon: string }>>({})
  const [productLoadFailed, setProductLoadFailed] = useState(false)

  useEffect(() => {
    const controller = new AbortController()
    const timeout = window.setTimeout(() => controller.abort(), 6000)
    const loadingTimer = window.setTimeout(() => {
      setLoading(true)
      setProductLoadFailed(false)
    }, 0)
    let cancelled = false

    apiFetch<Product[]>('/products', { auth: false, signal: controller.signal })
      .then(d => {
        if (!cancelled) setProducts(Array.isArray(d) ? d : [])
      })
      .catch(() => {
        if (!cancelled) {
          setProducts([])
          setProductLoadFailed(true)
        }
      })
      .finally(() => {
        window.clearTimeout(timeout)
        if (!cancelled) setLoading(false)
      })

    apiFetch<ShopCategory[]>('/categories', { auth: false }).then(cats => {
      if (Array.isArray(cats)) {
        const map: Record<string, { label: string; icon: string }> = {}
        cats.forEach(c => {
          const label = c.name_mn || c.name || c.slug || 'Ангилал'
          if (c.slug) map[c.slug] = { label, icon: c.icon || '📦' }
          if (c.name) map[c.name.toLowerCase()] = { label, icon: c.icon || '📦' }
        })
        setDbCategories(map)
      }
    }).catch(() => {})

    const token = getToken()
    if (token) apiFetch<ShopUser>('/auth/me').then(u => u?.id && setUser(u)).catch(() => {})

    return () => {
      cancelled = true
      window.clearTimeout(timeout)
      window.clearTimeout(loadingTimer)
      controller.abort()
    }
  }, [])

  const categories = useMemo(() => {
    const set = new Set<string>()
    products.forEach(p => p.category && set.add(p.category))
    return ['all', ...Array.from(set)]
  }, [products])

  const filtered = useMemo(() => {
    let list = products.filter(p => catFilter === 'all' || p.category === catFilter)
    if (dealsOnly) list = list.filter(p => p.sale_price && Number(p.sale_price) > 0 && Number(p.sale_price) < Number(p.base_price))
    if (searchQuery) {
      const q = searchQuery.toLowerCase()
      list = list.filter(p => (p.name || '').toLowerCase().includes(q) || (p.name_mn || '').toLowerCase().includes(q) || (p.description || '').toLowerCase().includes(q))
    }
    return list
  }, [products, catFilter, searchQuery, dealsOnly])

  const buildCartPricing = (product: Product, quantity = 1) => {
    const unitPrice = Math.round(Number(product.sale_price ?? product.base_price ?? product.price ?? 0))
    const totalPrice = Math.round(unitPrice * quantity)
    const pricingEngine = product.pricing_mode ? `shop.catalog.${product.pricing_mode}` : 'shop.catalog.fixed'
    const pricingSnapshot = {
      source: 'catalog',
      clientSnapshotVersion: CLIENT_PRICING_SNAPSHOT_VERSION,
      pricingContractVersion: PRICING_CONTRACT_VERSION,
      pricingEngine,
      total: totalPrice,
      unitPrice,
      product: {
        id: product.id,
        name: product.name_mn || product.name || '',
        category: product.category || '',
      },
      spec: { quantity },
      generatedAt: new Date().toISOString(),
    }
    return { unitPrice, totalPrice, pricingEngine, pricingSnapshot }
  }

  const addToCart = async (productId: string) => {
    if (!user?.id) { alert('Нэвтэрч орно уу'); return }
    const product = products.find(p => p.id === productId)
    if (!product) { alert('Бүтээгдэхүүн олдсонгүй'); return }
    const { unitPrice, totalPrice, pricingEngine, pricingSnapshot } = buildCartPricing(product)
    if (unitPrice <= 0) { alert('Үнийн мэдээлэл дутуу байна'); return }
    try {
      await apiFetch<void>('/cart/items', {
        method: 'POST',
        body: {
          product_id: productId,
          quantity: 1,
          unit_price: unitPrice,
          specs: {
            product_name: product.name_mn || product.name || '',
            product_image: product.thumbnail_url || null,
            pricing: {
              unit_price: unitPrice,
              total_price: totalPrice,
              quantity: 1,
              vat_included: true,
              source: 'catalog',
              clientSnapshotVersion: CLIENT_PRICING_SNAPSHOT_VERSION,
              pricingContractVersion: PRICING_CONTRACT_VERSION,
              pricingEngine,
            },
            pricing_snapshot: pricingSnapshot,
          },
        },
      })
      setToast('Сагсанд нэмэгдлээ'); setTimeout(() => setToast(''), 2500)
    } catch { alert('Сагслах үед алдаа гарлаа') }
  }

  return (
    <div style={{ fontFamily: F, background: 'var(--bg)', minHeight: '100vh' }}>
      {toast && <div style={{ position: 'fixed', top: 16, right: 16, background: '#10B981', color: '#fff', padding: '12px 18px', borderRadius: 12, boxShadow: '0 10px 30px rgba(0,0,0,0.15)', zIndex: 2000, fontSize: 13, fontWeight: 600 }}>✓ {toast}</div>}

      {/* Hero */}
      <section style={{ background: 'linear-gradient(135deg, var(--surface), var(--surface2))', color: 'var(--text)' }} className="shop-hero">
        <div style={{ maxWidth: 1200, margin: '0 auto' }}>
          <h1 className="shop-title" style={{ fontWeight: 800, marginBottom: 8, letterSpacing: '-0.02em' }}>
            Хэвлэлийн <span style={{ color: '#FF6B00' }}>бүтээгдэхүүн</span>
          </h1>
          <p style={{ fontSize: 14, color: '#A8A29E', marginBottom: 16 }}>Мэргэжлийн хэвлэл, хурдан хүргэлт, AI үнэ тооцоолол</p>
          <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
            <div style={{ flex: 1, minWidth: 0, display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px', background: 'var(--surface2)', borderRadius: 12, border: '1px solid var(--border)' }}>
              <svg width="18" height="18" fill="none" stroke="var(--text3)" strokeWidth="1.8" viewBox="0 0 24 24"><circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/></svg>
              <input type="text" placeholder="Бүтээгдэхүүн хайх..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
                style={{ border: 'none', background: 'transparent', outline: 'none', flex: 1, minWidth: 0, fontSize: 14, color: 'var(--text)', fontFamily: F }} />
            </div>
          </div>
          <div className="shop-quick-links" style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {[
              { icon: '🛒', label: 'Бэлэн бараа', href: '#products', color: '#FF6B00' },
              { icon: '⚡', label: 'Түргэн хэвлэл', href: '/quote', color: '#8B5CF6' },
              { icon: '🤖', label: 'AI үнийн санал', href: '/quote?tab=ai', color: '#3B82F6' },
              { icon: '🎨', label: 'Дизайн хийлгэх', href: '/marketplace', color: '#EC4899' },
            ].map(b => (
              <a key={b.label} href={b.href} style={{
                display: 'flex', alignItems: 'center', gap: 6, padding: '8px 16px', borderRadius: 99,
                background: b.color + '15', color: b.color, fontSize: 12, fontWeight: 600, textDecoration: 'none',
                border: `1px solid ${b.color}30`,
              }}>{b.icon} {b.label}</a>
            ))}
          </div>
        </div>
      </section>

      {/* Category pills */}
      <section id="products" style={{ maxWidth: 1200, margin: '0 auto' }} className="shop-cats">
        <div style={{ display: 'flex', gap: 8, overflowX: 'auto', paddingBottom: 4, scrollbarWidth: 'none' }}>
          {categories.map(c => {
            const isActive = catFilter === c
            const info = { ...FALLBACK_LABELS, ...dbCategories }[c]
            return (
              <a key={c} href={c === 'all' ? '/shop' : `/shop?cat=${encodeURIComponent(c)}`}
                style={{
                  flexShrink: 0, padding: '8px 16px', borderRadius: 10, display: 'flex', alignItems: 'center', gap: 6,
                  border: isActive ? '1.5px solid #FF6B00' : '1px solid var(--border)',
                  background: isActive ? 'rgba(255,107,0,0.08)' : 'var(--surface)',
                  color: isActive ? '#FF6B00' : 'var(--text2)', fontSize: 12, fontWeight: 600, textDecoration: 'none',
                }}>
                {info?.icon || '📦'} {info?.label || (c === 'all' ? 'Бүгд' : c)}
              </a>
            )
          })}
        </div>
      </section>

      {/* Count */}
      <div className="shop-products" style={{ maxWidth: 1200, margin: '0 auto', paddingBottom: 0, display: productLoadFailed ? 'none' : 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{ fontSize: 13, color: 'var(--text3)' }}>{loading ? 'Ачааллаж байна...' : `${filtered.length} бүтээгдэхүүн`}</span>
      </div>

      {/* Products grid */}
      <div style={{ maxWidth: 1200, margin: '0 auto' }} className="shop-products">
        {loading ? (
          <div className="shop-grid">
            {[1,2,3,4,5,6,7,8].map(i => <div key={i} style={{ aspectRatio: '3/4', background: 'var(--surface2)', borderRadius: 16 }} className="animate-pulse" />)}
          </div>
        ) : productLoadFailed ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
            <div style={{ padding: 24, background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 16 }}>
              <h3 style={{ margin: '0 0 8px', fontSize: 18, fontWeight: 800 }}>Дэлгүүрийн мэдээлэл түр ачаалсангүй</h3>
              <p style={{ color: 'var(--text3)', fontSize: 14, lineHeight: 1.6, margin: '0 0 16px', maxWidth: 620 }}>
                Сервер түр холбогдохгүй байна. Доорх түгээмэл бүтээгдэхүүнүүдээр шууд үнийн санал авах боломжтой.
              </p>
              <button onClick={() => window.location.reload()} style={{
                padding: '10px 16px', background: '#FF6B00', color: '#fff', border: 'none',
                borderRadius: 10, fontWeight: 700, fontSize: 14, cursor: 'pointer', fontFamily: F,
              }}>
                Дахин ачаалах
              </button>
            </div>
            <div className="shop-grid">
              {FALLBACK_PRODUCTS.map(item => (
                <a key={item.title} href={item.href} style={{
                  minHeight: 220, padding: 20, borderRadius: 16, background: 'var(--surface)',
                  border: '1px solid var(--border)', color: 'var(--text)', textDecoration: 'none',
                  display: 'flex', flexDirection: 'column', justifyContent: 'space-between',
                }}>
                  <div>
                    <div style={{ fontSize: 38, marginBottom: 14 }}>{item.icon}</div>
                    <h3 style={{ margin: '0 0 8px', fontSize: 17, fontWeight: 800 }}>{item.title}</h3>
                    <p style={{ margin: 0, color: 'var(--text3)', fontSize: 13, lineHeight: 1.5 }}>{item.desc}</p>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 10, marginTop: 18 }}>
                    <span style={{ color: '#FF6B00', fontWeight: 800, fontSize: 14 }}>{item.price}</span>
                    <span style={{ color: '#FF6B00', fontWeight: 700, fontSize: 13 }}>Үнэ авах →</span>
                  </div>
                </a>
              ))}
            </div>
          </div>
        ) : filtered.length === 0 ? (
          <div style={{ padding: 60, textAlign: 'center' }}>
            <div style={{ fontSize: 48, marginBottom: 12 }}>🔍</div>
            <p style={{ color: 'var(--text3)', fontSize: 14, marginBottom: 16 }}>Бүтээгдэхүүн олдсонгүй</p>
            <Link href="/shop" style={{ color: '#FF6B00', fontSize: 13, fontWeight: 600 }}>Бүгдийг харах →</Link>
          </div>
        ) : (
          <div className="shop-grid">
            {filtered.map(p => {
              const catInfo = { ...FALLBACK_LABELS, ...dbCategories }[p.category || '']
              return <ProductCard key={p.id} product={p} categoryLabel={catInfo?.label} onAddToCart={addToCart} />
            })}
          </div>
        )}
      </div>

      <style>{`
        .shop-grid {
          display: grid;
          gap: 18px;
          grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
        }
        .shop-hero { padding: 40px 20px; }
        .shop-title { font-size: 28px; }
        .shop-cats { padding: 20px 20px 0; }
        .shop-products { padding: 14px 20px 40px; }

        /* Tablet */
        @media (max-width: 768px) {
          .shop-grid { grid-template-columns: repeat(2, 1fr); gap: 12px; }
          .shop-hero { padding: 24px 14px; }
          .shop-title { font-size: 22px; }
          .shop-quick-links { overflow-x: auto; flex-wrap: nowrap !important; -webkit-overflow-scrolling: touch; scrollbar-width: none; }
          .shop-quick-links::-webkit-scrollbar { display: none; }
          .shop-cats { padding: 14px 14px 0 !important; }
          .shop-products { padding: 10px 14px 40px !important; }
        }

        /* Phones — keep 2 columns but tighten spacing so cards don't fall to one column */
        @media (max-width: 480px) {
          .shop-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 10px; }
          .shop-products { padding: 10px 10px 40px !important; }
        }
      `}</style>
    </div>
  )
}
