import type { Metadata } from 'next'
import PrintLanding from '@/components/print-landing/PrintLanding'

export const metadata: Metadata = {
  title: 'BizPrint — Нэрийн хуудаснаас фасадны туг хүртэл',
  description:
    'Нэрийн хуудас, туг далбаа, баннер, стикер, UV болон офсет хэвлэл — дизайнаас хүлээлгэн өгөх хүртэл нэг дороос. Логос Төв 701 тоот · 7200-0444',
  alternates: { canonical: '/print' },
  openGraph: {
    title: 'BizPrint — Таны брэндийг хэвлэлээр амилуулна',
    description: 'Нэрийн хуудас, туг далбаа, баннер, стикер, офсет хэвлэл. 7200-0444',
    url: '/print',
    images: ['/print-landing/about-large.jpg'],
  },
}

export default function PrintPage() {
  return <PrintLanding />
}
