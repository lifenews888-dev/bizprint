'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'

const API = 'http://localhost:4000'
const F = "'DM Sans','Segoe UI',system-ui,sans-serif"
const fmt = (n: number) => n.toLocaleString('mn-MN') + '₮'

const DELIVERY_FEE = 5000
const VAT_RATE = 0.1

interface CartItem {
  id: string
  product_id: string
  quantity: number
}

interface Product {
  id: string
  name: string
  name_mn?: string
  price?: number
  base_price?: number
  sale_price?: number
  thumbnail_url?: string
}

export default function CartPage() {
  const router = useRouter()
  const [userId, setUserId] = useState<string | null>(null)
  const [items, setItems] = useState<CartItem[]>([])
  const [products, setProducts] = useState<Record<string, Product>>({})
  const [loading, setLoading] = useState(true)
  const [removingId, setRemovingId] = useState<string | null>(null)
  const [hasToken, setHasToken] = useState(false)

  useEffect(() => {
    const token = localStorage.getItem('access_token') || localStorage.getItem('access_token') || localStorage.getItem('token') || ''
    setHasToken(!!token)
    if (!token) { setLoading(false); return }

    fetch(`${API}/auth/me`, { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.json())
      .then(async u => {
        if (!u?.id) { setLoading(false); return }
        setUserId(u.id)
        const [cartData, prods] = await Promise.all([
          fetch(`${API}/cart/${u.id}`, { headers: { Authorization: `Bearer ${token}` } }).then(r => r.json()).catch(() => null),
          fetch(`${API}/products`, { headers: { Authorization: `Bearer ${token}` } }).then(r => r.json()).catch(() => []),
        ])
        const cartItems: CartItem[] = cartData?.items ?? []
        setItems(cartItems)
        const prodMap: Record<string, Product> = {}
        if (Array.isArray(prods)) prods.forEach((p: Product) => { prodMap[p.id] = p })
        setProducts(prodMap)
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  const removeItem = async (itemId: string) => {
    const token = localStorage.getItem('access_token') || localStorage.getItem('access_token') || localStorage.getItem('token') || ''
    setRemovingId(itemId)
    try {
      await fetch(`${API}/cart/items/${itemId}`, { method: 'DELETE', headers: { Authorization: `Bearer ${token || ''}` } })
      setItems(prev => prev.filter(i => i.id !== itemId))
    } catch {}
    setRemovingId(null)
  }

  const getPrice = (productId: string) => {
    const p = products[productId]
    if (!p) return 0
    return Number(p.sale_price ?? p.base_price ?? p.price ?? 0)
  }

  const subtotal = items.reduce((s, i) => s + getPrice(i.product_id) * i.quantity, 0)
  const vat = Math.round(subtotal * VAT_RATE)
  const total = subtotal + DELIVERY_FEE + vat

  if (!hasToken && !loading) {
    return (
      <div style={{ maxWidth: 600, margin: '80px auto', padding: '0 24px', textAlign: 'center', fontFamily: F }}>
        <div style={{ fontSize: 48, marginBottom: 16 }}>🛒</div>
        <h2 style={{ fontSize: 22, fontWeight: 700, margin: '0 0 12px', color: 'var(--text)' }}>Нэвтэрч орно уу</h2>
        <p style={{ color: 'var(--text2)', marginBottom: 24 }}>Сагсаа харахын тулд нэвтэрч орно уу.</p>
        <a href="/login" style={{ padding: '12px 28px', background: '#FF6B00', color: '#fff', borderRadius: 10, textDecoration: 'none', fontWeight: 600, fontSize: 14 }}>Нэвтрэх</a>
      </div>
    )
  }

  return (
    <div style={{ maxWidth: 1000, margin: '0 auto', padding: '40px 24px', fontFamily: F }}>
      <h1 style={{ fontSize: 28, fontWeight: 700, margin: '0 0 32px', color: 'var(--text)' }}>Миний сагс</h1>

      {loading ? (
        <div style={{ textAlign: 'center', padding: 60, color: 'var(--text2)' }}>Уншиж байна...</div>
      ) : items.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '60px 24px', border: '2px dashed var(--border)', borderRadius: 16 }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>🛒</div>
          <h2 style={{ fontSize: 20, fontWeight: 600, margin: '0 0 10px', color: 'var(--text)' }}>Сагс хоосон байна</h2>
          <p style={{ color: 'var(--text2)', marginBottom: 24, fontSize: 14 }}>Дэлгүүр рүү очиж бүтээгдэхүүн нэм.</p>
          <a href="/shop" style={{ padding: '12px 28px', background: '#FF6B00', color: '#fff', borderRadius: 10, textDecoration: 'none', fontWeight: 600, fontSize: 14 }}>Дэлгүүр үзэх</a>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: 24, alignItems: 'start' }}>
          {/* Items list */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {items.map(item => {
              const prod = products[item.product_id]
              const price = getPrice(item.product_id)
              return (
                <div key={item.id} style={{ display: 'flex', gap: 16, padding: 16, background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 14 }}>
                  <div style={{ width: 80, height: 80, borderRadius: 10, overflow: 'hidden', background: '#F3F4F6', flexShrink: 0 }}>
                    {prod?.thumbnail_url
                      ? <img src={prod.thumbnail_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      : <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 28 }}>📦</div>}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 600, fontSize: 15, marginBottom: 4, color: 'var(--text)' }}>
                      {prod?.name_mn || prod?.name || 'Бүтээгдэхүүн'}
                    </div>
                    <div style={{ color: 'var(--text2)', fontSize: 13, marginBottom: 8 }}>Тоо ширхэг: {item.quantity}</div>
                    <div style={{ fontWeight: 700, fontSize: 16, color: '#FF6B00' }}>{fmt(price * item.quantity)}</div>
                    {item.quantity > 1 && <div style={{ fontSize: 12, color: 'var(--text3)' }}>{fmt(price)} / ш</div>}
                  </div>
                  <button
                    onClick={() => removeItem(item.id)}
                    disabled={removingId === item.id}
                    style={{ background: 'none', border: 'none', cursor: removingId === item.id ? 'not-allowed' : 'pointer', color: '#9CA3AF', fontSize: 20, padding: '4px 8px', alignSelf: 'flex-start', lineHeight: 1, opacity: removingId === item.id ? 0.4 : 1 }}>
                    ×
                  </button>
                </div>
              )
            })}
          </div>

          {/* Order summary */}
          <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 16, padding: 24, position: 'sticky', top: 80 }}>
            <h3 style={{ fontSize: 16, fontWeight: 700, margin: '0 0 20px', color: 'var(--text)' }}>Захиалгын дүн</h3>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 20 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 14 }}>
                <span style={{ color: 'var(--text2)' }}>Дэд нийт ({items.length} бараа)</span>
                <span style={{ fontWeight: 500, color: 'var(--text)' }}>{fmt(subtotal)}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 14 }}>
                <span style={{ color: 'var(--text2)' }}>Хүргэлтийн төлбөр</span>
                <span style={{ fontWeight: 500, color: 'var(--text)' }}>{fmt(DELIVERY_FEE)}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 14 }}>
                <span style={{ color: 'var(--text2)' }}>НӨАТ (10%)</span>
                <span style={{ fontWeight: 500, color: 'var(--text)' }}>{fmt(vat)}</span>
              </div>
              <div style={{ height: 1, background: 'var(--border)', margin: '4px 0' }} />
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 18, fontWeight: 700 }}>
                <span style={{ color: 'var(--text)' }}>Нийт дүн</span>
                <span style={{ color: '#FF6B00' }}>{fmt(total)}</span>
              </div>
            </div>

            <button
              onClick={() => router.push('/checkout')}
              style={{ width: '100%', padding: '14px', background: '#111', color: '#fff', border: 'none', borderRadius: 12, fontSize: 15, fontWeight: 700, cursor: 'pointer', fontFamily: F }}>
              Захиалга баталгаажуулах →
            </button>
            <a href="/shop" style={{ display: 'block', textAlign: 'center', marginTop: 12, color: 'var(--text2)', fontSize: 13, textDecoration: 'none' }}>
              ← Дэлгүүр рүү буцах
            </a>
          </div>
        </div>
      )}
    </div>
  )
}
