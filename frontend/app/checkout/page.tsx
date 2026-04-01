'use client'
import { apiFetch } from '@/lib/api'
import { useState, useEffect, useRef } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Suspense } from 'react'
import { useStore } from '@/lib/store'

const FONT = "'DM Sans','Segoe UI',system-ui,sans-serif"
const fmt = (n: number) => new Intl.NumberFormat('mn-MN').format(Math.round(n)) + '₮'

const inp: React.CSSProperties = {
  width: '100%', padding: '12px 16px', border: '1px solid var(--border)',
  borderRadius: 10, background: 'var(--surface2)', color: 'var(--text)',
  fontSize: 14, boxSizing: 'border-box', fontFamily: FONT, outline: 'none',
}

const PAYMENT_METHODS = [
  { value: 'qr', label: '📱 QR Код (Онлайн)', desc: 'QPay/SocialPay уншуулж төлөх' },
  { value: 'bank', label: '🏦 Банк шилжүүлэг', desc: 'ХХБ дансаар шилжүүлэх' },
  { value: 'invoice', label: '📄 Нэхэмжлэх (Invoice)', desc: 'Байгууллагын нэр дээр нэхэмжлэх' },
  { value: 'cash', label: '💵 Бэлэн мөнгө', desc: 'Хүргэлтийн үед төлөх' },
]

