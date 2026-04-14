import ProGate from '@/components/ProGate'

export default function AnalyticsLayout({ children }: { children: React.ReactNode }) {
  return (
    <ProGate feature="Аналитик тайлан" description="Аналитик тайлан ашиглахад Pro төлөвлөгөө шаардлагатай" plan="pro">
      {children}
    </ProGate>
  )
}
