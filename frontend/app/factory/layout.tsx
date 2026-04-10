import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Хэвлэлийн үйлдвэрүүд | BizPrint',
  description: 'Монголын баталгаажсан хэвлэлийн үйлдвэрүүд. Үнэлгээ, захиалгын тоо, мэргэшлээр шүүх.',
  alternates: { canonical: 'https://bizprint.mn/factory' },
}

export default function FactoryLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
