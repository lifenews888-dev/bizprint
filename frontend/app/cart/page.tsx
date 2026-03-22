'use client'
import { apiFetch } from '@/lib/api'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'

const FONT = "'DM Sans','Segoe UI',system-ui,sans-serif"
const fmt = (n: number) => new Intl.NumberFormat('mn-MN').format(Math.round(n)) + '₮'

export default function CartPage() {
  const router = useRouter()
  const [cart, setCart] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [removing, setRemoving] = useState<string | null>(null)

  const loadCart = async () => {
    try {
      const u = JSON.parse(localStorage.getItem('user') || '{}')
      const userId = u.id || u.sub
      if (!userId) { setLoading(false); return }
      const res = await apiFetch(`/cart/${userId}`)
      const d = await res.json()
      setCart(d?.data || d)
    } catch {}
    setLoading(false)
  }

  useEffect(() => { loadCart() }, [])

  const removeItem = async (itemId: string) => {
    setRemoving(itemId)
    try {
      await apiFetch(`/cart/items/${itemId}`, { method: 'DELETE' })
      await loadCart()
    } catch {}
    setRemoving(null)
  }

  const items: any[] = cart?.items || []
  const total = items.reduce((s: number, i: any) => s + (i.total_price || i.unit_price * i.quantity || 0), 0)

  return (
    <div style={{ maxWidth: 860, margin: '0 auto', padding: '40px 24px', fontFamily: FONT }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 28 }}>
        <h1 style={{ fontSize: 26, fontWeight: 800, margin: 0 }}>🛒 Миний сагс</h1>
        <button onClick={() => router.push('/smart-quote')} style={{
          background: '#FF6B00', color: '#fff', border: 'none', borderRadius: 12,
          padding: '12px 20px', fontWeight: 700, fontSize: 14, cursor: 'pointer',
        }}>+ Нэмэх</button>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '60px 0', color: 'var(--text2)' }}>⏳ Уншиж байна...</div>
      ) : items.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '60px 20px', background: 'var(--surface)', borderRadius: 20, border: '2px dashed var(--border)' }}>
          <div style={{ fontSize: 64, marginBottom: 16 }}>🛒</div>
          <h3 style={{ margin: '0 0 12px', fontSize: 20 }}>Сагс хоосон байна</h3>
          <p style={{ margin: '0 0 24px', color: 'var(--text2)' }}>PDF upload хийж үнэ авснаа сагсанд нэмнэ үү</p>
          <button onClick={() => router.push('/smart-quote')} style={{
            background: '#FF6B00', color: '#fff', border: 'none', borderRadius: 12,
            padding: '14px 28px', fontWeight: 700, fontSize: 15, cursor: 'pointer',
          }}>🤖 AI Smart Quote</button>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: 24, alignItems: 'start' }}>
          {/* Items */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {items.map((item: any) => (
              <div key={item.id} style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 16, padding: 20 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 700, fontSize: 16, marginBottom: 6 }}>
                      {item.product_name || item.name || 'Захиалга'}
                    </div>
                    <div style={{ fontSize: 13, color: 'var(--text2)', display: 'flex', flexWrap: 'wrap', gap: '6px 16px' }}>
                      {item.quantity && <span>📦 {item.quantity} ширхэг</span>}
                      {item.paper_gsm && <span>📄 {item.paper_gsm}gsm</span>}
                      {item.color_mode && <span>🎨 {item.color_mode === 'color' ? 'Өнгөт' : 'Хар цагаан'}</span>}
                      {item.sides && <span>↔️ {item.sides === 'double' ? '2 тал' : '1 тал'}</span>}
                      {item.finishing && item.finishing !== 'none' && <span>✨ {item.finishing}</span>}
                    </div>
                  </div>
                  <div style={{ textAlign: 'right', marginLeft: 16 }}>
                    <div style={{ fontSize: 18, fontWeight: 800, color: '#FF6B00' }}>
                      {fmt(item.total_price || item.unit_price * item.quantity || 0)}
                    </div>
                    {item.unit_price && (
                      <div style={{ fontSize: 12, color: 'var(--text2)' }}>{fmt(item.unit_price)}/ш</div>
                    )}
                  </div>
                </div>
                <div style={{ marginTop: 14, borderTop: '1px solid var(--border)', paddingTop: 14, display: 'flex', justifyContent: 'flex-end' }}>
                  <button onClick={() => removeItem(item.id)} disabled={removing === item.id} style={{
                    background: 'none', border: '1px solid #FECACA', borderRadius: 8,
                    color: '#DC2626', fontSize: 13, cursor: 'pointer', padding: '6px 14px',
                  }}>
                    {removing === item.id ? '⏳ ...' : '🗑️ Устгах'}
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Summary */}
          <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 16, padding: 24, position: 'sticky', top: 20 }}>
            <h3 style={{ margin: '0 0 20px', fontSize: 17, fontWeight: 700 }}>Нийт дүн</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 20 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 14 }}>
                <span style={{ color: 'var(--text2)' }}>Барааны тоо:</span>
                <span>{items.length} зүйл</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 14 }}>
                <span style={{ color: 'var(--text2)' }}>Нийт ширхэг:</span>
                <span>{items.reduce((s: number, i: any) => s + (i.quantity || 0), 0)} ш</span>
              </div>
              <div style={{ height: 1, background: 'var(--border)', margin: '4px 0' }} />
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 18, fontWeight: 800 }}>
                <span>Нийт:</span>
                <span style={{ color: '#FF6B00' }}>{fmt(total)}</span>
              </div>
            </div>
            <button onClick={() => router.push('/checkout')} style={{
              width: '100%', padding: '14px', background: '#FF6B00', color: '#fff',
              border: 'none', borderRadius: 12, fontWeight: 700, fontSize: 15, cursor: 'pointer', marginBottom: 10,
            }}>
              ✅ Захиалах
            </button>
            <button onClick={() => router.push('/shop')} style={{
              width: '100%', padding: '12px', background: 'transparent', color: 'var(--text2)',
              border: '1px solid var(--border)', borderRadius: 12, fontWeight: 600, fontSize: 14, cursor: 'pointer',
            }}>
              ← Дэлгүүр үргэлжлүүлэх
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
