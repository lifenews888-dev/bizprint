'use client'
import { useState, useEffect } from 'react'
import { API_URL } from '@/lib/api'

const CATEGORIES = ['Бүгд', 'Нэрийн хуудас', 'Флаер', 'Баннер', 'Хаяг', 'Ном', 'Хайрцаг', 'Стикер']

const FALLBACK_GALLERY = [
  { id: 1, title: 'Корпорэйт нэрийн хуудас', category: 'Нэрийн хуудас', image: 'https://images.unsplash.com/photo-1611532736597-de2d4265fba3?w=600', description: '350gsm, soft-touch ламинат', featured: true },
  { id: 2, title: 'Алтан фойл визит карт', category: 'Нэрийн хуудас', image: 'https://images.unsplash.com/photo-1572044162444-ad60f128bdea?w=600', description: 'Алтан фойл дарлалтай, матт' },
  { id: 3, title: 'Минимал визит', category: 'Нэрийн хуудас', image: 'https://images.unsplash.com/photo-1589041127168-9b1915731dc3?w=600', description: '300gsm, хоёр талдаа хэвлэл' },
  { id: 4, title: 'Spot UV визит', category: 'Нэрийн хуудас', image: 'https://images.unsplash.com/photo-1616628188540-925618b3f14f?w=600', description: 'Spot UV гялгар бүрэлт' },
  { id: 5, title: 'Ресторан флаер', category: 'Флаер', image: 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=600', description: 'A5, 2 талдаа хэвлэл', featured: true },
  { id: 6, title: 'Фитнес промо флаер', category: 'Флаер', image: 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=600', description: 'A4, гялгар ламинат' },
  { id: 7, title: 'Хүнсний флаер', category: 'Флаер', image: 'https://images.unsplash.com/photo-1586281380349-632531db7ed4?w=600', description: 'A5, матт бүрэлт' },
  { id: 8, title: 'Концертын флаер', category: 'Флаер', image: 'https://images.unsplash.com/photo-1514320291840-2e0a9bf2a9ae?w=600', description: 'A6, 4+4 хэвлэл' },
  { id: 9, title: 'Роллап стенд', category: 'Баннер', image: 'https://images.unsplash.com/photo-1558618666-fcd25c85f82e?w=600', description: '85×200cm, PVC хэвлэл', featured: true },
  { id: 10, title: 'Гадна баннер', category: 'Баннер', image: 'https://images.unsplash.com/photo-1557804506-669a67965ba0?w=600', description: '3×2м, хулдаас хэвлэл' },
  { id: 11, title: 'Арга хэмжээний баннер', category: 'Баннер', image: 'https://images.unsplash.com/photo-1542744173-8e7e53415bb0?w=600', description: '2×1м, PVC' },
  { id: 12, title: 'X-banner стенд', category: 'Баннер', image: 'https://images.unsplash.com/photo-1551135049-8a33b5883817?w=600', description: '60×160cm, PVC' },
  { id: 13, title: '3D товгор үсэг', category: 'Хаяг', image: 'https://images.unsplash.com/photo-1563986768609-322da13575f3?w=600', description: 'Нерж, LED гэрэлтэй', featured: true },
  { id: 14, title: 'Гэрэлт самбар', category: 'Хаяг', image: 'https://images.unsplash.com/photo-1533750349088-cd871a92f312?w=600', description: 'LED backlit, акрил' },
  { id: 15, title: 'PVC хаяг', category: 'Хаяг', image: 'https://images.unsplash.com/photo-1555774698-0b77e0d5fac6?w=600', description: 'PVC, UV хэвлэл' },
  { id: 16, title: 'Алтан нерж хаяг', category: 'Хаяг', image: 'https://images.unsplash.com/photo-1497366216548-37526070297c?w=600', description: 'Нерж, лазер зүсэлт' },
  { id: 17, title: 'Компанийн каталог', category: 'Ном', image: 'https://images.unsplash.com/photo-1586075010923-2dd4570fb338?w=600', description: 'A4, 32 хуудас, садлаар', featured: true },
  { id: 18, title: 'Хүүхдийн ном', category: 'Ном', image: 'https://images.unsplash.com/photo-1512820790803-83ca734da794?w=600', description: 'A5, зузаан хавтастай' },
  { id: 19, title: 'Сурах бичиг', category: 'Ном', image: 'https://images.unsplash.com/photo-1497633762265-9d179a990aa6?w=600', description: 'B5, 200 хуудас, офсет' },
  { id: 20, title: 'Нүүр будалтын хайрцаг', category: 'Хайрцаг', image: 'https://images.unsplash.com/photo-1556228578-0d85b1a4d571?w=600', description: 'Хатуу хавтаг, UV хэвлэл' },
  { id: 21, title: 'Хүнсний хайрцаг', category: 'Хайрцаг', image: 'https://images.unsplash.com/photo-1607082349566-187342175e2f?w=600', description: 'E-commerce, хүнсний зэрэглэл' },
  { id: 22, title: 'Бэлэг дурсгалын хайрцаг', category: 'Хайрцаг', image: 'https://images.unsplash.com/photo-1513885535751-8b9238bd345a?w=600', description: 'Тусгай зүсэлт, фойл' },
  { id: 23, title: 'Гоо сайхны хайрцаг', category: 'Хайрцаг', image: 'https://images.unsplash.com/photo-1596462502278-27bfdc403348?w=600', description: 'Дээд зэрэглэлийн материал' },
  { id: 24, title: 'Эмийн хайрцаг', category: 'Хайрцаг', image: 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=600', description: 'Стандарт хайрцаг, бар код' },
  { id: 25, title: 'Брэндийн стикер', category: 'Стикер', image: 'https://images.unsplash.com/photo-1588345921523-c2dcdb7f1dcd?w=600', description: 'Vinyl, Die-cut', featured: true },
  { id: 26, title: 'Бүтээгдэхүүний шошго', category: 'Стикер', image: 'https://images.unsplash.com/photo-1570831739435-6601aa3fa4fb?w=600', description: 'Ороомог шошго, 500ш' },
]

export default function GalleryPage() {
  const [cat, setCat] = useState('Бүгд')
  const [lightbox, setLightbox] = useState<any>(null)
  const [gallery, setGallery] = useState(FALLBACK_GALLERY)

  // Try fetching from API, fallback to static data
  useEffect(() => {
    fetch(`${API_URL}/api/gallery`).then(r => r.json())
      .then((data: any[]) => {
        if (Array.isArray(data) && data.length >= 5) {
          setGallery(data.map((g, i) => ({
            id: g.id || i,
            title: g.title || g.name || '',
            category: g.category || '',
            image: g.image_url || g.image || '',
            description: g.description || '',
            featured: g.is_featured || false,
          })))
        }
      }).catch(() => {})
  }, [])

  const filtered = gallery.filter(g => cat === 'Бүгд' || g.category === cat)
  const counts = CATEGORIES.reduce((acc, c) => {
    acc[c] = c === 'Бүгд' ? gallery.length : gallery.filter(g => g.category === c).length
    return acc
  }, {} as Record<string, number>)

  return (
    <div style={{ maxWidth: 1100, margin: '0 auto', padding: '32px 20px' }}>
      <div style={{ textAlign: 'center', marginBottom: 32 }}>
        <h1 style={{ fontSize: 28, fontWeight: 800, color: 'var(--text)' }}>Бүтээлийн <span style={{ color: '#FF6B00' }}>галерей</span></h1>
        <p style={{ fontSize: 14, color: 'var(--text3)', marginTop: 4 }}>Манай хэвлэлийн шилдэг бүтээлүүд</p>
      </div>

      {/* Category filter */}
      <div style={{ display: 'flex', gap: 8, justifyContent: 'center', marginBottom: 32, flexWrap: 'wrap' }}>
        {CATEGORIES.filter(c => counts[c] > 0).map(c => (
          <button key={c} onClick={() => setCat(c)} style={{ padding: '8px 18px', borderRadius: 99, border: '1px solid var(--border)', background: cat === c ? '#FF6B00' : 'var(--surface)', color: cat === c ? '#fff' : 'var(--text2)', fontSize: 13, fontWeight: 500, cursor: 'pointer', transition: 'all 0.2s' }}>
            {c} {c !== 'Бүгд' && <span style={{ opacity: 0.7 }}>({counts[c]})</span>}
          </button>
        ))}
      </div>

      {/* Masonry grid */}
      <div style={{ columnCount: 3, columnGap: 16 }} className="gallery-masonry">
        {filtered.map(g => (
          <div key={g.id} onClick={() => setLightbox(g)} className="gallery-item" style={{ breakInside: 'avoid', marginBottom: 16, borderRadius: 12, overflow: 'hidden', border: '1px solid var(--border)', background: 'var(--surface)', cursor: 'pointer', position: 'relative' }}>
            <div style={{ position: 'relative', overflow: 'hidden' }}>
              <img src={g.image} alt={g.title} loading="lazy" className="gallery-img" style={{ width: '100%', display: 'block', transition: 'transform 0.3s' }} />
              {/* Hover overlay */}
              <div className="gallery-overlay" style={{ position: 'absolute', inset: 0, background: 'linear-gradient(transparent 40%, rgba(0,0,0,0.6))', opacity: 0, transition: 'opacity 0.3s', display: 'flex', alignItems: 'flex-end', padding: 12 }}>
                <span style={{ color: '#fff', fontSize: 12, fontWeight: 600 }}>Дэлгэрэнгүй үзэх</span>
              </div>
              {(g as any).featured && (
                <span style={{ position: 'absolute', top: 8, left: 8, fontSize: 10, fontWeight: 700, background: '#FF6B00', color: '#fff', padding: '3px 8px', borderRadius: 6 }}>Онцлох</span>
              )}
            </div>
            <div style={{ padding: '10px 14px' }}>
              <h3 style={{ fontSize: 13, fontWeight: 700, color: 'var(--text)', marginBottom: 2 }}>{g.title}</h3>
              <p style={{ fontSize: 11, color: 'var(--text3)' }}>{g.description}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Lightbox */}
      {lightbox && (
        <div onClick={() => setLightbox(null)} style={{ position: 'fixed', inset: 0, zIndex: 9999, background: 'rgba(0,0,0,0.92)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
          <div onClick={e => e.stopPropagation()} style={{ maxWidth: 700, width: '100%', borderRadius: 16, overflow: 'hidden', background: 'var(--surface)' }}>
            <img src={lightbox.image} alt={lightbox.title} style={{ width: '100%', display: 'block', maxHeight: '60vh', objectFit: 'cover' }} />
            <div style={{ padding: '20px 24px' }}>
              <h2 style={{ fontSize: 18, fontWeight: 700, color: 'var(--text)', marginBottom: 4 }}>{lightbox.title}</h2>
              <p style={{ fontSize: 13, color: 'var(--text3)', marginBottom: 4 }}>{lightbox.category} · {lightbox.description}</p>
              <div style={{ display: 'flex', gap: 8, marginTop: 16 }}>
                <a href="/quote" style={{ flex: 1, textAlign: 'center', padding: '10px 0', borderRadius: 10, background: '#FF6B00', color: '#fff', textDecoration: 'none', fontSize: 13, fontWeight: 600 }}>Ижил захиалах →</a>
                <button onClick={() => setLightbox(null)} style={{ flex: 1, padding: '10px 0', borderRadius: 10, background: 'var(--surface2)', color: 'var(--text2)', border: '1px solid var(--border)', fontSize: 13, cursor: 'pointer' }}>Хаах</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* CTA */}
      <div style={{ textAlign: 'center', marginTop: 48, padding: '36px 24px', background: 'var(--surface)', borderRadius: 20, border: '1px solid var(--border)' }}>
        <h2 style={{ fontSize: 20, fontWeight: 700, color: 'var(--text)', marginBottom: 8 }}>Таны бизнест тохирсон хэвлэл хэрэгтэй юу?</h2>
        <p style={{ fontSize: 13, color: 'var(--text3)', marginBottom: 20 }}>Үнийн санал авах, захиалга өгөх</p>
        <a href="/quote" style={{ display: 'inline-block', padding: '12px 32px', background: '#FF6B00', color: '#fff', borderRadius: 12, textDecoration: 'none', fontSize: 14, fontWeight: 600 }}>Үнэ тооцоолох →</a>
      </div>

      <style>{`
        @media (max-width: 768px) { .gallery-masonry { column-count: 2 !important; } }
        @media (max-width: 480px) { .gallery-masonry { column-count: 1 !important; } }
        .gallery-item:hover .gallery-overlay { opacity: 1 !important; }
        .gallery-item:hover .gallery-img { transform: scale(1.05); }
      `}</style>
    </div>
  )
}
