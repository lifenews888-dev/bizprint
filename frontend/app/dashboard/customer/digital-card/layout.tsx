import React from 'react'
import ProGate from '@/components/ProGate'

export default function DigitalCardLayout({ children }: { children: React.ReactNode }) {
  return (
    <ProGate feature="Дижитал нэрийн хуудас" description="Дижитал нэрийн хуудас ашиглахад Pro төлөвлөгөө шаардлагатай" plan="pro">
      {children}
    </ProGate>
  )
}
