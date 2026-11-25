'use client'

import Link from 'next/link'
import { useState } from 'react'
import { ArrowRight, Check, FileText, Search, Upload } from 'lucide-react'
import { BIZCARD_COUNT, bizcardCodes, bizcardImg } from '@/lib/bizcard-templates'
import { fmt, getType, typeFromPrice } from '@/lib/pricing'

const PAGE = 60

export default function BizcardGallery() {
  const [q, setQ] = useState('')
  const [shown, setShown] = useState(PAGE)
  const type = getType('bizcard')
  const from = type ? typeFromPrice(type) : null

  const digits = q.replace(/\D/g, '')
  const list = digits
    ? bizcardCodes.filter((c) => c.slice(6).includes(digits) || Number(c.slice(6)) === Number(digits))
    : bizcardCodes

  return (
    <main className="min-h-screen bg-[#F7F5F2]">
      <section className="mx-auto max-w-6xl px-5 pb-8 pt-10 md:pt-14">
        <p className="text-[12px] font-medium uppercase tracking-[0.12em] text-[#FF6B00]">Нэрийн хуудас</p>
        <h1 className="mt-2 max-w-3xl text-[32px] font-semibold leading-[1.1] tracking-[-0.02em] text-gray-900 md:text-[44px]">
          {BIZCARD_COUNT} бэлэн загвараас сонгоод захиалаарай
        </h1>
        <p className="mt-3 max-w-2xl text-[15px] leading-[1.6] text-gray-600">
          Загвараа сонгож, нэрийн хуудсанд орох мэдээлэл, логогоо өгнө. Эх бэлтгэлийг манай дизайнер хийж, танд батлуулсны дараа хэвлэнэ.
          {from && <> Үнэ {fmt(from.inc)}-с (НӨАТ орсон).</>}
        </p>
        <ol className="mt-6 grid gap-3 sm:grid-cols-3">
          {[
            { i: Check, t: 'Загвар сонгох', d: 'Код бүрээр нь хайж болно' },
            { i: Upload, t: 'Мэдээлэл, лого өгөх', d: 'Нэр, утас, имэйл, лого' },
            { i: FileText, t: 'Эх бэлтгэл батлах', d: 'Батласны дараа хэвлэнэ' },
          ].map((s, n) => (
            <li key={s.t} className="flex items-center gap-3 rounded-2xl bg-white p-4">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#FF6B00]/10 text-[#FF6B00]"><s.i className="h-5 w-5" /></span>
              <span>
                <span className="block text-[14px] font-medium text-gray-900">{n + 1}. {s.t}</span>
                <span className="block text-[12px] text-gray-500">{s.d}</span>
              </span>
            </li>
          ))}
        </ol>
      </section>

      <section className="mx-auto max-w-6xl px-5 pb-16">
        <div className="sticky top-16 z-10 -mx-5 mb-5 flex flex-wrap items-center gap-3 bg-[#F7F5F2]/95 px-5 py-3 backdrop-blur">
          <label className="relative flex-1 min-w-[220px]">
            <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <input
              value={q}
              onChange={(e) => { setQ(e.target.value); setShown(PAGE) }}
              inputMode="numeric"
              placeholder="Загварын код (жишээ: 125 эсвэл BP-NC-125)"
              className="w-full rounded-full border border-gray-200 bg-white py-3 pl-11 pr-4 text-[15px] text-gray-900 outline-none focus:border-gray-900"
            />
          </label>
          <span className="text-[13px] text-gray-500">{list.length} загвар</span>
        </div>

        {list.length === 0 ? (
          <p className="rounded-2xl bg-white p-8 text-center text-[14px] text-gray-500">«{q}» кодтой загвар олдсонгүй. 001–{BIZCARD_COUNT} хооронд код оруулна уу.</p>
        ) : (
          <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:gap-4 lg:grid-cols-4">
            {list.slice(0, shown).map((code) => (
              <li key={code}>
                <Link href={`/business-cards/${code}`} className="group block overflow-hidden rounded-2xl bg-white transition-shadow hover:shadow-lg">
                  <span className="block aspect-square overflow-hidden bg-gray-100">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={bizcardImg(code)} alt={`Нэрийн хуудасны загвар ${code}`} loading="lazy" decoding="async" width={720} height={720}
                      className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.03]" />
                  </span>
                  <span className="flex items-center justify-between gap-2 px-3 py-2.5">
                    <span className="text-[13px] font-medium tracking-[0.02em] text-gray-900">{code}</span>
                    <span className="flex items-center gap-1 text-[12px] text-[#FF6B00]">Сонгох <ArrowRight className="h-3.5 w-3.5" /></span>
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        )}

        {shown < list.length && (
          <div className="mt-8 text-center">
            <button type="button" onClick={() => setShown((n) => n + PAGE)}
              className="rounded-full border border-gray-300 bg-white px-7 py-3 text-[14px] font-medium text-gray-900 hover:border-gray-900">
              Цааш үзэх ({list.length - shown} үлдсэн)
            </button>
          </div>
        )}

        <p className="mt-10 text-center text-[13px] text-gray-500">
          Өөрийн загвартай юу? <Link href="/product/bizcard" className="text-[#FF6B00] underline-offset-2 hover:underline">Бэлэн файлаараа захиалах</Link>
        </p>
      </section>
    </main>
  )
}
