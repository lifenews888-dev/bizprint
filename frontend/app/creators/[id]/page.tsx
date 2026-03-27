'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { apiFetch } from '@/lib/api'
import OrderModal from '@/components/marketplace/OrderModal'
import type { Creator } from '@/components/marketplace/CreatorCard'

/* ═══════════════════════════════════════
 *  CONSTANTS
 * ═══════════════════════════════════════ */

const LEVEL_CONFIG: Record<string, { label: string; color: string; bg: string }> = {
  starter: { label: 'Starter', color: '#6B7280', bg: 'rgba(107,114,128,0.12)' },
  pro:     { label: 'Pro',     color: '#3B82F6', bg: 'rgba(59,130,246,0.12)' },
  expert:  { label: 'Expert',  color: '#8B5CF6', bg: 'rgba(139,92,246,0.12)' },
  elite:   { label: 'Elite',   color: '#FF6B00', bg: 'rgba(255,107,0,0.12)' },
}

interface Package {
  name: string
  label: string
  price: number
  deliveryDays: number
  revisions: number
  features: string[]
}

interface Review {
  id: string
  author: string
  rating: number
  text: string
  date: string
}

interface PortfolioItem {
  id: string
  type: 'image' | 'video'
  url: string
  title: string
}

const DEMO_PACKAGES: Package[] = [
  {
    name: 'starter', label: 'Starter', price: 50000, deliveryDays: 5, revisions: 1,
    features: ['1 контент', 'Стандарт чанар', '1 засвар'],
  },
  {
    name: 'business', label: 'Business', price: 150000, deliveryDays: 3, revisions: 3,
    features: ['3 контент', 'Өндөр чанар', '3 засвар', 'Эх файл'],
  },
  {
    name: 'pro', label: 'Pro', price: 350000, deliveryDays: 2, revisions: 5,
    features: ['5 контент', 'Премиум чанар', '5 засвар', 'Эх файл', 'Экспресс'],
  },
]

const DEMO_PORTFOLIO: PortfolioItem[] = [
  { id: '1', type: 'image', url: '', title: 'Брэнд контент #1' },
  { id: '2', type: 'image', url: '', title: 'Сошиал постер' },
  { id: '3', type: 'video', url: '', title: 'UGC видео' },
  { id: '4', type: 'image', url: '', title: 'Лого дизайн' },
  { id: '5', type: 'image', url: '', title: 'Баннер дизайн' },
  { id: '6', type: 'image', url: '', title: 'Нэрийн хуудас' },
]

const DEMO_REVIEWS: Review[] = [
  { id: '1', author: 'Ганболд Б.', rating: 5, text: 'Маш чанартай ажил хийсэн. Цаг хугацаандаа хүргэсэн. Дахин хамтрана!', date: '2026-03-15' },
  { id: '2', author: 'Нансалмаа Д.', rating: 5, text: 'Гайхалтай сайн дизайн. Бүх шаардлагыг хангасан.', date: '2026-03-10' },
  { id: '3', author: 'Баярсайхан О.', rating: 4, text: 'Сайн ажилласан, зөвхөн бага зэрэг засвар хэрэгтэй байсан.', date: '2026-02-28' },
  { id: '4', author: 'Мөнхтуяа Г.', rating: 5, text: 'Хурдан, чанартай. 100% сэтгэл хангалуун!', date: '2026-02-20' },
]

/* Demo creator fallback */
const DEMO_CREATOR: Creator & { bio: string } = {
  id: '1', name: 'Болор Б.', level: 'elite', rating: 4.9, reviewCount: 128,
  tags: ['Сошиал контент', 'Reels', 'TikTok', 'Instagram', 'Брэнд контент'],
  startingPrice: 80000, deliveryDays: 2, matchScore: 95, type: 'social',
  completedJobs: 245, responseTime: '1 цаг',
  bio: 'Сошиал медиа контент бүтээгч. 3+ жилийн туршлагатай. Instagram, TikTok, Facebook-д зориулсан контент бүтээнэ. 100+ брэндтэй хамтарсан туршлагатай. Танай бизнесийн онлайн дүр төрхийг өсгөнө.',
}

