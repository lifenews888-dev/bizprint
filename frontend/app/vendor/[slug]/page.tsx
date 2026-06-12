import { Metadata } from 'next'
import Link from 'next/link'

interface Props { params: Promise<{ slug: string }> }

interface VendorCapability {
  id?: string
  product_type?: string
  name?: string
  max_quantity?: number | string
  lead_time_days?: number | string
}

interface VendorProfile {
  id: string
  company_name?: string
  slug?: string
  description?: string
  logo_url?: string
  district?: string
  phone?: string
  contact_email?: string
  total_orders?: number
  rating?: number | string
  capacity_per_day?: number | string
  current_load?: number | string
  services?: string[]
  machine_types?: string[]
  vendor_capabilities?: VendorCapability[]
  capabilities?: VendorCapability[]
  metrics?: Record<string, unknown>
}

async function getVendor(slug: string): Promise<VendorProfile | null> {
  try {
    const base = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'
    const res = await fetch(`${base}/api/vendors/slug/${encodeURIComponent(slug)}`, {
      next: { revalidate: 300 },
    })
    if (!res.ok) return null
    const data: VendorProfile = await res.json()
    if (!data || !data.id) return null
    return data
  } catch {
    return null
  }
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  const vendor = await getVendor(slug)
  return {
    title: vendor ? `${vendor.company_name} | BizPrint` : 'Vendor | BizPrint',
    description: vendor?.description || 'BizPrint үйлдвэрийн профайл',
  }
}

