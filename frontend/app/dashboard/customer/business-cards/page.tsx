'use client'
import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function BusinessCardsPage() {
  const router = useRouter()
  useEffect(() => {
    // Open editor in same window — editor has its own full layout
    window.location.href = '/business-cards/editor'
  }, [])
  return <div style={{ padding: 40, textAlign: 'center', color: '#9CA3AF', fontFamily: "'DM Sans',sans-serif" }}>Нэрийн хуудас editor руу шилжиж байна...</div>
}
