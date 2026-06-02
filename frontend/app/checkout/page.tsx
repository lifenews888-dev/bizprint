'use client'
import { apiFetch, getToken } from '@/lib/api'
import { useState, useEffect, useRef } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Suspense } from 'react'
import { useStore } from '@/lib/store'
import { getCartPricingAudit, getCartPricingAuditSummaryMessage, summarizeCartPricingAudit } from '@/lib/cart-pricing-audit'
import { CLIENT_PRICING_SNAPSHOT_VERSION, PRICING_CONTRACT_VERSION } from '@/lib/pricing/snapshot'

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

type CheckoutCartItem = {
  id: string
  productId?: string
  product_id?: string
  name: string
  price: number
  qty: number
  quantity?: number
  unit_price?: number
  total_price?: number
  image?: string
  specs?: Record<string, unknown>
}

type CheckoutCartResponse = {
  items?: CheckoutCartItem[]
  total?: number
  total_price?: number
  subtotal_excl_vat?: number
  vat?: number
  vat_rate?: number
  vat_included?: boolean
  pricing_audit?: CartPricingAuditSummary
}

type CartPricingAuditSummary = {
  total_items?: number
  accepted_count?: number
  adjusted_count?: number
  missing_count?: number
  dynamic_count?: number
  catalog_count?: number
  has_adjustments?: boolean
  all_priced?: boolean
}

type LocalCheckoutCartItem = {
  id: string
  productId?: string
  name: string
  price: number
  qty: number
  image?: string
  specs?: Record<string, any>
}

const buildCheckoutSyncSpecs = (item: LocalCheckoutCartItem, productId: string) => {
  const quantity = Math.max(1, Number(item.qty) || 1)
  const unitPrice = Math.round(Number(item.price) || 0)
  const totalPrice = Math.round(unitPrice * quantity)
  const specs = item.specs || {}
  const pricing = specs.pricing && typeof specs.pricing === 'object' ? specs.pricing as Record<string, any> : {}
  const snapshot = specs.pricing_snapshot && typeof specs.pricing_snapshot === 'object'
    ? specs.pricing_snapshot as Record<string, any>
    : {
        source: 'catalog',
        clientSnapshotVersion: CLIENT_PRICING_SNAPSHOT_VERSION,
        pricingContractVersion: PRICING_CONTRACT_VERSION,
        pricingEngine: 'checkout.local-cart-sync',
        product: { id: productId, name: item.name || '' },
        generatedAt: new Date().toISOString(),
      }

  return {
    ...specs,
    product_name: item.name,
    product_image: item.image,
    local_cart_line_id: item.id,
    pricing: {
      ...pricing,
      unit_price: unitPrice,
      total_price: totalPrice,
      quantity,
      vat_included: pricing.vat_included ?? true,
      source: pricing.source || snapshot.source || 'catalog',
      clientSnapshotVersion: pricing.clientSnapshotVersion || CLIENT_PRICING_SNAPSHOT_VERSION,
      pricingContractVersion: pricing.pricingContractVersion || PRICING_CONTRACT_VERSION,
      pricingEngine: pricing.pricingEngine || snapshot.pricingEngine || 'checkout.local-cart-sync',
    },
    pricing_snapshot: {
      ...snapshot,
      total: totalPrice,
      unitPrice,
      spec: {
        ...(snapshot.spec && typeof snapshot.spec === 'object' ? snapshot.spec : {}),
        quantity,
      },
    },
  }
}

