import ProGate from '@/components/ProGate'

export default function BusinessCardsLayout({ children }: { children: React.ReactNode }) {
  return (
    <ProGate feature="Нэрийн хуудас editor" description="Нэрийн хуудас editor ашиглахад Basic төлөвлөгөө шаардлагатай" plan="basic">
      {children}
    </ProGate>
  )
}
