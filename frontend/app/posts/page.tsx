import type { Metadata } from 'next'
import { Newspaper } from 'lucide-react'
import PostsBrowser from '@/components/blog/PostsBrowser'
import { fetchCategories, fetchPosts, postDate } from '@/lib/blog-api'
import { SITE_NAME, SITE_URL, absoluteUrl, jsonLdScript } from '@/lib/seo'

const PAGE_SIZE = 9

const TITLE = 'Мэдээ & Нийтлэл — хэвлэлийн технологи, материал, дизайн'
const DESCRIPTION =
  'Хэвлэлийн технологи, цаас, материал сонголт, өнгөний тохируулга, дизайны '
  + 'зөвлөгөө болон үйлдвэрлэлийн туршлагын талаарх нийтлэлүүд — Bizprint.mn.'

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  keywords: [
    'хэвлэлийн мэдээ', 'хэвлэлийн нийтлэл', 'хэвлэлийн технологи',
    'офсет хэвлэл', 'дижитал хэвлэл', 'цаасны төрөл', 'дизайны зөвлөгөө',
    'нэрийн хуудас хэвлэх', 'CMYK өнгө', 'хэвлэлийн блог',
  ],
  alternates: {
    canonical: '/posts',
    types: { 'application/rss+xml': `${SITE_URL}/posts/rss.xml` },
  },
  openGraph: {
    type: 'website',
    url: absoluteUrl('/posts'),
    siteName: SITE_NAME,
    locale: 'mn_MN',
    title: TITLE,
    description: DESCRIPTION,
  },
  twitter: { card: 'summary_large_image', title: TITLE, description: DESCRIPTION },
}

export default async function PostsPage({
  searchParams,
}: {
  searchParams: Promise<{ category?: string | string[]; tag?: string | string[] }>
}) {
  const params = await searchParams
  const first = (value?: string | string[]) => (Array.isArray(value) ? value[0] : value) || ''
  const category = first(params.category)
  const tag = first(params.tag)

  // Серверээс татаж HTML дотор render хийнэ — хайлтын систем нийтлэлийн
  // линкүүдийг JS ажиллуулахгүйгээр уншина.
  const [list, categories] = await Promise.all([
    fetchPosts({ category, tag, limit: PAGE_SIZE }),
    fetchCategories(),
  ])

  // Blog + BlogPosting: нийтлэлүүдийг бүтэцлэгдсэн өгөгдлөөр танина
  const blogJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Blog',
    '@id': absoluteUrl('/posts#blog'),
    url: absoluteUrl('/posts'),
    name: `${SITE_NAME} — Мэдээ & Нийтлэл`,
    description: DESCRIPTION,
    inLanguage: 'mn-MN',
    publisher: { '@type': 'Organization', name: SITE_NAME, url: SITE_URL },
    blogPost: list.items.map(post => ({
      '@type': 'BlogPosting',
      '@id': absoluteUrl(`/posts/${post.slug}`),
      headline: post.title,
      url: absoluteUrl(`/posts/${post.slug}`),
      datePublished: postDate(post),
      ...(post.thumbnail ? { image: post.thumbnail } : {}),
      ...(post.author_name ? { author: { '@type': 'Person', name: post.author_name } } : {}),
    })),
  }

  const breadcrumbJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Нүүр', item: SITE_URL },
      { '@type': 'ListItem', position: 2, name: 'Мэдээ & Нийтлэл', item: absoluteUrl('/posts') },
    ],
  }

  return (
    <div className="min-h-screen bg-[var(--bg)] text-[var(--text)]">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: jsonLdScript(blogJsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: jsonLdScript(breadcrumbJsonLd) }}
      />

      <div className="mx-auto max-w-[1180px] px-4 py-10 sm:py-14">
        <header className="mb-8">
          <div className="mb-2 flex items-center gap-2 text-[#FF6B00]">
            <Newspaper size={18} />
            <span className="text-xs font-bold uppercase tracking-wider">BizPrint Blog</span>
          </div>
          <h1 className="text-2xl font-extrabold tracking-tight sm:text-3xl">Мэдээ &amp; Нийтлэл</h1>
          <p className="mt-2 max-w-2xl text-sm text-[var(--text2)]">
            Хэвлэлийн технологи, дизайн, материал сонголт болон үйлдвэрлэлийн туршлагын талаарх
            сонирхолтой нийтлэлүүд.
          </p>
        </header>

        <PostsBrowser
          initialPosts={list.items}
          initialTotal={list.total}
          categories={categories}
          initialCategory={category}
          initialTag={tag}
          pageSize={PAGE_SIZE}
        />
      </div>
    </div>
  )
}
