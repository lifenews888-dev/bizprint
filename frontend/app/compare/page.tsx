'use client'
import { useState, useEffect } from 'react'
import { apiFetch } from '@/lib/api'
import { useStore } from '@/lib/store'

const fmt = (n: number) => '₮' + n.toLocaleString('mn-MN')

export default function ComparePage() {
  const { compare, toggleCompare, clearCompare } = useStore()
  const [products, setProducts] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!compare.length) { setLoading(false); return }
    apiFetch<any>('/products', { auth: false }).then(all => {
      if (Array.isArray(all)) setProducts(all.filter((p: any) => compare.includes(p.id)))
    }).catch(() => {}).finally(() => setLoading(false))
  }, [compare])

  // Collect all spec keys
  const allKeys = new Set<string>()
  products.forEach(p => { if (p.compare_specs) Object.keys(p.compare_specs).forEach(k => allKeys.add(k)) })
  const defaultKeys = ['category', 'base_price', 'sale_price', 'stock_quantity', 'lead_time_days', 'sku']

  if (loading) return <div className="min-h-screen flex items-center justify-center bg-[var(--bg)]"><div className="w-10 h-10 border-[3px] border-[var(--border)] border-t-[#FF6B00] rounded-full animate-spin" /></div>

  return (
    <div className="min-h-screen bg-[var(--bg)] text-[var(--text)]">
      <div className="max-w-[1200px] mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold">Бараа харьцуулах</h1>
            <p className="text-sm text-[var(--text3)]">{products.length}/4 бүтээгдэхүүн</p>
          </div>
          {products.length > 0 && (
            <button onClick={clearCompare} className="text-sm text-red-500 font-semibold bg-transparent border border-red-200 rounded-lg px-4 py-2 cursor-pointer hover:bg-red-50 transition-colors">
              Бүгдийг хасах
            </button>
          )}
        </div>

        {products.length === 0 ? (
          <div className="text-center py-20">
            <span className="text-5xl block mb-4">📊</span>
            <h2 className="text-lg font-bold text-[var(--text)] mb-2">Харьцуулах бараа байхгүй</h2>
            <p className="text-sm text-[var(--text3)] mb-4">Бүтээгдэхүүний хуудаснаас "Харьцуулах" товчийг дарна уу</p>
            <a href="/shop" className="inline-block px-6 py-2.5 bg-[#FF6B00] text-white rounded-lg text-sm font-bold no-underline hover:bg-[#E55D00] transition-colors">Дэлгүүр үзэх</a>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse min-w-[600px]">
              {/* Product headers */}
              <thead>
                <tr>
                  <th className="w-[160px] p-3 text-left text-xs font-semibold text-[var(--text3)] align-top border-b border-[var(--border)]">Бүтээгдэхүүн</th>
                  {products.map(p => (
                    <th key={p.id} className="p-3 text-center align-top border-b border-[var(--border)] min-w-[200px]">
                      <div className="relative">
                        <button onClick={() => toggleCompare(p.id)} className="absolute -top-1 -right-1 w-6 h-6 rounded-full bg-red-100 text-red-500 border-none cursor-pointer text-xs font-bold flex items-center justify-center hover:bg-red-200">×</button>
                        <div className="w-24 h-24 mx-auto rounded-xl overflow-hidden bg-[var(--surface2)] mb-2">
                          {p.thumbnail_url ? <img src={p.thumbnail_url} alt="" className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center text-3xl">🖨️</div>}
                        </div>
                        <a href={`/product/${p.slug || p.id}`} className="text-sm font-bold text-[var(--text)] no-underline hover:text-[#FF6B00] transition-colors">{p.name_mn || p.name}</a>
                        <div className="text-lg font-extrabold text-[#FF6B00] mt-1">{fmt(Number(p.sale_price ?? p.base_price ?? 0))}</div>
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {/* Default fields */}
                {[
                  { key: 'category', label: 'Ангилал' },
                  { key: 'base_price', label: 'Суурь үнэ', format: (v: any) => v ? fmt(Number(v)) : '—' },
                  { key: 'sale_price', label: 'Хямдрал үнэ', format: (v: any) => v ? fmt(Number(v)) : '—' },
                  { key: 'stock_quantity', label: 'Нөөц', format: (v: any) => v != null ? `${v} ш` : '—' },
                  { key: 'lead_time_days', label: 'Хүргэлт', format: (v: any) => v ? `${v} өдөр` : '—' },
                  { key: 'sku', label: 'SKU' },
                ].map(field => (
                  <tr key={field.key} className="border-b border-[var(--border)]/50">
                    <td className="p-3 text-xs font-semibold text-[var(--text3)]">{field.label}</td>
                    {products.map(p => (
                      <td key={p.id} className="p-3 text-sm text-center text-[var(--text)]">
                        {field.format ? field.format(p[field.key]) : (p[field.key] || '—')}
                      </td>
                    ))}
                  </tr>
                ))}
                {/* Dynamic specs */}
                {Array.from(allKeys).map(key => (
                  <tr key={key} className="border-b border-[var(--border)]/50">
                    <td className="p-3 text-xs font-semibold text-[var(--text3)]">{key}</td>
                    {products.map(p => (
                      <td key={p.id} className="p-3 text-sm text-center text-[var(--text)]">
                        {p.compare_specs?.[key] || '—'}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
