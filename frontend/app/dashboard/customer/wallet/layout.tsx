import React from 'react'
import ProGate from '@/components/ProGate'

export default function WalletLayout({ children }: { children: React.ReactNode }) {
  return (
    <ProGate feature="Хэтэвч" description="Хэтэвч ашиглахад Pro төлөвлөгөө шаардлагатай" plan="pro">
      {children}
    </ProGate>
  )
}