export default async function VendorStorePage({ params }: Props) {
  const { slug } = await params
  const vendor = await getVendor(slug)

  if (!vendor) {
    return (
      <div style={{ maxWidth: 640, margin: '0 auto', padding: '64px 20px', textAlign: 'center' }}>
        <p style={{ fontSize: 40, marginBottom: 16 }}>🏭</p>
        <h1 style={{ fontSize: 22, fontWeight: 700, color: 'var(--text)', marginBottom: 8 }}>
          Vendor олдсонгүй
        </h1>
        <Link href="/factory" style={{ color: '#FF6B00', textDecoration: 'none' }}>
          Бүх үйлдвэр харах →
        </Link>
      </div>
    )
  }

  const caps = vendor.vendor_capabilities || vendor.capabilities || []
  const services = vendor.services || []
  const machineTypes = vendor.machine_types || []
  const metrics = vendor.metrics || {}

  return (
    <div style={{ maxWidth: 900, margin: '0 auto', padding: '32px 20px' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 24, marginBottom: 32 }}>
        <div style={{
          width: 88, height: 88, borderRadius: 18, flexShrink: 0,
          background: 'var(--surface2)', display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 36, overflow: 'hidden', border: '1px solid var(--border)',
        }}>
          {vendor.logo_url
            ? <img src={vendor.logo_url} alt={vendor.company_name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            : '🏭'}
        </div>
        <div style={{ flex: 1 }}>
          <h1 style={{ fontSize: 26, fontWeight: 800, color: 'var(--text)', margin: 0 }}>
            {vendor.company_name}
          </h1>
          {vendor.district && (
            <p style={{ fontSize: 13, color: 'var(--text3)', marginTop: 4 }}>📍 {vendor.district}</p>
          )}
          {vendor.description && (
            <p style={{ fontSize: 13, color: 'var(--text2)', marginTop: 10, lineHeight: 1.6 }}>
              {vendor.description}
            </p>
          )}
          <div style={{ display: 'flex', gap: 10, marginTop: 16, flexWrap: 'wrap' }}>
            <Link href={`/orders/new?vendor=${vendor.id}`} style={{
              padding: '10px 20px', background: '#FF6B00', color: '#fff', borderRadius: 12,
              fontSize: 13, fontWeight: 600, textDecoration: 'none',
            }}>
              Захиалга өгөх
            </Link>
            {vendor.phone && (
              <a href={`tel:${vendor.phone}`} style={{
                padding: '10px 20px', border: '1px solid var(--border)',
                background: 'var(--surface)', color: 'var(--text2)',
                borderRadius: 12, fontSize: 13, textDecoration: 'none',
              }}>
                📞 Залгах
              </a>
            )}
            {vendor.contact_email && (
              <a href={`mailto:${vendor.contact_email}`} style={{
                padding: '10px 20px', border: '1px solid var(--border)',
                background: 'var(--surface)', color: 'var(--text2)',
                borderRadius: 12, fontSize: 13, textDecoration: 'none',
              }}>
                ✉️ И-мэйл
              </a>
            )}
          </div>
        </div>
      </div>

      {/* Stats */}
      <div style={{
        display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: 12,
        background: 'var(--surface)', border: '1px solid var(--border)',
        borderRadius: 16, padding: 20, marginBottom: 24,
      }}>
        {[
          { l: 'Нийт захиалга', v: vendor.total_orders || 0 },
          { l: 'Үнэлгээ', v: vendor.rating ? `${Number(vendor.rating).toFixed(1)} ★` : '—' },
          { l: 'Багтаамж/өдөр', v: vendor.capacity_per_day || '—' },
          { l: 'Ачаалал', v: vendor.current_load != null ? `${vendor.current_load}%` : '—' },
        ].map(s => (
          <div key={s.l} style={{ textAlign: 'center' }}>
            <p style={{ fontSize: 20, fontWeight: 700, color: 'var(--text)' }}>{s.v}</p>
            <p style={{ fontSize: 11, color: 'var(--text3)', marginTop: 4 }}>{s.l}</p>
          </div>
        ))}
      </div>

      {/* Services */}
      {(services.length > 0 || machineTypes.length > 0) && (
        <div style={{ marginBottom: 24 }}>
          <h2 style={{ fontSize: 16, fontWeight: 700, color: 'var(--text)', marginBottom: 12 }}>
            Үйлчилгээ
          </h2>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            {services.map((s: string) => (
              <span key={s} style={{
                padding: '6px 12px', borderRadius: 20, fontSize: 12,
                background: 'rgba(255,107,0,0.08)', border: '1px solid rgba(255,107,0,0.2)', color: '#FF6B00',
              }}>
                {s}
              </span>
            ))}
            {machineTypes.map((m: string) => (
              <span key={m} style={{
                padding: '6px 12px', borderRadius: 20, fontSize: 12,
                background: 'var(--surface2)', border: '1px solid var(--border)', color: 'var(--text3)',
              }}>
                🖨️ {m}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Capabilities */}
      {caps.length > 0 && (
        <div style={{ marginBottom: 24 }}>
          <h2 style={{ fontSize: 16, fontWeight: 700, color: 'var(--text)', marginBottom: 12 }}>
            Чадвар
          </h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 12 }}>
            {caps.map(cap => (
              <div key={cap.id} style={{
                padding: 16, border: '1px solid var(--border)',
                borderRadius: 12, background: 'var(--surface)',
              }}>
                <p style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)' }}>
                  {cap.product_type || cap.name || 'Чадвар'}
                </p>
                {cap.max_quantity && (
                  <p style={{ fontSize: 11, color: 'var(--text3)', marginTop: 4 }}>
                    Хүртэл {Number(cap.max_quantity).toLocaleString()} ш
                  </p>
                )}
                {cap.lead_time_days && (
                  <p style={{ fontSize: 11, color: '#FF6B00', marginTop: 2 }}>
                    {cap.lead_time_days}х хоног
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* CTA footer */}
      <div style={{
        padding: 28, borderRadius: 20, border: '1px solid var(--border)',
        background: 'var(--surface)', textAlign: 'center',
      }}>
        <h3 style={{ fontSize: 18, fontWeight: 700, color: 'var(--text)', marginBottom: 8 }}>
          {vendor.company_name}-тэй шууд захиалга өгөх
        </h3>
        <p style={{ fontSize: 13, color: 'var(--text3)', marginBottom: 16 }}>
          Захиалга хүсэлтийг илгээхэд энэ үйлдвэр шууд хүлээн авна
        </p>
        <Link href={`/orders/new?vendor=${vendor.id}`} style={{
          display: 'inline-block', padding: '14px 32px', background: '#FF6B00',
          color: '#fff', borderRadius: 12, fontSize: 14, fontWeight: 600, textDecoration: 'none',
        }}>
          Захиалга өгөх →
        </Link>
      </div>
    </div>
  )
}
