'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'

interface Product {
  id: string
  name: string
  name_mn: string
  category: string
  base_price: number
  min_quantity: number
}

export default function OrderPage() {
  const router = useRouter()
  const [products, setProducts] = useState<Product[]>([])
  const [productId, setProductId] = useState('')
  const [quantity, setQuantity] = useState(100)
  const [finish, setFinish] = useState('')
  const [side, setSide] = useState('')
  const [delivery, setDelivery] = useState(false)
  const [notes, setNotes] = useState('')
  const [quote, setQuote] = useState<any>(null)
  const [step, setStep] = useState(1)
  const [loading, setLoading] = useState(false)
  const [paymentResult, setPaymentResult] = useState<any>(null)

  useEffect(() => {
    const token = localStorage.getItem('token')
    if (!token) { router.push('/login'); return }
    fetch('http://localhost:4000/products').then(r => r.json()).then(setProducts)
    const params = new URLSearchParams(window.location.search)
    const pid = params.get('product_id')
    if (pid) setProductId(pid)
  }, [])

  const getQuote = async () => {
    if (!productId) return
    setLoading(true)
    const res = await fetch('http://localhost:4000/pricing/quote', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        product_id: productId, quantity,
        options: { ...(finish && { finish }), ...(side && { side }) },
        delivery,
      }),
    })
    const data = await res.json()
    setQuote(data)
    setStep(2)
    setLoading(false)
  }

  const placeOrder = async () => {
    setLoading(true)
    const token = localStorage.getItem('token')
    const user = JSON.parse(localStorage.getItem('user') || '{}')

    // 1. Order үүсгэ
    const orderRes = await fetch('http://localhost:4000/orders', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({
        customer_id: user.id,
        product_id: productId,
        quantity,
        total_price: quote.total,
        options: { ...(finish && { finish }), ...(side && { side }) },
        notes,
      }),
    })
    const order = await orderRes.json()

    // 2. Payment үүсгэ
    const payRes = await fetch('http://localhost:4000/payment/create', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        order_id: order.id,
        customer_id: user.id,
        amount: quote.total,
      }),
    })
    const payment = await payRes.json()
    setPaymentResult({ order, payment })
    setStep(3)
    setLoading(false)
  }

  return (
    <main className="min-h-screen bg-gray-950 text-white">
      <nav className="border-b border-gray-800 px-8 py-4 flex items-center justify-between">
        <a href="/" className="text-2xl font-bold text-orange-500">BizPrint</a>
        <a href="/dashboard" className="text-gray-400 hover:text-white text-sm">← Dashboard</a>
      </nav>

      <div className="max-w-2xl mx-auto px-8 py-10">

        {/* Steps */}
        <div className="flex items-center gap-2 mb-10">
          {['Бүтээгдэхүүн', 'Үнэ батлах', 'Төлбөр'].map((s, i) => (
            <div key={s} className="flex items-center gap-2">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold
                ${step > i + 1 ? 'bg-green-500' : step === i + 1 ? 'bg-orange-500' : 'bg-gray-700'}`}>
                {step > i + 1 ? '✓' : i + 1}
              </div>
              <span className={`text-sm ${step === i + 1 ? 'text-white' : 'text-gray-500'}`}>{s}</span>
              {i < 2 && <div className="w-8 h-px bg-gray-700" />}
            </div>
          ))}
        </div>

        {/* Step 1 */}
        {step === 1 && (
          <div className="space-y-5">
            <h1 className="text-2xl font-bold">Захиалгын мэдээлэл</h1>

            <div>
              <label className="block text-sm text-gray-400 mb-2">Бүтээгдэхүүн</label>
              <select value={productId} onChange={e => setProductId(e.target.value)}
                className="w-full bg-gray-900 border border-gray-700 rounded-lg px-4 py-3 text-white">
                <option value="">Сонгоно уу...</option>
                {products.map(p => (
                  <option key={p.id} value={p.id}>{p.name_mn}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm text-gray-400 mb-2">
                Тоо ширхэг: <span className="text-orange-400 font-semibold">{quantity}</span>
              </label>
              <input type="range" min={10} max={5000} step={10}
                value={quantity} onChange={e => setQuantity(Number(e.target.value))}
                className="w-full accent-orange-500" />
            </div>

            <div>
              <label className="block text-sm text-gray-400 mb-2">Нааш боловсруулалт</label>
              <select value={finish} onChange={e => setFinish(e.target.value)}
                className="w-full bg-gray-900 border border-gray-700 rounded-lg px-4 py-3 text-white">
                <option value="">Байхгүй</option>
                <option value="matte_laminate">Матт ламинат (+20%)</option>
                <option value="gloss_laminate">Глосс ламинат (+18%)</option>
                <option value="soft_touch">Мягкий сенсор (+35%)</option>
              </select>
            </div>

            <div>
              <label className="block text-sm text-gray-400 mb-2">Хэвлэх тал</label>
              <select value={side} onChange={e => setSide(e.target.value)}
                className="w-full bg-gray-900 border border-gray-700 rounded-lg px-4 py-3 text-white">
                <option value="">Нэг тал</option>
                <option value="double">Хоёр тал (+70%)</option>
              </select>
            </div>

            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={delivery} onChange={e => setDelivery(e.target.checked)}
                className="accent-orange-500 w-4 h-4" />
              <span className="text-sm">Хүргэлт хэрэгтэй (+15,000₮)</span>
            </label>

            <div>
              <label className="block text-sm text-gray-400 mb-2">Тайлбар (заавал биш)</label>
              <textarea value={notes} onChange={e => setNotes(e.target.value)}
                rows={3} placeholder="Захиалгын тайлбар..."
                className="w-full bg-gray-900 border border-gray-700 rounded-lg px-4 py-3 text-white resize-none" />
            </div>

            <button onClick={getQuote} disabled={!productId || loading}
              className="w-full py-4 bg-orange-500 rounded-xl font-semibold text-lg hover:bg-orange-600 disabled:opacity-50">
              {loading ? 'Тооцоолж байна...' : 'Үргэлжлүүлэх →'}
            </button>
          </div>
        )}

        {/* Step 2 */}
        {step === 2 && quote && (
          <div className="space-y-5">
            <h1 className="text-2xl font-bold">Үнийн санал батлах</h1>
            <div className="bg-gray-900 rounded-xl p-6 space-y-3">
              <h2 className="text-lg font-semibold text-orange-400">{quote.product_name}</h2>
              {[
                { label: 'Тоо ширхэг', value: `${quote.quantity} ширхэг` },
                { label: 'Нэгж үнэ', value: `${Number(quote.unit_price).toLocaleString()}₮` },
                { label: 'Нийт дүн', value: `${Number(quote.subtotal).toLocaleString()}₮` },
                { label: 'Платформ шимтгэл', value: `${Number(quote.platform_margin).toLocaleString()}₮` },
                { label: 'Хүргэлт', value: `${Number(quote.delivery_fee).toLocaleString()}₮` },
              ].map(row => (
                <div key={row.label} className="flex justify-between text-sm border-b border-gray-800 pb-2">
                  <span className="text-gray-400">{row.label}</span>
                  <span>{row.value}</span>
                </div>
              ))}
              <div className="flex justify-between font-bold text-xl pt-2">
                <span>Нийт төлөх</span>
                <span className="text-orange-400">{Number(quote.total).toLocaleString()}₮</span>
              </div>
            </div>
            <div className="flex gap-3">
              <button onClick={() => setStep(1)}
                className="flex-1 py-3 border border-gray-600 rounded-xl hover:border-orange-500">
                ← Буцах
              </button>
              <button onClick={placeOrder} disabled={loading}
                className="flex-1 py-3 bg-orange-500 rounded-xl font-semibold hover:bg-orange-600 disabled:opacity-50">
                {loading ? 'Захиалж байна...' : 'Захиалга өгөх →'}
              </button>
            </div>
          </div>
        )}

        {/* Step 3 */}
        {step === 3 && paymentResult && (
          <div className="space-y-5 text-center">
            <div className="text-6xl">🎉</div>
            <h1 className="text-2xl font-bold">Захиалга амжилттай!</h1>
            <div className="bg-gray-900 rounded-xl p-6 text-left space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-gray-400">Захиалгын дугаар</span>
                <span className="font-mono text-xs">{paymentResult.order.id.slice(0, 16)}...</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-400">Invoice код</span>
                <span className="text-orange-400 font-semibold">{paymentResult.payment.invoice_code}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-400">Төлөх дүн</span>
                <span className="font-bold text-lg">{Number(paymentResult.payment.amount).toLocaleString()}₮</span>
              </div>
              <div className="bg-orange-500/10 border border-orange-500/30 rounded-lg p-4 mt-4">
                <p className="text-orange-400 text-sm font-semibold mb-1">QPay QR код</p>
                <p className="text-xs text-gray-400">{paymentResult.payment.qr_text}</p>
                <a href={paymentResult.payment.qpay_url} target="_blank"
                  className="mt-2 block text-center py-2 bg-orange-500 rounded-lg text-sm font-semibold hover:bg-orange-600">
                  QPay-ээр төлөх
                </a>
              </div>
            </div>
            <a href="/dashboard"
              className="block py-3 border border-gray-600 rounded-xl hover:border-orange-500">
              Dashboard руу буцах
            </a>
          </div>
        )}
      </div>
    </main>
  )
}