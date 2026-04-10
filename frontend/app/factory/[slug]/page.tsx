'use client'
import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { API_URL } from '@/lib/api'

export default function VendorDetailPage() {
  const { slug } = useParams<{ slug: string }>()
  const router = useRouter()
  const [vendor, setVendor] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch(`${API_URL}/api/vendors`)
      .then(r => r.json())
      .then(data => {
        const v = Array.isArray(data) ? data.find((v: any) => v.company_name?.toLowerCase().replace(/\s+/g, '-') === slug || v.id === slug) : null
        setVendor(v)
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [slug])

  if (loading) return <div style={{ minHeight: '60vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><div style={{ width: 32, height: 32, border: '3px solid var(--border)', borderTopColor: '#FF6B00', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} /><style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style></div>

  if (!vendor) return (
    <div style={{ minHeight: '60vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 12 }}>
      <div style={{ fontSize: 48 }}>🏭</div>
      <p style={{ color: 'var(--text3)' }}>Үйлдвэр олдсонгүй</p>
      <Link href="/factory" style={{ color: '#FF6B00', textDecoration: 'none' }}>← Буцах</Link>
    </div>
  )

  return (
    <div style={{ maxWidth: 700, margin: '0 auto', padding: '32px 20px' }}>
      <button onClick={() => router.back()} style={{ background: 'none', border: 'none', color: 'var(--text3)', cursor: 'pointer', fontSize: 13, marginBottom: 20 }}>← Буцах</button>

      <div style={{ borderRadius: 16, border: '1px solid var(--border)', background: 'var(--surface)', overflow: 'hidden' }}>
        <div style={{ padding: 24, borderBottom: '1px solid var(--border)' }}>
          <div style={{ display: 'flex', gap: 16, alignItems: 'flex-start' }}>
            {vendor.logo_url && <img src={vendor.logo_url} alt={vendor.company_name} style={{ width: 64, height: 64, borderRadius: 12, objectFit: 'cover' }} />}
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginBottom: 4 }}>
                <h1 style={{ fontSize: 20, fontWeight: 700, color: 'var(--text)', margin: 0 }}>{vendor.company_name}</h1>
                {vendor.verified && <span style={{ padding: '2px 8px', borderRadius: 99, background: 'rgba(16,185,129,0.1)', color: '#10B981', fontSize: 10, fontWeight: 700 }}>✓ Verified</span>}
              </div>
              <p style={{ fontSize: 13, color: 'var(--text3)' }}>📍 {vendor.address || vendor.district}</p>
              <div style={{ display: 'flex', gap: 16, marginTop: 8, fontSize: 13, color: 'var(--text3)' }}>
                <span style={{ color: '#F59E0B', fontWeight: 600 }}>★ {vendor.rating || 0}</span>
                <span>📦 {vendor.total_orders || 0} захиалга</span>
              </div>
            </div>
          </div>
        </div>

        {vendor.services?.length > 0 && (
          <div style={{ padding: 24, borderBottom: '1px solid var(--border)' }}>
            <h2 style={{ fontSize: 14, fontWeight: 600, color: 'var(--text)', marginBottom: 10 }}>Үйлчилгээ</h2>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
              {vendor.services.map((s: string) => <span key={s} style={{ padding: '4px 12px', borderRadius: 8, background: 'var(--surface2)', fontSize: 12, color: 'var(--text2)' }}>{s}</span>)}
            </div>
          </div>
        )}

        {vendor.description && (
          <div style={{ padding: 24, borderBottom: '1px solid var(--border)' }}>
            <h2 style={{ fontSize: 14, fontWeight: 600, color: 'var(--text)', marginBottom: 8 }}>Тухай</h2>
            <p style={{ fontSize: 13, color: 'var(--text2)', lineHeight: 1.7 }}>{vendor.description}</p>
          </div>
        )}

        <div style={{ padding: 24 }}>
          <Link href={`/quote?vendor=${vendor.id}`} style={{ display: 'block', textAlign: 'center', padding: '14px 0', borderRadius: 10, background: '#FF6B00', color: '#fff', textDecoration: 'none', fontSize: 14, fontWeight: 600 }}>Үнийн санал авах</Link>
        </div>
      </div>
    </div>
  )
}
