'use client'
import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'
const FONT = "'DM Sans','Segoe UI',system-ui,sans-serif"

const SOCIAL_META: Record<string, { icon: string; color: string; label: string }> = {
  facebook:  { icon: 'f',  color: '#1877F2', label: 'Facebook' },
  instagram: { icon: 'ig', color: '#E4405F', label: 'Instagram' },
  linkedin:  { icon: 'in', color: '#0A66C2', label: 'LinkedIn' },
  tiktok:    { icon: 'Tk', color: '#000000', label: 'TikTok' },
  twitter:   { icon: 'X',  color: '#1DA1F2', label: 'X / Twitter' },
  telegram:  { icon: 'Tg', color: '#0088CC', label: 'Telegram' },
  youtube:   { icon: 'Yt', color: '#FF0000', label: 'YouTube' },
  wechat:    { icon: 'Wc', color: '#07C160', label: 'WeChat' },
  viber:     { icon: 'Vb', color: '#7360F2', label: 'Viber' },
  whatsapp:  { icon: 'Wa', color: '#25D366', label: 'WhatsApp' },
}

interface SocialLink {
  platform?: string
  value?: string
}

interface DigitalCard {
  accent_color?: string
  logo_url?: string
  avatar_url?: string
  display_name?: string
  company_name?: string
  job_title?: string
  company_message?: string
  phone?: string
  email?: string
  website?: string
  address?: string
  social_links?: SocialLink[]
}

interface PublicCardData {
  error?: 'not_found' | 'network' | string
  status?: 'expired' | string
  display_name?: string
  company_name?: string
  card?: DigitalCard
  subscription?: {
    is_trial?: boolean
    days_left?: number
  }
  is_owner?: boolean
}

