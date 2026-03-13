'use client'

import { useEffect, useState } from 'react'

interface Product {
  id: string
  name: string
  name_mn: string
  category: string
  base_price: number
  min_quantity: number
  lead_time_days: number
  is_active: boolean
}

const categoryLabel: Record<string, string> = {
  offset: '🖨️ Офсет',
  digital: '💻 Дижитал',
  wide_format: '📐 Өргөн форматын',
  book: '📚 Ном',
  packaging: '📦 Савлагаа',
  promo: '🎁 Промо',
}

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [selected, setSelected] = useState<string>('all')

  useEffect(() => {
    fetch('http://localhost:4000/products')
      .then(r => r.json())
      .then(data => {
        setProducts(data)
        setLoading(false)
      })
  }, [])

  const categories = ['all', ...Array.from(new Set(products.map(p => p.category)))]

  const filtered = selected === 'all'
    ? products
    : products.filter(p => p.category === selected)

  return (
    <main className="min-h-screen bg-gray-950 text-white">

      {/* Header */}
      <nav className="border-b border-gray-800 px-8 py-4 flex items-center justify-between">
        <a href="/" className="text-2xl font-bold text-orange-500">BizPrint</a>
        <div className="flex gap-4">
          <a href="/products" className="text-white font-semibold">Бүтээгдэхүүн</a>
          <a href="/quote" className="text-gray-400 hover:text-white">Үнэ тооцоолол</a>
        </div>
      </nav>

      <div className="px-8 py-10">
        <h1 className="text-4xl font-bold mb-2">Бүтээгдэхүүнүүд</h1>
        <p className="text-gray-400 mb-8">Захиалах бүтээгдэхүүнээ сонгоно уу</p>

        {/* Category filter */}
        <div className="flex gap-3 mb-8 flex-wrap">
          {categories.map(cat => (
            <button
              key={cat}
              onClick={() => setSelected(cat)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                selected === cat
                  ? 'bg-orange-500 text-white'
                  : 'bg-gray-900 text-gray-400 hover:bg-gray-800'
              }`}
            >
              {cat === 'all' ? '🔥 Бүгд' : categoryLabel[cat] || cat}
            </button>
          ))}
        </div>

        {/* Products grid */}
        {loading ? (
          <div className="text-center py-20 text-gray-400">Ачааллаж байна...</div>
        ) : (
          <div className="grid grid-cols-3 gap-6">
            {filtered.map(product => (
              <div key={product.id}
                className="bg-gray-900 rounded-xl p-6 hover:bg-gray-800 hover:border hover:border-orange-500 transition-all cursor-pointer">
                <div className="text-sm text-orange-400 mb-2">
                  {categoryLabel[product.category] || product.category}
                </div>
                <h3 className="text-xl font-semibold mb-1">{product.name_mn}</h3>
                <p className="text-gray-400 text-sm mb-4">{product.name}</p>
                <div className="border-t border-gray-700 pt-4 space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-400">Үндсэн үнэ</span>
                    <span className="text-orange-400 font-semibold">
                      {Number(product.base_price).toLocaleString()}₮
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-400">Хамгийн бага тоо</span>
                    <span>{product.min_quantity} ширхэг</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-400">Хугацаа</span>
                    <span>{product.lead_time_days} өдөр</span>
                  </div>
                </div>
                <a href={`/quote?product_id=${product.id}`}
                  className="mt-4 w-full block text-center py-2 bg-orange-500 rounded-lg hover:bg-orange-600 text-sm font-semibold">
                  Үнэ тооцоолох
                </a>
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  )
}