import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Үнийн тооцоолуур | BizPrint',
  description: 'BizPrint-ийн албан ёсны үнийн жагсаалтаар хэвлэлийн үнээ шууд тооцоолоорой: баннер, нэрийн хуудас, туг, хаяг реклам, промо, ном. Бүх үнэ НӨАТ-тэй, хүргэлт бүсээр.',
  alternates: { canonical: 'https://bizprint.mn/quote' },
}

export default function QuoteLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