export default function PublicDigitalCard() {
  const params = useParams<{ slug: string }>()
  const slug = params?.slug
  const [data, setData] = useState<PublicCardData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!slug) return
    const tok = typeof window !== 'undefined' ? (localStorage.getItem('access_token') || localStorage.getItem('token')) : null
    const headers: Record<string, string> = {}
    if (tok) headers['Authorization'] = `Bearer ${tok}`
    fetch(`${API}/api/u/${slug}`, { headers })
      .then(r => r.json())
      .then((d: PublicCardData) => setData(d))
      .catch(() => setData({ error: 'network' }))
      .finally(() => setLoading(false))
  }, [slug])

  if (loading) return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: FONT, background: '#F9FAFB' }}>
      <div style={{ fontSize: 16, color: '#9CA3AF' }}>Ачааллаж байна...</div>
    </div>
  )

  if (!data || data.error === 'not_found' || data.error === 'network') return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: FONT, background: '#F9FAFB' }}>
      <div style={{ textAlign: 'center', padding: 40 }}>
        <div style={{ fontSize: 48, marginBottom: 16 }}>&#x1F4C7;</div>
        <div style={{ fontSize: 18, fontWeight: 600, color: '#374151' }}>Карт олдсонгүй</div>
        <p style={{ color: '#9CA3AF', fontSize: 14, marginTop: 8 }}>Энэ хаягаар дижитал карт бүртгэгдээгүй байна</p>
      </div>
    </div>
  )

  // Expired
  if (data.status === 'expired') return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: FONT, background: '#F9FAFB' }}>
      <div style={{ textAlign: 'center', padding: 40, maxWidth: 400 }}>
        <div style={{ fontSize: 48, marginBottom: 16 }}>&#x23F3;</div>
        <div style={{ fontSize: 20, fontWeight: 700, color: '#374151' }}>{data.display_name || 'Хэрэглэгч'}</div>
        {data.company_name && <div style={{ fontSize: 14, color: '#9CA3AF', marginTop: 4 }}>{data.company_name}</div>}
        <div style={{ marginTop: 20, padding: 16, background: '#FEF3C7', borderRadius: 12, fontSize: 14, color: '#92400E' }}>
          Дижитал картны хугацаа дууссан байна
        </div>
        <a href="/dashboard/customer/digital-card" style={{ display: 'inline-block', marginTop: 16, padding: '12px 24px', background: '#FF6B00', color: '#fff', borderRadius: 10, textDecoration: 'none', fontSize: 14, fontWeight: 600 }}>
          Сэргээх
        </a>
      </div>
    </div>
  )

  if (!data.card) return null

  const c = data.card
  const accent = c.accent_color || '#FF6B00'
  const socials: SocialLink[] = Array.isArray(c.social_links) ? c.social_links : []

  const generateVCard = () => {
    const lines = ['BEGIN:VCARD', 'VERSION:3.0']
    if (c.display_name) lines.push(`FN:${c.display_name}`)
    if (c.company_name) lines.push(`ORG:${c.company_name}`)
    if (c.job_title) lines.push(`TITLE:${c.job_title}`)
    if (c.phone) lines.push(`TEL;TYPE=WORK:${c.phone}`)
    if (c.email) lines.push(`EMAIL:${c.email}`)
    if (c.website) lines.push(`URL:${c.website}`)
    if (c.address) lines.push(`ADR;TYPE=WORK:;;${c.address};;;;`)
    lines.push('END:VCARD')
    return lines.join('\n')
  }

  const saveContact = () => {
    const vcard = generateVCard()
    const blob = new Blob([vcard], { type: 'text/vcard;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${c.display_name || 'contact'}.vcf`
    a.click()
    URL.revokeObjectURL(url)
    // Track save
    fetch(`${API}/api/u/${slug}/save-contact`, { method: 'POST' }).catch(() => {})
  }

  return (
    <div style={{ minHeight: '100vh', background: '#F3F4F6', fontFamily: FONT, display: 'flex', justifyContent: 'center', padding: '24px 16px' }}>
      <div style={{ width: '100%', maxWidth: 420 }}>

        {/* Header card */}
        <div style={{ background: '#fff', borderRadius: 20, overflow: 'hidden', boxShadow: '0 4px 24px rgba(0,0,0,0.08)' }}>
          {/* Accent banner */}
          <div style={{ height: 80, background: `linear-gradient(135deg, ${accent}, ${accent}CC)`, position: 'relative' }}>
            {c.logo_url && (
              <img src={c.logo_url} alt="" style={{ position: 'absolute', right: 16, top: 16, height: 40, objectFit: 'contain', opacity: 0.9 }} />
            )}
          </div>

          {/* Avatar */}
          <div style={{ display: 'flex', justifyContent: 'center', marginTop: -40 }}>
            <div style={{ width: 80, height: 80, borderRadius: '50%', border: '4px solid #fff', background: accent + '20', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 28, fontWeight: 700, color: accent, overflow: 'hidden' }}>
              {c.avatar_url ? <img src={c.avatar_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : (c.display_name || '?')[0]?.toUpperCase()}
            </div>
          </div>

          {/* Name & info */}
          <div style={{ textAlign: 'center', padding: '12px 24px 24px' }}>
            <div style={{ fontSize: 22, fontWeight: 700, color: '#111' }}>{c.display_name}</div>
            {c.job_title && <div style={{ fontSize: 14, color: '#6B7280', marginTop: 4 }}>{c.job_title}</div>}
            {c.company_name && <div style={{ fontSize: 13, color: accent, fontWeight: 500, marginTop: 4 }}>{c.company_name}</div>}
            {c.company_message && <div style={{ fontSize: 12, color: '#9CA3AF', marginTop: 4 }}>{c.company_message}</div>}
          </div>

          {/* Action buttons */}
          <div style={{ display: 'flex', gap: 8, padding: '0 24px 20px', justifyContent: 'center' }}>
            {c.phone && (
              <a href={`tel:${c.phone}`} style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, padding: '12px 16px', background: accent, color: '#fff', borderRadius: 12, textDecoration: 'none', fontSize: 13, fontWeight: 600 }}>
                Залгах
              </a>
            )}
            <button onClick={saveContact} style={{ flex: 1, padding: '12px 16px', background: '#F3F4F6', color: '#374151', borderRadius: 12, border: 'none', cursor: 'pointer', fontSize: 13, fontWeight: 600 }}>
              Контакт хадгалах
            </button>
          </div>
        </div>

        {/* Contact details */}
        <div style={{ background: '#fff', borderRadius: 16, padding: 20, marginTop: 12, boxShadow: '0 2px 12px rgba(0,0,0,0.04)' }}>
          <div style={{ fontSize: 12, fontWeight: 600, color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 12 }}>Холбоо барих</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {c.phone && (
              <a href={`tel:${c.phone}`} style={{ display: 'flex', alignItems: 'center', gap: 12, textDecoration: 'none', color: '#374151' }}>
                <div style={{ width: 36, height: 36, borderRadius: 10, background: '#10B98115', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16 }}>&#x260E;</div>
                <div><div style={{ fontSize: 13, fontWeight: 500 }}>{c.phone}</div><div style={{ fontSize: 10, color: '#9CA3AF' }}>Утас</div></div>
              </a>
            )}
            {c.email && (
              <a href={`mailto:${c.email}`} style={{ display: 'flex', alignItems: 'center', gap: 12, textDecoration: 'none', color: '#374151' }}>
                <div style={{ width: 36, height: 36, borderRadius: 10, background: '#6B728015', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14 }}>@</div>
                <div><div style={{ fontSize: 13, fontWeight: 500 }}>{c.email}</div><div style={{ fontSize: 10, color: '#9CA3AF' }}>Имэйл</div></div>
              </a>
            )}
            {c.website && (
              <a href={c.website.startsWith('http') ? c.website : `https://${c.website}`} target="_blank" rel="noopener" style={{ display: 'flex', alignItems: 'center', gap: 12, textDecoration: 'none', color: '#374151' }}>
                <div style={{ width: 36, height: 36, borderRadius: 10, background: '#3B82F615', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14 }}>&#x1F310;</div>
                <div><div style={{ fontSize: 13, fontWeight: 500 }}>{c.website}</div><div style={{ fontSize: 10, color: '#9CA3AF' }}>Вэбсайт</div></div>
              </a>
            )}
            {c.address && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, color: '#374151' }}>
                <div style={{ width: 36, height: 36, borderRadius: 10, background: '#F59E0B15', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14 }}>&#x1F4CD;</div>
                <div><div style={{ fontSize: 13, fontWeight: 500 }}>{c.address}</div><div style={{ fontSize: 10, color: '#9CA3AF' }}>Хаяг</div></div>
              </div>
            )}
          </div>
        </div>

        {/* Social links */}
        {socials.length > 0 && (
          <div style={{ background: '#fff', borderRadius: 16, padding: 20, marginTop: 12, boxShadow: '0 2px 12px rgba(0,0,0,0.04)' }}>
            <div style={{ fontSize: 12, fontWeight: 600, color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 12 }}>Сошиал</div>
            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
              {socials.map((s, i) => {
                const platform = s.platform || ''
                const value = s.value || ''
                const meta = SOCIAL_META[platform] || { icon: '?', color: '#6B7280', label: platform || 'Social' }
                const href = value.startsWith('http') ? value : `https://${value}`
                return (
                  <a key={i} href={href} target="_blank" rel="noopener"
                    style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, textDecoration: 'none', minWidth: 56 }}>
                    <div style={{ width: 40, height: 40, borderRadius: 12, background: meta.color, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, color: '#fff', fontWeight: 700 }}>{meta.icon}</div>
                    <span style={{ fontSize: 10, color: '#6B7280' }}>{meta.label}</span>
                  </a>
                )
              })}
            </div>
          </div>
        )}

        {/* Subscription badge */}
        {data.subscription?.is_trial && (
          <div style={{ textAlign: 'center', marginTop: 12, padding: '8px 16px', background: '#FEF3C7', borderRadius: 10, fontSize: 11, color: '#92400E' }}>
            Туршилтын хугацаа — {data.subscription.days_left} өдөр үлдсэн
          </div>
        )}

        {/* Owner edit button */}
        {data.is_owner && (
          <a href="/dashboard/customer/digital-card" style={{ display: 'block', marginTop: 12, padding: '12px 16px', background: '#fff', borderRadius: 12, textAlign: 'center', textDecoration: 'none', fontSize: 13, fontWeight: 600, color: '#FF6B00', border: '1px solid #E5E7EB', boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}>
            Профайл засах
          </a>
        )}

        {/* BizPrint branding */}
        <div style={{ textAlign: 'center', marginTop: 20, paddingBottom: 20 }}>
          <span style={{ fontSize: 11, color: '#D1D5DB' }}>Powered by </span>
          <Link href="/" style={{ fontSize: 11, color: '#FF6B00', textDecoration: 'none', fontWeight: 600 }}>BizPrint</Link>
        </div>
      </div>
    </div>
  )
}
