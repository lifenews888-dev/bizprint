'use client'
import { useState } from 'react'
import Link from 'next/link'

const FACTORIES = [
  { id: 1, name: 'МГ Принт', slug: 'mg-print', logo: 'https://images.unsplash.com/photo-1563986768609-322da13575f3?w=200&h=200&fit=crop', location: 'Хан-Уул дүүрэг', district: 'ХУД', types: ['Хулдаасан хэвлэл', 'UV хэвлэл', 'Офсет'], rating: 4.8, orders: 1240, verified: true, description: '2007 оноос хойш үйл ажиллагаа явуулж байгаа мэргэжлийн хэвлэлийн компани' },
  { id: 2, name: 'Соёмбо Принт', slug: 'soyombo', logo: 'https://images.unsplash.com/photo-1572044162444-ad60f128bdea?w=200&h=200&fit=crop', location: 'Сүхбаатар дүүрэг', district: 'СХД', types: ['Офсет хэвлэл', 'Үнэт цаас', 'Хайрцаг'], rating: 4.7, orders: 890, verified: true, description: 'Офсет хэвлэл, үнэт цаасны мэргэшсэн үйлдвэр' },
  { id: 3, name: 'Шинэпресс', slug: 'newpress', logo: 'https://images.unsplash.com/photo-1586075010923-2dd4570fb338?w=200&h=200&fit=crop', location: 'Баянгол дүүрэг', district: 'БГД', types: ['Офсет', 'Дижитал', 'Торгон хэвлэл'], rating: 4.6, orders: 670, verified: true, description: '2011 оноос тогтвортой үйл ажиллагаа явуулж байна' },
  { id: 4, name: 'Адмон Принт', slug: 'admon', logo: 'https://images.unsplash.com/photo-1497366216548-37526070297c?w=200&h=200&fit=crop', location: 'Чингэлтэй дүүрэг', district: 'ЧД', types: ['Хэвлэл', 'Хаяг реклам', 'LED самбар'], rating: 4.5, orders: 520, verified: false, description: 'Хаяг реклам, LED самбарт мэргэшсэн компани' },
  { id: 5, name: 'Интерпресс', slug: 'interpress', logo: 'https://images.unsplash.com/photo-1504384308090-c894fdcc538d?w=200&h=200&fit=crop', location: 'Сүхбаатар дүүрэг', district: 'СХД', types: ['Бүх төрлийн хэвлэл'], rating: 4.4, orders: 430, verified: false, description: '1996 оноос хэвлэлийн бүтээгдэхүүн үйлдвэрлэж байна' },
]

const DISTRICTS = ['Бүгд', 'ХУД', 'СХД', 'БГД', 'ЧД']
const SORT_OPTIONS = [
  { key: 'rating', label: 'Үнэлгээ' },
  { key: 'orders', label: 'Захиалгын тоо' },
]

export default function FactoryPage() {
  const [district, setDistrict] = useState('Бүгд')
  const [verifiedOnly, setVerifiedOnly] = useState(false)
  const [sort, setSort] = useState('rating')

  const filtered = FACTORIES
    .filter(f => district === 'Бүгд' || f.district === district)
    .filter(f => !verifiedOnly || f.verified)
    .sort((a, b) => sort === 'rating' ? b.rating - a.rating : b.orders - a.orders)

  return (
    <div style={{ maxWidth: 900, margin: '0 auto', padding: '32px 20px' }}>
      <div style={{ textAlign: 'center', marginBottom: 32 }}>
        <h1 style={{ fontSize: 28, fontWeight: 800, color: 'var(--text)' }}>Хэвлэлийн <span style={{ color: '#FF6B00' }}>үйлдвэрүүд</span></h1>
        <p style={{ fontSize: 14, color: 'var(--text3)', marginTop: 4 }}>Баталгаажсан хэвлэлийн компаниуд</p>
      </div>

      {/* Filters */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 24, flexWrap: 'wrap', alignItems: 'center' }}>
        <div style={{ display: 'flex', gap: 6 }}>
          {DISTRICTS.map(d => (
            <button key={d} onClick={() => setDistrict(d)} style={{ padding: '6px 14px', borderRadius: 99, border: '1px solid var(--border)', background: district === d ? '#FF6B00' : 'var(--surface)', color: district === d ? '#fff' : 'var(--text2)', fontSize: 12, fontWeight: 500, cursor: 'pointer' }}>
              {d}
            </button>
          ))}
        </div>
        <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: 'var(--text2)', cursor: 'pointer' }}>
          <input type="checkbox" checked={verifiedOnly} onChange={e => setVerifiedOnly(e.target.checked)} style={{ accentColor: '#FF6B00' }} />
          Баталгаажсан
        </label>
        <select value={sort} onChange={e => setSort(e.target.value)} style={{ padding: '6px 12px', borderRadius: 8, border: '1px solid var(--border)', background: 'var(--surface)', color: 'var(--text)', fontSize: 12, marginLeft: 'auto' }}>
          {SORT_OPTIONS.map(s => <option key={s.key} value={s.key}>{s.label}</option>)}
        </select>
      </div>

      {/* Factory list */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        {filtered.map(f => (
          <div key={f.id} style={{ display: 'flex', gap: 20, padding: 20, borderRadius: 14, border: '1px solid var(--border)', background: 'var(--surface)', alignItems: 'flex-start' }}>
            <img src={f.logo} alt={f.name} style={{ width: 72, height: 72, borderRadius: 12, objectFit: 'cover', flexShrink: 0 }} />
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                <h3 style={{ fontSize: 16, fontWeight: 700, color: 'var(--text)', margin: 0 }}>{f.name}</h3>
                {f.verified && <span style={{ padding: '2px 8px', borderRadius: 99, background: 'rgba(16,185,129,0.1)', color: '#10B981', fontSize: 10, fontWeight: 700 }}>✓ Verified</span>}
              </div>
              <p style={{ fontSize: 12, color: 'var(--text3)', marginBottom: 8 }}>📍 {f.location}</p>
              <p style={{ fontSize: 13, color: 'var(--text2)', marginBottom: 10, lineHeight: 1.5 }}>{f.description}</p>
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 10 }}>
                {f.types.map(t => (
                  <span key={t} style={{ padding: '3px 10px', borderRadius: 6, background: 'var(--surface2)', fontSize: 11, color: 'var(--text3)', fontWeight: 500 }}>{t}</span>
                ))}
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                <span style={{ fontSize: 13, color: '#F59E0B', fontWeight: 700 }}>★ {f.rating}</span>
                <span style={{ fontSize: 12, color: 'var(--text3)' }}>{f.orders.toLocaleString()} захиалга</span>
                <Link href="/quote" style={{ marginLeft: 'auto', padding: '8px 18px', borderRadius: 8, background: '#FF6B00', color: '#fff', textDecoration: 'none', fontSize: 12, fontWeight: 600 }}>
                  Үнийн санал авах
                </Link>
              </div>
            </div>
          </div>
        ))}
      </div>

      {filtered.length === 0 && (
        <div style={{ textAlign: 'center', padding: 60, color: 'var(--text3)' }}>
          <div style={{ fontSize: 48, marginBottom: 8 }}>🏭</div>
          <p>Үйлдвэр олдсонгүй</p>
        </div>
      )}
    </div>
  )
}
