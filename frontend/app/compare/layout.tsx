import React from 'react'
import ProGate from '@/components/ProGate'

export default function CompareLayout({ children }: { children: React.ReactNode }) {
  return (
    <ProGate feature="Үнэ харьцуулах" description="Үнэ харьцуулах боломжид Basic төлөвлөгөө шаардлагатай" plan="basic">
      {children}
    </ProGate>
  )
}
