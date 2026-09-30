'use client'

import { useEffect, useRef } from 'react'
import { Link2 } from 'lucide-react'
import { toast } from 'sonner'
import { apiFetch } from '@/lib/api'

/** lucide-react brand icon-уудыг хассан тул Footer-тэй адил inline SVG */
function FacebookMark() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
    </svg>
  )
}

const buttonClass = 'inline-flex items-center gap-1.5 rounded-lg border border-[var(--border)] bg-[var(--surface)] px-3 py-1.5 text-xs font-semibold no-underline transition-colors hover:border-[#FF6B00] hover:text-[#FF6B00]'

/**
 * Хуваалцах товчнууд + үзэлт тоолох.
 *
 * Үзэлтийг клиентээс тоолдог: хуудас нь server-side render болдог тул
 * GET дээр тоолвол crawler болон ISR revalidate бүр тоог хөөрөгдөнө.
 */
export default function PostArticleActions({ slug, url }: { slug: string; url: string }) {
  const counted = useRef(false)

  useEffect(() => {
    // React strict mode нь effect-ийг хоёр удаа ажиллуулдаг — нэг л удаа тоолно
    if (counted.current) return
    counted.current = true
    void apiFetch(`/posts/${encodeURIComponent(slug)}/view`, { method: 'POST', auth: false })
      .catch(() => { /* тоолуур бүтэлгүйтвэл уншигчид нөлөөлөхгүй */ })
  }, [slug])

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(url)
      toast.success('Линк хуулагдлаа')
    } catch {
      toast.error('Линк хуулж чадсангүй')
    }
  }

  return (
    <div className="mt-8 flex flex-wrap items-center gap-2 border-t border-[var(--border)] pt-6">
      <span className="mr-1 text-xs font-semibold text-[var(--text3)]">Хуваалцах:</span>
      <button onClick={copyLink} className={buttonClass}>
        <Link2 size={13} />Линк хуулах
      </button>
      <a
        href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`}
        target="_blank"
        rel="noopener noreferrer"
        className={buttonClass}
      >
        <FacebookMark />Facebook
      </a>
    </div>
  )
}
