'use client'

import { useSearchParams } from 'next/navigation'
import ProGate from '@/components/ProGate'

export default function DesignEditorGate({ children }: { children: React.ReactNode }) {
  const params = useSearchParams()
  const type = String(params.get('type') || '').toLowerCase()
  const isBusinessCard = type === '' || type === 'business-card' || type === 'business-cards'

  if (isBusinessCard) return <>{children}</>

  return (
    <ProGate feature="Design editor" description="Design editor ашиглахад Basic төлөвлөгөө шаардлагатай" plan="basic">
      {children}
    </ProGate>
  )
}
