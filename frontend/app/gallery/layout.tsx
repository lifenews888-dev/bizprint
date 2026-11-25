import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Галерей — бодит ажил | BizPrint',
  description: 'BizPrint-ийн хэвлэсэн туг далбаа, стенд, үзэсгэлэнгийн фон, шагнал, бэлгийн бодит зургууд.',
  alternates: { canonical: 'https://bizprint.mn/gallery' },
}

export default function GalleryLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
