import type { Metadata } from 'next'
import ProductPageClient from './ProductPageClient'

export const revalidate = 60

type Product = {
  id?: string
  slug?: string
  name?: string
  name_mn?: string
  description?: string
  category?: string
  subcategory?: string
  sku?: string
  base_price?: string | number | null
  sale_price?: string | number | null
  thumbnail_url?: string | null
  images?: string[] | null
  is_out_of_stock?: boolean
  compare_specs?: Record<string, unknown> | null
}

type PageProps = {
  params: Promise<{ _slug: string }> | { _slug: string }
}

const API_URL = (
  process.env.NEXT_PUBLIC_API_URL ||
  process.env.API_URL ||
  (process.env.NODE_ENV === 'production' ? 'https://api.bizprint.mn' : 'http://localhost:4000')
).replace(/\/$/, '')

const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL || 'https://bizprint.mn').replace(/\/$/, '')

function safeDecode(value: string) {
  try {
    return decodeURIComponent(value)
  } catch {
    return value
  }
}

function stripHtml(value: unknown) {
  return String(value || '')
    .replace(/<[^>]*>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

function productName(product: Product) {
  return product.name_mn || product.name || 'BizPrint бүтээгдэхүүн'
}

function productDescription(product: Product) {
  const specs = product.compare_specs || {}
  const fromSpecs = stripHtml(specs.seo_description || specs.features_html || specs.qty_condition)
  const raw = stripHtml(product.description) || fromSpecs
  return raw || `${productName(product)} бүтээгдэхүүн. Bizprint.mn дээр захиалах боломжтой.`
}

function productImages(product: Product) {
  const urls = [product.thumbnail_url, ...(Array.isArray(product.images) ? product.images : [])]
  return Array.from(new Set(urls.filter((url): url is string => !!url && /^https?:\/\//i.test(url))))
}

function productPrice(product: Product) {
  const raw = product.sale_price ?? product.base_price ?? 0
  const price = Number(raw)
  return Number.isFinite(price) ? Math.max(0, price) : 0
}

function productUrl(product: Product, fallbackSlug: string) {
  const slug = product.slug || safeDecode(fallbackSlug)
  return `${SITE_URL}/product/${encodeURIComponent(slug)}`
}

function normalizeSlug(value: string) {
  return safeDecode(value)
    .toLowerCase()
    .replace(/[^a-zа-яөүё0-9]+/gi, '-')
    .replace(/^-+|-+$/g, '')
}

function slugDistance(a: string, b: string) {
  if (Math.abs(a.length - b.length) > 3) return Number.POSITIVE_INFINITY
  const previous = Array.from({ length: b.length + 1 }, (_, index) => index)
  for (let i = 1; i <= a.length; i++) {
    const current = [i]
    let rowMin = current[0]
    for (let j = 1; j <= b.length; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1
      current[j] = Math.min(previous[j] + 1, current[j - 1] + 1, previous[j - 1] + cost)
      rowMin = Math.min(rowMin, current[j])
    }
    if (rowMin > 3) return Number.POSITIVE_INFINITY
    previous.splice(0, previous.length, ...current)
  }
  return previous[b.length]
}

async function fetchJson<T>(url: string): Promise<T | null> {
  try {
    const res = await fetch(url, { next: { revalidate } })
    if (!res.ok) return null
    const text = await res.text()
    if (!text.trim()) return null
    return JSON.parse(text) as T
  } catch {
    return null
  }
}

function validProduct(value: unknown): value is Product {
  return !!value && typeof value === 'object' && !!(value as Product).id
}

async function getProduct(slugParam: string): Promise<Product | null> {
  const slug = safeDecode(slugParam)
  const direct = await fetchJson<Product>(`${API_URL}/api/products/${encodeURIComponent(slug)}`)
  if (validProduct(direct)) return direct

  const list = await fetchJson<Product[]>(`${API_URL}/api/products?limit=100`)
  if (!Array.isArray(list)) return null

  const normalized = normalizeSlug(slug)
  const exact = list.find(item => normalizeSlug(item.slug || item.id || '') === normalized)
  if (validProduct(exact)) return exact

  const close = list
    .map(item => ({ item, distance: slugDistance(normalized, normalizeSlug(item.slug || '')) }))
    .filter(({ distance }) => distance <= 2)
    .sort((a, b) => a.distance - b.distance)[0]?.item

  return validProduct(close) ? close : null
}

function productJsonLd(product: Product, fallbackSlug: string) {
  const name = productName(product)
  const url = productUrl(product, fallbackSlug)
  const images = productImages(product)
  const price = productPrice(product)

  return {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name,
    description: productDescription(product),
    image: images.length ? images : undefined,
    sku: product.sku || product.id,
    category: product.subcategory || product.category,
    brand: { '@type': 'Brand', name: 'BizPrint' },
    url,
    offers: {
      '@type': 'Offer',
      url,
      priceCurrency: 'MNT',
      price: String(Math.round(price)),
      availability: product.is_out_of_stock ? 'https://schema.org/OutOfStock' : 'https://schema.org/InStock',
    },
  }
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { _slug } = await params
  const product = await getProduct(_slug)

  if (!product) {
    return {
      title: 'Бүтээгдэхүүн олдсонгүй | BizPrint',
      robots: { index: false, follow: false },
    }
  }

  const name = productName(product)
  const description = productDescription(product)
  const images = productImages(product)
  const url = productUrl(product, _slug)
  const price = productPrice(product)

  return {
    title: `${name} | BizPrint`,
    description,
    alternates: { canonical: url },
    openGraph: {
      type: 'website',
      locale: 'mn_MN',
      siteName: 'Bizprint.mn',
      title: name,
      description,
      url,
      images: images.map(imageUrl => ({ url: imageUrl, alt: name })),
    },
    twitter: {
      card: images.length ? 'summary_large_image' : 'summary',
      title: name,
      description,
      images,
    },
    other: {
      'product:price:amount': String(Math.round(price)),
      'product:price:currency': 'MNT',
      'product:availability': product.is_out_of_stock ? 'out of stock' : 'in stock',
      'og:price:amount': String(Math.round(price)),
      'og:price:currency': 'MNT',
    },
  }
}

export default async function ProductPage({ params }: PageProps) {
  const { _slug } = await params
  const product = await getProduct(_slug)

  return (
    <>
      {product && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(productJsonLd(product, _slug)) }}
        />
      )}
      <ProductPageClient initialProduct={product || undefined} slug={_slug} />
    </>
  )
}
