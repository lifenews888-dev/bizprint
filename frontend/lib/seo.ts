/**
 * SEO-ийн нэгдсэн тохиргоо.
 *
 * Сайтын бүтэн хаяг нь canonical, Open Graph, JSON-LD, sitemap, RSS бүхэнд
 * шаардлагатай — тэднийг нэг эх сурвалжаас авбал тархсан домэйн зөрөхгүй.
 */

export const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL || 'https://bizprint.mn').replace(/\/$/, '')
export const SITE_NAME = 'Bizprint.mn'
export const SITE_LOCALE = 'mn_MN'

/** Сервер тал дээрх API хаяг (SSR, sitemap, RSS) */
export const SERVER_API_URL = (process.env.API_URL || process.env.NEXT_PUBLIC_API_URL || '').replace(/\/$/, '')

/** Харьцангуй замыг бүтэн URL болгоно. Аль хэдийн бүтэн бол хөндөхгүй. */
export const absoluteUrl = (path: string): string => {
  if (/^https?:\/\//i.test(path)) return path
  return `${SITE_URL}${path.startsWith('/') ? path : `/${path}`}`
}

/**
 * Meta description-д тохирох урттай, тагуудаас цэвэрлэсэн текст.
 * Google ~155-160 тэмдэгт харуулдаг тул 160 дээр таслана.
 */
export const metaDescription = (...candidates: Array<string | null | undefined>): string => {
  for (const candidate of candidates) {
    const text = (candidate || '')
      .replace(/<[^>]*>/g, ' ')
      .replace(/&[a-z]+;/gi, ' ')
      .replace(/\s+/g, ' ')
      .trim()
    if (text.length >= 40) return text.length > 160 ? `${text.slice(0, 157).trimEnd()}...` : text
    if (text) return text
  }
  return ''
}

/** JSON-LD-г script тагт хийхэд — HTML-ээс гарах </script> халдлагыг блоклоно */
export const jsonLdScript = (data: unknown): string =>
  JSON.stringify(data).replace(/</g, '\\u003c')
