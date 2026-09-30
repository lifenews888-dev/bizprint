import { fetchPosts, postDate } from '@/lib/blog-api'
import { SITE_NAME, SITE_URL, absoluteUrl } from '@/lib/seo'

/**
 * RSS 2.0 feed — /posts/rss.xml
 *
 * Мэдээний булангийн шинэ нийтлэлүүдийг reader, Google News болон
 * автомат тараагчид дагах боломж болгоно.
 */

export const revalidate = 900

const escapeXml = (value: string) =>
  value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;')

/** CDATA дотор ]]> байвал feed эвдэрнэ — хуваан бичнэ */
const cdata = (value: string) => `<![CDATA[${value.replace(/]]>/g, ']]]]><![CDATA[>')}]]>`

const plainText = (html?: string | null) =>
  (html || '')
    .replace(/<[^>]*>/g, ' ')
    .replace(/&[a-z]+;/gi, ' ')
    .replace(/\s+/g, ' ')
    .trim()

export async function GET() {
  const { items } = await fetchPosts({ limit: 30 })
  const feedUrl = absoluteUrl('/posts/rss.xml')

  const entries = items.map(post => {
    const url = absoluteUrl(`/posts/${post.slug}`)
    const summary = post.excerpt || plainText(post.excerpt)
    return [
      '    <item>',
      `      <title>${cdata(post.title)}</title>`,
      `      <link>${escapeXml(url)}</link>`,
      `      <guid isPermaLink="true">${escapeXml(url)}</guid>`,
      `      <pubDate>${new Date(postDate(post)).toUTCString()}</pubDate>`,
      summary ? `      <description>${cdata(summary)}</description>` : '',
      post.category ? `      <category>${cdata(post.category)}</category>` : '',
      post.author_name ? `      <dc:creator>${cdata(post.author_name)}</dc:creator>` : '',
      post.thumbnail
        ? `      <enclosure url="${escapeXml(post.thumbnail)}" type="image/jpeg" />`
        : '',
      '    </item>',
    ].filter(Boolean).join('\n')
  })

  const xml = [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom" xmlns:dc="http://purl.org/dc/elements/1.1/">',
    '  <channel>',
    `    <title>${cdata(`${SITE_NAME} — Мэдээ & Нийтлэл`)}</title>`,
    `    <link>${escapeXml(absoluteUrl('/posts'))}</link>`,
    `    <description>${cdata('Хэвлэлийн технологи, материал сонголт, дизайны зөвлөгөө болон үйлдвэрлэлийн туршлага.')}</description>`,
    '    <language>mn-MN</language>',
    `    <lastBuildDate>${new Date().toUTCString()}</lastBuildDate>`,
    `    <atom:link href="${escapeXml(feedUrl)}" rel="self" type="application/rss+xml" />`,
    `    <generator>${escapeXml(SITE_URL)}</generator>`,
    ...entries,
    '  </channel>',
    '</rss>',
  ].join('\n')

  return new Response(xml, {
    headers: {
      'content-type': 'application/rss+xml; charset=utf-8',
      'cache-control': 'public, max-age=0, s-maxage=900, stale-while-revalidate=3600',
    },
  })
}
