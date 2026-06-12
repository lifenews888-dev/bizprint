'use client'
import { useState, useEffect, Suspense } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { API_URL } from '@/lib/api'
import { fbPixel } from '@/components/FacebookPixel'

const SUGGESTED_SEARCHES = ['Нэрийн хуудас', 'Флаер', 'Баннер', 'Стикер', 'Каталог', 'Роллап', 'Постер', 'Ном']

interface SearchProduct {
  id: string
  slug?: string | null
  thumbnail_url?: string | null
  name_mn?: string | null
  name?: string | null
  base_price?: number | string | null
}

const isSearchProduct = (item: unknown): item is SearchProduct =>
  typeof item === 'object' && item !== null && 'id' in item

function SearchResults() {
  const params = useSearchParams()
  const router = useRouter()
  const q = params.get('q') || ''
  const [results, setResults] = useState<SearchProduct[]>([])
  const [loading, setLoading] = useState(false)
  const [query, setQuery] = useState(q)

  useEffect(() => {
    if (!q || q.length < 2) return
    fbPixel.search(q)
    const controller = new AbortController()
    const loadingTimer = window.setTimeout(() => setLoading(true), 0)
    fetch(`${API_URL}/api/products/search?q=${encodeURIComponent(q)}`, { signal: controller.signal })
      .then(r => r.json())
      .then((data: unknown) => { setResults(Array.isArray(data) ? data.filter(isSearchProduct) : []); setLoading(false) })
      .catch(error => {
        if (error instanceof DOMException && error.name === 'AbortError') return
        setLoading(false)
      })
    return () => {
      window.clearTimeout(loadingTimer)
      controller.abort()
    }
  }, [q])

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    if (query.trim()) router.push(`/search?q=${encodeURIComponent(query)}`)
  }

  return (
    <div style={{ maxWidth: 900, margin: '0 auto', padding: '32px 20px' }}>
      <form onSubmit={handleSearch} style={{ display: 'flex', gap: 10, marginBottom: 28 }}>
        <input value={query} onChange={e => setQuery(e.target.value)} placeholder="Бүтээгдэхүүн хайх..." autoFocus
          style={{ flex: 1, padding: '14px 18px', borderRadius: 12, border: '1px solid var(--border)', background: 'var(--surface)', fontSize: 15, color: 'var(--text)', outline: 'none', boxSizing: 'border-box' }} />
        <button type="submit" style={{ padding: '14px 24px', borderRadius: 12, background: '#FF6B00', color: '#fff', border: 'none', fontSize: 14, fontWeight: 600, cursor: 'pointer' }}>Хайх</button>
      </form>

      {q && <p style={{ fontSize: 13, color: 'var(--text3)', marginBottom: 20 }}>&ldquo;{q}&rdquo; — {loading ? 'Хайж байна...' : `${results.length} үр дүн`}</p>}

      {/* Suggested searches — when no query */}
      {!q && (
        <div style={{ marginTop: 8 }}>
          <p style={{ fontSize: 13, color: 'var(--text3)', marginBottom: 12 }}>Түгээмэл хайлтууд:</p>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            {SUGGESTED_SEARCHES.map(s => (
              <button key={s} onClick={() => router.push(`/search?q=${encodeURIComponent(s)}`)}
                style={{ padding: '8px 16px', border: '1px solid var(--border)', borderRadius: 20, background: 'var(--surface)', fontSize: 13, color: 'var(--text2)', cursor: 'pointer' }}>
                🔍 {s}
              </button>
            ))}
          </div>
        </div>
      )}

      {loading && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 16 }}>
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} style={{ borderRadius: 12, overflow: 'hidden', border: '1px solid var(--border)' }}>
              <div style={{ aspectRatio: '1', background: 'var(--surface2)', animation: 'pulse 1.5s infinite' }} />
              <div style={{ padding: 12 }}>
                <div style={{ height: 14, background: 'var(--surface2)', borderRadius: 6, marginBottom: 8, animation: 'pulse 1.5s infinite' }} />
                <div style={{ height: 14, background: 'var(--surface2)', borderRadius: 6, width: '50%', animation: 'pulse 1.5s infinite' }} />
              </div>
            </div>
          ))}
        </div>
      )}

      {!loading && results.length > 0 && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 16 }}>
          {results.map(p => {
            const productName = p.name_mn || p.name || 'Бүтээгдэхүүн'
            return (
            <Link key={p.id} href={`/shop/${p.slug || p.id}`} style={{ textDecoration: 'none', borderRadius: 12, overflow: 'hidden', border: '1px solid var(--border)', background: 'var(--surface)', display: 'block' }}>
              <div style={{ aspectRatio: '1', background: 'var(--surface2)', overflow: 'hidden' }}>
                {p.thumbnail_url ? <img src={p.thumbnail_url} alt={productName} loading="lazy" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', fontSize: 40, opacity: 0.2 }}>📦</div>}
              </div>
              <div style={{ padding: 12 }}>
                <p style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)', marginBottom: 4, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{productName}</p>
                <p style={{ fontSize: 14, fontWeight: 700, color: '#FF6B00' }}>
                  {Number(p.base_price) > 0 ? <><span style={{ fontSize: 11, color: 'var(--text3)', fontWeight: 400 }}>-аас </span>₮{Number(p.base_price).toLocaleString()}</> : 'Үнэ авах'}
                </p>
              </div>
            </Link>
          )})}
        </div>
      )}

      {!loading && q && results.length === 0 && (
        <div style={{ textAlign: 'center', padding: 60 }}>
          <div style={{ fontSize: 48, marginBottom: 12 }}>🔍</div>
          <p style={{ color: 'var(--text)', fontWeight: 600, marginBottom: 8 }}>&ldquo;{q}&rdquo; хайлтад тохирох бүтээгдэхүүн олдсонгүй</p>
          <p style={{ color: 'var(--text3)', fontSize: 13, marginBottom: 20 }}>Өөр үгээр хайж үзнэ үү эсвэл доорх ангилалуудаас сонгоно уу</p>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, justifyContent: 'center', marginBottom: 24 }}>
            {SUGGESTED_SEARCHES.map(s => (
              <button key={s} onClick={() => router.push(`/search?q=${encodeURIComponent(s)}`)}
                style={{ padding: '8px 16px', background: '#FFF7ED', border: 'none', borderRadius: 20, fontSize: 13, color: '#FF6B00', cursor: 'pointer', fontWeight: 500 }}>
                {s}
              </button>
            ))}
          </div>
          <Link href="/shop" style={{ color: 'var(--text3)', textDecoration: 'none', fontSize: 13 }}>Бүх бүтээгдэхүүн харах →</Link>
        </div>
      )}

      <style>{`@keyframes pulse{0%,100%{opacity:1}50%{opacity:0.4}}`}</style>
    </div>
  )
}

export default function SearchPage() {
  return <Suspense fallback={<div style={{ padding: 60, textAlign: 'center', color: 'var(--text3)' }}>Ачааллаж байна...</div>}><SearchResults /></Suspense>
}
