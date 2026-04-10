'use client'
import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { API_URL } from '@/lib/api'

const SLUG_LABELS: Record<string, string> = {
  'business-card': 'Нэрийн хуудас', 'flyer': 'Флаер', 'banner': 'Баннер',
  'sticker': 'Стикер', 'book': 'Ном & Каталог', 'packaging': 'Сав баглаа',
  'signage': 'Хаяг & Самбар', 'merchandise': 'Бэлэг дурсгал', 'apparel': 'Текстиль',
  'office': 'Оффисын хэвлэл', 'events': 'Арга хэмжээ',
}

export default function CategoryPage() {
  const { slug } = useParams<{ slug: string }>()
  const [products, setProducts] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const label = SLUG_LABELS[slug] || slug?.replace(/-/g, ' ')

  useEffect(() => {
    fetch(`${API_URL}/api/products?category=${slug}`)
      .then(r => r.json())
      .then(d => { setProducts(Array.isArray(d) ? d : []); setLoading(false) })
      .catch(() => setLoading(false))
  }, [slug])

  return (
    <div style={{ maxWidth: 1100, margin: '0 auto', padding: '32px 20px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: 'var(--text3)', marginBottom: 20 }}>
        <Link href="/shop" style={{ color: 'var(--text3)', textDecoration: 'none' }}>Дэлгүүр</Link>
        <span>/</span>
        <span style={{ color: 'var(--text)' }}>{label}</span>
      </div>

      <h1 style={{ fontSize: 24, fontWeight: 700, color: 'var(--text)', marginBottom: 24 }}>{label}</h1>

      {loading ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 16 }}>
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} style={{ borderRadius: 12, overflow: 'hidden', border: '1px solid var(--border)' }}>
              <div style={{ aspectRatio: '1', background: 'var(--surface2)', animation: 'pulse 1.5s infinite' }} />
              <div style={{ padding: 12 }}>
                <div style={{ height: 14, background: 'var(--surface2)', borderRadius: 6, marginBottom: 8 }} />
                <div style={{ height: 14, background: 'var(--surface2)', borderRadius: 6, width: '50%' }} />
              </div>
            </div>
          ))}
          <style>{`@keyframes pulse{0%,100%{opacity:1}50%{opacity:0.4}}`}</style>
        </div>
      ) : products.length === 0 ? (
        <div style={{ textAlign: 'center', padding: 60 }}>
          <div style={{ fontSize: 48, marginBottom: 12 }}>📦</div>
          <p style={{ color: 'var(--text3)', marginBottom: 16 }}>Энэ ангилалд бүтээгдэхүүн байхгүй байна</p>
          <Link href="/shop" style={{ color: '#FF6B00', textDecoration: 'none', fontWeight: 600 }}>Бүх бүтээгдэхүүн →</Link>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 16 }}>
          {products.map((p: any) => (
            <Link key={p.id} href={`/shop/${p.slug || p.id}`} style={{ textDecoration: 'none', borderRadius: 12, overflow: 'hidden', border: '1px solid var(--border)', background: 'var(--surface)', display: 'block' }}>
              <div style={{ aspectRatio: '1', background: 'var(--surface2)', overflow: 'hidden' }}>
                {p.thumbnail_url ? <img src={p.thumbnail_url} alt={p.name_mn} loading="lazy" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', fontSize: 40, opacity: 0.2 }}>📦</div>}
              </div>
              <div style={{ padding: 12 }}>
                <p style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)', marginBottom: 4, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.name_mn || p.name}</p>
                <p style={{ fontSize: 14, fontWeight: 700, color: '#FF6B00' }}>₮{Number(p.base_price).toLocaleString()}</p>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
