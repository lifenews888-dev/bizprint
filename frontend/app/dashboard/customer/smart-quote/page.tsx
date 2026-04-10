'use client'
import { useEffect } from 'react'

export default function P() {
  useEffect(() => { window.location.href = '/quote?tab=ai' }, [])
  return <div style={{ padding: 40, textAlign: 'center', color: '#9CA3AF' }}>Шилжиж байна...</div>
}
