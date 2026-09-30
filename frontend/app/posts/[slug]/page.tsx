import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ArrowLeft, Calendar, Clock, Eye, User } from 'lucide-react'
import { sanitizeHtml } from '@/lib/sanitize'
import { PostCard, formatPostDate } from '@/components/blog/PostCard'
import PostArticleActions from '@/components/blog/PostArticleActions'
import { fetchPost, fetchRelatedPosts, postDate } from '@/lib/blog-api'
import {
  SITE_NAME, SITE_URL, absoluteUrl, jsonLdScript, metaDescription,
} from '@/lib/seo'

interface Params {
  params: Promise<{ slug: string }>
}

/**
 * Дэлгэрэнгүй хуудас нь server component — ингэснээр хайлтын систем болон
 * сошиал preview-д зориулж бодит <title>, meta description, Open Graph,
 * canonical болон Article бүтэцлэгдсэн өгөгдөл HTML дотор шууд гарна.
 */
export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { slug } = await params
  const post = await fetchPost(slug)

  if (!post) {
    return { title: 'Нийтлэл олдсонгүй', robots: { index: false, follow: true } }
  }

  const title = post.seo_title || post.title
  const description = metaDescription(post.seo_description, post.excerpt, post.content)
  const url = absoluteUrl(`/posts/${post.slug}`)
  const images = post.thumbnail ? [{ url: post.thumbnail, alt: post.title }] : undefined

  return {
    title,
    description,
    ...(post.tags?.length ? { keywords: post.tags } : {}),
    ...(post.author_name ? { authors: [{ name: post.author_name }] } : {}),
    alternates: { canonical: `/posts/${post.slug}` },
    openGraph: {
      type: 'article',
      url,
      siteName: SITE_NAME,
      locale: 'mn_MN',
      title,
      description,
      images,
      publishedTime: postDate(post),
      modifiedTime: post.updated_at || postDate(post),
      ...(post.author_name ? { authors: [post.author_name] } : {}),
      ...(post.category ? { section: post.category } : {}),
      ...(post.tags?.length ? { tags: post.tags } : {}),
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: post.thumbnail ? [post.thumbnail] : undefined,
    },
  }
}

export default async function PostDetailPage({ params }: Params) {
  const { slug } = await params
  const post = await fetchPost(slug)

  // Байхгүй эсвэл драфт нийтлэл — Next-ийн бодит 404 (soft 404 болохгүй)
  if (!post) notFound()

  const related = await fetchRelatedPosts(slug, 3)
  const url = absoluteUrl(`/posts/${post.slug}`)
  const description = metaDescription(post.seo_description, post.excerpt, post.content)

  const articleJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BlogPosting',
    '@id': `${url}#article`,
    mainEntityOfPage: { '@type': 'WebPage', '@id': url },
    url,
    headline: post.title.slice(0, 110),
    ...(description ? { description } : {}),
    inLanguage: 'mn-MN',
    datePublished: postDate(post),
    dateModified: post.updated_at || postDate(post),
    ...(post.thumbnail ? { image: [post.thumbnail] } : {}),
    ...(post.category ? { articleSection: post.category } : {}),
    ...(post.tags?.length ? { keywords: post.tags.join(', ') } : {}),
    ...(post.reading_minutes ? { timeRequired: `PT${post.reading_minutes}M` } : {}),
    author: post.author_name
      ? { '@type': 'Person', name: post.author_name }
      : { '@type': 'Organization', name: SITE_NAME, url: SITE_URL },
    publisher: {
      '@type': 'Organization',
      name: SITE_NAME,
      url: SITE_URL,
      logo: { '@type': 'ImageObject', url: absoluteUrl('/icons/bizprint-icon-192.png') },
    },
  }

  const breadcrumbJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Нүүр', item: SITE_URL },
      { '@type': 'ListItem', position: 2, name: 'Мэдээ & Нийтлэл', item: absoluteUrl('/posts') },
      ...(post.category
        ? [{
          '@type': 'ListItem',
          position: 3,
          name: post.category,
          item: absoluteUrl(`/posts?category=${encodeURIComponent(post.category)}`),
        }]
        : []),
      {
        '@type': 'ListItem',
        position: post.category ? 4 : 3,
        name: post.title,
        item: url,
      },
    ],
  }

  return (
    <div className="min-h-screen bg-[var(--bg)] text-[var(--text)]">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: jsonLdScript(articleJsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: jsonLdScript(breadcrumbJsonLd) }}
      />

      <article className="mx-auto max-w-3xl px-4 py-10 sm:py-14">
        <nav aria-label="Замнал" className="mb-6">
          <Link
            href="/posts"
            className="inline-flex items-center gap-1.5 text-sm font-semibold text-[var(--text2)] no-underline transition-colors hover:text-[#FF6B00]"
          >
            <ArrowLeft size={15} />Бүх нийтлэл
          </Link>
        </nav>

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
            <time dateTime={postDate(post)} className="inline-flex items-center gap-1.5">
              <Calendar size={13} />{formatPostDate(post)}
            </time>
            <span className="inline-flex items-center gap-1.5">
              <Clock size={13} />{post.reading_minutes || 1} минут уншина
            </span>
            <span className="inline-flex items-center gap-1.5">
              <Eye size={13} />{post.view_count} үзсэн
            </span>
          </div>
        </header>

        {post.thumbnail && (
          /* eslint-disable-next-line @next/next/no-img-element */
          <img
            src={post.thumbnail}
            alt={post.title}
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

        <PostArticleActions slug={post.slug} url={url} />
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
