'use client'
import { useEffect } from 'react'

export default function BusinessCardsPage() {
  useEffect(() => {
    // Send customers to the free template picker first.
    window.location.href = '/business-cards'
  }, [])
  return <div style={{ padding: 40, textAlign: 'center', color: '#9CA3AF', fontFamily: "'DM Sans',sans-serif" }}>Нэрийн хуудасны үнэгүй загварууд руу шилжиж байна...</div>
}
