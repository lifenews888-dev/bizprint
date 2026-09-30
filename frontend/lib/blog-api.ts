import { SERVER_API_URL } from '@/lib/seo'
import type { BlogPost } from '@/components/blog/PostCard'

/**
 * Нийтлэлийг СЕРВЕР талаас татах. `lib/api.ts`-ийн apiFetch нь localStorage-ээс
 * token уншдаг тул зөвхөн browser-т ажилладаг — SSR metadata, sitemap, RSS-д
 * тохирохгүй. Энэ модуль нь нийтийн эндпойнтуудыг серверээс уншина.
 *
 * Серверээс татсан нийтлэлүүд HTML дотор шууд render болдог тул хайлтын
 * систем нийтлэлийн линкүүдийг JS ажиллуулахгүйгээр уншина.
 *
 * API хаяг тохируулагдаагүй эсвэл хүрэхгүй бол `null`/хоосон буцаана — хуудас
 * 500 болохгүй, дараагийн revalidate дээр сэргэнэ.
 */

export interface BlogPostDetail extends BlogPost {
  content?: string
  seo_title?: string
  seo_description?: string
  updated_at?: string
}

export interface BlogListResult {
  items: BlogPost[]
  total: number
  page: number
  limit: number
  pages: number
}

export interface BlogCategory {
  category: string
  count: number
}

/** Нийтлэл шинэчлэгдэхэд 5 минутын дотор тархана */
const REVALIDATE_SECONDS = 300

const EMPTY_LIST: BlogListResult = { items: [], total: 0, page: 1, limit: 0, pages: 1 }

async function getJson<T>(path: string, revalidate = REVALIDATE_SECONDS): Promise<T | null> {
  if (!SERVER_API_URL) return null
  try {
    const res = await fetch(`${SERVER_API_URL}/api${path}`, {
      next: { revalidate },
      headers: { accept: 'application/json' },
    })
    if (!res.ok) return null
    return (await res.json()) as T
  } catch {
    return null
  }
}

export const fetchPost = (slug: string) =>
  getJson<BlogPostDetail>(`/posts/${encodeURIComponent(slug)}`)

export const fetchRelatedPosts = async (slug: string, limit = 3): Promise<BlogPost[]> => {
  const res = await getJson<BlogPost[]>(`/posts/${encodeURIComponent(slug)}/related?limit=${limit}`)
  return Array.isArray(res) ? res : []
}

export const fetchPosts = async (
  { category = '', tag = '', limit = 9, page = 1 } = {},
): Promise<BlogListResult> => {
  const params = new URLSearchParams({ page: String(page), limit: String(limit) })
  if (category) params.set('category', category)
  if (tag) params.set('tag', tag)

  const res = await getJson<BlogListResult>(`/posts?${params.toString()}`)
  return res && Array.isArray(res.items) ? res : { ...EMPTY_LIST, limit }
}

export const fetchCategories = async (): Promise<BlogCategory[]> => {
  const res = await getJson<BlogCategory[]>('/posts/categories')
  return Array.isArray(res) ? res : []
}

/** Нийтлэлийн харагдах огноо — published_at байвал түүнийг */
export const postDate = (post: Pick<BlogPost, 'published_at' | 'created_at'>) =>
  post.published_at || post.created_at
