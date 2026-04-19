import React from 'react'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Үнийн тооцоолуур | BizPrint',
  description: 'Хэвлэлийн үнийг шууд тооцоолоорой. Түргэн тооцоо, нарийвчилсан, AI тооцоолуур.',
  alternates: { canonical: 'https://bizprint.mn/quote' },
}

export default function QuoteLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
