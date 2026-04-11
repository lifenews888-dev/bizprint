'use client'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { API_URL } from '@/lib/api'

const CATEGORIES = [
  { id: 'all', label: 'Бүгд', icon: '🗂️' },
  { id: 'business-card', label: 'Нэрийн хуудас', icon: '💳' },
  { id: 'flyer', label: 'Флаер', icon: '📄' },
  { id: 'poster', label: 'Постер', icon: '🖼️' },
  { id: 'banner', label: 'Баннер', icon: '🏗️' },
  { id: 'sticker', label: 'Стикер', icon: '📎' },
  { id: 'brochure', label: 'Брошур', icon: '📋' },
]

export default function TemplatesPage() {
  const router = useRouter()
  const [templates, setTemplates] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [category, setCategory] = useState('all')
  const [search, setSearch] = useState('')

  useEffect(() => {
    setLoading(true)
    const url = category === 'all'
      ? `${API_URL}/api/templates`
      : `${API_URL}/api/templates?category=${category}`
    fetch(url)
      .then(r => r.json())
      .then(data => { setTemplates(Array.isArray(data) ? data : []); setLoading(false) })
      .catch(() => setLoading(false))
  }, [category])

  const filtered = templates.filter(t =>
    !search || (t.title_mn || t.title || '').toLowerCase().includes(search.toLowerCase())
  )

  const handleUse = (template: any) => {
    fetch(`${API_URL}/api/templates/${template.id}/use`, { method: 'PATCH' }).catch(() => {})
    router.push(`/design/editor?type=${template.category || 'business-card'}&templateId=${template.id}`)
  }

  return (
    <div style={{ maxWidth: 1100, margin: '0 auto', padding: '32px 20px' }}>
      <div style={{ textAlign: 'center', marginBottom: 32 }}>
        <h1 style={{ fontSize: 28, fontWeight: 800, color: 'var(--text)' }}>Загвар <span style={{ color: '#FF6B00' }}>сан</span></h1>
        <p style={{ fontSize: 14, color: 'var(--text3)', marginTop: 4 }}>Бэлэн загвараас сонгоод editor-т нээж өөрчилнө үү</p>
      </div>

      {/* Search */}
      <div style={{ maxWidth: 400, margin: '0 auto 24px' }}>
        <input type="text" placeholder="Загвар хайх..." value={search} onChange={e => setSearch(e.target.value)}
          style={{ width: '100%', padding: '12px 16px', borderRadius: 10, border: '1px solid var(--border)', background: 'var(--surface)', fontSize: 14, color: 'var(--text)', outline: 'none', boxSizing: 'border-box' }} />
      </div>

      {/* Category tabs */}
      <div style={{ display: 'flex', gap: 8, justifyContent: 'center', marginBottom: 32, flexWrap: 'wrap' }}>
        {CATEGORIES.map(c => (
          <button key={c.id} onClick={() => setCategory(c.id)} style={{ padding: '8px 18px', borderRadius: 99, border: '1px solid var(--border)', background: category === c.id ? '#FF6B00' : 'var(--surface)', color: category === c.id ? '#fff' : 'var(--text2)', fontSize: 13, fontWeight: 500, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 5 }}>
            <span>{c.icon}</span> {c.label}
          </button>
        ))}
      </div>

      {/* Loading */}
      {loading ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: 16 }}>
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i}>
              <div style={{ aspectRatio: '3/4', background: 'var(--surface2)', borderRadius: 14, marginBottom: 10, animation: 'pulse 1.5s infinite' }} />
              <div style={{ height: 14, background: 'var(--surface2)', borderRadius: 6, marginBottom: 6, width: '70%', animation: 'pulse 1.5s infinite' }} />
              <div style={{ height: 32, background: 'var(--surface2)', borderRadius: 8, animation: 'pulse 1.5s infinite' }} />
            </div>
          ))}
          <style>{`@keyframes pulse{0%,100%{opacity:1}50%{opacity:0.4}}`}</style>
        </div>
      ) : filtered.length === 0 ? (
        <div style={{ textAlign: 'center', padding: 60, color: 'var(--text3)' }}>
          <div style={{ fontSize: 48, marginBottom: 8 }}>📐</div>
          <p>Загвар олдсонгүй</p>
        </div>
      ) : (
        /* Grid */
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: 16 }}>
          {filtered.map(t => (
            <div key={t.id} className="template-card" style={{ borderRadius: 14, overflow: 'hidden', border: '1px solid var(--border)', background: 'var(--surface)' }}>
              <div style={{ position: 'relative', aspectRatio: '3/4', overflow: 'hidden' }}>
                <img src={t.thumbnail_url || `https://images.unsplash.com/photo-1611532736597-de2d4265fba3?w=400`} alt={t.title_mn || t.title} loading="lazy"
                  className="template-img" style={{ width: '100%', height: '100%', objectFit: 'cover', transition: 'transform 0.3s' }} />
                {/* Category badge */}
                <span style={{ position: 'absolute', top: 8, right: 8, padding: '3px 10px', borderRadius: 99, background: 'rgba(0,0,0,0.6)', color: '#fff', fontSize: 10, fontWeight: 500 }}>{t.category}</span>
                {Number(t.price) === 0 && (
                  <span style={{ position: 'absolute', top: 8, left: 8, padding: '3px 10px', borderRadius: 99, background: '#10B981', color: '#fff', fontSize: 10, fontWeight: 700 }}>Үнэгүй</span>
                )}
                {/* Hover overlay */}
                <div className="template-overlay" style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: 0, transition: 'opacity 0.3s' }}>
                  <button onClick={() => handleUse(t)}
                    style={{ padding: '10px 20px', background: '#fff', color: '#111', borderRadius: 10, border: 'none', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
                    🎨 Editor-т нээх
                  </button>
                </div>
              </div>
              <div style={{ padding: '12px 14px' }}>
                <h3 style={{ fontSize: 13, fontWeight: 700, color: 'var(--text)', marginBottom: 4 }}>{t.title_mn || t.title}</h3>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                  <span style={{ fontSize: 11, color: 'var(--text3)' }}>{t.use_count || 0} удаа ашигласан</span>
                  {t.designer_name && <span style={{ fontSize: 10, color: 'var(--text3)' }}>by {t.designer_name}</span>}
                </div>
                <div style={{ display: 'flex', gap: 6 }}>
                  <button onClick={() => handleUse(t)} style={{ flex: 1, padding: '8px 0', borderRadius: 8, background: '#FF6B00', color: '#fff', fontSize: 12, fontWeight: 600, border: 'none', cursor: 'pointer' }}>
                    Ашиглах
                  </button>
                  <Link href={`/quote?template=${t.id}`} style={{ padding: '8px 12px', borderRadius: 8, border: '1px solid var(--border)', fontSize: 12, color: 'var(--text2)', textDecoration: 'none' }}>
                    Үнэ
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* CTA */}
      <div style={{ textAlign: 'center', marginTop: 48, padding: '36px 24px', background: 'var(--surface)', borderRadius: 20, border: '1px solid var(--border)' }}>
        <h2 style={{ fontSize: 20, fontWeight: 700, color: 'var(--text)', marginBottom: 8 }}>Өөрийн загвар хэрэгтэй юу?</h2>
        <p style={{ fontSize: 13, color: 'var(--text3)', marginBottom: 20 }}>Scratch-аас эхлэн өөрийн дизайн бүтээнэ үү</p>
        <Link href="/design/editor" style={{ display: 'inline-block', padding: '12px 32px', background: '#FF6B00', color: '#fff', borderRadius: 12, textDecoration: 'none', fontSize: 14, fontWeight: 600 }}>🎨 Шинэ загвар үүсгэх</Link>
      </div>

      <style>{`
        .template-card:hover .template-overlay { opacity: 1 !important; }
        .template-card:hover .template-img { transform: scale(1.05); }
      `}</style>
    </div>
  )
}
