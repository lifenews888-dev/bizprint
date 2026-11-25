'use client'

import Link from 'next/link'
import { HeroShader, ORANGE, SafeBoundary, Lines } from './primitives'
import { brand } from './content'

/** Нэвтрэх / бүртгүүлэх хуудсын зүүн тал — нүүр хуудасны hero-тэй ижил хэв маяг */
export default function AuthBrandPanel({
  headline = ['Захиалга бүхэн,', 'нэг дор.'],
  text = 'Нэрийн хуудаснаас фасадны туг хүртэл — үнэ тооцоолох, захиалах, хянах бүгд нэг бүртгэлээр.',
}: {
  headline?: string[]
  text?: string
}) {
  return (
    <div className="hide-mobile relative flex flex-[0_0_52%] flex-col justify-between overflow-hidden bg-[#EFEFEF] p-12">
      <div className="pointer-events-none absolute inset-0">
        <SafeBoundary>
          <HeroShader color={ORANGE} />
        </SafeBoundary>
      </div>
      <div className="relative z-10">
        <Link href="/" className="inline-flex items-center gap-3 no-underline">
          <span className="flex h-10 w-10 items-center justify-center rounded-full bg-gray-900 text-[11px] font-bold tracking-tight text-white">
            {brand.short}
          </span>
          <span className="text-[15px] font-medium text-gray-900">{brand.name}</span>
        </Link>
      </div>
      <div className="relative z-10">
        <p className="mb-6 text-[14px] tracking-wide text-gray-900">BizPrint · Хэвлэлийн бүх үйлчилгээ</p>
        <h1 className="mb-6 text-[clamp(2.5rem,4.5vw,4rem)] font-medium leading-[1.08] tracking-[-0.03em] text-gray-900">
          <Lines lines={headline} />
        </h1>
        <p className="max-w-[380px] text-[16px] leading-[1.6] text-gray-700">{text}</p>
      </div>
      <div className="relative z-10 text-[13px] text-gray-600">
        {brand.phone} · {brand.email}
      </div>
    </div>
  )
}
