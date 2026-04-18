'use client'
import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'

const API = 'http://localhost:4000'
const F = "'DM Sans','Segoe UI',system-ui,sans-serif"
const fmt = (n: number) => n.toLocaleString('mn-MN') + '₮'
const DELIVERY_FEE = 5000

// ─── Types ────────────────────────────────────────────────────────────────────

interface CartItem { id: string; product_id: string; quantity: number }
interface Product { id: string; name: string; name_mn?: string; price?: number; base_price?: number; sale_price?: number }
interface Address { full_name: string; phone: string; district: string; address: string; notes: string }

interface PendingQuote {
  product_id: number
  product_name: string
  quantity: number
  unit_price: number
  subtotal: number
  platform_margin: number
  delivery_fee: number
  total: number
  currency: string
  valid_until?: string
  options: Record<string, string>
}

interface UploadedFile {
  original_name: string
  saved_as: string
  file_url: string
  size_mb: string
  mimetype: string
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function CheckoutPage() {
  const router = useRouter()
  const [step, setStep] = useState(1)
  const [userId, setUserId] = useState<string | null>(null)
  const [hasToken, setHasToken] = useState(false)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)

  // Cart mode
  const [items, setItems] = useState<CartItem[]>([])
  const [products, setProducts] = useState<Record<string, Product>>({})

  // Quote mode
  const [isQuoteMode, setIsQuoteMode] = useState(false)
  const [quote, setQuote] = useState<PendingQuote | null>(null)

  // File upload (quote mode)
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([])
  const [uploading, setUploading] = useState(false)
  const [uploadError, setUploadError] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Address
  const [address, setAddress] = useState<Address>({
    full_name: '', phone: '', district: '', address: '', notes: '',
  })

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const isQuote = params.get('source') === 'quote'
    setIsQuoteMode(isQuote)

    if (isQuote) {
      try {
        const raw = localStorage.getItem('pending_quote')
        if (raw) setQuote(JSON.parse(raw) as PendingQuote)
      } catch { /* ignore */ }
    }

    const token = localStorage.getItem('access_token') || localStorage.getItem('access_token') || localStorage.getItem('token') || ''
    setHasToken(!!token)
    if (!token) { setLoading(false); return }

