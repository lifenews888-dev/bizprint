import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Загвар сан | BizPrint',
  description: 'Хэвлэлийн загваруудыг үнэгүй ашиглаарай. Визит карт, флаер, постер, баннер загварууд.',
  alternates: { canonical: 'https://bizprint.mn/templates' },
}

export default function TemplatesLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
