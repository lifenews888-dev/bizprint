import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Нэрийн хуудасны 389 бэлэн загвар | BizPrint',
  description: 'Кодтой 389 бэлэн загвараас сонгоод мэдээлэл, логогоо өгөөд нэрийн хуудсаа захиалаарай. Эх бэлтгэлийг бид хийж, батлуулсны дараа хэвлэнэ.',
  alternates: { canonical: 'https://bizprint.mn/business-cards' },
  openGraph: {
    title: 'Нэрийн хуудасны 389 бэлэн загвар',
    description: 'Загвараа сонгох, мэдээллээ бөглөх, логогоо оруулах — эх бэлтгэлийг BizPrint хийнэ.',
    url: '/business-cards',
    type: 'website',
    images: ['/bizcard/BP-NC-001.webp'],
  },
}

export default function BusinessCardsLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
