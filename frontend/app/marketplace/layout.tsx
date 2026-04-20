import React from 'react'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Creator Marketplace | BizPrint',
  description: 'Монголын хамгийн том дизайн маркетплейс. Мэргэжлийн дизайнеруудтай холбогдоорой.',
  alternates: { canonical: 'https://bizprint.mn/marketplace' },
}

export default function MarketplaceLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
