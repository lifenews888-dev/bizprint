import React from 'react'
import ProGate from '@/components/ProGate'

export default function EditorLayout({ children }: { children: React.ReactNode }) {
  return (
    <ProGate feature="Design editor" description="Design editor ашиглахад Basic төлөвлөгөө шаардлагатай" plan="basic">
      {children}
    </ProGate>
  )
}
