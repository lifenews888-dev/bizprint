'use client'
import { apiFetch } from '@/lib/api'
import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import EmptyState from '@/components/ui/EmptyState'

const F = "'DM Sans','Segoe UI',system-ui,sans-serif"
const fmt = (n: number) => new Intl.NumberFormat('mn-MN').format(Math.round(n)) + '₮'

type Step = 'cart' | 'quote' | 'payment' | 'confirmed'

const PAYMENT_METHODS = [
  { value: 'bank', label: '🏦 Банк шилжүүлэг', desc: 'ХХБ дансаар шилжүүлэх' },
  { value: 'qr', label: '📱 QR Код', desc: 'QR уншуулж төлөх' },
  { value: 'cash', label: '💵 Бэлэн мөнгө', desc: 'Хүргэлтийн үед төлөх' },
]

export default function CartPage() {
  const router = useRouter()
  const [cart, setCart] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [removing, setRemoving] = useState<string | null>(null)
  const [step, setStep] = useState<Step>('cart')
  const [quotation, setQuotation] = useState<any>(null)
  const [quoting, setQuoting] = useState(false)
  const [confirming, setConfirming] = useState(false)
  const [error, setError] = useState('')
  const [payMethod, setPayMethod] = useState('bank')
  const [order, setOrder] = useState<any>(null)
  const [paymentData, setPaymentData] = useState<any>(null)
  const [paymentStatus, setPaymentStatus] = useState('pending')
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null)

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
          setTimeout(() => setStep('confirmed'), 1500)
        }
      } catch {}
    }, 5000)
  }

  const loadCart = async () => {
    try {
      const d = await apiFetch<any>('/cart')
      setCart(d)
    } catch { setCart(null) }
    setLoading(false)
  }

  useEffect(() => { loadCart() }, [])

  const removeItem = async (itemId: string) => {
    setRemoving(itemId)
    try {
      await apiFetch<any>(`/cart/items/${itemId}`, { method: 'DELETE' })
      await loadCart()
    } catch {}
    setRemoving(null)
  }

  const handleQuote = async () => {
    setQuoting(true); setError('')
    try {
      const q = await apiFetch<any>('/cart/quote', { method: 'POST' })
      setQuotation(q)
      setStep('quote')
    } catch (e: any) {
      setError(e.message || 'Үнийн санал авахад алдаа гарлаа')
    }
    setQuoting(false)
  }

  const handleConfirm = async () => {
    if (!quotation) return
    setConfirming(true); setError('')
    try {
      const orderData = await apiFetch<any>('/cart/quote/confirm', {
        method: 'POST',
        body: { quotation_id: quotation.id, payment_method: payMethod },
      })
      const o = orderData?.data || orderData
      setOrder(o)

      // Create payment
      if (o?.id && (o?.total_price || quotation.total_price)) {
        try {
          const payRes = await apiFetch<any>('/payment/create', {
            method: 'POST',
            body: {
              orderId: o.id,
              amount: Number(o.total_price || quotation.total_price),
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

      setStep('payment')
    } catch (e: any) {
      setError(e.message || 'Захиалга үүсгэхэд алдаа гарлаа')
    }
    setConfirming(false)
  }

  const items: any[] = cart?.items || []
  const total = items.reduce((s: number, i: any) => s + (Number(i.unit_price || 0) * (i.quantity || 1)), 0)

  const stepLabels = [
    { key: 'cart', label: '1. Сагс', icon: '🛒' },
    { key: 'quote', label: '2. Үнийн санал', icon: '📋' },
    { key: 'payment', label: '3. Төлбөр', icon: '💳' },
    { key: 'confirmed', label: '4. Баталгаа', icon: '✅' },
  ]
  const stepIdx = stepLabels.findIndex(s => s.key === step)

  return (
    <div style={{ maxWidth: 900, margin: '0 auto', padding: '32px 24px', fontFamily: F }}>
      {/* Stepper */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 0, marginBottom: 32 }}>
        {stepLabels.map((s, i) => (
          <div key={s.key} style={{ display: 'flex', alignItems: 'center' }}>
            <div style={{
              display: 'flex', alignItems: 'center', gap: 6, padding: '8px 16px',
              borderRadius: 999,
              background: i <= stepIdx ? '#FFF3EC' : 'transparent',
              border: i === stepIdx ? '2px solid #FF6B00' : '2px solid transparent',
            }}>
              <span>{i < stepIdx ? '✓' : s.icon}</span>
              <span style={{ fontSize: 13, fontWeight: i === stepIdx ? 700 : 500, color: i <= stepIdx ? '#FF6B00' : '#999' }}>
                {s.label}
              </span>
            </div>
            {i < stepLabels.length - 1 && (
              <div style={{ width: 40, height: 2, background: i < stepIdx ? '#FF6B00' : '#E5E7EB' }} />
            )}
          </div>
        ))}
      </div>

      {error && (
        <div style={{ background: '#FEF2F2', border: '1px solid #FECACA', borderRadius: 12, padding: '12px 16px', marginBottom: 20, color: '#DC2626', fontSize: 14 }}>
          {error}
        </div>
      )}

      {/* STEP: Confirmed */}
      {step === 'confirmed' && (
        <div style={{ textAlign: 'center', padding: '60px 20px' }}>
          <div style={{ fontSize: 64, marginBottom: 16 }}>✅</div>
          <h2 style={{ fontSize: 24, fontWeight: 800, margin: '0 0 12px' }}>Төлбөр баталгаажлаа!</h2>
          <p style={{ color: '#888', marginBottom: 24 }}>Таны захиалга үйлдвэрт шилжинэ.</p>
          <div style={{ display: 'flex', gap: 12, justifyContent: 'center' }}>
            <button onClick={() => router.push('/dashboard/orders')} style={{
              padding: '14px 28px', background: '#FF6B00', color: '#fff', border: 'none',
              borderRadius: 12, fontWeight: 700, fontSize: 14, cursor: 'pointer',
            }}>📦 Захиалга харах</button>
            <button onClick={() => router.push('/')} style={{
              padding: '14px 28px', background: 'var(--surface2, #f5f5f0)', color: 'var(--text, #333)',
              border: '1px solid var(--border, #ddd)', borderRadius: 12, fontWeight: 600, fontSize: 14, cursor: 'pointer',
            }}>🏠 Нүүр хуудас</button>
          </div>
        </div>
      )}

      {/* STEP: Payment */}
      {step === 'payment' && (
        <div style={{ maxWidth: 560, margin: '0 auto' }}>
          <div style={{ background: 'var(--surface, #fff)', border: '1px solid var(--border, #E5E7EB)', borderRadius: 20, padding: 32 }}>
            <div style={{ textAlign: 'center', marginBottom: 24 }}>
              <div style={{ fontSize: 48, marginBottom: 12 }}>🎉</div>
              <h2 style={{ fontSize: 22, fontWeight: 800, margin: '0 0 8px' }}>Захиалга үүслээ!</h2>
              <p style={{ color: '#888', fontSize: 14, margin: 0 }}>
                Дугаар: <strong>#{(order?.id || '').slice(-8).toUpperCase()}</strong>
              </p>
            </div>

            <div style={{ textAlign: 'center', fontSize: 32, fontWeight: 800, color: '#FF6B00', marginBottom: 24 }}>
              {fmt(order?.total_price || quotation?.total_price || 0)}
            </div>

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
                    <span style={{ fontWeight: 800, color: '#1E3A5F' }}>{fmt(paymentData.amount || order?.total_price)}</span>
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

            {/* QR */}
            {payMethod === 'qr' && paymentData && (
              <div style={{ background: '#F0FDF4', border: '1px solid #86EFAC', borderRadius: 14, padding: 20, marginBottom: 20, textAlign: 'center' }}>
                <p style={{ fontWeight: 700, fontSize: 15, margin: '0 0 12px', color: '#166534' }}>📱 QR кодоор төлөх</p>
                {paymentData.qrImage ? (
                  <img src={`data:image/png;base64,${paymentData.qrImage}`} alt="QR" style={{ width: 200, height: 200, margin: '0 auto 12px', display: 'block', borderRadius: 8 }} />
                ) : (
                  <p style={{ fontSize: 13, color: '#166534' }}>QR код үүсгэгдэж байна...</p>
                )}
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
                      setTimeout(() => setStep('confirmed'), 1500)
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
                flex: 1, padding: '14px', background: 'var(--surface2, #f5f5f0)', color: 'var(--text, #333)',
                border: '1px solid var(--border, #ddd)', borderRadius: 12, fontWeight: 600, fontSize: 14, cursor: 'pointer',
              }}>🏠 Нүүр хуудас</button>
            </div>
          </div>
          <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        </div>
      )}

      {/* STEP: Quote review */}
      {step === 'quote' && quotation && (
        <div>
          <h2 style={{ fontSize: 22, fontWeight: 800, marginBottom: 20 }}>Үнийн санал #{quotation.quote_number}</h2>
          <div style={{ background: 'var(--surface, #fff)', border: '1px solid var(--border, #E5E7EB)', borderRadius: 16, padding: 24, marginBottom: 20 }}>
            {(quotation.items || []).map((qi: any, i: number) => (
              <div key={qi.id || i} style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0', borderBottom: i < (quotation.items?.length || 0) - 1 ? '1px solid var(--border, #eee)' : 'none' }}>
                <div>
                  <div style={{ fontWeight: 600, fontSize: 14 }}>{qi.product_id?.slice(0, 8) || 'Бараа'}</div>
                  <div style={{ fontSize: 12, color: '#888' }}>{qi.quantity} ширхэг</div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: 14, fontWeight: 700, color: '#FF6B00' }}>{fmt(qi.customer_price * qi.quantity)}</div>
                  <div style={{ fontSize: 11, color: '#888' }}>{fmt(qi.customer_price)}/ш</div>
                </div>
              </div>
            ))}
            <div style={{ display: 'flex', justifyContent: 'space-between', paddingTop: 16, marginTop: 8, borderTop: '2px solid var(--border, #eee)' }}>
              <span style={{ fontSize: 16, fontWeight: 700 }}>Нийт:</span>
              <span style={{ fontSize: 20, fontWeight: 800, color: '#FF6B00' }}>{fmt(quotation.total_price)}</span>
            </div>
          </div>

          {/* Payment method */}
          <div style={{ background: 'var(--surface, #fff)', border: '1px solid var(--border, #E5E7EB)', borderRadius: 16, padding: 24, marginBottom: 20 }}>
            <h3 style={{ margin: '0 0 16px', fontSize: 16, fontWeight: 700 }}>💳 Төлбөрийн арга</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {PAYMENT_METHODS.map(m => (
                <div key={m.value} onClick={() => setPayMethod(m.value)} style={{
                  border: `2px solid ${payMethod === m.value ? '#FF6B00' : 'var(--border, #E5E7EB)'}`,
                  borderRadius: 12, padding: '14px 18px', cursor: 'pointer',
                  background: payMethod === m.value ? '#FFF7ED' : 'var(--surface2, #f9f9f7)',
                  display: 'flex', alignItems: 'center', gap: 14,
                }}>
                  <div style={{
                    width: 18, height: 18, borderRadius: '50%',
                    border: `2px solid ${payMethod === m.value ? '#FF6B00' : '#ccc'}`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                  }}>
                    {payMethod === m.value && <div style={{ width: 10, height: 10, borderRadius: '50%', background: '#FF6B00' }} />}
                  </div>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: 14 }}>{m.label}</div>
                    <div style={{ fontSize: 12, color: '#888', marginTop: 2 }}>{m.desc}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div style={{ display: 'flex', gap: 12 }}>
            <button onClick={() => setStep('cart')} style={{
              flex: 1, padding: '14px', background: 'transparent', border: '1px solid var(--border, #ddd)',
              borderRadius: 12, fontWeight: 600, fontSize: 14, cursor: 'pointer', fontFamily: F,
            }}>
              ← Сагс руу буцах
            </button>
            <button onClick={handleConfirm} disabled={confirming} style={{
              flex: 2, padding: '14px', background: '#FF6B00', color: '#fff', border: 'none',
              borderRadius: 12, fontWeight: 700, fontSize: 15, cursor: 'pointer', fontFamily: F,
              opacity: confirming ? 0.7 : 1,
            }}>
              {confirming ? '⏳ Захиалга үүсгэж байна...' : '✅ Захиалга батлах & Төлбөр хийх'}
            </button>
          </div>
        </div>
      )}

      {/* STEP: Cart */}
      {step === 'cart' && (
        loading ? (
          <div style={{ textAlign: 'center', padding: '60px 0', color: '#888' }}>Уншиж байна...</div>
        ) : items.length === 0 ? (
          <EmptyState
            icon="🛒"
            title="Сагс хоосон байна"
            message="Бүтээгдэхүүн сонгож сагсанд нэмнэ үү"
            ctaText="Дэлгүүр үзэх"
            ctaHref="/shop"
          />
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 300px', gap: 24, alignItems: 'start' }}>
            {/* Items */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {items.map((item: any) => (
                <div key={item.id} style={{ background: 'var(--surface, #fff)', border: '1px solid var(--border, #E5E7EB)', borderRadius: 14, padding: 18 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 4 }}>
                        {item.product_name || item.product_id?.slice(0, 8) || 'Бараа'}
                      </div>
                      <div style={{ fontSize: 13, color: '#888', display: 'flex', flexWrap: 'wrap', gap: '4px 14px' }}>
                        <span>{item.quantity} ширхэг</span>
                        {item.specs?.paper_gsm && <span>{item.specs.paper_gsm}gsm</span>}
                        {item.specs?.color_mode && <span>{item.specs.color_mode === 'color' ? 'Өнгөт' : 'Хар цагаан'}</span>}
                      </div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      {item.unit_price && (
                        <div style={{ fontSize: 16, fontWeight: 800, color: '#FF6B00' }}>{fmt(item.unit_price * item.quantity)}</div>
                      )}
                    </div>
                  </div>
                  <div style={{ marginTop: 12, display: 'flex', justifyContent: 'flex-end' }}>
                    <button onClick={() => removeItem(item.id)} disabled={removing === item.id} style={{
                      background: 'none', border: '1px solid #FECACA', borderRadius: 8,
                      color: '#DC2626', fontSize: 12, cursor: 'pointer', padding: '5px 12px',
                    }}>
                      {removing === item.id ? '...' : 'Устгах'}
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Summary */}
            <div style={{ background: 'var(--surface, #fff)', border: '1px solid var(--border, #E5E7EB)', borderRadius: 14, padding: 20, position: 'sticky', top: 20 }}>
              <h3 style={{ margin: '0 0 16px', fontSize: 16, fontWeight: 700 }}>Нийт дүн</h3>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 14, marginBottom: 8 }}>
                <span style={{ color: '#888' }}>Барааны тоо:</span>
                <span>{items.length}</span>
              </div>
              <div style={{ height: 1, background: 'var(--border, #eee)', margin: '12px 0' }} />
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 18, fontWeight: 800, marginBottom: 20 }}>
                <span>Нийт:</span>
                <span style={{ color: '#FF6B00' }}>{fmt(total)}</span>
              </div>
              <button onClick={handleQuote} disabled={quoting} style={{
                width: '100%', padding: '14px', background: '#FF6B00', color: '#fff',
                border: 'none', borderRadius: 12, fontWeight: 700, fontSize: 15,
                cursor: 'pointer', fontFamily: F, opacity: quoting ? 0.7 : 1, marginBottom: 10,
              }}>
                {quoting ? '⏳ Тооцоолж байна...' : 'Үнийн санал авах'}
              </button>
              <button onClick={() => router.push('/shop')} style={{
                width: '100%', padding: '12px', background: 'transparent', color: '#888',
                border: '1px solid var(--border, #ddd)', borderRadius: 12, fontWeight: 600,
                fontSize: 13, cursor: 'pointer', fontFamily: F,
              }}>
                Дэлгүүр үргэлжлүүлэх
              </button>
            </div>
          </div>
        )
      )}
    </div>
  )
}
