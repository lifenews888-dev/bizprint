'use client'
import { useState } from 'react'
import Link from 'next/link'

const CATEGORIES = ['Бүгд', 'Визит карт', 'Флаер', 'Постер', 'Баннер', 'Ном', 'Каталог']

const TEMPLATES = [
  { id: 1, name: 'Корпорэйт визит карт', category: 'Визит карт', thumbnail: 'https://images.unsplash.com/photo-1611532736597-de2d4265fba3?w=400&h=300&fit=crop', tags: ['минималист', 'корпорэйт'], popular: true },
  { id: 2, name: 'Креатив визит карт', category: 'Визит карт', thumbnail: 'https://images.unsplash.com/photo-1572044162444-ad60f128bdea?w=400&h=300&fit=crop', tags: ['креатив', 'өнгөлөг'], popular: false },
  { id: 3, name: 'Минимал визит карт', category: 'Визит карт', thumbnail: 'https://images.unsplash.com/photo-1589041127168-9b1915731dc3?w=400&h=300&fit=crop', tags: ['минимал', 'цэвэр'], popular: true },
  { id: 4, name: 'Бизнес флаер', category: 'Флаер', thumbnail: 'https://images.unsplash.com/photo-1586281380349-632531db7ed4?w=400&h=300&fit=crop', tags: ['флаер', 'промо'], popular: false },
  { id: 5, name: 'Хүнсний флаер', category: 'Флаер', thumbnail: 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=400&h=300&fit=crop', tags: ['хүнс', 'ресторан'], popular: true },
  { id: 6, name: 'Иж бүрэн флаер', category: 'Флаер', thumbnail: 'https://images.unsplash.com/photo-1557804506-669a67965ba0?w=400&h=300&fit=crop', tags: ['бизнес'], popular: false },
  { id: 7, name: 'Арга хэмжээний постер', category: 'Постер', thumbnail: 'https://images.unsplash.com/photo-1492684223f-36772ef3fa5c?w=400&h=300&fit=crop', tags: ['арга хэмжээ'], popular: true },
  { id: 8, name: 'Кино постер', category: 'Постер', thumbnail: 'https://images.unsplash.com/photo-1536440136628-849c177e76a1?w=400&h=300&fit=crop', tags: ['кино', 'урлаг'], popular: false },
  { id: 9, name: 'Хөгжмийн постер', category: 'Постер', thumbnail: 'https://images.unsplash.com/photo-1514320291840-2e0a9bf2a9ae?w=400&h=300&fit=crop', tags: ['хөгжим', 'концерт'], popular: false },
  { id: 10, name: 'Роллап баннер', category: 'Баннер', thumbnail: 'https://images.unsplash.com/photo-1558618666-fcd25c85f82e?w=400&h=300&fit=crop', tags: ['роллап', 'стенд'], popular: true },
  { id: 11, name: 'Гадна баннер', category: 'Баннер', thumbnail: 'https://images.unsplash.com/photo-1557804506-669a67965ba0?w=400&h=300&fit=crop', tags: ['гадна', 'реклам'], popular: false },
  { id: 12, name: 'Дотор баннер', category: 'Баннер', thumbnail: 'https://images.unsplash.com/photo-1542744173-8e7e53415bb0?w=400&h=300&fit=crop', tags: ['дотор', 'арга хэмжээ'], popular: false },
  { id: 13, name: 'Түүх ном', category: 'Ном', thumbnail: 'https://images.unsplash.com/photo-1544947950-fa07a98d237f?w=400&h=300&fit=crop', tags: ['ном', 'хэвлэл'], popular: false },
  { id: 14, name: 'Хүүхдийн ном', category: 'Ном', thumbnail: 'https://images.unsplash.com/photo-1512820790803-83ca734da794?w=400&h=300&fit=crop', tags: ['хүүхэд'], popular: true },
  { id: 15, name: 'Сурах бичиг', category: 'Ном', thumbnail: 'https://images.unsplash.com/photo-1497633762265-9d179a990aa6?w=400&h=300&fit=crop', tags: ['боловсрол'], popular: false },
  { id: 16, name: 'Компанийн каталог', category: 'Каталог', thumbnail: 'https://images.unsplash.com/photo-1586075010923-2dd4570fb338?w=400&h=300&fit=crop', tags: ['каталог', 'корпорэйт'], popular: true },
  { id: 17, name: 'Бүтээгдэхүүний каталог', category: 'Каталог', thumbnail: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=400&h=300&fit=crop', tags: ['бүтээгдэхүүн'], popular: false },
  { id: 18, name: 'Үйлчилгээний каталог', category: 'Каталог', thumbnail: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=400&h=300&fit=crop', tags: ['үйлчилгээ'], popular: false },
]

export default function TemplatesPage() {
  const [cat, setCat] = useState('Бүгд')
  const [search, setSearch] = useState('')

  const filtered = TEMPLATES.filter(t => {
    const matchCat = cat === 'Бүгд' || t.category === cat
    const matchSearch = !search || t.name.toLowerCase().includes(search.toLowerCase())
    return matchCat && matchSearch
  })

  return (
    <div style={{ maxWidth: 1100, margin: '0 auto', padding: '32px 20px' }}>
      <div style={{ textAlign: 'center', marginBottom: 32 }}>
        <h1 style={{ fontSize: 28, fontWeight: 800, color: 'var(--text)' }}>Загвар <span style={{ color: '#FF6B00' }}>сан</span></h1>
        <p style={{ fontSize: 14, color: 'var(--text3)', marginTop: 4 }}>Хэвлэлийн загваруудыг үнэгүй ашиглаарай</p>
      </div>

      {/* Search */}
      <div style={{ maxWidth: 400, margin: '0 auto 24px' }}>
        <input type="text" placeholder="Загвар хайх..." value={search} onChange={e => setSearch(e.target.value)}
          style={{ width: '100%', padding: '12px 16px', borderRadius: 10, border: '1px solid var(--border)', background: 'var(--surface)', fontSize: 14, color: 'var(--text)', outline: 'none', boxSizing: 'border-box' }} />
      </div>

      {/* Category tabs */}
      <div style={{ display: 'flex', gap: 8, justifyContent: 'center', marginBottom: 32, flexWrap: 'wrap' }}>
        {CATEGORIES.map(c => (
          <button key={c} onClick={() => setCat(c)} style={{ padding: '8px 18px', borderRadius: 99, border: '1px solid var(--border)', background: cat === c ? '#FF6B00' : 'var(--surface)', color: cat === c ? '#fff' : 'var(--text2)', fontSize: 13, fontWeight: 500, cursor: 'pointer' }}>
            {c}
          </button>
        ))}
      </div>

      {/* Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 20 }}>
        {filtered.map(t => (
          <div key={t.id} style={{ borderRadius: 14, overflow: 'hidden', border: '1px solid var(--border)', background: 'var(--surface)', transition: 'box-shadow 0.2s' }}>
            <div style={{ position: 'relative', height: 180, overflow: 'hidden' }}>
              <img src={t.thumbnail} alt={t.name} loading="lazy" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              {t.popular && (
                <span style={{ position: 'absolute', top: 8, left: 8, padding: '3px 10px', borderRadius: 99, background: '#FF6B00', color: '#fff', fontSize: 10, fontWeight: 700 }}>Popular</span>
              )}
              <span style={{ position: 'absolute', top: 8, right: 8, padding: '3px 10px', borderRadius: 99, background: 'rgba(0,0,0,0.6)', color: '#fff', fontSize: 10, fontWeight: 500 }}>{t.category}</span>
            </div>
            <div style={{ padding: '14px 16px' }}>
              <h3 style={{ fontSize: 14, fontWeight: 700, color: 'var(--text)', marginBottom: 8 }}>{t.name}</h3>
              <div style={{ display: 'flex', gap: 6, marginBottom: 12 }}>
                {t.tags.map(tag => (
                  <span key={tag} style={{ padding: '2px 8px', borderRadius: 6, background: 'var(--surface2)', fontSize: 10, color: 'var(--text3)' }}>#{tag}</span>
                ))}
              </div>
              <Link href={`/quote?template=${t.id}`} style={{ display: 'block', textAlign: 'center', padding: '8px 0', borderRadius: 8, background: '#FF6B00', color: '#fff', fontSize: 13, fontWeight: 600, textDecoration: 'none' }}>
                Ашиглах →
              </Link>
            </div>
          </div>
        ))}
      </div>

      {filtered.length === 0 && (
        <div style={{ textAlign: 'center', padding: 60, color: 'var(--text3)' }}>
          <div style={{ fontSize: 48, marginBottom: 8 }}>🔍</div>
          <p>Загвар олдсонгүй</p>
        </div>
      )}
    </div>
  )
}
