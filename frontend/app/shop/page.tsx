import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import ShopCatalog from '@/components/site/ShopCatalog'
import { catBySlug, catSlug } from '@/lib/pricing'

export const metadata: Metadata = {
  title: 'Дэлгүүр | BizPrint — Хэвлэлийн бүтээгдэхүүн',
  description: 'Нэрийн хуудас, брошур, баннер, туг, стикер, хаяг реклам, промо бэлэг — албан үнээр онлайнаар захиалаарай. Бүх үнэ НӨАТ орсон.',
  alternates: { canonical: 'https://bizprint.mn/shop' },
}

export default async function ShopPage({ searchParams }: { searchParams: Promise<{ cat?: string; category?: string }> }) {
  const sp = await searchParams
  const c = sp.cat || sp.category
  if (c && (catBySlug(c) || catSlug(c))) redirect(`/shop/category/${catSlug(c) || c}`)
  return <ShopCatalog />
}
