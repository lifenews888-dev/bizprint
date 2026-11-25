'use client'

import { Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import QuoteCalculator from '@/components/site/QuoteCalculator'
import { catalog } from '@/lib/pricing'

function Calculator() {
  const sp = useSearchParams()
  const initial = { code: sp.get('code') || undefined, cat: sp.get('cat') || undefined, tab: sp.get('tab') || undefined }
  return <QuoteCalculator key={`${initial.code}|${initial.cat}|${initial.tab}`} initial={initial} />
}

const RULES = [
  ['Талбайгаар', 'Баннер, стикер, хавтан: өргөн × өндөр (м²) × м²-ийн үнэ'],
  ['Багцаар', 'Нэрийн хуудас, брошур, бланк: сонгосон тиражийн багц үнэ'],
  ['Шатлалаар', 'Промо, бэлэг, ном: тоо ихсэх тусам нэгжийн үнэ буурна'],
  ['Хүргэлт', 'Ачааны хэмжээ × таны бүс, нэг захиалгад нэг удаа, дээд тал нь 25,000₮'],
]

export default function QuotePage() {
  return (
    <div className="bg-white">
      <section className="mx-auto max-w-[1440px] px-5 pb-8 pt-10 sm:px-8 sm:pt-14 lg:px-12">
        <p className="mb-4 text-[12px] font-medium uppercase tracking-[0.1em] text-gray-500">Үнийн тооцоолуур · {catalog.version}</p>
        <h1>Үнээ өөрөө бодоод, шууд захиал.</h1>
        <p className="mt-4 max-w-2xl text-[15px] leading-[1.6] text-gray-600 sm:text-[17px]">
          Албан ёсны үнийн жагсаалтаар бодно. Тооцоо бүр ил харагдана — хэмжээ, тоо, нэгжийн үнэ, хүргэлт. Бүх үнэ НӨАТ-тэй.
        </p>
        <div className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {RULES.map(([t, d]) => (
            <div key={t} className="rounded-2xl border border-gray-200 p-4">
              <p className="text-[14px] font-medium text-gray-900">{t}</p>
              <p className="mt-1 text-[13px] leading-[1.5] text-gray-600">{d}</p>
            </div>
          ))}
        </div>
      </section>
      <section className="mx-auto max-w-[1440px] px-5 pb-20 sm:px-8 lg:px-12">
        <Suspense fallback={<div className="h-96 rounded-3xl bg-[#F5F5F5]" />}>
          <Calculator />
        </Suspense>
      </section>
    </div>
  )
}
