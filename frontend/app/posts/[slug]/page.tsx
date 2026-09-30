'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { apiFetch } from '@/lib/api'
import { sanitizeHtml } from '@/lib/sanitize'
import {
  PostCard, formatPostDate, type BlogPost,
} from '@/components/blog/PostCard'
import {
  ArrowLeft, Calendar, Clock, Eye, Link2, Newspaper, User,
} from 'lucide-react'
import { toast } from 'sonner'

interface PostDetail extends BlogPost {
  content?: string
  seo_title?: string
  seo_description?: string
}

/** lucide-react brand icon-уудыг хассан тул Footer-тэй адил inline SVG */
function FacebookMark() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
    </svg>
  )
}

export default function PostDetailPage() {
  const params = useParams<{ slug: string }>()
  const slug = typeof params?.slug === 'string' ? params.slug : ''

  const [post, setPost] = useState<PostDetail | null>(null)
  const [related, setRelated] = useState<BlogPost[]>([])
  const [notFound, setNotFound] = useState(false)

  // Ачаалсан slug-аас loading-ийг гаргана — effect дотор синхрон setState хийхгүй
  const [loadedSlug, setLoadedSlug] = useState<string | null>(null)
  const loading = loadedSlug !== slug

  useEffect(() => {
    if (!slug) return
    let active = true

    apiFetch<PostDetail>(`/posts/${encodeURIComponent(slug)}`, { auth: false })
      .then(res => {
        if (!active) return
        setPost(res)
        setNotFound(false)
      })
      .catch(() => {
        if (!active) return
        setPost(null)
        setNotFound(true)
      })
      .finally(() => { if (active) setLoadedSlug(slug) })

    apiFetch<BlogPost[]>(`/posts/${encodeURIComponent(slug)}/related?limit=3`, { auth: false })
      .then(res => { if (active) setRelated(Array.isArray(res) ? res : []) })
      .catch(() => { if (active) setRelated([]) })

    return () => { active = false }
  }, [slug])

  // Нийтлэл уншсаны дараа browser tab-ийн гарчгийг сольдог. Client component тул
  // generateMetadata хэрэглэх боломжгүй — SSR болгосон үед үүнийг сольж болно.
  useEffect(() => {
    if (!post) return
    const previous = document.title
    document.title = `${post.seo_title || post.title} | BizPrint`
    return () => { document.title = previous }
  }, [post])

  const shareUrl = typeof window !== 'undefined' ? window.location.href : ''

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl)
      toast.success('Линк хуулагдлаа')
    } catch {
      toast.error('Линк хуулж чадсангүй')
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[var(--bg)]">
        <div className="mx-auto max-w-3xl space-y-4 px-4 py-14">
          <div className="h-4 w-24 animate-pulse rounded bg-[var(--surface2)]" />
          <div className="h-8 w-4/5 animate-pulse rounded bg-[var(--surface2)]" />
          <div className="h-56 w-full animate-pulse rounded-xl bg-[var(--surface2)]" />
          <div className="h-4 w-full animate-pulse rounded bg-[var(--surface2)]" />
          <div className="h-4 w-11/12 animate-pulse rounded bg-[var(--surface2)]" />
          <div className="h-4 w-3/4 animate-pulse rounded bg-[var(--surface2)]" />
        </div>
      </div>
    )
  }

  if (notFound || !post) {
    return (
      <div className="flex min-h-[70vh] flex-col items-center justify-center gap-3 bg-[var(--bg)] px-4 text-center">
        <Newspaper size={40} className="text-[var(--text3)]" />
        <h1 className="text-xl font-bold text-[var(--text)]">Нийтлэл олдсонгүй</h1>
        <p className="max-w-sm text-sm text-[var(--text2)]">
          Хайж байгаа нийтлэл устсан эсвэл хаяг буруу байж магадгүй.
        </p>
        <Link
          href="/posts"
          className="mt-2 rounded-lg bg-[#FF6B00] px-5 py-2.5 text-sm font-bold text-white no-underline hover:bg-[#E55D00]"
        >
          Бүх нийтлэл
        </Link>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[var(--bg)] text-[var(--text)]">
      <article className="mx-auto max-w-3xl px-4 py-10 sm:py-14">

        <Link
          href="/posts"
          className="mb-6 inline-flex items-center gap-1.5 text-sm font-semibold text-[var(--text2)] no-underline transition-colors hover:text-[#FF6B00]"
        >
          <ArrowLeft size={15} />Бүх нийтлэл
        </Link>

        <header>
          {post.category && (
            <Link
              href={`/posts?category=${encodeURIComponent(post.category)}`}
              className="text-[11px] font-bold uppercase tracking-wider text-[#FF6B00] no-underline hover:underline"
            >
              {post.category}
            </Link>
          )}
          <h1 className="mt-2 text-2xl font-extrabold leading-tight tracking-tight sm:text-3xl">
            {post.title}
          </h1>

          <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-[var(--text3)]">
            {post.author_name && (
              <span className="inline-flex items-center gap-1.5">
                <User size={13} />{post.author_name}
              </span>
            )}
            <span className="inline-flex items-center gap-1.5">
              <Calendar size={13} />{formatPostDate(post)}
            </span>
            <span className="inline-flex items-center gap-1.5">
              <Clock size={13} />{post.reading_minutes || 1} минут уншина
            </span>
            <span className="inline-flex items-center gap-1.5">
              <Eye size={13} />{post.view_count} үзсэн
            </span>
          </div>
        </header>

        {post.thumbnail && (
          <img
            src={post.thumbnail}
            alt=""
            className="mt-6 w-full rounded-xl border border-[var(--border)] object-cover"
          />
        )}

        {post.excerpt && (
          <p className="mt-6 border-l-2 border-[#FF6B00] pl-4 text-[15px] font-medium leading-relaxed text-[var(--text2)]">
            {post.excerpt}
          </p>
        )}

        {post.content && (
          <div
            className="post-content mt-6 text-[15px] leading-[1.8] text-[var(--text)]"
            dangerouslySetInnerHTML={{ __html: sanitizeHtml(post.content) }}
          />
        )}

        {post.tags && post.tags.length > 0 && (
          <div className="mt-8 flex flex-wrap gap-2">
            {post.tags.map(tag => (
              <Link
                key={tag}
                href={`/posts?tag=${encodeURIComponent(tag)}`}
                className="rounded-full border border-[var(--border)] bg-[var(--surface)] px-3 py-1 text-xs font-medium text-[var(--text2)] no-underline transition-colors hover:border-[#FF6B00] hover:text-[#FF6B00]"
              >
                #{tag}
              </Link>
            ))}
          </div>
        )}

        {/* Хуваалцах */}
        <div className="mt-8 flex flex-wrap items-center gap-2 border-t border-[var(--border)] pt-6">
          <span className="mr-1 text-xs font-semibold text-[var(--text3)]">Хуваалцах:</span>
          <button
            onClick={copyLink}
            className="inline-flex items-center gap-1.5 rounded-lg border border-[var(--border)] bg-[var(--surface)] px-3 py-1.5 text-xs font-semibold transition-colors hover:border-[#FF6B00] hover:text-[#FF6B00]"
          >
            <Link2 size={13} />Линк хуулах
          </button>
          <a
            href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 rounded-lg border border-[var(--border)] bg-[var(--surface)] px-3 py-1.5 text-xs font-semibold no-underline transition-colors hover:border-[#FF6B00] hover:text-[#FF6B00]"
          >
            <FacebookMark />Facebook
          </a>
        </div>
      </article>

      {related.length > 0 && (
        <section className="border-t border-[var(--border)] bg-[var(--surface2)]/40">
          <div className="mx-auto max-w-[1180px] px-4 py-12">
            <h2 className="mb-5 text-lg font-bold">Холбоотой нийтлэлүүд</h2>
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {related.map(item => <PostCard key={item.id} post={item} />)}
            </div>
          </div>
        </section>
      )}
    </div>
  )
}
