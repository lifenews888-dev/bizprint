'use client'
import { apiFetch } from '@/lib/api'
import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Suspense } from 'react'

const FONT = "'DM Sans','Segoe UI',system-ui,sans-serif"
const fmt = (n: number) => new Intl.NumberFormat('mn-MN').format(Math.round(n)) + '₮'

const inp: React.CSSProperties = {
  width: '100%', padding: '12px 16px', border: '1px solid var(--border)',
  borderRadius: 10, background: 'var(--surface2)', color: 'var(--text)',
  fontSize: 14, boxSizing: 'border-box', fontFamily: FONT, outline: 'none',
}

const PAYMENT_METHODS = [
  { value: 'qr', label: '📱 QR Код', desc: 'Khan Bank, Golomt, TDB...' },
  { value: 'bank', label: '🏦 Банк шилжүүлэг', desc: 'Дансаар шилжүүлэх' },
  { value: 'cash', label: '💵 Бэлэн мөнгө', desc: 'Хүргэлтийн үед' },
]

function CheckoutInner() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const quoteId = searchParams.get('quote_id')

  const [step, setStep] = useState(1) // 1=form, 2=payment, 3=done
  const [form, setForm] = useState({
    customer_name: '', customer_phone: '', customer_email: '',
    product_name: '', quantity: 100, notes: '', delivery_address: '',
  })
  const [payMethod, setPayMethod] = useState('qr')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [order, setOrder] = useState<any>(null)

  // Pre-fill from localStorage user
  useEffect(() => {
    try {
      const u = JSON.parse(localStorage.getItem('user') || '{}')
      setForm(f => ({
        ...f,
        customer_name: u.name || u.username || '',
        customer_email: u.email || '',
        customer_phone: u.phone || '',
      }))
    } catch {}
  }, [])

  const set = (k: string, v: any) => setForm(f => ({ ...f, [k]: v }))

  const submitOrder = async () => {
    if (!form.customer_name || !form.customer_phone) {
      setError('Нэр, утасны дугаараа оруулна уу'); return
    }
    setSaving(true); setError('')
    try {
      let res
      if (quoteId) {
        // Convert quote to order
        res = await apiFetch(`/orders/from-quote`, {
          method: 'POST',
          body: { quote_id: quoteId, payment_method: payMethod },
        })
      } else {
        // Create order directly
        res = await apiFetch(`/orders`, {
          method: 'POST',
          body: { ...form, payment_method: payMethod },
        })
      }
      if (!res.ok) {
        const e = await res.json().catch(() => ({}))
        throw new Error(e.message || 'Алдаа гарлаа')
      }
      const data = await res.json()
      setOrder(data.data || data)
      setStep(3)
    } catch (e: any) {
      setError(e.message)
    } finally {
      setSaving(false)
    }
  }

  // Step 3 — Done
  if (step === 3 && order) {
    return (
      <div style={{ maxWidth: 560, margin: '80px auto', padding: '0 24px', textAlign: 'center', fontFamily: FONT }}>
        <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 20, padding: 40 }}>
          <div style={{ fontSize: 64, marginBottom: 20 }}>🎉</div>
          <h2 style={{ fontSize: 24, fontWeight: 800, margin: '0 0 12px' }}>Захиалга амжилттай!</h2>
          <p style={{ color: 'var(--text2)', fontSize: 15, margin: '0 0 24px' }}>
            Захиалгын дугаар: <strong>#{(order.id || '').slice(-8).toUpperCase()}</strong>
          </p>
          {order.total_price && (
            <div style={{ fontSize: 28, fontWeight: 800, color: '#FF6B00', marginBottom: 24 }}>
              {fmt(order.total_price)}
            </div>
          )}

          {payMethod === 'qr' && (
            <div style={{ background: '#F0FDF4', border: '1px solid #86EFAC', borderRadius: 14, padding: 20, marginBottom: 24 }}>
              <div style={{ fontSize: 48, marginBottom: 8 }}>📱</div>
              <p style={{ fontWeight: 700, fontSize: 15, margin: '0 0 8px', color: '#166534' }}>QR кодоор төлөх</p>
              <p style={{ fontSize: 13, color: '#166534', margin: 0 }}>Та аппликейшнаараа QR код уншуулж төлнө үү</p>
            </div>
          )}

          {payMethod === 'bank' && (
            <div style={{ background: '#EFF6FF', border: '1px solid #93C5FD', borderRadius: 14, padding: 20, marginBottom: 24 }}>
              <p style={{ fontWeight: 700, margin: '0 0 8px', color: '#1E40AF' }}>🏦 Банк шилжүүлэг</p>
              <p style={{ fontSize: 13, color: '#1E40AF', margin: 0 }}>Дансны мэдээлэл имэйлд илгээгдлээ</p>
            </div>
          )}

          <div style={{ display: 'flex', gap: 12 }}>
            <button onClick={() => router.push('/dashboard/orders')} style={{
              flex: 1, padding: '14px', background: '#FF6B00', color: '#fff', border: 'none',
              borderRadius: 12, fontWeight: 700, fontSize: 14, cursor: 'pointer',
            }}>
              📦 Захиалга харах
            </button>
            <button onClick={() => router.push('/')} style={{
              flex: 1, padding: '14px', background: 'var(--surface2)', color: 'var(--text)',
              border: '1px solid var(--border)', borderRadius: 12, fontWeight: 600, fontSize: 14, cursor: 'pointer',
            }}>
              🏠 Нүүр хуудас
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div style={{ maxWidth: 700, margin: '0 auto', padding: '40px 24px', fontFamily: FONT }}>
      {/* Header */}
      <div style={{ marginBottom: 32 }}>
        <button onClick={() => router.back()} style={{ background: 'none', border: 'none', color: 'var(--text2)', fontSize: 14, cursor: 'pointer', marginBottom: 16, padding: 0 }}>
          ← Буцах
        </button>
        <h1 style={{ fontSize: 26, fontWeight: 800, margin: '0 0 8px' }}>🛍️ Захиалга өгөх</h1>

        {/* Steps */}
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          {['Мэдээлэл', 'Төлбөр', 'Баталгаажуулах'].map((s, i) => (
            <div key={s} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <div style={{
                width: 28, height: 28, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
                background: step > i + 1 ? '#059669' : step === i + 1 ? '#FF6B00' : 'var(--border)',
                color: step >= i + 1 ? '#fff' : 'var(--text2)', fontSize: 13, fontWeight: 700,
              }}>
                {step > i + 1 ? '✓' : i + 1}
              </div>
              <span style={{ fontSize: 13, color: step === i + 1 ? '#FF6B00' : 'var(--text2)', fontWeight: step === i + 1 ? 700 : 400 }}>{s}</span>
              {i < 2 && <span style={{ color: 'var(--border)' }}>→</span>}
            </div>
          ))}
        </div>
      </div>

      {/* Step 1 — Customer Info */}
      {step === 1 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 16, padding: 24 }}>
            <h3 style={{ margin: '0 0 20px', fontSize: 16, fontWeight: 700 }}>👤 Хэрэглэгчийн мэдээлэл</h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              <div>
                <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text2)', display: 'block', marginBottom: 6 }}>НЭР *</label>
                <input style={inp} placeholder="Овог нэр" value={form.customer_name} onChange={e => set('customer_name', e.target.value)} />
              </div>
              <div>
                <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text2)', display: 'block', marginBottom: 6 }}>УТАС *</label>
                <input style={inp} placeholder="9999-9999" value={form.customer_phone} onChange={e => set('customer_phone', e.target.value)} />
              </div>
              <div style={{ gridColumn: '1/-1' }}>
                <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text2)', display: 'block', marginBottom: 6 }}>ИМЭЙЛ</label>
                <input style={inp} placeholder="email@example.com" value={form.customer_email} onChange={e => set('customer_email', e.target.value)} />
              </div>
              <div style={{ gridColumn: '1/-1' }}>
                <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text2)', display: 'block', marginBottom: 6 }}>ХҮРГЭЛТИЙН ХАЯГ</label>
                <input style={inp} placeholder="Дүүрэг, Хороо, Байр, Орц..." value={form.delivery_address} onChange={e => set('delivery_address', e.target.value)} />
              </div>
            </div>
          </div>

          {!quoteId && (
            <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 16, padding: 24 }}>
              <h3 style={{ margin: '0 0 20px', fontSize: 16, fontWeight: 700 }}>🖨️ Захиалгын мэдээлэл</h3>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                <div style={{ gridColumn: '1/-1' }}>
                  <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text2)', display: 'block', marginBottom: 6 }}>БҮТЭЭГДЭХҮҮН</label>
                  <input style={inp} placeholder="Визит карт, Флаер, Баннер..." value={form.product_name} onChange={e => set('product_name', e.target.value)} />
                </div>
                <div>
                  <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text2)', display: 'block', marginBottom: 6 }}>ТОО ШИРХЭГ</label>
                  <input style={inp} type="number" min={1} value={form.quantity} onChange={e => set('quantity', Number(e.target.value))} />
                </div>
                <div>
                  <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text2)', display: 'block', marginBottom: 6 }}>НЭМЭЛТ ТАЙЛБАР</label>
                  <input style={inp} placeholder="2 тал, мат ламинат..." value={form.notes} onChange={e => set('notes', e.target.value)} />
                </div>
              </div>
            </div>
          )}

          {error && <div style={{ background: '#FEF2F2', border: '1px solid #FECACA', borderRadius: 10, padding: '12px 16px', color: '#DC2626', fontSize: 14 }}>⚠️ {error}</div>}

          <button onClick={() => setStep(2)} style={{
            padding: '16px', background: '#FF6B00', color: '#fff', border: 'none',
            borderRadius: 12, fontWeight: 700, fontSize: 16, cursor: 'pointer',
          }}>
            Үргэлжлүүлэх →
          </button>
        </div>
      )}

      {/* Step 2 — Payment */}
      {step === 2 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 16, padding: 24 }}>
            <h3 style={{ margin: '0 0 20px', fontSize: 16, fontWeight: 700 }}>💳 Төлбөрийн арга</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {PAYMENT_METHODS.map(m => (
                <div key={m.value} onClick={() => setPayMethod(m.value)} style={{
                  border: `2px solid ${payMethod === m.value ? '#FF6B00' : 'var(--border)'}`,
                  borderRadius: 12, padding: '16px 20px', cursor: 'pointer',
                  background: payMethod === m.value ? '#FFF7ED' : 'var(--surface2)',
                  display: 'flex', alignItems: 'center', gap: 16,
                }}>
                  <div style={{
                    width: 20, height: 20, borderRadius: '50%', border: `2px solid ${payMethod === m.value ? '#FF6B00' : 'var(--border2)'}`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                  }}>
                    {payMethod === m.value && <div style={{ width: 10, height: 10, borderRadius: '50%', background: '#FF6B00' }} />}
                  </div>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: 15 }}>{m.label}</div>
                    <div style={{ fontSize: 13, color: 'var(--text2)', marginTop: 2 }}>{m.desc}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Summary */}
          <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 16, padding: 24 }}>
            <h3 style={{ margin: '0 0 16px', fontSize: 16, fontWeight: 700 }}>📋 Захиалгын хураангуй</h3>
            <div style={{ fontSize: 14, display: 'flex', flexDirection: 'column', gap: 8 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text2)' }}>Нэр:</span>
                <span style={{ fontWeight: 600 }}>{form.customer_name || '—'}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text2)' }}>Утас:</span>
                <span style={{ fontWeight: 600 }}>{form.customer_phone || '—'}</span>
              </div>
              {form.product_name && (
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--text2)' }}>Бүтээгдэхүүн:</span>
                  <span style={{ fontWeight: 600 }}>{form.product_name}</span>
                </div>
              )}
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text2)' }}>Тоо:</span>
                <span style={{ fontWeight: 600 }}>{form.quantity} ш</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text2)' }}>Төлбөр:</span>
                <span style={{ fontWeight: 600 }}>{PAYMENT_METHODS.find(m => m.value === payMethod)?.label}</span>
              </div>
            </div>
          </div>

          {error && <div style={{ background: '#FEF2F2', border: '1px solid #FECACA', borderRadius: 10, padding: '12px 16px', color: '#DC2626', fontSize: 14 }}>⚠️ {error}</div>}

          <div style={{ display: 'flex', gap: 12 }}>
            <button onClick={() => setStep(1)} style={{
              flex: 1, padding: '14px', background: 'var(--surface2)', color: 'var(--text)',
              border: '1px solid var(--border)', borderRadius: 12, fontWeight: 600, fontSize: 14, cursor: 'pointer',
            }}>← Буцах</button>
            <button onClick={submitOrder} disabled={saving} style={{
              flex: 2, padding: '14px', background: saving ? '#ccc' : '#FF6B00', color: '#fff',
              border: 'none', borderRadius: 12, fontWeight: 700, fontSize: 16, cursor: saving ? 'default' : 'pointer',
            }}>
              {saving ? '⏳ Илгээж байна...' : '✅ Захиалга баталгаажуулах'}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

export default function CheckoutPage() {
  return (
    <Suspense fallback={<div style={{ padding: 40, fontFamily: FONT, textAlign: 'center' }}>Уншиж байна...</div>}>
      <CheckoutInner />
    </Suspense>
  )
}