function CheckoutInner() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const quoteId = searchParams.get('quote_id')
  const source = searchParams.get('source') // 'subscription' | 'addon' | 'product' | 'cart' | null
  const planId = searchParams.get('plan_id')
  const billingCycle = (searchParams.get('billing_cycle') || 'monthly') as 'monthly' | 'yearly'
  const addonId = searchParams.get('addon_id')
  const productPricingId = searchParams.get('product_pricing_id')

  const isDigitalPurchase = source === 'subscription' || source === 'addon' || source === 'product'
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
  const [digitalLoading, setDigitalLoading] = useState(isDigitalPurchase)
  const [serverCart, setServerCart] = useState<CheckoutCartResponse | null>(null)
  const [cartLoading, setCartLoading] = useState(false)
  const [cartSyncing, setCartSyncing] = useState(false)
  const [cartSyncError, setCartSyncError] = useState('')
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const cartSyncAttemptedRef = useRef(false)

  const serverCartItems = (serverCart?.items || []).map(item => ({
    ...item,
    price: Number(item.price ?? item.unit_price ?? 0),
    qty: Math.max(1, Number(item.qty ?? item.quantity ?? 1) || 1),
  }))
  const storeCartItems = store.cart.map(item => ({
    ...item,
    price: Number(item.price || 0),
    total_price: Number(item.price || 0) * Math.max(1, Number(item.qty) || 1),
  }))
  const cartItems = serverCartItems.length > 0 ? serverCartItems : storeCartItems
  const hasCartItems = cartItems.length > 0
  const regularCheckoutNeedsCart = !quoteId && !isDigitalPurchase
  const hasAuthToken = Boolean(getToken())
  const regularCheckoutRequiresLogin = regularCheckoutNeedsCart && !hasAuthToken
  const regularCheckoutWaitingForCart = regularCheckoutNeedsCart && (cartLoading || cartSyncing) && !hasCartItems
  const regularCheckoutBlocked = regularCheckoutNeedsCart && (
    regularCheckoutRequiresLogin ||
    Boolean(cartSyncError) ||
    (!cartLoading && !cartSyncing && !hasCartItems)
  )
  const digitalCheckoutBlocked = isDigitalPurchase && (digitalLoading || !digitalInfo)
  const stepOneBlocked = digitalCheckoutBlocked || regularCheckoutBlocked || regularCheckoutWaitingForCart
  const showStepOneForm = isDigitalPurchase || Boolean(quoteId) || hasCartItems
  const cartItemCount = cartItems.reduce((sum, item) => sum + item.qty, 0)
  const cartTotal = serverCartItems.length > 0
    ? Math.round(Number(serverCart?.total_price ?? serverCart?.total ?? cartItems.reduce((sum, item) => sum + item.price * item.qty, 0)))
    : Math.round(store.cartTotal())
  const cartSubtotalExclVat = serverCartItems.length > 0 && serverCart?.subtotal_excl_vat != null
    ? Math.round(Number(serverCart.subtotal_excl_vat))
    : Math.round(cartTotal / 1.1)
  const cartVat = serverCartItems.length > 0 && serverCart?.vat != null
    ? Math.round(Number(serverCart.vat))
    : cartTotal - cartSubtotalExclVat
  const cartPricingAudit = serverCart?.pricing_audit || (hasCartItems ? summarizeCartPricingAudit(cartItems) : null)
  const { message: cartPricingAuditMessage, tone: cartPricingAuditTone } = getCartPricingAuditSummaryMessage(cartPricingAudit, cartItems.length)

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
    setDigitalInfo(null)
    if (!isDigitalPurchase) {
      setDigitalLoading(false)
      return
    }
    setDigitalLoading(true)
    if (source === 'subscription' && planId) {
      apiFetch<any>('/subscription/plans').then((plans: any[]) => {
        const plan = plans?.find((p: any) => p.id === planId)
        if (plan) setDigitalInfo({ type: 'subscription', plan, price: billingCycle === 'yearly' ? plan.price_yearly : plan.price_monthly })
      }).catch(() => {}).finally(() => setDigitalLoading(false))
    } else if (source === 'addon' && addonId) {
      apiFetch<any>('/subscription/addons').then((addons: any[]) => {
        const addon = addons?.find((a: any) => a.id === addonId)
        if (addon) setDigitalInfo({ type: 'addon', addon, price: addon.price })
      }).catch(() => {}).finally(() => setDigitalLoading(false))
    } else if (source === 'product' && productPricingId) {
      apiFetch<any>('/subscription/product-pricing').then((products: any[]) => {
        const product = products?.find((p: any) => p.id === productPricingId)
        if (product) setDigitalInfo({ type: 'product', product, price: product.price })
      }).catch(() => {}).finally(() => setDigitalLoading(false))
    } else {
      setDigitalLoading(false)
    }
  }, [])

  useEffect(() => {
    if (quoteId || isDigitalPurchase) return
    if (!getToken()) {
      setServerCart(null)
      setCartLoading(false)
      setCartSyncing(false)
      setCartSyncError('')
      return
    }

    let cancelled = false
    const loadAndSyncCart = async () => {
      setCartLoading(true)
      setCartSyncError('')
      try {
        let data = await apiFetch<CheckoutCartResponse>('/cart')
        if (cancelled) return
        const serverItems = data?.items || []
        if (serverItems.length === 0 && store.cart.length > 0 && !cartSyncAttemptedRef.current) {
          cartSyncAttemptedRef.current = true
          setCartSyncing(true)
          for (const item of store.cart) {
            const productId = item.productId || item.id.split(':')[0]
            if (!productId) continue
            await apiFetch('/cart/items', {
              method: 'POST',
              body: {
                product_id: productId,
                quantity: Math.max(1, Number(item.qty) || 1),
                unit_price: Math.round(Number(item.price) || 0),
                specs: buildCheckoutSyncSpecs(item, productId),
              },
            })
          }
          data = await apiFetch<CheckoutCartResponse>('/cart')
        }
        if (!cancelled) setServerCart(data)
      } catch (e: any) {
        if (!cancelled) {
          setServerCart(null)
          setCartSyncError(e?.message || 'Сагсыг сервертэй sync хийхэд алдаа гарлаа')
        }
      } finally {
        if (!cancelled) {
          setCartLoading(false)
          setCartSyncing(false)
        }
      }
    }
    void loadAndSyncCart()

    return () => { cancelled = true }
  }, [quoteId, isDigitalPurchase, store.cart])

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

  const makeIdempotencyKey = () =>
    (typeof crypto !== 'undefined' && (crypto as any).randomUUID)
      ? (crypto as any).randomUUID()
      : `${Date.now()}-${Math.random().toString(36).slice(2)}`

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
      if (isDigitalPurchase) {
        setError(digitalLoading ? 'Дижитал үйлчилгээний мэдээлэл ачаалж байна' : 'Дижитал үйлчилгээний мэдээлэл олдсонгүй')
        return
      }

      if (regularCheckoutBlocked) {
        setError(regularCheckoutRequiresLogin
          ? 'Checkout хийхийн тулд эхлээд нэвтэрнэ үү'
          : cartSyncError || 'Захиалга үүсгэхийн тулд эхлээд сагсанд бараа нэмнэ үү')
        return
      }

      if (cartLoading || cartSyncing) {
        setError('Сагс сервертэй sync хийж дууссаны дараа үргэлжлүүлнэ үү')
        return
      }

      // Idempotency: same key prevents double-orders if the user double-clicks
      // or the network retries. Stored on the form for the lifetime of this view.
      const quoteIdemHeaders = { 'X-Idempotency-Key': `quote-${makeIdempotencyKey()}` }
      const confirmIdemHeaders = { 'X-Idempotency-Key': `confirm-${makeIdempotencyKey()}` }

      // Canonical pipeline: must always go through cart → quote → confirm.
      // If the user arrived without a quoteId (e.g. came directly from cart),
      // we generate the quote here from their current cart, then confirm it.
      let activeQuoteId = quoteId
      if (!activeQuoteId) {
        const quote = await apiFetch<any>('/cart/quote', { method: 'POST', headers: quoteIdemHeaders })
        activeQuoteId = quote?.quotation_id || quote?.id
        if (!activeQuoteId) {
          throw new Error('Үнийн санал үүсгэж чадсангүй')
        }
      }
      // Pull the agent referral code captured by /s/{code} or /register?ref=
      // so guest-style checkouts (logged in without registration via ref)
      // still credit the agent.
      const refCode = (typeof window !== 'undefined') ? (localStorage.getItem('bp_referral_code') || undefined) : undefined

      const data = await apiFetch<any>('/cart/quote/confirm', {
        method: 'POST',
        headers: confirmIdemHeaders,
        body: {
          quotation_id: activeQuoteId,
          payment_method: payMethod,
          customer_name: form.customer_name,
          customer_phone: form.customer_phone,
          customer_email: form.customer_email,
          shipping_address: form.delivery_address,
          referral_code: refCode,
        },
      })
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
    setStep(4)
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
                <img src={`data:image/png;base64,${paymentData.qrImage}`} alt="QR" style={{ width: '100%', maxWidth: 200, height: 'auto', margin: '0 auto 12px', display: 'block', borderRadius: 8 }} />
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
          {showStepOneForm && (
          <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 16, padding: 24 }}>
            <h3 style={{ margin: '0 0 20px', fontSize: 16, fontWeight: 700 }}>👤 Хэрэглэгчийн мэдээлэл</h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 16 }}>
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
          )}

          {/* Digital purchase summary */}
          {isDigitalPurchase && digitalLoading && (
            <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 16, padding: 24 }}>
              <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700 }}>Дижитал үйлчилгээ ачаалж байна...</h3>
            </div>
          )}

          {isDigitalPurchase && !digitalLoading && !digitalInfo && (
            <div style={{ background: '#FEF2F2', border: '1px solid #FECACA', borderRadius: 16, padding: 24 }}>
              <h3 style={{ margin: '0 0 8px', fontSize: 16, fontWeight: 700, color: '#DC2626' }}>Мэдээлэл олдсонгүй</h3>
              <p style={{ color: '#991B1B', fontSize: 14, lineHeight: 1.6, margin: 0 }}>
                Сонгосон багц эсвэл нэмэлт эрх олдсонгүй. Dashboard-оос дахин сонгоно уу.
              </p>
            </div>
          )}

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

          {/* Cart items summary OR manual form */}
          {!quoteId && !isDigitalPurchase && (
            (cartLoading || cartSyncing) && !hasCartItems ? (
              <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 16, padding: 24 }}>
                <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700 }}>
                  {cartSyncing ? 'Сагсыг сервертэй sync хийж байна...' : 'Сагс ачаалж байна...'}
                </h3>
              </div>
            ) : hasCartItems ? (
              <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 16, padding: 24 }}>
                <h3 style={{ margin: '0 0 16px', fontSize: 16, fontWeight: 700 }}>🛒 Сагсны бараа ({cartItemCount} ш)</h3>
                {cartPricingAuditMessage && (
                  <div style={{
                    marginBottom: 12,
                    border: `1px solid ${cartPricingAuditTone === 'warning' ? '#F59E0B' : cartPricingAuditTone === 'success' ? '#10B981' : '#BFDBFE'}`,
                    background: cartPricingAuditTone === 'warning' ? '#FFFBEB' : cartPricingAuditTone === 'success' ? '#ECFDF5' : '#EFF6FF',
                    color: cartPricingAuditTone === 'warning' ? '#92400E' : cartPricingAuditTone === 'success' ? '#047857' : '#1D4ED8',
                    borderRadius: 10,
                    padding: '10px 12px',
                    fontSize: 12,
                    fontWeight: 700,
                  }}>
                    {cartPricingAuditMessage}
                  </div>
                )}
                {(cartSyncing || cartSyncError || regularCheckoutRequiresLogin) && (
                  <div style={{
                    marginBottom: 12,
                    border: `1px solid ${cartSyncError || regularCheckoutRequiresLogin ? '#F59E0B' : '#BFDBFE'}`,
                    background: cartSyncError || regularCheckoutRequiresLogin ? '#FFFBEB' : '#EFF6FF',
                    color: cartSyncError || regularCheckoutRequiresLogin ? '#92400E' : '#1D4ED8',
                    borderRadius: 10,
                    padding: '10px 12px',
                    fontSize: 12,
                    fontWeight: 600,
                  }}>
                    {regularCheckoutRequiresLogin
                      ? 'Checkout хийхийн тулд нэвтэрнэ үү. Нэвтэрсний дараа сагс сервертэй sync хийгдэнэ.'
                      : cartSyncError || 'Local cart сервертэй sync хийгдэж байна.'}
                  </div>
                )}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  {cartItems.map(item => {
                    const audit = getCartPricingAudit(item)
                    return (
                    <div key={item.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 12px', background: 'var(--surface2)', borderRadius: 10, border: '1px solid var(--border)' }}>
                      {item.image && <img src={item.image} alt={item.name} style={{ width: 44, height: 44, borderRadius: 8, objectFit: 'cover' }} />}
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.name}</div>
                        <div style={{ fontSize: 12, color: 'var(--text3)' }}>{fmt(item.price)} × {item.qty}</div>
                        <div style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: 6,
                          marginTop: 6,
                          padding: '4px 8px',
                          borderRadius: 999,
                          background: audit.background,
                          color: audit.color,
                          fontSize: 11,
                          fontWeight: 700,
                        }}>
                          <span>{audit.label}</span>
                          <span style={{ opacity: 0.75, fontWeight: 600 }}>{audit.detail}</span>
                        </div>
                      </div>
                      <div style={{ fontSize: 14, fontWeight: 700, color: '#FF6B00', whiteSpace: 'nowrap' }}>{fmt(item.price * item.qty)}</div>
                    </div>
                    )
                  })}
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 16, paddingTop: 12, borderTop: '2px solid var(--border)', fontSize: 14 }}>
                  <span style={{ color: 'var(--text2)' }}>НӨАТгүй дүн:</span>
                  <span style={{ fontWeight: 600 }}>{fmt(cartSubtotalExclVat)}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 8, fontSize: 14 }}>
                  <span style={{ color: 'var(--text2)' }}>НӨАТ (10%):</span>
                  <span style={{ fontWeight: 600 }}>{fmt(cartVat)}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 8, fontSize: 16 }}>
                  <span style={{ fontWeight: 700 }}>Нийт дүн:</span>
                  <span style={{ fontWeight: 800, color: '#FF6B00', fontSize: 20 }}>{fmt(cartTotal)}</span>
                </div>
                <div style={{ marginTop: 12 }}>
                  <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text2)', display: 'block', marginBottom: 6 }}>НЭМЭЛТ ТАЙЛБАР</label>
                  <input style={inp} placeholder="Нэмэлт тайлбар..." value={form.notes} onChange={e => set('notes', e.target.value)} />
                </div>
              </div>
            ) : (
              <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 16, padding: 24 }}>
                <h3 style={{ margin: '0 0 8px', fontSize: 16, fontWeight: 700 }}>Сагс хоосон байна</h3>
                <p style={{ color: 'var(--text2)', fontSize: 14, lineHeight: 1.6, margin: '0 0 18px' }}>
                  Захиалга баталгаажуулахын тулд эхлээд бүтээгдэхүүн сонгож сагсанд нэмнэ үү.
                </p>
                <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                  <button onClick={() => router.push('/shop')} style={{
                    padding: '11px 18px', background: '#FF6B00', color: '#fff', border: 'none',
                    borderRadius: 10, fontWeight: 700, fontSize: 14, cursor: 'pointer', fontFamily: FONT,
                  }}>
                    Дэлгүүр үзэх
                  </button>
                  <button onClick={() => router.push('/quote')} style={{
                    padding: '11px 18px', background: 'var(--surface2)', color: 'var(--text)',
                    border: '1px solid var(--border)', borderRadius: 10, fontWeight: 600,
                    fontSize: 14, cursor: 'pointer', fontFamily: FONT,
                  }}>
                    Үнийн санал авах
                  </button>
                </div>
              </div>
            )
          )}

          {error && <div style={{ background: '#FEF2F2', border: '1px solid #FECACA', borderRadius: 10, padding: '12px 16px', color: '#DC2626', fontSize: 14 }}>⚠️ {error}</div>}

          {showStepOneForm && (
          <button
            onClick={() => {
              if (digitalCheckoutBlocked) {
                setError(digitalLoading ? 'Дижитал үйлчилгээний мэдээлэл ачаалж байна' : 'Дижитал үйлчилгээний мэдээлэл олдсонгүй')
                return
              }
              if (regularCheckoutBlocked) {
                setError(regularCheckoutRequiresLogin
                  ? 'Checkout хийхийн тулд эхлээд нэвтэрнэ үү'
                  : cartSyncError || 'Захиалга үүсгэхийн тулд эхлээд сагсанд бараа нэмнэ үү')
                return
              }
              setStep(2)
            }}
            disabled={stepOneBlocked}
            style={{
            padding: '16px', background: stepOneBlocked ? '#ccc' : '#FF6B00', color: '#fff', border: 'none',
            borderRadius: 12, fontWeight: 700, fontSize: 16, cursor: stepOneBlocked ? 'not-allowed' : 'pointer',
          }}>
            Үргэлжлүүлэх →
          </button>
          )}
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
                  {hasCartItems ? (
                    <>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span style={{ color: 'var(--text2)' }}>Бараа:</span>
                        <span style={{ fontWeight: 600 }}>{cartItemCount} ширхэг ({cartItems.length} төрөл)</span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px solid var(--border)', paddingTop: 8, marginTop: 4 }}>
                        <span style={{ color: 'var(--text2)' }}>НӨАТгүй дүн:</span>
                        <span style={{ fontWeight: 600 }}>{fmt(cartSubtotalExclVat)}</span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span style={{ color: 'var(--text2)' }}>НӨАТ (10%):</span>
                        <span style={{ fontWeight: 600 }}>{fmt(cartVat)}</span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px solid var(--border)', paddingTop: 8, marginTop: 4 }}>
                        <span style={{ fontWeight: 700 }}>Нийт:</span>
                        <span style={{ fontWeight: 800, color: '#FF6B00', fontSize: 18 }}>{fmt(cartTotal)}</span>
                      </div>
                    </>
                  ) : form.product_name ? (
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ color: 'var(--text2)' }}>Бүтээгдэхүүн:</span>
                      <span style={{ fontWeight: 600 }}>{form.product_name}</span>
                    </div>
                  ) : null}
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