function CheckoutInner() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const quoteId = searchParams.get('quote_id')
  const source = searchParams.get('source') // 'subscription' | 'addon' | 'product' | null
  const planId = searchParams.get('plan_id')
  const billingCycle = (searchParams.get('billing_cycle') || 'monthly') as 'monthly' | 'yearly'
  const addonId = searchParams.get('addon_id')
  const productPricingId = searchParams.get('product_pricing_id')

  const isDigitalPurchase = !!source
  const store = useStore()

  const [step, setStep] = useState(1) // 1=form, 2=payment method, 3=pay, 4=done
  const [form, setForm] = useState({
    customer_name: '', customer_phone: '', customer_email: '',
    product_name: '', quantity: 100, notes: '', delivery_address: '',
  })
  const [payMethod, setPayMethod] = useState('bank')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [order, setOrder] = useState<any>(null)
  const [paymentData, setPaymentData] = useState<any>(null)
  const [paymentStatus, setPaymentStatus] = useState<string>('pending')
  const [digitalInfo, setDigitalInfo] = useState<any>(null) // plan/addon/product info
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null)

  // Pre-fill from localStorage user + search params
  useEffect(() => {
    try {
      const u = JSON.parse(localStorage.getItem('user') || '{}')
      setForm(f => ({
        ...f,
        customer_name: u.full_name || u.name || u.username || '',
        customer_email: u.email || '',
        customer_phone: u.phone || '',
        product_name: searchParams.get('product_name') || f.product_name,
        quantity: Number(searchParams.get('quantity')) || f.quantity,
        notes: searchParams.get('note') || f.notes,
      }))
    } catch {}

    // Load digital purchase info
    if (source === 'subscription' && planId) {
      apiFetch<any>('/subscription/plans').then((plans: any[]) => {
        const plan = plans?.find((p: any) => p.id === planId)
        if (plan) setDigitalInfo({ type: 'subscription', plan, price: billingCycle === 'yearly' ? plan.price_yearly : plan.price_monthly })
      }).catch(() => {})
    } else if (source === 'addon' && addonId) {
      apiFetch<any>('/subscription/addons').then((addons: any[]) => {
        const addon = addons?.find((a: any) => a.id === addonId)
        if (addon) setDigitalInfo({ type: 'addon', addon, price: addon.price })
      }).catch(() => {})
    } else if (source === 'product' && productPricingId) {
      apiFetch<any>('/subscription/product-pricing').then((products: any[]) => {
        const product = products?.find((p: any) => p.id === productPricingId)
        if (product) setDigitalInfo({ type: 'product', product, price: product.price })
      }).catch(() => {})
    }
  }, [])

  // Poll payment status
  useEffect(() => {
    return () => { if (pollRef.current) clearInterval(pollRef.current) }
  }, [])

  const startPolling = (invoiceCode: string) => {
    if (pollRef.current) clearInterval(pollRef.current)
    pollRef.current = setInterval(async () => {
      try {
        const res = await apiFetch<any>(`/payment/status/${invoiceCode}`)
        if (res?.status === 'paid' || res?.status === 1 || res?.status === 'PAID') {
          setPaymentStatus('paid')
          if (pollRef.current) clearInterval(pollRef.current)
          onOrderSuccess()
        }
      } catch {}
    }, 5000)
  }

  const set = (k: string, v: any) => setForm(f => ({ ...f, [k]: v }))

  const submitOrder = async () => {
    if (!form.customer_name || !form.customer_phone) {
      setError('Нэр, утасны дугаараа оруулна уу'); return
    }
    setSaving(true); setError('')
    try {
      // ── Digital purchases (subscription/addon/product) ──
      if (isDigitalPurchase && digitalInfo) {
        let result: any
        if (source === 'subscription' && planId) {
          result = await apiFetch<any>('/subscription/subscribe', {
            method: 'POST',
            body: { plan_id: planId, billing_cycle: billingCycle },
          })
        } else if (source === 'addon' && addonId) {
          result = await apiFetch<any>('/subscription/addons/purchase', {
            method: 'POST',
            body: { addon_id: addonId },
          })
        } else if (source === 'product' && productPricingId) {
          // Product pricing — create as subscription or one-time purchase
          result = await apiFetch<any>('/subscription/subscribe', {
            method: 'POST',
            body: { plan_id: productPricingId, billing_cycle: 'monthly' },
          })
        }
        setOrder({
          id: result?.id || 'digital',
          total_price: digitalInfo.price,
          ...result,
        })
        setStep(3)
        // For digital: skip payment flow, mark as success directly
        setTimeout(() => onOrderSuccess(), 1500)
        return
      }

      // ── Regular order / quote flow ──
      let data
      if (quoteId) {
        data = await apiFetch<any>('/cart/quote/confirm', {
          method: 'POST',
          body: { quotation_id: quoteId, payment_method: payMethod },
        })
      } else {
        data = await apiFetch<any>('/orders', {
          method: 'POST',
          body: { ...form, payment_method: payMethod },
        })
      }
      const orderData = data?.data || data
      setOrder(orderData)

      // Create payment
      if (orderData?.id && orderData?.total_price) {
        try {
          const payRes = await apiFetch<any>('/payment/create', {
            method: 'POST',
            body: {
              orderId: orderData.id,
              amount: Number(orderData.total_price),
              method: payMethod,
            },
          })
          setPaymentData(payRes)

          const invoiceCode = payRes?.invoice_code || payRes?.invoiceNo
          if (invoiceCode && payMethod !== 'cash') {
            startPolling(invoiceCode)
          }
        } catch (e) {
          console.log('Payment creation note:', (e as any).message)
        }
      }

      setStep(3)
    } catch (e: any) {
      setError(e.message)
    } finally {
      setSaving(false)
    }
  }

  // Clear cart on successful order
  const onOrderSuccess = () => {
    store.clearCart()
    onOrderSuccess()
  }

  // Step 4 — Payment confirmed
  if (step === 4) {
    return (
      <div style={{ maxWidth: 560, margin: '80px auto', padding: '0 24px', textAlign: 'center', fontFamily: FONT }}>
        <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 20, padding: 40 }}>
          <div style={{ fontSize: 64, marginBottom: 20 }}>✅</div>
          <h2 style={{ fontSize: 24, fontWeight: 800, margin: '0 0 12px' }}>
            {isDigitalPurchase ? 'Амжилттай идэвхжлээ!' : 'Төлбөр амжилттай!'}
          </h2>
          <p style={{ color: 'var(--text2)', fontSize: 15, margin: '0 0 24px' }}>
            {isDigitalPurchase
              ? 'Таны дижитал үйлчилгээ идэвхжлээ. Dashboard-аас ашиглах боломжтой.'
              : 'Таны захиалга баталгаажлаа. Удахгүй үйлдвэрт шилжинэ.'}
          </p>
          <div style={{ display: 'flex', gap: 12 }}>
            <button onClick={() => router.push(isDigitalPurchase ? '/dashboard/customer/subscription' : '/dashboard/orders')} style={{
              flex: 1, padding: '14px', background: '#FF6B00', color: '#fff', border: 'none',
              borderRadius: 12, fontWeight: 700, fontSize: 14, cursor: 'pointer',
            }}>{isDigitalPurchase ? '💎 Эрх & Багц' : '📦 Захиалга харах'}</button>
            <button onClick={() => router.push('/')} style={{
              flex: 1, padding: '14px', background: 'var(--surface2)', color: 'var(--text)',
              border: '1px solid var(--border)', borderRadius: 12, fontWeight: 600, fontSize: 14, cursor: 'pointer',
            }}>🏠 Нүүр хуудас</button>
          </div>
        </div>
      </div>
    )
  }

  // Step 3 — Show payment details
  if (step === 3 && order) {
    return (
      <div style={{ maxWidth: 560, margin: '60px auto', padding: '0 24px', fontFamily: FONT }}>
        <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 20, padding: 32 }}>
          <div style={{ textAlign: 'center', marginBottom: 24 }}>
            <div style={{ fontSize: 48, marginBottom: 12 }}>🎉</div>
            <h2 style={{ fontSize: 22, fontWeight: 800, margin: '0 0 8px' }}>Захиалга үүслээ!</h2>
            <p style={{ color: 'var(--text2)', fontSize: 14, margin: 0 }}>
              Дугаар: <strong>#{(order.id || '').slice(-8).toUpperCase()}</strong>
            </p>
          </div>

          {order.total_price && (
            <div style={{ textAlign: 'center', fontSize: 32, fontWeight: 800, color: '#FF6B00', marginBottom: 24 }}>
              {fmt(order.total_price)}
            </div>
          )}

          {/* Bank transfer details */}
          {payMethod === 'bank' && paymentData && (
            <div style={{ background: '#EFF6FF', border: '1px solid #BFDBFE', borderRadius: 14, padding: 20, marginBottom: 20 }}>
              <p style={{ fontWeight: 700, fontSize: 15, margin: '0 0 14px', color: '#1E40AF' }}>🏦 Банк шилжүүлгийн мэдээлэл</p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10, fontSize: 14 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: '#3B82F6' }}>Банк:</span>
                  <span style={{ fontWeight: 600, color: '#1E3A5F' }}>{paymentData.bank || 'ХХБ'}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: '#3B82F6' }}>IBAN:</span>
                  <span style={{ fontWeight: 600, color: '#1E3A5F' }}>{paymentData.iban || '—'}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: '#3B82F6' }}>Данс:</span>
                  <span style={{ fontWeight: 700, color: '#1E3A5F', letterSpacing: 1 }}>{paymentData.accountNumber || '—'}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: '#3B82F6' }}>Нэр:</span>
                  <span style={{ fontWeight: 600, color: '#1E3A5F' }}>{paymentData.accountName || '—'}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: '#3B82F6' }}>Дүн:</span>
                  <span style={{ fontWeight: 800, color: '#1E3A5F' }}>{fmt(paymentData.amount || order.total_price)}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', background: '#DBEAFE', borderRadius: 8, padding: '8px 12px' }}>
                  <span style={{ color: '#3B82F6' }}>Гүйлгээний утга:</span>
                  <span style={{ fontWeight: 800, color: '#1E40AF' }}>{paymentData.description || paymentData.invoice_code}</span>
                </div>
              </div>
              <p style={{ fontSize: 12, color: '#3B82F6', marginTop: 12, marginBottom: 0 }}>
                ⚠️ Гүйлгээний утга дээр дээрх кодыг заавал бичнэ үү!
              </p>
            </div>
          )}

          {/* QR code */}
          {payMethod === 'qr' && paymentData && (
            <div style={{ background: '#F0FDF4', border: '1px solid #86EFAC', borderRadius: 14, padding: 20, marginBottom: 20, textAlign: 'center' }}>
              <p style={{ fontWeight: 700, fontSize: 15, margin: '0 0 12px', color: '#166534' }}>📱 QR кодоор төлөх</p>
              {paymentData.qrImage ? (
                <img src={`data:image/png;base64,${paymentData.qrImage}`} alt="QR" style={{ width: 200, height: 200, margin: '0 auto 12px', display: 'block', borderRadius: 8 }} />
              ) : (
                <p style={{ fontSize: 13, color: '#166534' }}>QR код үүсгэгдэж байна...</p>
              )}
              <p style={{ fontSize: 12, color: '#15803D', margin: 0 }}>Банкны аппаар QR код уншуулна уу</p>
            </div>
          )}

          {/* Cash */}
          {payMethod === 'cash' && (
            <div style={{ background: '#FFFBEB', border: '1px solid #FDE68A', borderRadius: 14, padding: 20, marginBottom: 20 }}>
              <p style={{ fontWeight: 700, fontSize: 15, margin: '0 0 8px', color: '#92400E' }}>💵 Бэлэн төлбөр</p>
              <p style={{ fontSize: 13, color: '#92400E', margin: '0 0 16px' }}>Хүргэлтийн үед бэлэн мөнгөөр төлнө</p>
              {paymentStatus !== 'paid' && paymentData?.invoice_code && (
                <button onClick={async () => {
                  try {
                    await apiFetch<any>(`/payment/confirm/${paymentData.invoice_code}`, { method: 'POST' })
                    setPaymentStatus('paid')
                    setTimeout(() => onOrderSuccess(), 1500)
                  } catch (e: any) { alert(e.message) }
                }} style={{
                  width: '100%', padding: '14px', background: '#059669', color: '#fff', border: 'none',
                  borderRadius: 12, fontWeight: 700, fontSize: 14, cursor: 'pointer',
                }}>
                  ✅ Бэлэн мөнгө төлсөн — Баталгаажуулах
                </button>
              )}
            </div>
          )}

          {/* Payment status */}
          {payMethod !== 'cash' && (
            <div style={{
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
              padding: '12px', borderRadius: 10,
              background: paymentStatus === 'paid' ? '#DCFCE7' : '#FEF9C3',
              marginBottom: 20,
            }}>
              {paymentStatus === 'paid' ? (
                <span style={{ fontSize: 14, color: '#166534', fontWeight: 600 }}>✅ Төлбөр баталгаажсан</span>
              ) : (
                <>
                  <div style={{ width: 16, height: 16, border: '2px solid #F59E0B', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
                  <span style={{ fontSize: 14, color: '#92400E', fontWeight: 600 }}>Төлбөр хүлээж байна...</span>
                </>
              )}
            </div>
          )}

          <div style={{ display: 'flex', gap: 12 }}>
            <button onClick={() => router.push('/dashboard/orders')} style={{
              flex: 1, padding: '14px', background: '#FF6B00', color: '#fff', border: 'none',
              borderRadius: 12, fontWeight: 700, fontSize: 14, cursor: 'pointer',
            }}>📦 Захиалга харах</button>
            <button onClick={() => router.push('/')} style={{
              flex: 1, padding: '14px', background: 'var(--surface2)', color: 'var(--text)',
              border: '1px solid var(--border)', borderRadius: 12, fontWeight: 600, fontSize: 14, cursor: 'pointer',
            }}>🏠 Нүүр хуудас</button>
          </div>
        </div>

        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
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
        <h1 style={{ fontSize: 26, fontWeight: 800, margin: '0 0 8px' }}>
          {isDigitalPurchase ? '💎 Дижитал үйлчилгээ авах' : '🛍️ Захиалга өгөх'}
        </h1>

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

          {/* Digital purchase summary */}
          {isDigitalPurchase && digitalInfo && (
            <div style={{ background: '#FFF7ED', border: '1px solid #FDBA74', borderRadius: 16, padding: 24 }}>
              <h3 style={{ margin: '0 0 16px', fontSize: 16, fontWeight: 700 }}>
                {digitalInfo.type === 'subscription' ? '💎 Багц' : digitalInfo.type === 'addon' ? '🧩 Нэмэлт эрх' : '📦 Дижитал бүтээгдэхүүн'}
              </h3>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--text)' }}>
                    {digitalInfo.plan?.name || digitalInfo.addon?.name || digitalInfo.product?.name}
                  </div>
                  <div style={{ fontSize: 13, color: 'var(--text2)', marginTop: 4 }}>
                    {digitalInfo.plan?.description || digitalInfo.addon?.description || digitalInfo.product?.description}
                  </div>
                  {digitalInfo.type === 'subscription' && (
                    <div style={{ fontSize: 12, color: '#FF6B00', marginTop: 4, fontWeight: 600 }}>
                      {billingCycle === 'yearly' ? 'Жилийн төлбөр' : 'Сарын төлбөр'}
                    </div>
                  )}
                </div>
                <div style={{ fontSize: 24, fontWeight: 800, color: '#FF6B00' }}>
                  {digitalInfo.price === 0 ? 'Үнэгүй' : fmt(digitalInfo.price)}
                </div>
              </div>
            </div>
          )}

          {/* Physical order form */}
          {!quoteId && !isDigitalPurchase && (
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

          <button onClick={() => isDigitalPurchase ? setStep(2) : setStep(2)} style={{
            padding: '16px', background: '#FF6B00', color: '#fff', border: 'none',
            borderRadius: 12, fontWeight: 700, fontSize: 16, cursor: 'pointer',
          }}>
            Үргэлжлүүлэх →
          </button>
        </div>
      )}

      {/* Step 2 — Payment method / Confirm */}
      {step === 2 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          {!isDigitalPurchase && (
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
          )}

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
              {isDigitalPurchase && digitalInfo ? (
                <>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: 'var(--text2)' }}>Үйлчилгээ:</span>
                    <span style={{ fontWeight: 600 }}>{digitalInfo.plan?.name || digitalInfo.addon?.name || digitalInfo.product?.name}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px solid var(--border)', paddingTop: 8, marginTop: 4 }}>
                    <span style={{ fontWeight: 700 }}>Нийт:</span>
                    <span style={{ fontWeight: 800, color: '#FF6B00', fontSize: 18 }}>{digitalInfo.price === 0 ? 'Үнэгүй' : fmt(digitalInfo.price)}</span>
                  </div>
                </>
              ) : (
                <>
                  {form.product_name && (
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ color: 'var(--text2)' }}>Бүтээгдэхүүн:</span>
                      <span style={{ fontWeight: 600 }}>{form.product_name}</span>
                    </div>
                  )}
                </>
              )}
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text2)' }}>Төлбөр:</span>
                <span style={{ fontWeight: 600 }}>{isDigitalPurchase ? '💳 Дижитал' : PAYMENT_METHODS.find(m => m.value === payMethod)?.label}</span>
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
              {saving ? '⏳ Илгээж байна...' : isDigitalPurchase ? '✅ Идэвхжүүлэх' : '✅ Захиалга баталгаажуулах'}
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
