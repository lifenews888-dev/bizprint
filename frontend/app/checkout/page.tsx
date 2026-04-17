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
}

interface Address {
  full_name: string
  phone: string
  district: string
  address: string
  notes: string
}

export default function CheckoutPage() {
  const router = useRouter()
  const [step, setStep] = useState(1)
  const [userId, setUserId] = useState<string | null>(null)
  const [items, setItems] = useState<CartItem[]>([])
  const [products, setProducts] = useState<Record<string, Product>>({})
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [hasToken, setHasToken] = useState(false)
  const [address, setAddress] = useState<Address>({
    full_name: '', phone: '', district: '', address: '', notes: '',
  })

  useEffect(() => {
    const token = localStorage.getItem('token')
    setHasToken(!!token)
    if (!token) { setLoading(false); return }

    fetch(`${API}/auth/me`, { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.json())
      .then(async u => {
        if (!u?.id) { setLoading(false); return }
        setUserId(u.id)
        if (u.full_name) setAddress(prev => ({ ...prev, full_name: u.full_name || '' }))
        if (u.phone) setAddress(prev => ({ ...prev, phone: u.phone || '' }))

        const [cartData, prods] = await Promise.all([
          fetch(`${API}/cart/${u.id}`, { headers: { Authorization: `Bearer ${token}` } }).then(r => r.json()).catch(() => null),
          fetch(`${API}/products`, { headers: { Authorization: `Bearer ${token}` } }).then(r => r.json()).catch(() => []),
        ])
        setItems(cartData?.items ?? [])
        const prodMap: Record<string, Product> = {}
        if (Array.isArray(prods)) prods.forEach((p: Product) => { prodMap[p.id] = p })
        setProducts(prodMap)
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  const getPrice = (productId: string) => {
    const p = products[productId]
    if (!p) return 0
    return Number(p.sale_price ?? p.base_price ?? p.price ?? 0)
  }

  const subtotal = items.reduce((s, i) => s + getPrice(i.product_id) * i.quantity, 0)
  const vat = Math.round(subtotal * VAT_RATE)
  const total = subtotal + DELIVERY_FEE + vat

  const addressValid = address.full_name.trim() && address.phone.trim() && address.address.trim()

  const placeOrder = async () => {
    const token = localStorage.getItem('token')
    if (!token || !userId || submitting) return
    setSubmitting(true)
    try {
      await fetch(`${API}/orders`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          customer_id: userId,
          items: items.map(i => ({ product_id: i.product_id, quantity: i.quantity, unit_price: getPrice(i.product_id) })),
          subtotal,
          delivery_fee: DELIVERY_FEE,
          vat,
          total_price: total,
          delivery_address: `${address.district ? address.district + ', ' : ''}${address.address}`,
          customer_name: address.full_name,
          phone: address.phone,
          notes: address.notes,
          status: 'pending',
          payment_status: 'pending',
        }),
      })
      router.push('/order')
    } catch {
      alert('Захиалга өгөхөд алдаа гарлаа. Дахин оролдоно уу.')
    }
    setSubmitting(false)
  }

  if (!hasToken && !loading) {
    return (
      <div style={{ maxWidth: 600, margin: '80px auto', padding: '0 24px', textAlign: 'center', fontFamily: F }}>
        <h2 style={{ fontSize: 22, fontWeight: 700, margin: '0 0 12px', color: 'var(--text)' }}>Нэвтэрч орно уу</h2>
        <a href="/login" style={{ padding: '12px 28px', background: '#FF6B00', color: '#fff', borderRadius: 10, textDecoration: 'none', fontWeight: 600 }}>Нэвтрэх</a>
      </div>
    )
  }

  if (loading) {
    return <div style={{ padding: 60, textAlign: 'center', color: 'var(--text2)', fontFamily: F }}>Уншиж байна...</div>
  }

  if (items.length === 0) {
    return (
      <div style={{ maxWidth: 600, margin: '80px auto', padding: '0 24px', textAlign: 'center', fontFamily: F }}>
        <div style={{ fontSize: 48, marginBottom: 16 }}>🛒</div>
        <h2 style={{ fontSize: 20, fontWeight: 700, margin: '0 0 12px', color: 'var(--text)' }}>Сагс хоосон байна</h2>
        <a href="/shop" style={{ padding: '12px 28px', background: '#FF6B00', color: '#fff', borderRadius: 10, textDecoration: 'none', fontWeight: 600 }}>Дэлгүүр үзэх</a>
      </div>
    )
  }

  return (
    <div style={{ maxWidth: 900, margin: '0 auto', padding: '40px 24px', fontFamily: F }}>
      <h1 style={{ fontSize: 26, fontWeight: 700, margin: '0 0 8px', color: 'var(--text)' }}>Захиалга баталгаажуулах</h1>

      {/* Step indicator */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 0, marginBottom: 32 }}>
        {['Хүргэлтийн хаяг', 'Баталгаажуулах'].map((label, i) => {
          const num = i + 1
          const done = step > num
          const active = step === num
          return (
            <div key={label} style={{ display: 'flex', alignItems: 'center', flex: i < 1 ? 1 : 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <div style={{
                  width: 28, height: 28, borderRadius: '50%',
                  background: done || active ? '#FF6B00' : 'var(--surface2)',
                  border: `2px solid ${done || active ? '#FF6B00' : 'var(--border)'}`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 12, fontWeight: 700, color: done || active ? '#fff' : 'var(--text3)',
                  flexShrink: 0,
                }}>
                  {done ? '✓' : num}
                </div>
                <span style={{ fontSize: 13, fontWeight: active ? 600 : 400, color: active ? '#FF6B00' : done ? 'var(--text)' : 'var(--text3)', whiteSpace: 'nowrap' }}>
                  {label}
                </span>
              </div>
              {i < 1 && <div style={{ flex: 1, height: 2, background: done ? '#FF6B00' : 'var(--border)', margin: '0 12px' }} />}
            </div>
          )
        })}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 300px', gap: 24, alignItems: 'start' }}>
        {/* Left: form or review */}
        <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 16, padding: 24 }}>
          {step === 1 ? (
            <>
              <h2 style={{ fontSize: 17, fontWeight: 700, margin: '0 0 20px', color: 'var(--text)' }}>Хүргэлтийн хаяг</h2>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                {[
                  { key: 'full_name', label: 'Нэр', placeholder: 'Таны бүтэн нэр', required: true },
                  { key: 'phone', label: 'Утасны дугаар', placeholder: '+976 XXXX-XXXX', required: true },
                  { key: 'district', label: 'Дүүрэг / Хороо', placeholder: 'Сүхбаатар дүүрэг, 1-р хороо', required: false },
                  { key: 'address', label: 'Дэлгэрэнгүй хаяг', placeholder: 'Байр, давхар, тоот...', required: true },
                  { key: 'notes', label: 'Нэмэлт тэмдэглэл', placeholder: 'Хаалганы код, хүргэлтийн цаг...', required: false },
                ].map(field => (
                  <div key={field.key}>
                    <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: 'var(--text2)', marginBottom: 6 }}>
                      {field.label} {field.required && <span style={{ color: '#EF4444' }}>*</span>}
                    </label>
                    {field.key === 'notes' ? (
                      <textarea
                        value={address[field.key as keyof Address]}
                        onChange={e => setAddress(prev => ({ ...prev, [field.key]: e.target.value }))}
                        placeholder={field.placeholder}
                        rows={3}
                        style={{ width: '100%', padding: '10px 14px', border: '1px solid var(--border)', borderRadius: 10, fontSize: 14, outline: 'none', background: 'var(--surface2)', color: 'var(--text)', fontFamily: F, resize: 'vertical', boxSizing: 'border-box' }}
                      />
                    ) : (
                      <input
                        value={address[field.key as keyof Address]}
                        onChange={e => setAddress(prev => ({ ...prev, [field.key]: e.target.value }))}
                        placeholder={field.placeholder}
                        style={{ width: '100%', padding: '10px 14px', border: '1px solid var(--border)', borderRadius: 10, fontSize: 14, outline: 'none', background: 'var(--surface2)', color: 'var(--text)', fontFamily: F, boxSizing: 'border-box' }}
                      />
                    )}
                  </div>
                ))}
              </div>
              <button
                onClick={() => setStep(2)}
                disabled={!addressValid}
                style={{ marginTop: 24, width: '100%', padding: '13px', background: addressValid ? '#111' : 'var(--surface2)', color: addressValid ? '#fff' : 'var(--text3)', border: 'none', borderRadius: 12, fontSize: 15, fontWeight: 700, cursor: addressValid ? 'pointer' : 'not-allowed', fontFamily: F }}>
                Үргэлжлүүлэх →
              </button>
            </>
          ) : (
            <>
              <h2 style={{ fontSize: 17, fontWeight: 700, margin: '0 0 20px', color: 'var(--text)' }}>Захиалгын хураангуй</h2>

              {/* Address review */}
              <div style={{ background: 'var(--surface2)', borderRadius: 12, padding: '14px 16px', marginBottom: 20 }}>
                <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text2)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 10 }}>Хүргэлтийн хаяг</div>
                <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text)', marginBottom: 4 }}>{address.full_name}</div>
                <div style={{ fontSize: 13, color: 'var(--text2)', marginBottom: 4 }}>📞 {address.phone}</div>
                <div style={{ fontSize: 13, color: 'var(--text2)', marginBottom: address.notes ? 4 : 0 }}>
                  📍 {address.district ? `${address.district}, ` : ''}{address.address}
                </div>
                {address.notes && <div style={{ fontSize: 13, color: 'var(--text2)' }}>📝 {address.notes}</div>}
                <button onClick={() => setStep(1)} style={{ marginTop: 10, fontSize: 12, color: '#FF6B00', background: 'none', border: 'none', cursor: 'pointer', padding: 0, fontFamily: F }}>
                  Засах
                </button>
              </div>

              {/* Items */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 20 }}>
                {items.map(item => {
                  const prod = products[item.product_id]
                  const price = getPrice(item.product_id)
                  return (
                    <div key={item.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 14 }}>
                      <span style={{ color: 'var(--text)' }}>{prod?.name_mn || prod?.name || 'Бүтээгдэхүүн'} × {item.quantity}</span>
                      <span style={{ fontWeight: 600, color: 'var(--text)' }}>{fmt(price * item.quantity)}</span>
                    </div>
                  )
                })}
              </div>

              <button
                onClick={placeOrder}
                disabled={submitting}
                style={{ width: '100%', padding: '14px', background: submitting ? 'var(--surface2)' : '#FF6B00', color: submitting ? 'var(--text3)' : '#fff', border: 'none', borderRadius: 12, fontSize: 15, fontWeight: 700, cursor: submitting ? 'not-allowed' : 'pointer', fontFamily: F }}>
                {submitting ? 'Захиалж байна...' : 'Захиалга өгөх ✓'}
              </button>
            </>
          )}
        </div>

        {/* Right: price breakdown */}
        <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 16, padding: 20, position: 'sticky', top: 80 }}>
          <h3 style={{ fontSize: 14, fontWeight: 700, margin: '0 0 16px', color: 'var(--text)' }}>Төлбөрийн дэлгэрэнгүй</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13 }}>
              <span style={{ color: 'var(--text2)' }}>Дэд нийт</span>
              <span style={{ color: 'var(--text)' }}>{fmt(subtotal)}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13 }}>
              <span style={{ color: 'var(--text2)' }}>Хүргэлт</span>
              <span style={{ color: 'var(--text)' }}>{fmt(DELIVERY_FEE)}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13 }}>
              <span style={{ color: 'var(--text2)' }}>НӨАТ (10%)</span>
              <span style={{ color: 'var(--text)' }}>{fmt(vat)}</span>
            </div>
            <div style={{ height: 1, background: 'var(--border)' }} />
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 16, fontWeight: 700 }}>
              <span style={{ color: 'var(--text)' }}>Нийт</span>
              <span style={{ color: '#FF6B00' }}>{fmt(total)}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
