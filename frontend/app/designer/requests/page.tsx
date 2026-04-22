'use client'
import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function DesignerRequestsRedirect() {
  const router = useRouter()
  useEffect(() => { router.replace('/designer/approval') }, [router])
  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text2)' }}>
      Шилжүүлж байна...
    </div>
  )
}
