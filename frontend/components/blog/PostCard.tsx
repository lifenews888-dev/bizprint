'use client'

import Link from 'next/link'
import { Calendar, Clock, Eye, Newspaper } from 'lucide-react'

export interface BlogPost {
  id: string
  title: string
  slug: string
  excerpt?: string
  thumbnail?: string
  category?: string
  tags?: string[]
  author_name?: string
  published_at?: string | null
  created_at: string
  reading_minutes?: number | null
  view_count: number
}

/** published_at байвал түүнийг, байхгүй бол created_at-ыг харуулна */
export const formatPostDate = (post: Pick<BlogPost, 'published_at' | 'created_at'>) =>
  new Date(post.published_at || post.created_at).toLocaleDateString('mn-MN', {
    year: 'numeric', month: 'long', day: 'numeric',
  })

export function PostMeta({ post, className = '' }: { post: BlogPost; className?: string }) {
  return (
    <div className={`flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-[var(--text3)] ${className}`}>
      <span className="inline-flex items-center gap-1">
        <Calendar size={12} />{formatPostDate(post)}
      </span>
      <span className="inline-flex items-center gap-1">
        <Clock size={12} />{post.reading_minutes || 1} мин
      </span>
      <span className="inline-flex items-center gap-1">
        <Eye size={12} />{post.view_count}
      </span>
    </div>
  )
}

export function PostCard({ post }: { post: BlogPost }) {
  return (
    <Link
      href={`/posts/${post.slug}`}
      className="group flex flex-col overflow-hidden rounded-xl border border-[var(--border)] bg-[var(--surface)] no-underline transition-colors hover:border-[#FF6B00]"
    >
      {post.thumbnail
        ? <img src={post.thumbnail} alt={post.title} className="h-40 w-full object-cover" />
        : <div className="flex h-40 items-center justify-center bg-[var(--surface2)]">
            <Newspaper size={24} className="text-[var(--text4)]" />
          </div>}
      <div className="flex flex-1 flex-col p-4">
        {post.category && (
          <span className="mb-1.5 text-[11px] font-bold uppercase tracking-wider text-[#FF6B00]">
            {post.category}
          </span>
        )}
        <h3 className="line-clamp-2 text-[15px] font-bold leading-snug text-[var(--text)]">{post.title}</h3>
        {post.excerpt && (
          <p className="mt-2 line-clamp-2 flex-1 text-[13px] leading-relaxed text-[var(--text2)]">{post.excerpt}</p>
        )}
        <PostMeta post={post} className="mt-3" />
      </div>
    </Link>
  )
}

/** Шүүлтүүргүй үед хамгийн шинэ нийтлэлийг том карт болгож онцолно */
export function LeadPostCard({ post }: { post: BlogPost }) {
  return (
    <Link
      href={`/posts/${post.slug}`}
      className="group mb-6 block overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--surface)] no-underline transition-colors hover:border-[#FF6B00]"
    >
      <div className="grid md:grid-cols-2">
        {post.thumbnail
          ? <img src={post.thumbnail} alt={post.title} className="h-56 w-full object-cover md:h-full" />
          : <div className="hidden bg-[var(--surface2)] md:block" />}
        <div className="flex flex-col justify-center p-6 sm:p-8">
          {post.category && (
            <span className="mb-2 text-[11px] font-bold uppercase tracking-wider text-[#FF6B00]">
              {post.category}
            </span>
          )}
          <h2 className="text-xl font-extrabold leading-snug text-[var(--text)] sm:text-2xl">
            {post.title}
          </h2>
          {post.excerpt && (
            <p className="mt-3 line-clamp-3 text-sm leading-relaxed text-[var(--text2)]">{post.excerpt}</p>
          )}
          <PostMeta post={post} className="mt-4" />
        </div>
      </div>
    </Link>
  )
}

export function PostCardSkeletonGrid({ count = 6 }: { count?: number }) {
  return (
    <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="overflow-hidden rounded-xl border border-[var(--border)] bg-[var(--surface)]">
          <div className="h-40 animate-pulse bg-[var(--surface2)]" />
          <div className="space-y-2 p-4">
            <div className="h-3 w-20 animate-pulse rounded bg-[var(--surface2)]" />
            <div className="h-4 w-full animate-pulse rounded bg-[var(--surface2)]" />
            <div className="h-3 w-4/5 animate-pulse rounded bg-[var(--surface2)]" />
          </div>
        </div>
      ))}
    </div>
  )
}
