import React from 'react'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Бүтээлийн галерей | BizPrint',
  description: 'BizPrint хэвлэлийн шилдэг бүтээлүүд. Нэрийн хуудас, флаер, баннер, хаяг, ном, хайрцаг.',
  alternates: { canonical: 'https://bizprint.mn/gallery' },
}

export default function GalleryLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
