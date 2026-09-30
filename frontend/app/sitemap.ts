import type { MetadataRoute } from 'next'

const base = 'https://bizprint.mn'

const STATIC_ROUTES: MetadataRoute.Sitemap = [
  { url: base, lastModified: new Date(), changeFrequency: 'daily', priority: 1.0 },
  { url: `${base}/shop`, lastModified: new Date(), changeFrequency: 'daily', priority: 0.9 },
  { url: `${base}/quote`, lastModified: new Date(), changeFrequency: 'weekly', priority: 0.9 },
  { url: `${base}/marketplace`, lastModified: new Date(), changeFrequency: 'weekly', priority: 0.8 },
  { url: `${base}/about`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.7 },
  { url: `${base}/faq`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.7 },
  { url: `${base}/contact`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.7 },
  { url: `${base}/business-cards`, lastModified: new Date(), changeFrequency: 'weekly', priority: 0.7 },
  { url: `${base}/pricing`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.8 },
  { url: `${base}/b2b`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.7 },
  { url: `${base}/whitelabel`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.6 },
  { url: `${base}/track`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.6 },
  { url: `${base}/search`, lastModified: new Date(), changeFrequency: 'weekly', priority: 0.6 },
  { url: `${base}/templates`, lastModified: new Date(), changeFrequency: 'weekly', priority: 0.6 },
  { url: `${base}/gallery`, lastModified: new Date(), changeFrequency: 'weekly', priority: 0.6 },
  { url: `${base}/factory`, lastModified: new Date(), changeFrequency: 'weekly', priority: 0.6 },
  { url: `${base}/posts`, lastModified: new Date(), changeFrequency: 'daily', priority: 0.8 },
  { url: `${base}/orders/new`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.8 },
  { url: `${base}/checkout`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.6 },
  { url: `${base}/partner`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.4 },
  { url: `${base}/login`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.3 },
  { url: `${base}/register`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.3 },
]

interface SitemapPost {
  slug: string
  published_at?: string | null
  updated_at?: string
}

/**
 * Нийтлэгдсэн нийтлэлүүдийг sitemap-д нэмнэ.
 *
 * Build үед backend руу нэг удаа хандана. Хэрэв API хүрэхгүй бол (env
 * тохируулагдаагүй, backend унтарсан) sitemap статик жагсаалтаараа гарна —
 * build унахгүй, зөвхөн нийтлэлүүд дараагийн deploy хүртэл орохгүй.
 */
async function fetchPostRoutes(): Promise<MetadataRoute.Sitemap> {
  const apiUrl = process.env.API_URL || process.env.NEXT_PUBLIC_API_URL
  if (!apiUrl) return []

  try {
    const res = await fetch(`${apiUrl}/api/posts?limit=50`, {
      next: { revalidate: 3600 },
    })
    if (!res.ok) return []

    const data = (await res.json()) as { items?: SitemapPost[] }
    const items = Array.isArray(data?.items) ? data.items : []

    return items
      .filter(post => typeof post?.slug === 'string' && post.slug.length > 0)
      .map(post => ({
        url: `${base}/posts/${post.slug}`,
        lastModified: new Date(post.updated_at || post.published_at || Date.now()),
        changeFrequency: 'monthly' as const,
        priority: 0.6,
      }))
  } catch {
    return []
  }
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const posts = await fetchPostRoutes()
  return [...STATIC_ROUTES, ...posts]
}
