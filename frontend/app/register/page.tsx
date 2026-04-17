'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
const API = 'http://localhost:4000'
export default function БүртгэлPage() {
  const router = useRouter()
  const [data, setData] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  useEffect(() => {
    const token = localStorage.getItem('token')
    const headers: any = {}
    if (token) headers.Authorization = `Bearer ${token}`
    fetch(`${API}/auth/register`, { headers }).then(r => r.json())
      .then(d => setData(Array.isArray(d) ? d : []))
      .catch(() => {}).finally(() => setLoading(false))
  }, [])
  return (
    <div style={{ maxWidth: 1200, margin: '0 auto', padding: '40px 24px', fontFamily: "'DM Sans','Segoe UI',system-ui,sans-serif" }}>
      <h1 style={{ fontSize: 28, fontWeight: 700, margin: '0 0 24px' }}>Бүртгэл</h1>
      {loading ? <p style={{ color: 'var(--text2)' }}>Уншиж байна...</p>
      : data.length === 0 ? <p style={{ color: 'var(--text2)' }}>Мэдээлэл байхгүй</p>
      : <p style={{ color: 'var(--text2)' }}>Нийт {data.length} бичлэг олдлоо</p>}
    </div>
  )
}