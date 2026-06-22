import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Нэрийн хуудасны загвар үнэгүй бүтээх | BizPrint',
  description: 'Нэрийн хуудасны бэлэн загвар сонгоод мэдээллээ бөглөж, хэвлэлд бэлэн файл үнэгүй үүсгээрэй. Basic plan шаардлагагүй.',
  openGraph: {
    title: 'Нэрийн хуудасны загвар үнэгүй бүтээх',
    description: 'Бэлэн загвар сонгох, мэдээлэл бөглөх, print-ready файл үүсгэх үнэгүй editor.',
    url: '/business-cards',
    type: 'website',
  },
}

export default function BusinessCardsLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
