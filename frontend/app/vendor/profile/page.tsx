'use client'
import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { API_URL } from '@/lib/api'

interface VendorProfile {
  id: string
  company_name?: string
  slug?: string
  description?: string
  address?: string
  district?: string
  phone?: string
  contact_email?: string
  accepts_orders?: boolean
  logo_url?: string
}

type VendorTextField = 'company_name' | 'slug' | 'description' | 'address' | 'district' | 'phone' | 'contact_email'

export default function VendorProfilePage() {
  const router = useRouter()
  const [vendor, setVendor] = useState<VendorProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [logoFile, setLogoFile] = useState<File | null>(null)
  const [logoPreview, setLogoPreview] = useState('')
  const logoRef = useRef<HTMLInputElement>(null)

  const token = typeof window !== 'undefined' ? localStorage.getItem('access_token') || '' : ''

  useEffect(() => {
    fetch(`${API_URL}/api/vendors/my`, { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.json())
      .then(data => {
        if (data && data.id) {
          setVendor(data)
          if (data.logo_url) setLogoPreview(data.logo_url)
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  const save = async () => {
    if (!vendor) return
    setSaving(true)
    try {
      const fd = new FormData()
      const fields: VendorTextField[] = ['company_name', 'slug', 'description', 'address', 'district',
        'phone', 'contact_email']
      fields.forEach(f => fd.append(f, String(vendor[f] ?? '')))
      fd.append('accepts_orders', String(vendor.accepts_orders ?? true))
      if (logoFile) fd.append('logo', logoFile)

      const res = await fetch(`${API_URL}/api/vendors/my`, {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${token}` },
        body: fd,
      })
      if (res.ok) {
        const data = await res.json()
        setVendor(data)
        if (data.logo_url) setLogoPreview(data.logo_url)
        setLogoFile(null)
        setSaved(true)
        setTimeout(() => setSaved(false), 3000)
      }
    } finally {
      setSaving(false)
    }
  }

  const upd = <K extends keyof VendorProfile>(k: K, v: VendorProfile[K]) => {
    setVendor(p => (p ? { ...p, [k]: v } : p))
  }

  const handleLogo = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0]
    if (!f) return
    if (f.size > 2 * 1024 * 1024) {
      alert('Файлын хэмжээ 2МБ-с бага байх ёстой')
      return
    }
    setLogoFile(f)
    setLogoPreview(URL.createObjectURL(f))
  }

  if (loading) return (
    <div style={{ display: 'flex', justifyContent: 'center', padding: 48 }}>
      <div style={{ width: 32, height: 32, border: '3px solid var(--border)', borderTopColor: '#FF6B00', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  )

  if (!vendor) return (
    <div style={{ maxWidth: 500, margin: '0 auto', padding: '64px 20px', textAlign: 'center' }}>
      <p style={{ fontSize: 40, marginBottom: 16 }}>🏭</p>
      <h1 style={{ fontSize: 20, fontWeight: 700, color: 'var(--text)', marginBottom: 8 }}>
        Таны дансанд холбогдсон үйлдвэр алга
      </h1>
      <p style={{ fontSize: 13, color: 'var(--text3)', marginBottom: 24 }}>
        Админд хандаж vendor профайлаа үүсгүүлээрэй
      </p>
      <a href="/contact" style={{ color: '#FF6B00', textDecoration: 'none', fontSize: 13 }}>
        Холбогдох →
      </a>
    </div>
  )

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)', color: 'var(--text)' }}>
      <div style={{ maxWidth: 720, margin: '0 auto', padding: 24 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
          <div>
            <h1 style={{ fontSize: 22, fontWeight: 700, margin: 0 }}>Миний үйлдвэр</h1>
            <p style={{ fontSize: 12, color: 'var(--text3)', marginTop: 4 }}>
              Нийтэд харагдах мэдээлэл, лого, URL тохируулга
            </p>
          </div>
          <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
            {saved && <span style={{ fontSize: 12, color: '#10B981' }}>✓ Хадгалагдлаа</span>}
            {vendor.slug && (
              <button onClick={() => router.push(`/vendor/${vendor.slug}`)}
                style={{ padding: '8px 16px', border: '1px solid var(--border)', background: 'var(--surface)', color: 'var(--text2)', borderRadius: 10, fontSize: 12, cursor: 'pointer' }}>
                Нийтэд харах →
              </button>
            )}
            <button onClick={save} disabled={saving}
              style={{ padding: '8px 16px', background: '#FF6B00', color: '#fff', border: 'none', borderRadius: 10, fontSize: 13, fontWeight: 600, cursor: 'pointer', opacity: saving ? 0.5 : 1 }}>
              {saving ? 'Хадгалж байна...' : 'Хадгалах'}
            </button>
          </div>
        </div>

        {/* Logo */}
        <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 16, padding: 20, marginBottom: 14 }}>
          <h2 style={{ fontSize: 13, fontWeight: 600, marginBottom: 12 }}>Лого</h2>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <div
              onClick={() => logoRef.current?.click()}
              style={{ width: 80, height: 80, borderRadius: 12, background: 'var(--surface2)', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', cursor: 'pointer', border: '1px solid var(--border)' }}>
              {logoPreview
                ? <img src={logoPreview} alt="logo" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                : <span style={{ fontSize: 32 }}>🏭</span>
              }
            </div>
            <div>
              <button onClick={() => logoRef.current?.click()}
                style={{ padding: '8px 14px', border: '1px solid var(--border)', background: 'var(--surface2)', color: 'var(--text2)', borderRadius: 8, fontSize: 12, cursor: 'pointer' }}>
                Лого солих
              </button>
              <p style={{ fontSize: 10, color: 'var(--text4)', marginTop: 4 }}>PNG, JPG — 2МБ хүртэл</p>
              <input ref={logoRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={handleLogo} />
            </div>
          </div>
        </div>

        {/* Basic info */}
        <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 16, padding: 20, marginBottom: 14 }}>
          <h2 style={{ fontSize: 13, fontWeight: 600, marginBottom: 14 }}>Үндсэн мэдээлэл</h2>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            {([
              ['company_name', 'Байгууллагын нэр *', 'text'],
              ['slug', 'URL slug', 'text'],
              ['phone', 'Утас', 'tel'],
              ['contact_email', 'И-мэйл', 'email'],
              ['district', 'Дүүрэг', 'text'],
            ] as const).map(([k, label, type]) => (
              <div key={k}>
                <label style={{ fontSize: 11, color: 'var(--text3)', display: 'block', marginBottom: 4 }}>
                  {label}
                </label>
                <input type={type} value={vendor[k] || ''} onChange={e => upd(k, e.target.value)}
                  style={{ width: '100%', padding: '8px 12px', borderRadius: 8, border: '1px solid var(--border)', background: 'var(--surface2)', fontSize: 13, color: 'var(--text)', outline: 'none', boxSizing: 'border-box' }} />
              </div>
            ))}
          </div>
          <div style={{ marginTop: 12 }}>
            <label style={{ fontSize: 11, color: 'var(--text3)', display: 'block', marginBottom: 4 }}>Тайлбар</label>
            <textarea value={vendor.description || ''} onChange={e => upd('description', e.target.value)} rows={3}
              placeholder="Үйлдвэрийн тухай товч мэдээлэл..."
              style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: '1px solid var(--border)', background: 'var(--surface2)', fontSize: 13, color: 'var(--text)', outline: 'none', resize: 'vertical', boxSizing: 'border-box' }} />
          </div>
          <div style={{ marginTop: 12 }}>
            <label style={{ fontSize: 11, color: 'var(--text3)', display: 'block', marginBottom: 4 }}>Хаяг</label>
            <input value={vendor.address || ''} onChange={e => upd('address', e.target.value)}
              style={{ width: '100%', padding: '8px 12px', borderRadius: 8, border: '1px solid var(--border)', background: 'var(--surface2)', fontSize: 13, color: 'var(--text)', outline: 'none', boxSizing: 'border-box' }} />
          </div>
        </div>

        {/* Availability toggle */}
        <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 16, padding: 20, marginBottom: 14 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <h2 style={{ fontSize: 13, fontWeight: 600, margin: 0 }}>Захиалга хүлээн авах</h2>
              <p style={{ fontSize: 11, color: 'var(--text3)', marginTop: 4 }}>
                {vendor.accepts_orders ? '🟢 Одоо захиалга авч байна' : '🔴 Захиалга авахгүй байна'}
              </p>
            </div>
            <button onClick={() => upd('accepts_orders', !vendor.accepts_orders)}
              style={{
                width: 52, height: 28, borderRadius: 14, position: 'relative', cursor: 'pointer', border: 'none',
                background: vendor.accepts_orders ? '#10B981' : 'var(--surface3)',
                transition: 'background 0.2s',
              }}>
              <span style={{
                position: 'absolute', top: 2, left: 2, width: 24, height: 24, borderRadius: '50%', background: '#fff',
                transform: vendor.accepts_orders ? 'translateX(24px)' : 'translateX(0)',
                transition: 'transform 0.2s', boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
              }} />
            </button>
          </div>
        </div>

        {/* Public link preview */}
        {vendor.slug && (
          <div style={{ background: 'rgba(255,107,0,0.08)', border: '1px solid rgba(255,107,0,0.2)', borderRadius: 16, padding: 16 }}>
            <p style={{ fontSize: 11, color: 'var(--text3)', marginBottom: 4 }}>Нийтийн холбоос</p>
            <p style={{ fontFamily: 'monospace', color: '#FF6B00', fontSize: 13, fontWeight: 600 }}>
              bizprint.mn/vendor/{vendor.slug}
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