    fetch(`${API}/auth/me`, { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.json())
      .then(async u => {
        if (!u?.id) { setLoading(false); return }
        setUserId(u.id)
        if (u.full_name) setAddress(prev => ({ ...prev, full_name: u.full_name || '' }))
        if (u.phone) setAddress(prev => ({ ...prev, phone: u.phone || '' }))

        if (!isQuote) {
          const [cartData, prods] = await Promise.all([
            fetch(`${API}/cart/${u.id}`, { headers: { Authorization: `Bearer ${token}` } }).then(r => r.json()).catch(() => null),
            fetch(`${API}/products`, { headers: { Authorization: `Bearer ${token}` } }).then(r => r.json()).catch(() => []),
          ])
          setItems(cartData?.items ?? [])
          const prodMap: Record<string, Product> = {}
          if (Array.isArray(prods)) prods.forEach((p: Product) => { prodMap[p.id] = p })
          setProducts(prodMap)
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  // ── Price helpers ──────────────────────────────────────────────────────────

  const getPrice = (productId: string) => {
    const p = products[productId]
    if (!p) return 0
    return Number(p.sale_price ?? p.base_price ?? p.price ?? 0)
  }

  const cartSubtotal = items.reduce((s, i) => s + getPrice(i.product_id) * i.quantity, 0)
  const cartVat = Math.round(cartSubtotal * 0.1)
  const cartTotal = cartSubtotal + DELIVERY_FEE + cartVat

  const subtotal   = isQuoteMode ? (quote?.subtotal    ?? 0) : cartSubtotal
  const deliveryFee = isQuoteMode ? (quote?.delivery_fee ?? DELIVERY_FEE) : DELIVERY_FEE
  const total      = isQuoteMode ? (quote?.total       ?? 0) : cartTotal

  const addressValid = !!(address.full_name.trim() && address.phone.trim() && address.address.trim())

  // Quote mode has 3 steps (address → upload → confirm); cart has 2 (address → confirm)
  const STEPS = isQuoteMode
    ? ['Хүргэлтийн хаяг', 'Файл оруулах', 'Баталгаажуулах']
    : ['Хүргэлтийн хаяг', 'Баталгаажуулах']
  const confirmStep = isQuoteMode ? 3 : 2

  // ── File upload ────────────────────────────────────────────────────────────

  async function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setUploading(true)
    setUploadError(null)
    try {
      const fd = new FormData()
      fd.append('file', file)
      const res = await fetch(`${API}/upload/file`, { method: 'POST', body: fd })
      const data = await res.json()
      if (data.error) throw new Error(data.error)
      setUploadedFiles(prev => [...prev, data as UploadedFile])
    } catch (err: any) {
      setUploadError(err?.message || 'Файл оруулахад алдаа гарлаа')
    } finally {
      setUploading(false)
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

  function removeFile(idx: number) {
    setUploadedFiles(prev => prev.filter((_, i) => i !== idx))
  }

  // ── Place order ────────────────────────────────────────────────────────────

  async function placeOrder() {
    const token = localStorage.getItem('access_token') || localStorage.getItem('access_token') || localStorage.getItem('token') || ''
    if (!token || !userId || submitting) return
    setSubmitting(true)
    try {
      const deliveryAddr = `${address.district ? address.district + ', ' : ''}${address.address}`

      let orderPayload: Record<string, any>

      if (isQuoteMode && quote) {
        orderPayload = {
          customer_id: userId,
          items: [{ product_id: String(quote.product_id), quantity: quote.quantity, unit_price: quote.unit_price }],
          subtotal: quote.subtotal,
          delivery_fee: quote.delivery_fee,
          vat: 0,
          total_price: quote.total,
          delivery_address: deliveryAddr,
          customer_name: address.full_name,
          phone: address.phone,
          notes: address.notes || '',
          status: 'pending',
          payment_status: 'pending',
          source: 'quote',
        }
      } else {
        orderPayload = {
          customer_id: userId,
          items: items.map(i => ({ product_id: i.product_id, quantity: i.quantity, unit_price: getPrice(i.product_id) })),
          subtotal: cartSubtotal,
          delivery_fee: DELIVERY_FEE,
          vat: cartVat,
          total_price: cartTotal,
          delivery_address: deliveryAddr,
          customer_name: address.full_name,
          phone: address.phone,
          notes: address.notes || '',
          status: 'pending',
          payment_status: 'pending',
        }
      }

      const res = await fetch(`${API}/orders`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(orderPayload),
      })
      if (!res.ok) throw new Error(await res.text())
      const order = await res.json()

      // Link uploaded files to the new order
      if (uploadedFiles.length > 0 && order?.id) {
        await Promise.allSettled(uploadedFiles.map(f =>
          fetch(`${API}/order-files`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
            body: JSON.stringify({
              order_id: order.id,
              filename: f.original_name,
              path: f.file_url,
              size: Math.round(parseFloat(f.size_mb) * 1024 * 1024),
              mime_type: f.mimetype,
              file_type: 'customer_upload',
              uploaded_by: userId,
              uploaded_by_role: 'customer',
            }),
          })
        ))
      }

      localStorage.removeItem('pending_quote')
      router.push(`/payment?order_id=${order.id}&amount=${orderPayload.total_price}`)
    } catch {
      alert('Захиалга өгөхөд алдаа гарлаа. Дахин оролдоно уу.')
    }
    setSubmitting(false)
  }

  // ── Guard renders ──────────────────────────────────────────────────────────

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

  if (!isQuoteMode && items.length === 0) {
    return (
      <div style={{ maxWidth: 600, margin: '80px auto', padding: '0 24px', textAlign: 'center', fontFamily: F }}>
        <div style={{ fontSize: 48, marginBottom: 16 }}>🛒</div>
        <h2 style={{ fontSize: 20, fontWeight: 700, margin: '0 0 12px', color: 'var(--text)' }}>Сагс хоосон байна</h2>
        <a href="/shop" style={{ padding: '12px 28px', background: '#FF6B00', color: '#fff', borderRadius: 10, textDecoration: 'none', fontWeight: 600 }}>Дэлгүүр үзэх</a>
      </div>
    )
  }

  if (isQuoteMode && !quote) {
    return (
      <div style={{ maxWidth: 600, margin: '80px auto', padding: '0 24px', textAlign: 'center', fontFamily: F }}>
        <div style={{ fontSize: 48, marginBottom: 16 }}>🧮</div>
        <h2 style={{ fontSize: 20, fontWeight: 700, margin: '0 0 12px', color: 'var(--text)' }}>Үнийн тооцоолол олдсонгүй</h2>
        <a href="/quote" style={{ padding: '12px 28px', background: '#FF6B00', color: '#fff', borderRadius: 10, textDecoration: 'none', fontWeight: 600 }}>Үнэ тооцоолоход буцах</a>
      </div>
    )
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // RENDER
  // ─────────────────────────────────────────────────────────────────────────────

  return (
    <div style={{ maxWidth: 900, margin: '0 auto', padding: '40px 24px', fontFamily: F }}>
      <h1 style={{ fontSize: 26, fontWeight: 700, margin: '0 0 8px', color: 'var(--text)' }}>Захиалга баталгаажуулах</h1>

      {/* ── Step indicator ── */}
      <div style={{ display: 'flex', alignItems: 'center', marginBottom: 32 }}>
        {STEPS.map((label, i) => {
          const num = i + 1
          const done = step > num
          const active = step === num
          return (
            <div key={label} style={{ display: 'flex', alignItems: 'center', flex: i < STEPS.length - 1 ? 1 : 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <div style={{
                  width: 28, height: 28, borderRadius: '50%',
                  background: done || active ? '#FF6B00' : 'var(--surface2, #F3F4F6)',
                  border: `2px solid ${done || active ? '#FF6B00' : 'var(--border, #E5E7EB)'}`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 12, fontWeight: 700,
                  color: done || active ? '#fff' : 'var(--text3, #9CA3AF)',
                  flexShrink: 0,
                }}>
                  {done ? '✓' : num}
                </div>
                <span style={{
                  fontSize: 13, fontWeight: active ? 600 : 400,
                  color: active ? '#FF6B00' : done ? 'var(--text, #111)' : 'var(--text3, #9CA3AF)',
                  whiteSpace: 'nowrap',
                }}>
                  {label}
                </span>
              </div>
              {i < STEPS.length - 1 && (
                <div style={{ flex: 1, height: 2, background: done ? '#FF6B00' : 'var(--border, #E5E7EB)', margin: '0 12px' }} />
              )}
            </div>
          )
        })}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 300px', gap: 24, alignItems: 'start' }}>

        {/* ── Left panel ── */}
        <div style={{ background: 'var(--surface, #fff)', border: '1px solid var(--border, #E5E7EB)', borderRadius: 16, padding: 24 }}>

          {/* ════ STEP 1: Address ════ */}
          {step === 1 && (
            <>
              <h2 style={{ fontSize: 17, fontWeight: 700, margin: '0 0 20px', color: 'var(--text)' }}>Хүргэлтийн хаяг</h2>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                {[
                  { key: 'full_name', label: 'Нэр',               placeholder: 'Таны бүтэн нэр',            required: true  },
                  { key: 'phone',     label: 'Утасны дугаар',     placeholder: '+976 XXXX-XXXX',             required: true  },
                  { key: 'district',  label: 'Дүүрэг / Хороо',   placeholder: 'Сүхбаатар дүүрэг, 1-р хороо', required: false },
                  { key: 'address',   label: 'Дэлгэрэнгүй хаяг', placeholder: 'Байр, давхар, тоот...',      required: true  },
                  { key: 'notes',     label: 'Нэмэлт тэмдэглэл', placeholder: 'Хаалганы код, цаг...',       required: false },
                ].map(field => (
                  <div key={field.key}>
                    <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: 'var(--text2, #6B7280)', marginBottom: 6 }}>
                      {field.label} {field.required && <span style={{ color: '#EF4444' }}>*</span>}
                    </label>
                    {field.key === 'notes' ? (
                      <textarea
                        value={address[field.key as keyof Address]}
                        onChange={e => setAddress(prev => ({ ...prev, [field.key]: e.target.value }))}
                        placeholder={field.placeholder}
                        rows={3}
                        style={{ width: '100%', padding: '10px 14px', border: '1px solid var(--border, #E5E7EB)', borderRadius: 10, fontSize: 14, outline: 'none', background: 'var(--surface2, #F9FAFB)', color: 'var(--text, #111)', fontFamily: F, resize: 'vertical', boxSizing: 'border-box' }}
                      />
                    ) : (
                      <input
                        value={address[field.key as keyof Address]}
                        onChange={e => setAddress(prev => ({ ...prev, [field.key]: e.target.value }))}
                        placeholder={field.placeholder}
                        style={{ width: '100%', padding: '10px 14px', border: '1px solid var(--border, #E5E7EB)', borderRadius: 10, fontSize: 14, outline: 'none', background: 'var(--surface2, #F9FAFB)', color: 'var(--text, #111)', fontFamily: F, boxSizing: 'border-box' }}
                      />
                    )}
                  </div>
                ))}
              </div>
              <button
                onClick={() => setStep(isQuoteMode ? 2 : confirmStep)}
                disabled={!addressValid}
                style={{ marginTop: 24, width: '100%', padding: '13px', background: addressValid ? '#111' : 'var(--surface2, #F3F4F6)', color: addressValid ? '#fff' : 'var(--text3, #9CA3AF)', border: 'none', borderRadius: 12, fontSize: 15, fontWeight: 700, cursor: addressValid ? 'pointer' : 'not-allowed', fontFamily: F }}
              >
                Үргэлжлүүлэх →
              </button>
            </>
          )}

          {/* ════ STEP 2: File upload (quote mode only) ════ */}
          {step === 2 && isQuoteMode && (
            <>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
                <button
                  onClick={() => setStep(1)}
                  style={{ background: 'none', border: '1px solid var(--border, #E5E7EB)', borderRadius: 8, padding: '6px 12px', cursor: 'pointer', fontSize: 13, color: 'var(--text2, #6B7280)', fontFamily: F }}
                >
                  ← Буцах
                </button>
                <h2 style={{ fontSize: 17, fontWeight: 700, margin: 0, color: 'var(--text)' }}>Хэвлэх файл оруулах</h2>
              </div>

              <div style={{ background: 'rgba(255,107,0,0.05)', border: '1px solid rgba(255,107,0,0.2)', borderRadius: 10, padding: '12px 16px', marginBottom: 20, fontSize: 13, color: 'var(--text2, #6B7280)' }}>
                <strong style={{ color: '#FF6B00' }}>📄 Зөвшөөрөгдсөн форматууд:</strong> PDF, PNG, JPG, AI, EPS
              </div>

              {/* Drop zone */}
              <div
                onClick={() => fileInputRef.current?.click()}
                style={{ border: '2px dashed var(--border, #E5E7EB)', borderRadius: 12, padding: '40px 24px', textAlign: 'center', cursor: 'pointer', background: 'var(--surface2, #F9FAFB)', marginBottom: 16 }}
              >
                <div style={{ fontSize: 36, marginBottom: 12 }}>📁</div>
                <div style={{ fontWeight: 600, fontSize: 15, color: 'var(--text, #111)', marginBottom: 4 }}>Файл сонгох</div>
                <div style={{ fontSize: 13, color: 'var(--text2, #6B7280)' }}>Дарж файлаа оруулна уу</div>
                {uploading && (
                  <div style={{ marginTop: 12, fontSize: 13, color: '#FF6B00', fontWeight: 600 }}>⏳ Оруулж байна...</div>
                )}
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf,.png,.jpg,.jpeg,.ai,.eps"
                onChange={handleFileSelect}
                style={{ display: 'none' }}
              />

              {uploadError && (
                <div style={{ padding: '10px 14px', background: '#FEF2F2', color: '#B91C1C', borderRadius: 8, fontSize: 13, marginBottom: 12 }}>
                  ⚠️ {uploadError}
                </div>
              )}

              {/* Uploaded files list */}
              {uploadedFiles.length > 0 && (
                <div style={{ marginBottom: 16 }}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text2, #6B7280)', marginBottom: 8 }}>
                    Оруулсан файлууд:
                  </div>
                  {uploadedFiles.map((f, i) => (
                    <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 14px', background: 'rgba(16,185,129,0.05)', border: '1px solid rgba(16,185,129,0.2)', borderRadius: 8, marginBottom: 6 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <span style={{ fontSize: 16 }}>✅</span>
                        <div>
                          <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text, #111)' }}>{f.original_name}</div>
                          <div style={{ fontSize: 11, color: 'var(--text2, #6B7280)' }}>{f.size_mb} MB · {f.mimetype}</div>
                        </div>
                      </div>
                      <button
                        onClick={() => removeFile(i)}
                        style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#EF4444', fontSize: 18, padding: '2px 6px', lineHeight: 1 }}
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
              )}

              <button
                onClick={() => setStep(confirmStep)}
                style={{ width: '100%', padding: '13px', background: '#FF6B00', color: '#fff', border: 'none', borderRadius: 12, fontSize: 15, fontWeight: 700, cursor: 'pointer', fontFamily: F }}
              >
                {uploadedFiles.length > 0 ? 'Үргэлжлүүлэх →' : 'Алгасах →'}
              </button>
              {uploadedFiles.length === 0 && (
                <div style={{ marginTop: 8, fontSize: 12, color: 'var(--text2, #6B7280)', textAlign: 'center' }}>
                  Файл оруулахгүйгээр үргэлжлүүлж болно — захиалгын дараа дамжуулах боломжтой
                </div>
              )}
            </>
          )}

          {/* ════ Confirm step ════ */}
          {step === confirmStep && (
            <>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
                <button
                  onClick={() => setStep(isQuoteMode ? 2 : 1)}
                  style={{ background: 'none', border: '1px solid var(--border, #E5E7EB)', borderRadius: 8, padding: '6px 12px', cursor: 'pointer', fontSize: 13, color: 'var(--text2, #6B7280)', fontFamily: F }}
                >
                  ← Засах
                </button>
                <h2 style={{ fontSize: 17, fontWeight: 700, margin: 0, color: 'var(--text)' }}>Захиалгын хураангуй</h2>
              </div>

              {/* Address review */}
              <div style={{ background: 'var(--surface2, #F9FAFB)', borderRadius: 12, padding: '14px 16px', marginBottom: 20 }}>
                <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text2, #6B7280)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 10 }}>
                  Хүргэлтийн хаяг
                </div>
                <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text, #111)', marginBottom: 4 }}>{address.full_name}</div>
                <div style={{ fontSize: 13, color: 'var(--text2, #6B7280)', marginBottom: 4 }}>📞 {address.phone}</div>
                <div style={{ fontSize: 13, color: 'var(--text2, #6B7280)', marginBottom: address.notes ? 4 : 0 }}>
                  📍 {address.district ? `${address.district}, ` : ''}{address.address}
                </div>
                {address.notes && (
                  <div style={{ fontSize: 13, color: 'var(--text2, #6B7280)' }}>📝 {address.notes}</div>
                )}
                <button
                  onClick={() => setStep(1)}
                  style={{ marginTop: 10, fontSize: 12, color: '#FF6B00', background: 'none', border: 'none', cursor: 'pointer', padding: 0, fontFamily: F }}
                >
                  Засах
                </button>
              </div>

              {/* Order items */}
              {isQuoteMode && quote ? (
                <div style={{ background: 'rgba(255,107,0,0.04)', border: '1px solid rgba(255,107,0,0.15)', borderRadius: 10, padding: '14px 16px', marginBottom: 20 }}>
                  <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text2, #6B7280)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 10 }}>
                    Захиалгын мэдээлэл
                  </div>
                  {[
                    { label: 'Бүтээгдэхүүн', value: quote.product_name },
                    { label: 'Тоо ширхэг',   value: `${quote.quantity.toLocaleString()} ш` },
                    { label: 'Нэгж үнэ',      value: fmt(quote.unit_price) },
                  ].map(row => (
                    <div key={row.label} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 14, marginBottom: 6 }}>
                      <span style={{ color: 'var(--text2, #6B7280)' }}>{row.label}</span>
                      <span style={{ fontWeight: 600, color: 'var(--text, #111)' }}>{row.value}</span>
                    </div>
                  ))}
                  {uploadedFiles.length > 0 && (
                    <div style={{ marginTop: 10, paddingTop: 10, borderTop: '1px solid rgba(255,107,0,0.15)', fontSize: 13, color: '#10B981', fontWeight: 500 }}>
                      ✅ {uploadedFiles.length} файл бэлэн
                    </div>
                  )}
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 20 }}>
                  {items.map(item => {
                    const prod = products[item.product_id]
                    const price = getPrice(item.product_id)
                    return (
                      <div key={item.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 14 }}>
                        <span style={{ color: 'var(--text)' }}>
                          {prod?.name_mn || prod?.name || 'Бүтээгдэхүүн'} × {item.quantity}
                        </span>
                        <span style={{ fontWeight: 600, color: 'var(--text)' }}>{fmt(price * item.quantity)}</span>
                      </div>
                    )
                  })}
                </div>
              )}

              <button
                onClick={placeOrder}
                disabled={submitting}
                style={{ width: '100%', padding: '14px', background: submitting ? 'var(--surface2, #F3F4F6)' : '#FF6B00', color: submitting ? 'var(--text3, #9CA3AF)' : '#fff', border: 'none', borderRadius: 12, fontSize: 15, fontWeight: 700, cursor: submitting ? 'not-allowed' : 'pointer', fontFamily: F }}
              >
                {submitting ? 'Захиалж байна...' : 'Захиалга өгөх ✓'}
              </button>
            </>
          )}
        </div>

        {/* ── Right: price breakdown ── */}
        <div style={{ background: 'var(--surface, #fff)', border: '1px solid var(--border, #E5E7EB)', borderRadius: 16, padding: 20, position: 'sticky', top: 80 }}>
          <h3 style={{ fontSize: 14, fontWeight: 700, margin: '0 0 16px', color: 'var(--text)' }}>Төлбөрийн дэлгэрэнгүй</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <PriceRow label="Дэд нийт" value={fmt(subtotal)} />
            {isQuoteMode && quote?.platform_margin ? (
              <PriceRow label="Платформ шимтгэл" value={fmt(quote.platform_margin)} />
            ) : (
              <PriceRow label="НӨАТ (10%)" value={fmt(cartVat)} />
            )}
            <PriceRow label="Хүргэлт" value={fmt(deliveryFee)} />
            <div style={{ height: 1, background: 'var(--border, #E5E7EB)' }} />
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 16, fontWeight: 700 }}>
              <span style={{ color: 'var(--text)' }}>Нийт</span>
              <span style={{ color: '#FF6B00' }}>{fmt(total)}</span>
            </div>
          </div>
          {isQuoteMode && quote?.valid_until && (
            <div style={{ marginTop: 12, padding: '8px 12px', background: 'rgba(16,185,129,0.08)', borderRadius: 8, fontSize: 12, color: '#10B981', fontWeight: 500 }}>
              ✓ Үнэ хүчинтэй: {new Date(quote.valid_until).toLocaleDateString('mn-MN')} хүртэл
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

// ─── Sub-component ────────────────────────────────────────────────────────────

function PriceRow({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13 }}>
      <span style={{ color: 'var(--text2, #6B7280)' }}>{label}</span>
      <span style={{ color: 'var(--text, #111)' }}>{value}</span>
    </div>
  )
}
