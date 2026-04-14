import ProGate from '@/components/ProGate'

export default function B2BLayout({ children }: { children: React.ReactNode }) {
  return (
    <ProGate feature="B2B данс" description="B2B данс ашиглахад Pro төлөвлөгөө шаардлагатай" plan="pro">
      {children}
    </ProGate>
  )
}
