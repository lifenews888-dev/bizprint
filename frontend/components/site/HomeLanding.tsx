'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { ArrowRight } from 'lucide-react'
import { apiFetch, API_URL } from '@/lib/api'
import ProductCard from '@/components/ProductCard'
import InstantQuoteWidget from '@/components/InstantQuoteWidget'
import BlogSection from '@/components/blog/BlogSection'
import { Hero, About, Products as StaticProducts, Work, Contact } from './sections'
import { Badge, EASE, Lines, OrangeButton, WhiteButton } from './primitives'
import { home } from './content'

type ProductItem = Parameters<typeof ProductCard>[0]['product']
type Category = { id: string | number; name_mn?: string; name?: string; isActive?: boolean }
type Review = { text?: string; customer_name?: string; customer_company?: string; product_category?: string }

const h2 = 'text-[clamp(1.75rem,7vw,4.2rem)] font-medium leading-[1.08] tracking-[-0.03em] text-gray-900 sm:text-[clamp(2.5rem,5vw,4.2rem)]'

/* ---------- Бүтээгдэхүүн (API) ---------- */

function LiveProducts() {
  const [cats, setCats] = useState<Category[] | null>(null)
  const [active, setActive] = useState<string | null>(null)
  const [byCat, setByCat] = useState<Record<string, ProductItem[]>>({})
  const [failed, setFailed] = useState(false)

  useEffect(() => {
    apiFetch<Category[]>('/categories', { auth: false })
      .then((d) => {
        const list = Array.isArray(d) ? d.filter((c) => c.isActive !== false).slice(0, 8) : []
        if (!list.length) return setFailed(true)
        setCats(list)
        setActive(String(list[0].id))
      })
      .catch(() => setFailed(true))
  }, [])

  useEffect(() => {
    if (!active || byCat[active]) return
    apiFetch<{ data?: ProductItem[] } | ProductItem[]>(`/products?categoryId=${active}&limit=8`, { auth: false })
      .then((d) => setByCat((p) => ({ ...p, [active]: Array.isArray(d) ? d : d?.data ?? [] })))
      .catch(() => setByCat((p) => ({ ...p, [active]: [] })))
  }, [active, byCat])

  // API ажиллахгүй бол статик карусель харуулна
  if (failed) return <StaticProducts />

  const items = active ? byCat[active] : undefined

  return (
    <section id="products" className="bg-white pb-16 pt-8 sm:pb-20 lg:pb-28">
      <div className="mx-auto max-w-[1440px]">
        <Badge n="2" label={home.products.pill} />
        <div className="mb-8 flex flex-col gap-6 px-5 sm:mb-10 sm:flex-row sm:items-end sm:justify-between sm:px-8 lg:px-12">
          <div>
            <h2 className={h2}>{home.products.headline}</h2>
            <p className="mt-4 max-w-xl text-[15px] leading-[1.6] text-gray-600">{home.products.sub}</p>
          </div>
          <OrangeButton href="/shop">{home.products.cta}</OrangeButton>
        </div>

        <div className="mb-8 flex gap-2 overflow-x-auto px-5 pb-1 sm:px-8 lg:px-12" style={{ scrollbarWidth: 'none' }} role="tablist">
          {(cats ?? []).map((c) => {
            const id = String(c.id)
            const on = id === active
            return (
              <button
                key={id}
                role="tab"
                aria-selected={on}
                onClick={() => setActive(id)}
                className={`shrink-0 rounded-full border px-4 py-2 text-[13px] font-medium transition-colors duration-300 ${
                  on ? 'border-gray-900 bg-gray-900 text-white' : 'border-gray-200 text-gray-900 hover:border-gray-400'
                }`}
              >
                {c.name_mn || c.name}
              </button>
            )
          })}
        </div>

        <div className="px-5 sm:px-8 lg:px-12">
          {items === undefined ? (
            <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4 lg:gap-6">
              {Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="aspect-square animate-pulse rounded-2xl bg-gray-100" />
              ))}
            </div>
          ) : items.length ? (
            <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4 lg:gap-6">
              {items.slice(0, 8).map((p, i) => (
                <ProductCard key={p.id || i} product={p} />
              ))}
            </div>
          ) : (
            <p className="py-12 text-center text-[14px] text-gray-500">
              Энэ ангилалд бүтээгдэхүүн алга.{' '}
              <Link href="/shop" className="font-medium text-gray-900 underline">
                Дэлгүүрээс харах
              </Link>
            </p>
          )}
        </div>
      </div>
    </section>
  )
}