/* ═══════════════════════════════════════
 *  CREATOR PROFILE PAGE
 * ═══════════════════════════════════════ */

export default function CreatorProfilePage() {
  const params = useParams()
  const router = useRouter()
  const [creator, setCreator] = useState<Creator & { bio?: string }>(DEMO_CREATOR)
  const [packages, setPackages] = useState<Package[]>(DEMO_PACKAGES)
  const [portfolio, setPortfolio] = useState<PortfolioItem[]>(DEMO_PORTFOLIO)
  const [reviews, setReviews] = useState<Review[]>(DEMO_REVIEWS)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'portfolio' | 'packages' | 'about' | 'reviews'>('portfolio')
  const [orderOpen, setOrderOpen] = useState(false)

  useEffect(() => {
    if (!params.id) return
    setLoading(true)
    Promise.all([
      apiFetch<any>(`/marketplace/creators/${params.id}`, { auth: false }).catch(() => null),
      apiFetch<any[]>(`/marketplace/creators/${params.id}/portfolio`, { auth: false }).catch(() => []),
      apiFetch<any[]>(`/marketplace/creators/${params.id}/reviews`, { auth: false }).catch(() => []),
    ]).then(([c, p, r]) => {
      if (c) setCreator(c)
      if (Array.isArray(p) && p.length > 0) setPortfolio(p)
      if (Array.isArray(r) && r.length > 0) setReviews(r)
    }).finally(() => setLoading(false))
  }, [params.id])

  const level = LEVEL_CONFIG[creator.level] || LEVEL_CONFIG.starter

  const TABS = [
    { key: 'portfolio', label: 'Портфолио', count: portfolio.length },
    { key: 'packages', label: 'Багцууд', count: packages.length },
    { key: 'about', label: 'Тухай' },
    { key: 'reviews', label: 'Шүүмж', count: reviews.length },
  ] as const

  if (loading) {
    return (
      <div style={{ background: 'var(--bg)', minHeight: '100vh' }} className="flex items-center justify-center">
        <div className="animate-pulse space-y-4 w-full max-w-3xl px-4">
          <div className="h-48 rounded-2xl" style={{ background: 'var(--surface)' }} />
          <div className="h-64 rounded-2xl" style={{ background: 'var(--surface)' }} />
        </div>
      </div>
    )
  }

  return (
    <div style={{ background: 'var(--bg)', minHeight: '100vh' }}>
      {/* Back navigation */}
      <div className="max-w-5xl mx-auto px-4 pt-6">
        <button
          onClick={() => router.push('/marketplace')}
          className="flex items-center gap-1.5 text-sm font-medium mb-4"
          style={{ color: 'var(--text2)' }}
        >
          ← Marketplace
        </button>
      </div>

      {/* Profile header */}
      <section className="max-w-5xl mx-auto px-4">
        <div
          className="rounded-2xl p-6 sm:p-8"
          style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}
        >
          <div className="flex flex-col sm:flex-row gap-5">
            {/* Avatar */}
            <div
              className="w-24 h-24 rounded-2xl flex items-center justify-center text-3xl font-bold shrink-0"
              style={{
                background: creator.avatar ? `url(${creator.avatar}) center/cover` : 'var(--primary-gradient)',
                color: '#fff',
              }}
            >
              {!creator.avatar && creator.name.charAt(0).toUpperCase()}
            </div>

            {/* Info */}
            <div className="flex-1 min-w-0">
              <div className="flex flex-wrap items-start gap-3 mb-2">
                <h1 className="text-2xl font-bold" style={{ color: 'var(--text)' }}>
                  {creator.name}
                </h1>
                <span
                  className="px-3 py-1 rounded-lg text-xs font-semibold"
                  style={{ background: level.bg, color: level.color }}
                >
                  {creator.level === 'elite' && '⭐ '}{level.label}
                </span>
              </div>

              {/* Stats row */}
              <div className="flex flex-wrap gap-4 mt-3">
                <Stat icon="★" iconColor="#F59E0B" value={`${creator.rating.toFixed(1)} (${creator.reviewCount})`} label="Үнэлгээ" />
                <Stat icon="⏱" value={creator.responseTime || '—'} label="Хариу цаг" />
                <Stat icon="✓" value={`${creator.completedJobs || 0}`} label="Дууссан ажил" />
                <Stat icon="📅" value={`${creator.deliveryDays} хоног`} label="Хүргэлт" />
              </div>
            </div>

            {/* CTA */}
            <div className="flex flex-col gap-2 shrink-0 sm:items-end">
              <button
                onClick={() => setOrderOpen(true)}
                className="px-6 py-3 rounded-xl text-sm font-bold text-white transition-colors"
                style={{ background: 'var(--primary)' }}
                onMouseEnter={e => (e.currentTarget.style.background = 'var(--primary-hover)')}
                onMouseLeave={e => (e.currentTarget.style.background = 'var(--primary)')}
              >
                Захиалга өгөх
              </button>
              <button
                className="px-6 py-2.5 rounded-xl text-sm font-medium transition-colors"
                style={{ background: 'var(--surface2)', color: 'var(--text2)', border: '1px solid var(--border)' }}
              >
                Чат бичих
              </button>
              <p className="text-xs mt-1" style={{ color: 'var(--text3)' }}>
                Эхлэх үнэ: <span style={{ color: 'var(--primary)' }}>₮{creator.startingPrice.toLocaleString()}</span>
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Tabs */}
      <section className="max-w-5xl mx-auto px-4 mt-6">
        <div className="flex gap-1 overflow-x-auto pb-1">
          {TABS.map(t => (
            <button
              key={t.key}
              onClick={() => setActiveTab(t.key)}
              className="px-4 py-2.5 rounded-xl text-sm font-medium transition-colors whitespace-nowrap"
              style={{
                background: activeTab === t.key ? 'var(--orange-10)' : 'transparent',
                color: activeTab === t.key ? 'var(--primary)' : 'var(--text2)',
              }}
            >
              {t.label}
              {'count' in t && t.count !== undefined && (
                <span
                  className="ml-1.5 px-1.5 py-0.5 rounded-md text-xs"
                  style={{ background: 'var(--surface2)', color: 'var(--text3)' }}
                >
                  {t.count}
                </span>
              )}
            </button>
          ))}
        </div>
      </section>

      {/* Tab content */}
      <section className="max-w-5xl mx-auto px-4 mt-4 pb-16">
        {/* Portfolio */}
        {activeTab === 'portfolio' && (
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {portfolio.map(item => (
              <div
                key={item.id}
                className="aspect-square rounded-xl overflow-hidden relative group cursor-pointer"
                style={{ background: 'var(--surface2)', border: '1px solid var(--border)' }}
              >
                {item.url ? (
                  item.type === 'video' ? (
                    <video src={item.url} className="w-full h-full object-cover" />
                  ) : (
                    <img src={item.url} alt={item.title} className="w-full h-full object-cover" />
                  )
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <span className="text-3xl">{item.type === 'video' ? '🎬' : '🖼️'}</span>
                  </div>
                )}
                {/* Overlay */}
                <div
                  className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-3"
                >
                  <p className="text-white text-sm font-medium">{item.title}</p>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Packages */}
        {activeTab === 'packages' && (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {packages.map((pkg, i) => (
              <div
                key={pkg.name}
                className="rounded-2xl p-5 relative overflow-hidden"
                style={{
                  background: 'var(--surface)',
                  border: `1.5px solid ${i === 1 ? 'var(--primary)' : 'var(--border)'}`,
                }}
              >
                {i === 1 && (
                  <div
                    className="absolute top-0 left-0 right-0 py-1 text-center text-xs font-bold text-white"
                    style={{ background: 'var(--primary)' }}
                  >
                    Хамгийн их сонгодог
                  </div>
                )}
                <div className={i === 1 ? 'mt-4' : ''}>
                  <h3 className="font-bold text-base" style={{ color: 'var(--text)' }}>{pkg.label}</h3>
                  <p className="text-2xl font-bold mt-2" style={{ color: 'var(--primary)' }}>
                    ₮{pkg.price.toLocaleString()}
                  </p>
                  <p className="text-xs mt-1" style={{ color: 'var(--text3)' }}>
                    {pkg.deliveryDays} хоног · {pkg.revisions} засвар
                  </p>
                  <ul className="mt-4 space-y-2">
                    {pkg.features.map(f => (
                      <li key={f} className="flex items-center gap-2 text-sm" style={{ color: 'var(--text2)' }}>
                        <span style={{ color: '#10B981' }}>✓</span> {f}
                      </li>
                    ))}
                  </ul>
                  <button
                    onClick={() => setOrderOpen(true)}
                    className="w-full mt-5 py-2.5 rounded-xl text-sm font-semibold transition-colors"
                    style={{
                      background: i === 1 ? 'var(--primary)' : 'var(--surface2)',
                      color: i === 1 ? '#fff' : 'var(--text)',
                      border: i === 1 ? 'none' : '1px solid var(--border)',
                    }}
                  >
                    Сонгох
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* About */}
        {activeTab === 'about' && (
          <div
            className="rounded-2xl p-6"
            style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}
          >
            <h3 className="font-bold mb-3" style={{ color: 'var(--text)' }}>Тухай</h3>
            <p className="text-sm leading-relaxed" style={{ color: 'var(--text2)' }}>
              {creator.bio || 'Мэдээлэл байхгүй'}
            </p>
            <h3 className="font-bold mt-6 mb-3" style={{ color: 'var(--text)' }}>Ур чадвар</h3>
            <div className="flex flex-wrap gap-2">
              {creator.tags.map(tag => (
                <span
                  key={tag}
                  className="px-3 py-1.5 rounded-lg text-sm font-medium"
                  style={{ background: 'var(--surface2)', color: 'var(--text2)', border: '1px solid var(--border)' }}
                >
                  {tag}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Reviews */}
        {activeTab === 'reviews' && (
          <div className="space-y-3">
            {reviews.map(r => (
              <div
                key={r.id}
                className="rounded-xl p-4"
                style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <div
                      className="w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold"
                      style={{ background: 'var(--surface2)', color: 'var(--text2)' }}
                    >
                      {r.author.charAt(0)}
                    </div>
                    <span className="font-medium text-sm" style={{ color: 'var(--text)' }}>{r.author}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <span key={i} className="text-sm" style={{ color: i < r.rating ? '#F59E0B' : 'var(--border)' }}>
                        ★
                      </span>
                    ))}
                  </div>
                </div>
                <p className="text-sm" style={{ color: 'var(--text2)' }}>{r.text}</p>
                <p className="text-xs mt-2" style={{ color: 'var(--text3)' }}>{r.date}</p>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Order modal */}
      <OrderModal creator={creator} open={orderOpen} onClose={() => setOrderOpen(false)} />
    </div>
  )
}

function Stat({ icon, iconColor, value, label }: { icon: string; iconColor?: string; value: string; label: string }) {
  return (
    <div className="flex items-center gap-2">
      <span style={{ color: iconColor || 'var(--text3)' }}>{icon}</span>
      <div>
        <p className="text-sm font-semibold" style={{ color: 'var(--text)' }}>{value}</p>
        <p className="text-xs" style={{ color: 'var(--text3)' }}>{label}</p>
      </div>
    </div>
  )
}
