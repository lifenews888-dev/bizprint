import React from 'react'
import ProGate from '@/components/ProGate'

export default function LoyaltyLayout({ children }: { children: React.ReactNode }) {
  return (
    <ProGate feature="Loyalty хөтөлбөр" description="Loyalty хөтөлбөр ашиглахад Pro төлөвлөгөө шаардлагатай" plan="pro">
      {children}
    </ProGate>
  )
}
