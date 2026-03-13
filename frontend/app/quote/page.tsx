'use client'

import { useState, useEffect } from 'react'

interface Product {
  id: string
  name: string
  name_mn: string
  category: string
  base_price: number
}

interface QuoteResult {
  product_name: string
  quantity: number
  unit_price: number
  subtotal: number
  platform_margin: number
  delivery_fee: number
  total: number
  currency: string
  valid_until: string
}

export default function QuotePage() {
  const [products, setProducts] = useState<Product[]>([])
  const [productId, setProductId] = useState('')
  const [quantity, setQuantity] = useState(100)
  const [finish, setFinish] = useState('')
  const [side, setSide] = useState('')
  const [delivery, setDelivery] = useState(false)
  const [rush, setRush] = useState(false)
  const [result, setResult] = useState<QuoteResult | null>(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    fetch('http://localhost:4000/products')
      .then(r => r.json())
      .then(setProducts)

    const params = new URLSearchParams(window.location.search)
    const pid = params.get('product_id')
    if (pid) setProductId(pid)
  }, [])

  const calculate = async () => {
    if (!productId) return
    setLoading(true)
    const res = await fetch('http://localhost:4000/pricing/quote', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        product_id: productId,
        quantity,
        options: {
          ...(finish && { finish }),
          ...(side && { side }),
        },
        delivery,
        rush,
      }),
    })
    const data = await res.json()
    setResult(data)
    setLoading(false)
  }

  return (
    <main className="min-h-screen bg-gray-950 text-white">
      <nav className="border-b border-gray-800 px-8 py-4 flex items-center justify-between">
        <a href="/" className="text-2xl font-bold text-orange-500">BizPrint</a>
        <div className="flex gap-4">
          <a href="/products" className="text-gray-400 hover:text-white">Бүтээгдэхүүн</a>
          <a href="/quote" className="text-white font-semibold">Үнэ тооцоолол</a>
        </div>
      </nav>

      <div className="max-w-4xl mx-auto px-8 py-10">
        <h1 className="text-4xl font-bold mb-2">Үнэ тооцоолол</h1>
        <p className="text-gray-400 mb-8">Хэвлэлийн зардлаа урьдчилан тооцоол</p>

        <div className="grid grid-cols-2 gap-8">
          {/* Form */}
          <div className="space-y-6">

            {/* Product */}
            <div>
              <label className="block text-sm text-gray-400 mb-2">Бүтээгдэхүүн</label>
              <select
                value={productId}
                onChange={e => setProductId(e.target.value)}
                className="w-full bg-gray-900 border border-gray-700 rounded-lg px-4 py-3 text-white">
                <option value="">Сонгоно уу...</option>
                {products.map(p => (
                  <option key={p.id} value={p.id}>{p.name_mn}</option>
                ))}
              </select>
            </div>

            {/* Quantity */}
            <div>
              <label className="block text-sm text-gray-400 mb-2">
                Тоо ширхэг: <span className="text-orange-400 font-semibold">{quantity}</span>
              </label>
              <input
                type="range" min={10} max={5000} step={10}
                value={quantity}
                onChange={e => setQuantity(Number(e.target.value))}
                className="w-full accent-orange-500"
              />
              <div className="flex justify-between text-xs text-gray-500 mt-1">
                <span>10</span><span>500</span><span>1000</span><span>5000</span>
              </div>
            </div>

            {/* Finish */}
            <div>
              <label className="block text-sm text-gray-400 mb-2">Нааш боловсруулалт</label>
              <select
                value={finish}
                onChange={e => setFinish(e.target.value)}
                className="w-full bg-gray-900 border border-gray-700 rounded-lg px-4 py-3 text-white">
                <option value="">Байхгүй</option>
                <option value="matte_laminate">Матт ламинат (+20%)</option>
                <option value="gloss_laminate">Глосс ламинат (+18%)</option>
                <option value="soft_touch">Мягкий сенсор (+35%)</option>
              </select>
            </div>

            {/* Side */}
            <div>
              <label className="block text-sm text-gray-400 mb-2">Хэвлэх тал</label>
              <select
                value={side}
                onChange={e => setSide(e.target.value)}
                className="w-full bg-gray-900 border border-gray-700 rounded-lg px-4 py-3 text-white">
                <option value="">Нэг тал</option>
                <option value="double">Хоёр тал (+70%)</option>
              </select>
            </div>

            {/* Options */}
            <div className="flex gap-6">
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={delivery}
                  onChange={e => setDelivery(e.target.checked)}
                  className="accent-orange-500 w-4 h-4" />
                <span className="text-sm">Хүргэлт (+15,000₮)</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={rush}
                  onChange={e => setRush(e.target.checked)}
                  className="accent-orange-500 w-4 h-4" />
                <span className="text-sm">Яаралтай (+35%)</span>
              </label>
            </div>

            <button
              onClick={calculate}
              disabled={!productId || loading}
              className="w-full py-4 bg-orange-500 rounded-xl font-semibold text-lg hover:bg-orange-600 disabled:opacity-50">
              {loading ? 'Тооцоолж байна...' : '🧮 Үнэ тооцоолох'}
            </button>
          </div>

          {/* Result */}
          <div>
            {result ? (
              <div className="bg-gray-900 rounded-xl p-6 space-y-4">
                <h2 className="text-xl font-bold text-orange-400">{result.product_name}</h2>
                <div className="space-y-3">
                  {[
                    { label: 'Тоо ширхэг', value: `${result.quantity} ширхэг` },
                    { label: 'Нэгж үнэ', value: `${Number(result.unit_price).toLocaleString()}₮` },
                    { label: 'Нийт дүн', value: `${Number(result.subtotal).toLocaleString()}₮` },
                    { label: 'Платформ шимтгэл (15%)', value: `${Number(result.platform_margin).toLocaleString()}₮` },
                    { label: 'Хүргэлт', value: `${Number(result.delivery_fee).toLocaleString()}₮` },
                  ].map(row => (
                    <div key={row.label} className="flex justify-between text-sm border-b border-gray-800 pb-2">
                      <span className="text-gray-400">{row.label}</span>
                      <span>{row.value}</span>
                    </div>
                  ))}
                  <div className="flex justify-between font-bold text-xl pt-2">
                    <span>Нийт төлөх</span>
                    <span className="text-orange-400">{Number(result.total).toLocaleString()}₮</span>
                  </div>
                </div>
                <a href="/order"
                  className="block text-center mt-4 py-3 bg-orange-500 rounded-lg hover:bg-orange-600 font-semibold">
                  Захиалга өгөх →
                </a>
              </div>
            ) : (
              <div className="bg-gray-900 rounded-xl p-6 flex flex-col items-center justify-center h-full text-center">
                <div className="text-6xl mb-4">🧮</div>
                <p className="text-gray-400">Бүтээгдэхүүн сонгоод үнэ тооцоолно уу</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </main>
  )
}