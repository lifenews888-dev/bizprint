'use client'
import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { apiFetch } from '@/lib/api'
import { useRoleGuard } from '@/lib/use-role-guard'
import { ShoppingCart, Trash2, ShoppingBag, ArrowRight, Package } from 'lucide-react'

const ORANGE = '#FF6B00'
const FONT = "'Segoe UI',system-ui,sans-serif"

interface CartItem {
  id: string
  productId: string
  name: string
  price: number
  qty: number
  image?: string
  options?: Record<string, string>
}

interface CartResponse {
  items: CartItem[]
  total: number
}

export default function CartPage() {
  useRoleGuard(['customer'])
  const router = useRouter()
  const [items, setItems] = useState<CartItem[]>([])
  const [loading, setLoading] = useState(true)
  const [removing, setRemoving] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const fetchCart = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      const data = await apiFetch<CartResponse | CartItem[]>('/cart')
      if (Array.isArray(data)) {
        setItems(data)
      } else {
        setItems(data.items ?? [])
      }
    } catch (e: any) {
      setError(e?.message ?? 'Сагс ачаалахад алдаа гарлаа')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchCart() }, [fetchCart])

  const removeItem = async (id: string) => {
    setRemoving(id)
    try {
      await apiFetch(`/cart/items/${id}`, { method: 'DELETE' })
      setItems(prev => prev.filter(i => i.id !== id))
    } catch (e: any) {
      setError(e?.message ?? 'Устгахад алдаа гарлаа')
    } finally {
      setRemoving(null)
    }
  }

  const total = items.reduce((sum, i) => sum + i.price * i.qty, 0)
  const itemCount = items.reduce((sum, i) => sum + i.qty, 0)

  /* ─── loading ─── */
  if (loading) {
    return (
      <div style={{ minHeight: '60vh', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: FONT }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{
            width: 48, height: 48, border: `3px solid #333`, borderTopColor: ORANGE,
            borderRadius: '50%', animation: 'spin 0.8s linear infinite', margin: '0 auto 16px'
          }} />
          <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
          <p style={{ color: '#888', fontSize: 14 }}>Сагс ачаалж байна...</p>
        </div>
      </div>
    )
  }

  /* ─── empty ─── */
  if (!loading && items.length === 0) {
    return (
      <div style={{ minHeight: '60vh', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: FONT }}>
        <div style={{ textAlign: 'center', maxWidth: 360 }}>
          <div style={{
            width: 96, height: 96, borderRadius: '50%', background: '#1a1a1a',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            margin: '0 auto 24px'
          }}>
            <ShoppingCart size={40} color="#555" />
          </div>
          <h2 style={{ color: '#fff', fontSize: 22, fontWeight: 700, margin: '0 0 8px' }}>
            Сагс хоосон байна
          </h2>
          <p style={{ color: '#888', fontSize: 14, marginBottom: 28, lineHeight: 1.6 }}>
            Та одоохондоо сагсанд бараа нэмээгүй байна.<br />Дэлгүүрт орж бараагаа сонгоорой.
          </p>
          <button
            onClick={() => router.push('/dashboard/customer/shop')}
            style={{
              display: 'inline-flex', alignItems: 'center', gap: 8,
              background: ORANGE, color: '#fff', border: 'none',
              padding: '12px 28px', borderRadius: 10, fontSize: 15,
              fontWeight: 600, cursor: 'pointer', fontFamily: FONT
            }}
          >
            <ShoppingBag size={18} />
            Дэлгүүр үзэх
          </button>
        </div>
      </div>
    )
  }

  /* ─── cart ─── */
  return (
    <div style={{ maxWidth: 860, margin: '0 auto', padding: '24px 16px', fontFamily: FONT }}>

      {/* header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 28 }}>
        <div style={{
          width: 44, height: 44, borderRadius: 12, background: '#1a1a1a',
          display: 'flex', alignItems: 'center', justifyContent: 'center'
        }}>
          <ShoppingCart size={22} color={ORANGE} />
        </div>
        <div>
          <h1 style={{ color: '#fff', fontSize: 22, fontWeight: 700, margin: 0 }}>Миний сагс</h1>
          <p style={{ color: '#888', fontSize: 13, margin: 0 }}>{itemCount} бараа</p>
        </div>
      </div>

      {error && (
        <div style={{
          background: '#2a1515', border: '1px solid #f43f5e44', borderRadius: 10,
          padding: '12px 16px', color: '#f43f5e', fontSize: 14, marginBottom: 20
        }}>
          {error}
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 16 }}>

        {/* item list */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {items.map(item => (
            <div
              key={item.id}
              style={{
                background: '#111', border: '1px solid #222', borderRadius: 14,
                padding: 16, display: 'flex', alignItems: 'center', gap: 14
              }}
            >
              {/* image */}
              <div style={{
                width: 72, height: 72, borderRadius: 10, background: '#1a1a1a',
                overflow: 'hidden', flexShrink: 0,
                display: 'flex', alignItems: 'center', justifyContent: 'center'
              }}>
                {item.image
                  ? <img src={item.image} alt={item.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  : <Package size={28} color="#444" />
                }
              </div>

              {/* info */}
              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{ color: '#fff', fontWeight: 600, fontSize: 15, margin: '0 0 4px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {item.name}
                </p>
                {item.options && Object.keys(item.options).length > 0 && (
                  <p style={{ color: '#666', fontSize: 12, margin: '0 0 6px' }}>
                    {Object.entries(item.options).map(([k, v]) => `${k}: ${v}`).join(' · ')}
                  </p>
                )}
                <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                  <span style={{ color: '#888', fontSize: 13 }}>Тоо: <span style={{ color: '#ccc', fontWeight: 600 }}>{item.qty}</span></span>
                  <span style={{ color: ORANGE, fontWeight: 700, fontSize: 15 }}>
                    ₮{(item.price * item.qty).toLocaleString()}
                  </span>
                  {item.qty > 1 && (
                    <span style={{ color: '#555', fontSize: 12 }}>₮{item.price.toLocaleString()} / ширхэг</span>
                  )}
                </div>
              </div>

              {/* remove */}
              <button
                onClick={() => removeItem(item.id)}
                disabled={removing === item.id}
                style={{
                  background: removing === item.id ? '#1a1a1a' : '#1e0a0a',
                  border: '1px solid #f43f5e33',
                  borderRadius: 8, padding: '8px 10px', cursor: removing === item.id ? 'not-allowed' : 'pointer',
                  color: removing === item.id ? '#555' : '#f43f5e',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  transition: 'all 0.15s', flexShrink: 0
                }}
                title="Устгах"
              >
                <Trash2 size={16} />
              </button>
            </div>
          ))}
        </div>

        {/* summary */}
        <div style={{
          background: '#111', border: '1px solid #222', borderRadius: 14, padding: 20
        }}>
          <h3 style={{ color: '#fff', fontSize: 16, fontWeight: 700, margin: '0 0 16px' }}>Дүн</h3>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 20 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 14 }}>
              <span style={{ color: '#888' }}>Бараа ({itemCount} ширхэг)</span>
              <span style={{ color: '#ccc' }}>₮{total.toLocaleString()}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 14 }}>
              <span style={{ color: '#888' }}>Хүргэлт</span>
              <span style={{ color: '#4ade80', fontSize: 13 }}>Тооцоолох</span>
            </div>
            <div style={{ height: 1, background: '#222', margin: '4px 0' }} />
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 16 }}>
              <span style={{ color: '#fff', fontWeight: 700 }}>Нийт дүн</span>
              <span style={{ color: ORANGE, fontWeight: 800, fontSize: 20 }}>₮{total.toLocaleString()}</span>
            </div>
          </div>

          <button
            onClick={() => router.push('/dashboard/customer/checkout')}
            style={{
              width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center',
              gap: 8, background: ORANGE, color: '#fff', border: 'none',
              padding: '14px 24px', borderRadius: 12, fontSize: 16,
              fontWeight: 700, cursor: 'pointer', fontFamily: FONT,
              boxShadow: `0 4px 20px ${ORANGE}44`
            }}
          >
            Захиалах
            <ArrowRight size={18} />
          </button>

          <button
            onClick={() => router.push('/dashboard/customer/shop')}
            style={{
              width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center',
              gap: 8, background: 'transparent', color: '#888', border: '1px solid #333',
              padding: '11px 24px', borderRadius: 12, fontSize: 14,
              fontWeight: 500, cursor: 'pointer', fontFamily: FONT, marginTop: 10
            }}
          >
            Дэлгүүр үргэлжлүүлэх
          </button>
        </div>
      </div>
    </div>
  )
}
