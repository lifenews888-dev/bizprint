'use client'

import { useState, useEffect, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import SearchBar from '@/components/marketplace/SearchBar'
import FilterPanel, { DEFAULT_FILTERS, type Filters } from '@/components/marketplace/FilterPanel'
import CreatorCard, { type Creator } from '@/components/marketplace/CreatorCard'
import { apiFetch } from '@/lib/api'

/* ═══════════════════════════════════════
 *  CONSTANTS
 * ═══════════════════════════════════════ */

const CREATOR_TYPES = [
  { key: '', label: 'Бүгд', icon: '🎯' },
  { key: 'social', label: 'Сошиал контент', icon: '📱' },
  { key: 'print', label: 'Хэвлэл дизайн', icon: '🖨️' },
  { key: 'live', label: 'Live борлуулалт', icon: '🔴' },
  { key: 'ai', label: 'AI контент', icon: '🤖' },
  { key: 'ugc', label: 'UGC контент', icon: '🎬' },
]

const SORT_OPTIONS = [
  { value: 'recommended', label: 'Санал болгох' },
  { value: 'rating', label: 'Үнэлгээ' },
  { value: 'price_low', label: 'Үнэ: Бага → Их' },
  { value: 'price_high', label: 'Үнэ: Их → Бага' },
  { value: 'delivery', label: 'Хурдан хүргэлт' },
  { value: 'reviews', label: 'Шүүмж олонтой' },
]

/* Demo data — replaced by API in production */
const DEMO_CREATORS: Creator[] = [
  { id: '1', name: 'Болор Б.', level: 'elite', rating: 4.9, reviewCount: 128, tags: ['Сошиал контент', 'Reels', 'TikTok'], startingPrice: 80000, deliveryDays: 2, matchScore: 95, type: 'social', completedJobs: 245, responseTime: '1 цаг' },
  { id: '2', name: 'Тэмүүлэн О.', level: 'expert', rating: 4.8, reviewCount: 87, tags: ['Лого дизайн', 'Брэндинг', 'Брошур'], startingPrice: 120000, deliveryDays: 3, matchScore: 88, type: 'print', completedJobs: 180, responseTime: '2 цаг' },
  { id: '3', name: 'Сарангэрэл Д.', level: 'pro', rating: 4.7, reviewCount: 64, tags: ['Live борлуулалт', 'Facebook', 'Бүтээгдэхүүн'], startingPrice: 200000, deliveryDays: 1, matchScore: 82, type: 'live', completedJobs: 95, responseTime: '30 мин' },
  { id: '4', name: 'Ганбаатар М.', level: 'expert', rating: 4.9, reviewCount: 156, tags: ['AI контент', 'Midjourney', 'Зураг боловсруулалт'], startingPrice: 60000, deliveryDays: 1, matchScore: 91, type: 'ai', completedJobs: 320, responseTime: '1 цаг' },
  { id: '5', name: 'Оюунтунгалаг Б.', level: 'pro', rating: 4.6, reviewCount: 42, tags: ['UGC видео', 'Бүтээгдэхүүн танилцуулга'], startingPrice: 150000, deliveryDays: 3, matchScore: 75, type: 'ugc', completedJobs: 67, responseTime: '3 цаг' },
  { id: '6', name: 'Батбаяр Э.', level: 'elite', rating: 5.0, reviewCount: 203, tags: ['Постер', 'Баннер', 'Хэвлэл'], startingPrice: 100000, deliveryDays: 2, matchScore: 93, type: 'print', completedJobs: 410, responseTime: '45 мин' },
  { id: '7', name: 'Номин С.', level: 'starter', rating: 4.3, reviewCount: 15, tags: ['Сошиал контент', 'Instagram'], startingPrice: 30000, deliveryDays: 4, type: 'social', completedJobs: 18, responseTime: '5 цаг' },
  { id: '8', name: 'Энхтүвшин Л.', level: 'pro', rating: 4.5, reviewCount: 53, tags: ['AI контент', 'Копирайтинг', 'ChatGPT'], startingPrice: 45000, deliveryDays: 2, type: 'ai', completedJobs: 88, responseTime: '2 цаг' },
  { id: '9', name: 'Мөнхзул Г.', level: 'expert', rating: 4.8, reviewCount: 91, tags: ['UGC видео', 'Unboxing', 'Review'], startingPrice: 180000, deliveryDays: 2, matchScore: 86, type: 'ugc', completedJobs: 142, responseTime: '1.5 цаг' },
  { id: '10', name: 'Дэлгэрмаа Ц.', level: 'starter', rating: 4.1, reviewCount: 8, tags: ['Live борлуулалт', 'TikTok Shop'], startingPrice: 100000, deliveryDays: 1, type: 'live', completedJobs: 12, responseTime: '4 цаг' },
  { id: '11', name: 'Ариунболд Н.', level: 'elite', rating: 4.9, reviewCount: 175, tags: ['Хэвлэл дизайн', 'Каталог', 'Брошюр'], startingPrice: 250000, deliveryDays: 4, matchScore: 78, type: 'print', completedJobs: 290, responseTime: '1 цаг' },
  { id: '12', name: 'Цэцэгмаа А.', level: 'pro', rating: 4.6, reviewCount: 38, tags: ['Сошиал контент', 'YouTube', 'Thumbnail'], startingPrice: 55000, deliveryDays: 3, type: 'social', completedJobs: 55, responseTime: '2 цаг' },
]

/* ═══════════════════════════════════════
 *  MARKETPLACE PAGE
 * ═══════════════════════════════════════ */

export default function MarketplacePage() {
  const router = useRouter()
  const [creators, setCreators] = useState<Creator[]>(DEMO_CREATORS)
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [activeSearch, setActiveSearch] = useState('')
  const [filters, setFilters] = useState<Filters>(DEFAULT_FILTERS)
  const [sort, setSort] = useState('recommended')
  const [mobileFilters, setMobileFilters] = useState(false)
  const [activeType, setActiveType] = useState('')

  /* Fetch creators from API (falls back to demo) */
  useEffect(() => {
    apiFetch<Creator[]>('/marketplace/creators', { auth: false })
      .then(data => { if (Array.isArray(data) && data.length > 0) setCreators(data) })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  /* Filter + sort logic */
  const filtered = useMemo(() => {
    let result = [...creators]

    // Search
    if (activeSearch) {
      const q = activeSearch.toLowerCase()
      result = result.filter(c =>
        c.name.toLowerCase().includes(q) ||
        c.tags.some(t => t.toLowerCase().includes(q)) ||
        (c.type || '').toLowerCase().includes(q)
      )
    }

    // Type tab
    if (activeType) {
      result = result.filter(c => c.type === activeType)
    }

    // Content type filter
    if (filters.contentType) {
      result = result.filter(c => c.type === filters.contentType)
    }

    // Price range
    result = result.filter(c =>
      c.startingPrice >= filters.priceRange[0] && c.startingPrice <= filters.priceRange[1]
    )

    // Delivery
    if (filters.deliveryDays > 0) {
      result = result.filter(c => c.deliveryDays <= filters.deliveryDays)
    }

    // Rating
    if (filters.minRating > 0) {
      result = result.filter(c => c.rating >= filters.minRating)
    }

    // Level
    if (filters.creatorLevel) {
      result = result.filter(c => c.level === filters.creatorLevel)
    }

    // Sort
    switch (sort) {
      case 'rating': result.sort((a, b) => b.rating - a.rating); break
      case 'price_low': result.sort((a, b) => a.startingPrice - b.startingPrice); break
      case 'price_high': result.sort((a, b) => b.startingPrice - a.startingPrice); break
      case 'delivery': result.sort((a, b) => a.deliveryDays - b.deliveryDays); break
      case 'reviews': result.sort((a, b) => b.reviewCount - a.reviewCount); break
      default: result.sort((a, b) => (b.matchScore || 0) - (a.matchScore || 0)); break
    }

    return result
  }, [creators, activeSearch, activeType, filters, sort])

  const recommended = useMemo(
    () => creators.filter(c => (c.matchScore || 0) >= 85).slice(0, 4),
    [creators]
  )

  const handleSearch = (q: string) => {
    const normalized = q.toLowerCase()
    if (normalized.includes('нэрийн хуудас') || normalized.includes('business card') || normalized.includes('name card')) {
      router.push('/business-cards')
      return
    }
    setActiveSearch(q)
    setSearch(q)
  }

  return (
    <div style={{ background: 'var(--bg)', minHeight: '100vh' }}>
      {/* Hero */}
      <section
        className="relative overflow-hidden py-12 sm:py-16"
        style={{ background: 'linear-gradient(135deg, var(--surface) 0%, var(--surface2) 100%)' }}
      >
        <div className="max-w-6xl mx-auto px-4 text-center">
          <h1 className="text-3xl sm:text-4xl font-bold mb-3" style={{ color: 'var(--text)' }}>
            Creator <span style={{ color: 'var(--primary)' }}>Marketplace</span>
          </h1>
          <p className="text-sm sm:text-base mb-8 max-w-lg mx-auto" style={{ color: 'var(--text2)' }}>
            Монголын шилдэг контент бүтээгчдийг олж, бизнесээ өсгө
          </p>

          <SearchBar value={search} onChange={setSearch} onSearch={handleSearch} />

          {/* Type tabs */}
          <div className="flex flex-wrap justify-center gap-2 mt-8">
            {CREATOR_TYPES.map(t => (
              <button
                key={t.key}
                onClick={() => { setActiveType(t.key); if (t.key) setFilters(f => ({ ...f, contentType: t.key })) ; if (!t.key) setFilters(f => ({ ...f, contentType: '' })) }}
                className="px-4 py-2 rounded-xl text-sm font-medium transition-all"
                style={{
                  background: activeType === t.key ? 'var(--primary)' : 'var(--surface)',
                  color: activeType === t.key ? '#fff' : 'var(--text2)',
                  border: `1px solid ${activeType === t.key ? 'var(--primary)' : 'var(--border)'}`,
                }}
              >
                {t.icon} {t.label}
              </button>
            ))}
          </div>
        </div>

        {/* Decorative dots */}
        <div
          className="absolute -bottom-6 left-1/2 -translate-x-1/2 w-40 h-12 rounded-full blur-3xl opacity-30"
          style={{ background: 'var(--primary)' }}
        />
      </section>

      {/* AI Recommended */}
      {recommended.length > 0 && !activeSearch && (
        <section className="max-w-6xl mx-auto px-4 mt-10">
          <div className="flex items-center gap-2 mb-4">
            <span
              className="px-2 py-0.5 rounded-md text-xs font-semibold"
              style={{ background: 'var(--secondary)', color: '#fff' }}
            >
              AI
            </span>
            <h2 className="font-bold text-lg" style={{ color: 'var(--text)' }}>
              Танд санал болгох
            </h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {recommended.map(c => (
              <CreatorCard key={c.id} creator={c} onViewProfile={id => router.push(`/creators/${id}`)} />
            ))}
          </div>
        </section>
      )}

      {/* Main content */}
      <section className="max-w-6xl mx-auto px-4 mt-10 pb-16">
        {/* Toolbar */}
        <div className="flex items-center justify-between mb-5 gap-3 flex-wrap">
          <div className="flex items-center gap-3">
            <button
              className="lg:hidden px-3 py-2 rounded-xl text-sm font-medium"
              style={{ background: 'var(--surface)', border: '1px solid var(--border)', color: 'var(--text2)' }}
              onClick={() => setMobileFilters(true)}
            >
              ☰ Шүүлтүүр
            </button>
            <p className="text-sm" style={{ color: 'var(--text3)' }}>
              {filtered.length} creator олдлоо
              {activeSearch && <span> — &ldquo;{activeSearch}&rdquo;</span>}
            </p>
          </div>
          <select
            value={sort}
            onChange={e => setSort(e.target.value)}
            className="px-3 py-2 rounded-xl text-sm"
            style={{ background: 'var(--surface)', border: '1px solid var(--border)', color: 'var(--text)' }}
          >
            {SORT_OPTIONS.map(o => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>
        </div>

        <div className="flex gap-6">
          {/* Filter sidebar */}
          <FilterPanel
            filters={filters}
            onChange={setFilters}
            onReset={() => { setFilters(DEFAULT_FILTERS); setActiveType('') }}
            mobileOpen={mobileFilters}
            onMobileClose={() => setMobileFilters(false)}
          />

          {/* Grid */}
          <div className="flex-1 min-w-0">
            {loading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {Array.from({ length: 6 }).map((_, i) => (
                  <div
                    key={i}
                    className="rounded-2xl h-64 animate-pulse"
                    style={{ background: 'var(--surface)' }}
                  />
                ))}
              </div>
            ) : filtered.length === 0 ? (
              <div className="text-center py-20">
                <p className="text-4xl mb-3">🔍</p>
                <p className="font-semibold" style={{ color: 'var(--text)' }}>Creator олдсонгүй</p>
                <p className="text-sm mt-1" style={{ color: 'var(--text3)' }}>
                  Шүүлтүүр эсвэл хайлтаа өөрчилнө үү
                </p>
                <button
                  onClick={() => { setFilters(DEFAULT_FILTERS); setActiveSearch(''); setSearch(''); setActiveType('') }}
                  className="mt-4 px-4 py-2 rounded-xl text-sm font-medium"
                  style={{ background: 'var(--primary)', color: '#fff' }}
                >
                  Бүгдийг харах
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {filtered.map(c => (
                  <CreatorCard key={c.id} creator={c} onViewProfile={id => router.push(`/creators/${id}`)} />
                ))}
              </div>
            )}
          </div>
        </div>
      </section>
    </div>
  )
}