/* ---------- Үнэ шууд мэдэх ---------- */

function QuickQuote() {
  return (
    <section id="quote" className="bg-white pb-10 pt-16 sm:pt-20 lg:pt-28">
      <div className="mx-auto max-w-[1440px]">
        <Badge n="4" label={home.quote.pill} />
        <div className="grid items-start gap-10 px-5 sm:px-8 lg:grid-cols-2 lg:gap-16 lg:px-12">
          <div>
            <h2 className={h2}>
              <Lines lines={home.quote.headline} />
            </h2>
            <p className="mt-6 max-w-md text-[15px] leading-[1.6] text-gray-600 sm:text-[17px]">{home.quote.paragraph}</p>
            <ol className="mt-8 space-y-3">
              {home.quote.steps.map((s, i) => (
                <li key={s} className="flex items-center gap-3 text-[15px] text-gray-900">
                  <span className="flex h-7 w-7 items-center justify-center rounded-full bg-gray-900 text-[12px] font-semibold text-white">{i + 1}</span>
                  {s}
                </li>
              ))}
            </ol>
          </div>
          <div className="rounded-3xl bg-[#F5F5F5] p-2">
            <InstantQuoteWidget />
          </div>
        </div>
      </div>
    </section>
  )
}

/* ---------- Үйлчилгээ ---------- */

function Services() {
  return (
    <section className="bg-white pb-16 sm:pb-20 lg:pb-28">
      <div className="mx-auto grid max-w-[1440px] grid-cols-1 gap-4 px-5 sm:grid-cols-2 sm:px-8 lg:grid-cols-4 lg:px-12">
        {home.services.map((s) => (
          <a key={s.href} href={s.href} className="group flex items-center justify-between gap-4 rounded-2xl bg-[#F5F5F5] p-5 transition-shadow duration-300 hover:shadow-[0_4px_16px_rgba(0,0,0,0.08)]">
            <span>
              <span className="block text-[15px] font-semibold text-gray-900">{s.title}</span>
              <span className="mt-1 block text-[13px] text-gray-600">{s.note}</span>
            </span>
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gray-900">
              <ArrowRight size={14} className={`text-white transition-transform duration-500 ${EASE} -rotate-45 group-hover:rotate-0`} />
            </span>
          </a>
        ))}
      </div>
    </section>
  )
}

/* ---------- Сэтгэгдэл (зөвхөн бодит, баталгаажсан) ---------- */

function Reviews() {
  const [reviews, setReviews] = useState<Review[]>([])
  useEffect(() => {
    fetch(`${API_URL}/api/reviews?approved=true`)
      .then((r) => (r.ok ? r.json() : []))
      .then((d) => Array.isArray(d) && setReviews(d.filter((r: Review) => r.text).slice(0, 3)))
      .catch(() => {})
  }, [])
  if (reviews.length < 2) return null

  return (
    <section className="bg-[#F5F5F5] py-16 sm:py-20 lg:py-28">
      <div className="mx-auto max-w-[1440px]">
        <Badge n="5" label={home.reviews.pill} border="border-gray-300" />
        <h2 className={`${h2} mb-10 px-5 sm:mb-14 sm:px-8 lg:px-12`}>{home.reviews.headline}</h2>
        <div className="grid gap-5 px-5 sm:px-8 md:grid-cols-3 lg:px-12">
          {reviews.map((r, i) => (
            <figure key={i} className="rounded-2xl bg-white p-6">
              <blockquote className="text-[15px] leading-[1.65] text-gray-900">&ldquo;{r.text}&rdquo;</blockquote>
              <figcaption className="mt-5 text-[13px] text-gray-600">
                <span className="font-semibold text-gray-900">{r.customer_name || 'BizPrint үйлчлүүлэгч'}</span>
                {r.customer_company ? ` · ${r.customer_company}` : ''}
              </figcaption>
            </figure>
          ))}
        </div>
      </div>
    </section>
  )
}

/* ---------- Нүүр хуудас ---------- */

export default function HomeLanding() {
  const hh = home.hero
  return (
    <main className="site-light bg-white font-sans text-gray-900" data-theme="light">
      <Hero cta={hh.cta} ctaHref={hh.ctaHref} secondary={<WhiteButton href={hh.secondaryHref}>{hh.secondary}</WhiteButton>} />
      <About />
      <LiveProducts />
      <Work step="3" />
      <QuickQuote />
      <Services />
      <Reviews />
      <div className="bg-white">
        <BlogSection />
      </div>
      <Contact />
    </main>
  )
}
