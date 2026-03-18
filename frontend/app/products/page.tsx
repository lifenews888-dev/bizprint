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
  offset: '= DA5B',
  digital: '= 868B0;',
  wide_format: '= @3= D>@<0BK=',
  book: '= ><',
  packaging: '= !02;0300',
  promo: '< @><>',
}

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [selected, setSelected] = useState('all')
  const [search, setSearch] = useState('')
  const [sortBy, setSortBy] = useState('default')
  const [maxPrice, setMaxPrice] = useState(1000000)

  useEffect(() => {
    fetch('http://localhost:4000/products')
      .then(r => r.json())
      .then(data => {
        setProducts(data)
        setLoading(false)
      })
  }, [])

  const categories = ['all', ...Array.from(new Set(products.map(p => p.category)))]

  const filtered = products
    .filter(p => selected === 'all' || p.category === selected)
    .filter(p =>
      p.name_mn.toLowerCase().includes(search.toLowerCase()) ||
      p.name.toLowerCase().includes(search.toLowerCase())
    )
    .filter(p => Number(p.base_price) <= maxPrice)
    .sort((a, b) => {
      if (sortBy === 'price_asc') return Number(a.base_price) - Number(b.base_price)
      if (sortBy === 'price_desc') return Number(b.base_price) - Number(a.base_price)
      if (sortBy === 'fast') return a.lead_time_days - b.lead_time_days
      return 0
    })

  return (
    <main className="min-h-screen bg-gray-950 text-white">

      {/* Header */}
      <nav className="border-b border-gray-800 px-8 py-4 flex items-center justify-between">
        <a href="/" className="text-2xl font-bold text-orange-500">BizPrint</a>
        <div className="flex gap-4">
          <a href="/products" className="text-white font-semibold">BMM34ME=</a>
          <a href="/quote" className="text-gray-400 hover:text-white">=M B>>F>>;>;</a>
          <a href="/dashboard" className="text-gray-400 hover:text-white">Dashboard</a>
        </div>
      </nav>

      <div className="px-8 py-10">
        <h1 className="text-4xl font-bold mb-2">BMM34ME=4</h1>
        <p className="text-gray-400 mb-6">0E80;0E 1BMM34ME=MM A>=3>=> CC</p>

        {/* Search + Sort */}
        <div className="flex gap-4 mb-6">
          <div className="flex-1 relative">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">=</span>
            <input
              type="text"
              placeholder="BMM34ME= E09E..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full bg-gray-900 border border-gray-700 rounded-lg pl-10 pr-4 py-3 text-white focus:border-orange-500 outline-none"
            />
          </div>
          <select
            value={sortBy}
            onChange={e => setSortBy(e.target.value)}
            className="bg-gray-900 border border-gray-700 rounded-lg px-4 py-3 text-white focus:border-orange-500 outline-none">
            <option value="default">-@M<1M;ME</option>
            <option value="price_asc">=M: 1030  8E</option>
            <option value="price_desc">=M: 8E  1030</option>
            <option value="fast">%C@40= EC30F00</option>
          </select>
        </div>

        {/* Price filter */}
        <div className="mb-6 bg-gray-900 rounded-xl p-4">
          <div className="flex justify-between text-sm mb-2">
            <span className="text-gray-400">=89= 4MM4 EO7300@</span>
            <span className="text-orange-400 font-semibold">{maxPrice.toLocaleString()}</span>
          </div>
          <input
            type="range" min={10000} max={1000000} step={10000}
            value={maxPrice}
            onChange={e => setMaxPrice(Number(e.target.value))}
            className="w-full accent-orange-500"
          />
          <div className="flex justify-between text-xs text-gray-600 mt-1">
            <span>10,000</span>
            <span>500,000</span>
            <span>1,000,000</span>
          </div>
        </div>

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
              {cat === 'all' ? `=% 34 (${products.length})` : categoryLabel[cat] || cat}
            </button>
          ))}
        </div>

        {/* Result count */}
        <p className="text-gray-500 text-sm mb-4">
          {filtered.length} 1BMM34ME= >;4;>>
        </p>

        {/* Products grid */}
        {loading ? (
          <div className="text-center py-20 text-gray-400">G00;;06 109=0...</div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-20">
            <div className="text-5xl mb-4">=</div>
            <p className="text-gray-400">BMM34ME= >;4A>=39</p>
            <button onClick={() => { setSearch(''); setSelected('all'); setMaxPrice(1000000) }}
              className="mt-4 text-orange-400 hover:underline text-sm">
              Filter FM2M@;ME
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-3 gap-6">
            {filtered.map(product => (
              <div key={product.id}
                className="bg-gray-900 rounded-xl p-6 hover:bg-gray-800 border border-transparent hover:border-orange-500 transition-all cursor-pointer">
                <div className="text-sm text-orange-400 mb-2">
                  {categoryLabel[product.category] || product.category}
                </div>
                <h3 className="text-xl font-semibold mb-1">{product.name_mn}</h3>
                <p className="text-gray-400 text-sm mb-4">{product.name}</p>
                <div className="border-t border-gray-700 pt-4 space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-400">=4AM= =M</span>
                    <span className="text-orange-400 font-semibold">
                      {Number(product.base_price).toLocaleString()}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-400">%0<389= 1030 B>></span>
                    <span>{product.min_quantity} H8@EM3</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-400">%C30F00</span>
                    <span className={product.lead_time_days <= 2 ? 'text-green-400' : ''}>
                      {product.lead_time_days <= 2 ? ' ' : ''}{product.lead_time_days} 4@
                    </span>
                  </div>
                </div>
                <div className="flex gap-2 mt-4">
                  <a href={`/quote?product_id=${product.id}`}
                    className="flex-1 text-center py-2 bg-orange-500 rounded-lg hover:bg-orange-600 text-sm font-semibold">
                    =M B>>F>>;>E
                  </a>
                  <a href={`/order?product_id=${product.id}`}
                    className="flex-1 text-center py-2 border border-gray-600 rounded-lg hover:border-orange-500 text-sm">
                    0E80;0E
                  </a>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  )
}