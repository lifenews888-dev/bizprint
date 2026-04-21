'use client'
import { useState, useEffect } from 'react'

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'
const F = "'DM Sans','Segoe UI',system-ui,sans-serif"

interface Vendor {
  id: string
  company_name: string
  contact_email: string
  phone?: string
  address?: string
  verified: boolean
  created_at: string
}

export default function FactoryDirectoryPage() {
  const [vendors,  setVendors]  = useState<Vendor[]>([])
  const [loading,  setLoading]  = useState(true)
  const [search,   setSearch]   = useState('')
  const [verified, setVerified] = useState<'all' | 'verified' | 'unverified'>('all')

  useEffect(() => {
    fetch(`${API}/vendors`)
      .then(r => r.json())
      .then(d => setVendors(Array.isArray(d) ? d : []))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  const filtered = vendors.filter(v => {
    const q = search.toLowerCase()
    const matchText = !q || v.company_name.toLowerCase().includes(q) || (v.address || '').toLowerCase().includes(q)
    const matchVerif = verified === 'all' || (verified === 'verified' ? v.verified : !v.verified)
    return matchText && matchVerif
  })

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)', fontFamily: F, color: 'var(--text)' }}>

      {/* Hero */}
      <div style={{ background: 'linear-gradient(135deg,#0F0F0F,#1A1A1A)', borderBottom: '1px solid #222', padding: '48px 32px 40px', textAlign: 'center' }}>
        <div style={{ maxWidth: 720, margin: '0 auto' }}>
          <div style={{ fontSize: 13, color: '#FF6B00', fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 12 }}>
            🏭 Үйлдвэрүүдийн лавлах
          </div>
          <h1 style={{ fontSize: 36, fontWeight: 800, color: '#fff', margin: '0 0 12px', lineHeight: 1.2 }}>
            Монголын хэвлэлийн<br/>
            <span style={{ color: '#FF6B00' }}>үйлдвэрүүдтэй</span> холбогдоорой
          </h1>
          <p style={{ color: '#888', fontSize: 15, margin: '0 0 28px', lineHeight: 1.6 }}>
            Батлагдсан хэвлэлийн үйлдвэрүүд — офсет, дижитал, том форматын хэвлэл
          </p>
          <div style={{ display: 'flex', gap: 10, justifyContent: 'center', maxWidth: 480, margin: '0 auto' }}>
            <input value={search} onChange={e => setSearch(e.target.value)}
              placeholder="Үйлдвэрийн нэр, хаяг хайх..."
              style={{ flex: 1, padding: '12px 16px', borderRadius: 10, border: '1px solid #333', background: '#1A1A1A', color: '#fff', fontSize: 14, outline: 'none' }} />
          </div>
        </div>
      </div>

      <div style={{ maxWidth: 1100, margin: '0 auto', padding: '32px 24px' }}>

        {/* Filter bar */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24, flexWrap: 'wrap', gap: 12 }}>
          <div style={{ display: 'flex', gap: 8 }}>
            {(['all', 'verified', 'unverified'] as const).map(v => (
              <button key={v} onClick={() => setVerified(v)} style={{
                padding: '7px 16px', borderRadius: 99, border: '1px solid',
                borderColor: verified === v ? '#FF6B00' : 'var(--border)',
                background: verified === v ? 'rgba(255,107,0,0.1)' : 'var(--surface)',
                color: verified === v ? '#FF6B00' : 'var(--text2)',
                fontSize: 13, fontWeight: verified === v ? 600 : 400, cursor: 'pointer',
              }}>
                {v === 'all' ? `Бүгд (${vendors.length})` : v === 'verified' ? `✓ Баталгаажсан (${vendors.filter(x=>x.verified).length})` : `Баталгаажаагүй (${vendors.filter(x=>!x.verified).length})`}
              </button>
            ))}
          </div>
          <div style={{ fontSize: 13, color: 'var(--text2)' }}>
            {filtered.length} үйлдвэр
          </div>
        </div>

        {loading ? (
          <div style={{ padding: 80, textAlign: 'center', color: 'var(--text2)' }}>Уншиж байна...</div>
        ) : filtered.length === 0 ? (
          <div style={{ padding: '80px 40px', textAlign: 'center', border: '2px dashed var(--border)', borderRadius: 16, color: 'var(--text2)' }}>
            <div style={{ fontSize: 48, marginBottom: 16 }}>🏭</div>
            <div style={{ fontWeight: 600, fontSize: 18, marginBottom: 8 }}>Үйлдвэр олдсонгүй</div>
            <div style={{ fontSize: 14 }}>Хайлтаа өөрчилж дахин үзнэ үү</div>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 16 }}>
            {filtered.map(v => (
              <div key={v.id} style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 14, padding: '22px 24px', transition: 'all 0.15s', position: 'relative', overflow: 'hidden' }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = '#FF6B00'; e.currentTarget.style.transform = 'translateY(-2px)' }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.transform = 'translateY(0)' }}>

                {v.verified && (
                  <div style={{ position: 'absolute', top: 16, right: 16, background: 'rgba(16,185,129,0.12)', border: '1px solid rgba(16,185,129,0.3)', borderRadius: 99, padding: '3px 10px', fontSize: 11, fontWeight: 700, color: '#10B981' }}>
                    ✓ Баталгаажсан
                  </div>
                )}

                {/* Avatar */}
                <div style={{ width: 48, height: 48, borderRadius: 12, background: 'linear-gradient(135deg,#FF6B00,#FF8C42)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22, marginBottom: 14, fontWeight: 700, color: '#fff' }}>
                  {v.company_name.charAt(0).toUpperCase()}
                </div>

                <div style={{ fontWeight: 700, fontSize: 16, marginBottom: 6, paddingRight: v.verified ? 100 : 0 }}>
                  {v.company_name}
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 16 }}>
                  {v.address && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, color: 'var(--text2)' }}>
                      <span>📍</span>
                      <span>{v.address}</span>
                    </div>
                  )}
                  {v.phone && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, color: 'var(--text2)' }}>
                      <span>📞</span>
                      <a href={`tel:${v.phone}`} style={{ color: 'var(--text2)', textDecoration: 'none' }}>{v.phone}</a>
                    </div>
                  )}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, color: 'var(--text2)' }}>
                    <span>✉️</span>
                    <a href={`mailto:${v.contact_email}`} style={{ color: 'var(--text2)', textDecoration: 'none', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{v.contact_email}</a>
                  </div>
                  <div style={{ fontSize: 11, color: 'var(--text3)', marginTop: 2 }}>
                    Бүртгүүлсэн: {new Date(v.created_at).toLocaleDateString('mn-MN')}
                  </div>
                </div>

                <div style={{ display: 'flex', gap: 8 }}>
                  <a href={`tel:${v.phone || ''}`}
                    style={{ flex: 1, textAlign: 'center', padding: '8px', background: 'var(--surface2)', border: '1px solid var(--border)', borderRadius: 8, fontSize: 12, fontWeight: 600, color: 'var(--text)', textDecoration: 'none', cursor: v.phone ? 'pointer' : 'not-allowed', opacity: v.phone ? 1 : 0.5 }}>
                    📞 Залгах
                  </a>
                  <a href={`mailto:${v.contact_email}`}
                    style={{ flex: 1, textAlign: 'center', padding: '8px', background: 'rgba(255,107,0,0.08)', border: '1px solid rgba(255,107,0,0.25)', borderRadius: 8, fontSize: 12, fontWeight: 600, color: '#FF6B00', textDecoration: 'none' }}>
                    ✉️ Имэйл
                  </a>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
