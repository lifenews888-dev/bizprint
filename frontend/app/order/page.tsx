'use client'
import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

// /order → redirect to customer dashboard orders section
export default function OrderRedirect() {
  const router = useRouter()
  useEffect(() => {
    router.replace('/dashboard?section=orders')
  }, [router])
  return null
}
