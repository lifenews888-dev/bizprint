'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { apiFetch } from '@/lib/api'
import { PostCard, type BlogPost } from '@/components/blog/PostCard'

/**
 * Нүүр хуудсанд харагдах "Мэдээ & Нийтлэл" блок.
 *
 * Онцолсон (is_featured) нийтлэлүүд эхэлж, дараа нь шинэ нийтлэлүүдээр
 * нөхөгдөнө — backend-ийн /posts/featured үүнийг хийдэг.
 *
 * Нийтлэл байхгүй бол блок бүхэлдээ харагдахгүй (хоосон хэсэг гаргахгүй).
 */
export default function BlogSection({ limit = 3 }: { limit?: number }) {
  const [posts, setPosts] = useState<BlogPost[]>([])

  useEffect(() => {
    let active = true
    apiFetch<BlogPost[]>(`/posts/featured?limit=${limit}`, { auth: false })
      .then(res => { if (active) setPosts(Array.isArray(res) ? res : []) })
      .catch(() => { if (active) setPosts([]) })
    return () => { active = false }
  }, [limit])

  if (posts.length === 0) return null

  return (
    <section className="max-w-[1100px] mx-auto px-5 py-10 md:py-16">
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between mb-6">
        <div>
          <h2 className="text-xl md:text-2xl font-bold tracking-tight" style={{ color: 'var(--text)' }}>
            Мэдээ &amp; Нийтлэл
          </h2>
          <p className="text-sm mt-1" style={{ color: 'var(--text3)' }}>
            Хэвлэлийн технологи, материал сонголт, дизайны зөвлөгөө
          </p>
        </div>
        <Link href="/posts" className="no-underline text-sm font-bold text-[#FF6B00] hover:underline">
          Бүх нийтлэл харах →
        </Link>
      </div>

      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {posts.map(post => <PostCard key={post.id} post={post} />)}
      </div>
    </section>
  )
}
