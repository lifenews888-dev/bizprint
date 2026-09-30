'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { Search, Newspaper, X } from 'lucide-react'
import { apiFetch } from '@/lib/api'
import {
  LeadPostCard, PostCard, PostCardSkeletonGrid, type BlogPost,
} from '@/components/blog/PostCard'

interface PostListResponse {
  items: BlogPost[]
  total: number
  page: number
  limit: number
  pages: number
}

interface CategoryCount {
  category: string
  count: number
}

interface Props {
  /** Серверээс render болсон эхний хуудас — hydration дараа дахин татахгүй */
  initialPosts: BlogPost[]
  initialTotal: number
  categories: CategoryCount[]
  initialCategory?: string
  initialTag?: string
  pageSize: number
}

export default function PostsBrowser({
  initialPosts, initialTotal, categories, initialCategory = '', initialTag = '', pageSize,
}: Props) {
  const [items, setItems] = useState<BlogPost[]>(initialPosts)
  const [total, setTotal] = useState(initialTotal)
  const [page, setPage] = useState(1)
  const [appending, setAppending] = useState(false)

  const [category, setCategory] = useState(initialCategory)
  const [tag, setTag] = useState(initialTag)
  const [searchInput, setSearchInput] = useState('')
  const [search, setSearch] = useState('')

  // `loading`-ийг state-ээр биш, ачаалж дууссан шүүлтүүрийн key-ээс гаргана —
  // effect дотор синхрон setState хийхгүй (cascading render-ээс сэргийлнэ).
  const filterKey = `${category}|${tag}|${search}`
  const [loadedKey, setLoadedKey] = useState(filterKey)
  const loading = loadedKey !== filterKey

  // Серверээс ирсэн өгөгдөл аль хэдийн байгаа тул mount дээр дахин татахгүй
  const hydrated = useRef(false)

  const buildParams = useCallback((pageNum: number) => {
    const params = new URLSearchParams({ page: String(pageNum), limit: String(pageSize) })
    if (category) params.set('category', category)
    if (tag) params.set('tag', tag)
    if (search) params.set('search', search)
    return params.toString()
  }, [category, tag, search, pageSize])

  // Хайлтын debounce
  useEffect(() => {
    const timer = setTimeout(() => setSearch(searchInput.trim()), 350)
    return () => clearTimeout(timer)
  }, [searchInput])

  // Шүүлтүүр солигдоход 1-р хуудаснаас дахин уншина
  useEffect(() => {
    if (!hydrated.current) { hydrated.current = true; return }

    let active = true
    apiFetch<PostListResponse>(`/posts?${buildParams(1)}`, { auth: false })
      .then(res => {
        if (!active) return
        setItems(Array.isArray(res?.items) ? res.items : [])
        setTotal(res?.total || 0)
        setPage(1)
      })
      .catch(() => {
        if (!active) return
        setItems([])
        setTotal(0)
      })
      .finally(() => { if (active) setLoadedKey(filterKey) })

    return () => { active = false }
  }, [buildParams, filterKey])

  const loadMore = async () => {
    const next = page + 1
    setAppending(true)
    try {
      const res = await apiFetch<PostListResponse>(`/posts?${buildParams(next)}`, { auth: false })
      setItems(prev => [...prev, ...(Array.isArray(res?.items) ? res.items : [])])
      setPage(next)
    } catch {
      /* Дахин оролдох боломжтой — жагсаалтыг хөндөхгүй */
    }
    setAppending(false)
  }

  const isUnfiltered = !category && !tag && !search
  const lead = isUnfiltered ? items[0] : undefined
  const rest = lead ? items.slice(1) : items
  const hasMore = items.length < total

  return (
    <>
      {/* Хайлт + ангилал */}
      <div className="mb-8 flex flex-col gap-4">
        <div className="relative max-w-md">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text3)]" />
          <input
            value={searchInput}
            onChange={e => setSearchInput(e.target.value)}
            placeholder="Нийтлэл хайх..."
            aria-label="Нийтлэл хайх"
            className="h-10 w-full rounded-lg border border-[var(--border)] bg-[var(--surface)] pl-9 pr-3 text-sm text-[var(--text)] outline-none transition-colors placeholder:text-[var(--text3)] focus:border-[#FF6B00]"
          />
        </div>

        {categories.length > 0 && (
          <div className="flex flex-wrap gap-2">
            <FilterChip active={!category} onClick={() => setCategory('')} label="Бүгд" />
            {categories.map(c => (
              <FilterChip
                key={c.category}
                active={category === c.category}
                onClick={() => setCategory(c.category)}
                label={`${c.category} (${c.count})`}
              />
            ))}
          </div>
        )}

        {tag && (
          <div className="flex items-center gap-2">
            <span className="text-xs text-[var(--text3)]">Таг:</span>
            <button
              onClick={() => setTag('')}
              className="inline-flex items-center gap-1.5 rounded-full border border-[#FF6B00] bg-[#FF6B00] px-3 py-1 text-xs font-semibold text-white"
            >
              #{tag}<X size={12} />
            </button>
          </div>
        )}
      </div>

      {loading && <PostCardSkeletonGrid />}

      {!loading && items.length === 0 && (
        <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] px-6 py-16 text-center">
          <Newspaper size={32} className="mx-auto mb-3 text-[var(--text3)]" />
          <p className="font-semibold">
            {isUnfiltered ? 'Одоогоор нийтлэл байхгүй' : 'Тохирох нийтлэл олдсонгүй'}
          </p>
          <p className="mt-1 text-sm text-[var(--text2)]">
            {isUnfiltered
              ? 'Шинэ нийтлэлүүд эндээс хамгийн түрүүнд харагдана.'
              : 'Хайлтын үг, ангилал эсвэл тагийг сольж үзээрэй.'}
          </p>
        </div>
      )}

      {!loading && lead && <LeadPostCard post={lead} />}

      {!loading && rest.length > 0 && (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {rest.map(post => <PostCard key={post.id} post={post} />)}
        </div>
      )}

      {!loading && hasMore && (
        <div className="mt-10 text-center">
          <button
            onClick={loadMore}
            disabled={appending}
            className="rounded-lg border border-[var(--border)] bg-[var(--surface)] px-6 py-2.5 text-sm font-semibold transition-colors hover:border-[#FF6B00] hover:text-[#FF6B00] disabled:opacity-50"
          >
            {appending ? 'Уншиж байна...' : `Дараагийн нийтлэлүүд (${total - items.length})`}
          </button>
        </div>
      )}
    </>
  )
}

function FilterChip({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      aria-pressed={active}
      className={`rounded-full border px-3.5 py-1.5 text-xs font-semibold transition-colors ${
        active
          ? 'border-[#FF6B00] bg-[#FF6B00] text-white'
          : 'border-[var(--border)] bg-[var(--surface)] text-[var(--text2)] hover:border-[#FF6B00] hover:text-[#FF6B00]'
      }`}
    >
      {label}
    </button>
  )
}
