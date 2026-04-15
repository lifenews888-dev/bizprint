import Link from 'next/link'

interface Vendor {
  id: string
  slug?: string
  company_name: string
  logo_url?: string
  district?: string
  description?: string
  accepts_orders?: boolean
  verified?: boolean
  total_orders?: number
  rating?: number
  services?: string[]
}

async function getVendors(): Promise<Vendor[]> {
  try {
    const base = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'
    const res = await fetch(`${base}/api/vendors`, { next: { revalidate: 300 } })
    if (!res.ok) return []
    const data = await res.json()
    return Array.isArray(data) ? data : (data?.data || [])
  } catch {
    return []
  }
}

export default async function FactoryPage() {
  const vendors = await getVendors()

  return (
    <div style={{ maxWidth: 1100, margin: '0 auto', padding: '32px 20px' }}>
      <div style={{ textAlign: 'center', marginBottom: 40 }}>
        <h1 style={{ fontSize: 30, fontWeight: 800, color: 'var(--text)', margin: 0 }}>
          Хэвлэлийн үйлдвэрүүд
        </h1>
        <p style={{ fontSize: 14, color: 'var(--text3)', marginTop: 8 }}>
          BizPrint-ийн баталгаажсан хамтрагч үйлдвэрүүд
        </p>
      </div>

      {vendors.length === 0 ? (
        <div style={{ textAlign: 'center', padding: 64, color: 'var(--text3)' }}>
          <p style={{ fontSize: 44, marginBottom: 12 }}>🏭</p>
          <p style={{ fontSize: 14 }}>Үйлдвэр байхгүй байна</p>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 16 }}>
          {vendors.map(vendor => (
            <Link
              key={vendor.id}
              href={`/vendor/${vendor.slug || vendor.id}`}
              className="factory-card"
              style={{
                display: 'block',
                border: '1px solid var(--border)',
                borderRadius: 16,
                padding: 20,
                background: 'var(--surface)',
                textDecoration: 'none',
                transition: 'all 0.15s',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12, marginBottom: 16 }}>
                <div style={{
                  width: 52, height: 52, borderRadius: 12, overflow: 'hidden', flexShrink: 0,
                  background: 'var(--surface2)', display: 'flex', alignItems: 'center', justifyContent: 'center',
                  border: '1px solid var(--border)',
                }}>
                  {vendor.logo_url ? (
                    <img src={vendor.logo_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  ) : (
                    <span style={{ fontSize: 24 }}>🏭</span>
                  )}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <h3 style={{
                    fontSize: 15, fontWeight: 700, color: 'var(--text)',
                    whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', margin: 0,
                  }}>
                    {vendor.company_name}
                  </h3>
                  {vendor.district && (
                    <p style={{ fontSize: 11, color: 'var(--text3)', marginTop: 2 }}>📍 {vendor.district}</p>
                  )}
                </div>
                {vendor.accepts_orders !== false && (
                  <span style={{
                    fontSize: 10, padding: '3px 8px', borderRadius: 10, flexShrink: 0,
                    background: 'rgba(16,185,129,0.12)', color: '#10B981',
                  }}>
                    Нээлттэй
                  </span>
                )}
              </div>

              {vendor.description && (
                <p style={{
                  fontSize: 12, color: 'var(--text3)', lineHeight: 1.5, marginBottom: 12,
                  display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden',
                }}>
                  {vendor.description}
                </p>
              )}

              {/* Services pill list */}
              {vendor.services && vendor.services.length > 0 && (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginBottom: 12 }}>
                  {vendor.services.slice(0, 3).map(s => (
                    <span key={s} style={{
                      fontSize: 10, padding: '3px 8px', borderRadius: 10,
                      background: 'var(--surface2)', color: 'var(--text3)',
                    }}>
                      {s}
                    </span>
                  ))}
                  {vendor.services.length > 3 && (
                    <span style={{ fontSize: 10, color: 'var(--text4)' }}>+{vendor.services.length - 3}</span>
                  )}
                </div>
              )}

              {/* Stats row */}
              <div style={{ display: 'flex', gap: 14, fontSize: 11, color: 'var(--text3)' }}>
                {(vendor.total_orders || 0) > 0 && <span>{vendor.total_orders} захиалга</span>}
                {(vendor.rating || 0) > 0 && <span>⭐ {Number(vendor.rating).toFixed(1)}</span>}
                {vendor.verified && <span style={{ color: '#10B981' }}>✓ Баталгаатай</span>}
              </div>
            </Link>
          ))}
        </div>
      )}

      <style>{`
        .factory-card:hover {
          border-color: #FF6B00 !important;
          transform: translateY(-2px);
        }
      `}</style>
    </div>
  )
}
