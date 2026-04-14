import ProGate from '@/components/ProGate'

export default function CampaignsLayout({ children }: { children: React.ReactNode }) {
  return (
    <ProGate feature="Кампани удирдах" description="Кампани удирдахад Pro төлөвлөгөө шаардлагатай" plan="pro">
      {children}
    </ProGate>
  )
}
