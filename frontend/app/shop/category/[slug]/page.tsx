import type { Metadata } from 'next'
import { notFound, redirect } from 'next/navigation'
import ShopCatalog from '@/components/site/ShopCatalog'
import { catalog, catBySlug } from '@/lib/pricing'

// Хуучин дэлгүүрийн ангиллын холбоосууд
const LEGACY: Record<string, string> = {
  'business-cards': 'business-card', offset: 'marketing', flyer: 'marketing', digital: 'marketing', book: 'marketing', books: 'marketing',
  stickers: 'sticker', banners: 'banner', wide_format: 'banner', packaging: 'promo', merchandise: 'promo', office: 'office', events: 'banner',
}

export function generateStaticParams() {
  return Object.values(catalog.categorySlugs).map((slug) => ({ slug }))
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params
  const cat = catBySlug(slug)
  return {
    title: `${cat || 'Дэлгүүр'} | BizPrint`,
    description: `${cat || 'Хэвлэлийн бүтээгдэхүүн'} — албан үнэ, НӨАТ орсон. Сонгоод шууд захиална.`,
    alternates: { canonical: `https://bizprint.mn/shop/category/${slug}` },
  }
}

export default async function CategoryPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const cat = catBySlug(slug)
  if (!cat) {
    if (LEGACY[slug]) redirect(`/shop/category/${LEGACY[slug]}`)
    notFound()
  }
  return <ShopCatalog active={cat} />
}
