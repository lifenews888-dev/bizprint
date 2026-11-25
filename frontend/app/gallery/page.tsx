'use client'

import { useEffect, useMemo, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { ArrowRight, ChevronLeft, ChevronRight, X } from 'lucide-react'
import { API_URL } from '@/lib/api'
import gallery from '@/lib/gallery.json'

/**
 * Бодит ажлын галерей. Үндсэн зургууд repo-д (lib/gallery.json, public/gallery/),
 * админаас /gallery API-д нэмсэн зургууд араас нь нэмэгдэнэ.
 */
type Item = { src: string; title: string; cat: string; slug?: string; poster?: boolean; desc?: string }
type ApiItem = { id?: string; url?: string; image_url?: string; caption?: string; title?: string; category?: string; description?: string; is_active?: boolean }

const BASE: Item[] = gallery.items as Item[]

export default function GalleryPage() {
  const [extra, setExtra] = useState<Item[]>([])
  const [cat, setCat] = useState('Бүгд')
  const [open, setOpen] = useState<number | null>(null)

  useEffect(() => {
    fetch(`${API_URL}/api/gallery`)
      .then((r) => (r.ok ? (r.json() as Promise<ApiItem[]>) : []))
      .then((d) => {
        if (!Array.isArray(d)) return
        setExtra(
          d.filter((x) => x.is_active !== false && (x.url || x.image_url)).map((x) => ({
            src: (x.url || x.image_url)!,
            title: x.title || x.caption || 'BizPrint',
            cat: x.category || 'Бусад',
            desc: x.description,
          })),
        )
      })
      .catch(() => {})
  }, [])

  const all = useMemo(() => [...BASE, ...extra], [extra])
  const cats = useMemo(() => ['Бүгд', 'Постер', ...[...new Set(all.map((i) => i.cat))]].filter((c, i, a) => a.indexOf(c) === i && (c !== 'Постер' || all.some((x) => x.poster))), [all])
  const list = all.filter((i) => cat === 'Бүгд' || (cat === 'Постер' ? i.poster : i.cat === cat))
  const cur = open !== null ? list[open] : null

  useEffect(() => {
    if (open === null) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(null)
      if (e.key === 'ArrowRight') setOpen((i) => (i === null ? i : (i + 1) % list.length))
      if (e.key === 'ArrowLeft') setOpen((i) => (i === null ? i : (i + list.length - 1) % list.length))
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, list.length])

  const pill = (on: boolean) =>
    `shrink-0 rounded-full border px-4 py-2 text-[13px] transition-colors ${on ? 'border-gray-900 bg-gray-900 text-white' : 'border-gray-200 bg-white text-gray-800 hover:border-gray-400'}`

  return (
    <div className="bg-white">
      <section className="mx-auto max-w-[1440px] px-5 pb-6 pt-10 sm:px-8 sm:pt-14 lg:px-12">
        <p className="mb-4 text-[12px] font-medium uppercase tracking-[0.1em] text-gray-500">Галерей · бодит ажил</p>
        <h1>Бидний хэвлэсэн ажлууд.</h1>
        <p className="mt-4 max-w-2xl text-[15px] leading-[1.6] text-gray-600 sm:text-[17px]">
          Туг далбаа, стенд, үзэсгэлэнгийн фон, шагнал, бэлэг — захиалагчдад хүлээлгэн өгсөн бүтээгдэхүүний бодит зургууд.
        </p>
        <nav className="-mx-5 mt-8 flex gap-2 overflow-x-auto px-5 pb-2 sm:mx-0 sm:flex-wrap sm:px-0">
          {cats.map((c) => (
            <button key={c} type="button" className={pill(c === cat)} onClick={() => { setCat(c); setOpen(null) }}>{c}</button>
          ))}
        </nav>
      </section>

      <div className="mx-auto max-w-[1440px] px-5 pb-24 pt-4 sm:px-8 lg:px-12">
        <div className="grid grid-cols-2 gap-3 sm:gap-5 md:grid-cols-3 xl:grid-cols-4">
          {list.map((it, i) => (
            <button key={it.src} type="button" onClick={() => setOpen(i)} className="group block text-left">
              <div className="relative aspect-[4/5] overflow-hidden rounded-3xl bg-[#F5F5F5]">
                <Image src={it.src} alt={it.title} fill sizes="(min-width: 1280px) 25vw, (min-width: 768px) 33vw, 50vw"
                  className="object-cover transition-transform duration-500 group-hover:scale-[1.03]" />
              </div>
              <p className="mt-3 text-[15px] leading-tight text-gray-900">{it.title}</p>
              <p className="mt-1 text-[13px] text-gray-500">{it.cat}</p>
            </button>
          ))}
        </div>

        <div className="mt-16 flex flex-col items-start gap-4 rounded-3xl bg-[#F5F5F5] p-6 sm:flex-row sm:items-center sm:justify-between sm:p-8">
          <div>
            <p className="text-[20px] font-medium tracking-[-0.02em] text-gray-900">Танд ийм бүтээгдэхүүн хэрэгтэй юу?</p>
            <p className="mt-1 text-[14px] text-gray-600">Дэлгүүрээс сонгоод үнээ шууд бодоорой.</p>
          </div>
          <Link href="/shop" className="inline-flex items-center gap-2 rounded-full bg-[#FF6B00] px-6 py-3 text-[14px] font-medium text-white hover:opacity-90">
            Дэлгүүр <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </div>

      {cur && open !== null && (
        <div className="fixed inset-0 z-[5000] flex items-center justify-center bg-black/90 p-4" onClick={() => setOpen(null)}>
          <div className="relative flex max-h-full w-full max-w-[960px] flex-col items-center gap-4 sm:flex-row sm:items-end" onClick={(e) => e.stopPropagation()}>
            <div className="relative aspect-[4/5] w-full max-w-[min(560px,70vh)] overflow-hidden rounded-3xl bg-black">
              <Image src={cur.src} alt={cur.title} fill sizes="560px" className="object-contain" />
            </div>
            <div className="w-full text-white sm:flex-1">
              <p className="text-[12px] uppercase tracking-[0.1em] text-white/60">{cur.cat}</p>
              <p className="mt-1 text-[24px] font-medium leading-tight">{cur.title}</p>
              {cur.desc && <p className="mt-2 text-[14px] text-white/70">{cur.desc}</p>}
              {cur.slug && (
                <Link href={`/product/${cur.slug}`} className="mt-4 inline-flex items-center gap-2 rounded-full bg-[#FF6B00] px-5 py-2.5 text-[14px] font-medium text-white hover:opacity-90">
                  Захиалах, үнэ бодох <ArrowRight className="h-4 w-4" />
                </Link>
              )}
              <p className="mt-4 text-[12px] text-white/50">{open + 1} / {list.length}</p>
            </div>
            <button type="button" aria-label="Хаах" onClick={() => setOpen(null)} className="absolute -top-2 right-0 flex h-10 w-10 items-center justify-center rounded-full bg-white/15 text-white hover:bg-white/25"><X className="h-5 w-5" /></button>
          </div>
          <button type="button" aria-label="Өмнөх" onClick={(e) => { e.stopPropagation(); setOpen((i) => (i === null ? i : (i + list.length - 1) % list.length)) }}
            className="absolute left-3 top-1/2 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-white/15 text-white hover:bg-white/25"><ChevronLeft className="h-5 w-5" /></button>
          <button type="button" aria-label="Дараах" onClick={(e) => { e.stopPropagation(); setOpen((i) => (i === null ? i : (i + 1) % list.length)) }}
            className="absolute right-3 top-1/2 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-white/15 text-white hover:bg-white/25"><ChevronRight className="h-5 w-5" /></button>
        </div>
      )}
    </div>
  )
}
