'use client'
import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function PricingRulesRedirect() {
  const router = useRouter()
  useEffect(() => { router.replace('/admin/pricing') }, [router])
  return <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '60vh', fontFamily: 'system-ui' }}>Шилжүүлж байна...</div>
}
