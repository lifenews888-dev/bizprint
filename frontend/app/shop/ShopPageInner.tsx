'use client'
import { apiFetch, getToken } from '@/lib/api'
import { useEffect, useMemo, useState } from 'react'
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
  id: string; name: string; price?: number; base_price?: number; sale_price?: number
  category?: string; thumbnail_url?: string; description?: string; name_mn?: string
  vendor_name?: string; rating?: number; slug?: string
}

export default function ShopPageInner() {
  const search = useSearchParams()
  const catFilter = search.get('category') || search.get('cat') || 'all'
  const dealsOnly = search.get('deals') === 'true'
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [user, setUser] = useState<any>(null)
  const [toast, setToast] = useState('')
  const [searchQuery, setSearchQuery] = useState('')
  const [dbCategories, setDbCategories] = useState<Record<string, { label: string; icon: string }>>({})

  useEffect(() => {
    apiFetch<any>('/products', { auth: false })
      .then(d => setProducts(Array.isArray(d) ? d : []))
      .catch(() => setProducts([]))
      .finally(() => setLoading(false))

    apiFetch<any>('/categories', { auth: false }).then(cats => {
      if (Array.isArray(cats)) {
        const map: Record<string, { label: string; icon: string }> = {}
        cats.forEach((c: any) => {
          if (c.slug) map[c.slug] = { label: c.name_mn || c.name, icon: c.icon || '📦' }
          if (c.name) map[c.name.toLowerCase()] = { label: c.name_mn || c.name, icon: c.icon || '📦' }
        })
        setDbCategories(map)
      }
    }).catch(() => {})

    const token = getToken()
    if (token) apiFetch<any>('/auth/me').then(u => u?.id && setUser(u)).catch(() => {})
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

  const addToCart = async (e: React.MouseEvent, productId: string) => {
    e.preventDefault(); e.stopPropagation()
    if (!user?.id) { alert('Нэвтэрч орно уу'); return }
    try {
      await apiFetch<any>('/cart/items', { method: 'POST', body: { user_id: user.id, product_id: productId, quantity: 1 } })
      setToast('Сагсанд нэмэгдлээ'); setTimeout(() => setToast(''), 2500)
    } catch { alert('Сагслах үед алдаа гарлаа') }
  }

  return (
    <div style={{ fontFamily: F, background: 'var(--bg)', minHeight: '100vh' }}>
      {toast && <div style={{ position: 'fixed', top: 16, right: 16, background: '#10B981', color: '#fff', padding: '12px 18px', borderRadius: 12, boxShadow: '0 10px 30px rgba(0,0,0,0.15)', zIndex: 2000, fontSize: 13, fontWeight: 600 }}>✓ {toast}</div>}

      {/* Hero */}
      <section style={{ background: 'linear-gradient(135deg, var(--surface), var(--surface2))', padding: '40px 20px', color: 'var(--text)' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto' }}>
          <h1 style={{ fontSize: 28, fontWeight: 800, marginBottom: 8, letterSpacing: '-0.02em' }}>
            Хэвлэлийн <span style={{ color: '#FF6B00' }}>бүтээгдэхүүн</span>
          </h1>
          <p style={{ fontSize: 14, color: '#A8A29E', marginBottom: 20 }}>Мэргэжлийн хэвлэл, хурдан хүргэлт, AI үнэ тооцоолол</p>
          <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
            <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 10, padding: '12px 16px', background: 'var(--surface2)', borderRadius: 12, border: '1px solid var(--border)' }}>
              <svg width="18" height="18" fill="none" stroke="var(--text3)" strokeWidth="1.8" viewBox="0 0 24 24"><circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/></svg>
              <input type="text" placeholder="Бүтээгдэхүүн хайх..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
                style={{ border: 'none', background: 'transparent', outline: 'none', flex: 1, fontSize: 14, color: 'var(--text)', fontFamily: F }} />
            </div>
          </div>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {[
              { icon: '🛒', label: 'Бэлэн бараа', href: '#products', color: '#FF6B00' },
              { icon: '⚡', label: 'Түргэн хэвлэл', href: '/quote', color: '#8B5CF6' },
              { icon: '🤖', label: 'AI үнийн санал', href: '/smart-quote', color: '#3B82F6' },
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
      <section id="products" style={{ maxWidth: 1200, margin: '0 auto', padding: '20px 20px 0' }}>
        <div style={{ display: 'flex', gap: 8, overflowX: 'auto', paddingBottom: 4, scrollbarWidth: 'none' as any }}>
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
      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '16px 20px 0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{ fontSize: 13, color: 'var(--text3)' }}>{loading ? 'Ачааллаж байна...' : `${filtered.length} бүтээгдэхүүн`}</span>
      </div>

      {/* Products grid */}
      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '14px 20px 40px' }}>
        {loading ? (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: 16 }} className="shop-grid">
            {[1,2,3,4,5,6,7,8].map(i => <div key={i} style={{ aspectRatio: '3/4', background: 'var(--surface2)', borderRadius: 16 }} className="animate-pulse" />)}
          </div>
        ) : filtered.length === 0 ? (
          <div style={{ padding: 60, textAlign: 'center' }}>
            <div style={{ fontSize: 48, marginBottom: 12 }}>🔍</div>
            <p style={{ color: 'var(--text3)', fontSize: 14, marginBottom: 16 }}>Бүтээгдэхүүн олдсонгүй</p>
            <a href="/shop" style={{ color: '#FF6B00', fontSize: 13, fontWeight: 600 }}>Бүгдийг харах →</a>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: 16 }} className="shop-grid">
            {filtered.map(p => {
              const catInfo = { ...FALLBACK_LABELS, ...dbCategories }[p.category || '']
              return <ProductCard key={p.id} product={p} categoryLabel={catInfo?.label} onAddToCart={id => addToCart({ preventDefault: () => {}, stopPropagation: () => {} } as any, id)} />
            })}
          </div>
        )}
      </div>

      <style>{`@media (max-width: 768px) { .shop-grid { grid-template-columns: repeat(2, 1fr) !important; } }`}</style>
    </div>
  )
}
