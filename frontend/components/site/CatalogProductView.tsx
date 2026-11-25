'use client'

import { useState, useSyncExternalStore } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { toast } from 'sonner'
import { ChevronLeft, ChevronRight, Clock, FileUp, Truck } from 'lucide-react'
import ItemBuilder from './ItemBuilder'
import { apiFetch } from '@/lib/api'
import { useStore } from '@/lib/store'
import { catalog, fmt, typeFromPrice, typesOf, type Line, type Priced, type ProductType } from '@/lib/pricing'

/**
 * Албан үнийн жагсаалтаас үүссэн дэлгүүрийн барааны хуудас (pricing_mode = 'catalog').
 * Үнэ, сонголт нь /quote тооцоолууртай нэг эх сурвалжаас (lib/pricing) бодогдоно.
 */
export default function CatalogProductView({ type, productId }: { type: ProductType; productId?: string }) {
  const [img, setImg] = useState(0)
  // ?code=BP-005 — тухайн сонголтыг урьдчилан сонгоно (Facebook каталог, тооцоолуураас ирэх холбоос)
  const code = useSyncExternalStore(
    () => () => {},
    () => new URLSearchParams(window.location.search).get('code') || '',
    () => '',
  )
  const { addToCart } = useStore()
  const fp = typeFromPrice(type)
  const related = typesOf(type.cat).filter((t) => t.slug !== type.slug)

  const add = async (line: Line, p: Priced) => {
    const unit = Math.round(p.inc / p.cartQty)
    const name = `${type.name} — ${[p.title, p.subtitle].filter(Boolean).join(', ')}`
    const specs = {
      catalog: { version: catalog.version, type: type.slug, line },
      description: p.steps.join('; '),
      pricing: { source: 'catalog', pricingEngine: 'catalog.v1', unit_price: unit, total_price: p.inc, quantity: p.cartQty },
    }
    const id = `${productId || type.slug}:${line.id}`
    addToCart({ id, productId, name, price: unit, image: type.img[0], specs }, p.cartQty)
    toast.success('Сагсанд нэмэгдлээ', { description: `${name} · ${fmt(p.inc)}` })
    try {
      const u = JSON.parse(localStorage.getItem('user') || '{}')
      if (u?.id && productId) {
        await apiFetch<void>('/cart/items', { method: 'POST', body: { product_id: productId, quantity: p.cartQty, unit_price: unit, specs } })
      }
    } catch {}
  }

  return (
    <div className="bg-white">
      <div className="mx-auto max-w-[1440px] px-5 pb-20 pt-8 sm:px-8 lg:px-12">
        <nav className="mb-6 flex flex-wrap items-center gap-2 text-[13px] text-gray-500">
          <Link href="/shop" className="hover:text-gray-900">Дэлгүүр</Link>
          <span>/</span>
          <Link href={`/shop/category/${type.catSlug}`} className="hover:text-gray-900">{type.cat}</Link>
          <span>/</span>
          <span className="text-gray-900">{type.name}</span>
        </nav>

        <div className="grid items-start gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)] lg:gap-14">
          {/* Зураг */}
          <div className="lg:sticky lg:top-28">
            <div className="relative aspect-square overflow-hidden rounded-3xl bg-[#F5F5F5]">
              <Image src={type.img[img]} alt={type.name} fill priority sizes="(min-width: 1024px) 45vw, 100vw" className="object-cover" />
              {type.img.length > 1 && (
                <>
                  <button type="button" aria-label="Өмнөх" onClick={() => setImg((i) => (i + type.img.length - 1) % type.img.length)}
                    className="absolute left-3 top-1/2 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-white/90 shadow hover:bg-white">
                    <ChevronLeft className="h-5 w-5" />
                  </button>
                  <button type="button" aria-label="Дараах" onClick={() => setImg((i) => (i + 1) % type.img.length)}
                    className="absolute right-3 top-1/2 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-white/90 shadow hover:bg-white">
                    <ChevronRight className="h-5 w-5" />
                  </button>
                  <span className="absolute bottom-3 right-3 rounded-full bg-white/90 px-3 py-1 text-[12px] text-gray-700">{img + 1} / {type.img.length}</span>
                </>
              )}
            </div>
            {type.img.length > 1 && (
              <div className="mt-3 flex gap-2">
                {type.img.map((src, i) => (
                  <button key={src} type="button" onClick={() => setImg(i)} aria-label={`Зураг ${i + 1}`}
                    className={`relative h-20 w-20 overflow-hidden rounded-2xl border-2 ${i === img ? 'border-gray-900' : 'border-transparent'}`}>
                    <Image src={src} alt="" fill sizes="80px" className="object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Мэдээлэл ба захиалга */}
          <div>
            <p className="mb-3 text-[12px] font-medium uppercase tracking-[0.1em] text-gray-500">{type.cat}</p>
            <h1 data-keep-size className="text-[clamp(1.9rem,4vw,3rem)] font-medium leading-[1.05] tracking-[-0.03em] text-gray-900">{type.name}</h1>
            <p className="mt-3 text-[15px] text-gray-600">
              <span className="text-[22px] font-medium text-gray-900">{fmt(fp.inc)}</span>/{fp.per}-аас · НӨАТ орсон
            </p>
            {type.about && <p className="mt-4 max-w-xl text-[15px] leading-[1.6] text-gray-600">{type.about}</p>}

            <div className="mt-6 grid gap-2 text-[13px] text-gray-700 sm:grid-cols-3">
              <span className="flex items-center gap-2 rounded-2xl bg-[#F5F5F5] px-3 py-2.5"><FileUp className="h-4 w-4 shrink-0" />Файлаа захиалгын дараа илгээнэ</span>
              <span className="flex items-center gap-2 rounded-2xl bg-[#F5F5F5] px-3 py-2.5"><Truck className="h-4 w-4 shrink-0" />Хүргэлт 10–25 мянга</span>
              <span className="flex items-center gap-2 rounded-2xl bg-[#F5F5F5] px-3 py-2.5"><Clock className="h-4 w-4 shrink-0" />{catalog.delivery.time}</span>
            </div>

            <div className="mt-6 rounded-3xl bg-[#F5F5F5] p-5 sm:p-7">
              <ItemBuilder key={code} types={[type]} initialCode={code || undefined} actionLabel="Сагсанд нэмэх" onAction={add} />
            </div>
            <p className="mt-3 text-[12px] text-gray-500">
              Олон бараа хамт бодох бол <Link href={`/quote?cat=${type.catSlug}`} className="underline">үнийн тооцоолуур</Link>. {catalog.version}.
            </p>
          </div>
        </div>

        {related.length > 0 && (
          <section className="mt-20">
            <h2 className="mb-6 text-[clamp(1.5rem,3vw,2.2rem)] font-medium tracking-[-0.02em] text-gray-900">{type.cat}: бусад</h2>
            <TypeGrid types={related} />
          </section>
        )}
      </div>
    </div>
  )
}

export function TypeGrid({ types }: { types: ProductType[] }) {
  return (
    <div className="grid grid-cols-2 gap-3 sm:gap-5 md:grid-cols-3 xl:grid-cols-4">
      {types.map((t) => {
        const fp = typeFromPrice(t)
        return (
          <Link key={t.slug} href={`/product/${t.slug}`} className="group block">
            <div className="relative aspect-square overflow-hidden rounded-3xl bg-[#F5F5F5]">
              <Image src={t.img[0]} alt={t.name} fill sizes="(min-width: 1280px) 25vw, (min-width: 768px) 33vw, 50vw"
                className="object-cover transition-transform duration-500 group-hover:scale-[1.03]" />
            </div>
            <p className="mt-3 text-[15px] leading-tight text-gray-900">{t.name}</p>
            <p className="mt-1 text-[13px] text-gray-500">{fmt(fp.inc)}/{fp.per}-аас</p>
          </Link>
        )
      })}
    </div>
  )
}
