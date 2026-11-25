import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { bizcardCodes, bizcardImg, isBizcardCode } from '@/lib/bizcard-templates'
import BizcardTemplateView from './BizcardTemplateView'

export const dynamicParams = false

export function generateStaticParams() {
  return bizcardCodes.map((code) => ({ code }))
}

export async function generateMetadata({ params }: { params: Promise<{ code: string }> }): Promise<Metadata> {
  const { code } = await params
  return {
    title: `Нэрийн хуудас ${code} загвар | BizPrint`,
    description: `${code} загвараар нэрийн хуудсаа захиалаарай: мэдээлэл, логогоо өгөхөд эх бэлтгэлийг BizPrint хийж, батлуулсны дараа хэвлэнэ.`,
    alternates: { canonical: `https://bizprint.mn/business-cards/${code}` },
    openGraph: { title: `Нэрийн хуудас ${code}`, images: [bizcardImg(code)], url: `/business-cards/${code}` },
  }
}

export default async function BizcardTemplatePage({ params }: { params: Promise<{ code: string }> }) {
  const { code } = await params
  if (!isBizcardCode(code)) notFound()
  return <BizcardTemplateView code={code} />
}
