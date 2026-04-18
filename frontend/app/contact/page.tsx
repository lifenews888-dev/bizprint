'use client'
import { useState, useEffect } from 'react'
import { apiFetch } from '@/lib/api'

/* ── Fallback data ── */
const DEFAULTS = {
  hero_title: 'Холбоо барих',
  hero_desc: 'Асуулт, санал хүсэлт байвал бидэнтэй холбогдоорой',
  info: [
    { icon: '📞', title: 'Утас', value: '+976 7711-7700', link: 'tel:+97677117700' },
    { icon: '📧', title: 'И-мэйл', value: 'info@bizprint.mn', link: 'mailto:info@bizprint.mn' },
    { icon: '📍', title: 'Хаяг', value: 'Улаанбаатар, Монгол', link: '' },
    { icon: '🕐', title: 'Цагийн хуваарь', value: 'Даваа-Баасан: 09:00-18:00', link: '' },
  ],
  social: [
    { label: 'Facebook', url: 'https://facebook.com/bizprint.mn', icon: '🔵' },
    { label: 'Instagram', url: 'https://instagram.com/bizprint.mn', icon: '🟣' },
  ],
  map_embed: '',
}

export default function ContactPage() {
  const [d, setD] = useState(DEFAULTS)
  const [loaded, setLoaded] = useState(false)

  useEffect(() => {
    apiFetch<any>('/pages/contact', { auth: false })
      .then(page => {
        if (page?.metadata) {
          const m = page.metadata
          setD(prev => ({
            hero_title: m.hero_title || prev.hero_title,
            hero_desc: m.hero_desc || prev.hero_desc,
            info: m.info?.length ? m.info : prev.info,
            social: m.social?.length ? m.social : prev.social,
            map_embed: m.map_embed || prev.map_embed,
          }))
        }
      })
      .catch(() => {})
      .finally(() => setLoaded(true))
  }, [])

  if (!loaded) return (
    <div style={{ maxWidth: 800, margin: '0 auto', padding: '48px 20px', textAlign: 'center' }}>
      <div style={{ color: 'var(--text3)', fontSize: 14 }}>Ачааллаж байна...</div>
    </div>
  )

  return (
    <div style={{ maxWidth: 800, margin: '0 auto', padding: '48px 20px' }}>
      <div style={{ textAlign: 'center', marginBottom: 40 }}>
        <h1 style={{ fontSize: 28, fontWeight: 800, color: 'var(--text)' }}>
          {d.hero_title.includes(' ')
            ? <>{d.hero_title.split(' ').slice(0, -1).join(' ')} <span style={{ color: '#FF6B00' }}>{d.hero_title.split(' ').pop()}</span></>
            : <span style={{ color: '#FF6B00' }}>{d.hero_title}</span>
          }
        </h1>
        <p style={{ fontSize: 14, color: 'var(--text3)', marginTop: 4 }}>{d.hero_desc}</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16, marginBottom: 40 }}>
        {d.info.map((item: any) => (
          <div key={item.title} style={{ padding: 20, borderRadius: 14, border: '1px solid var(--border)', background: 'var(--surface)' }}>
            <div style={{ fontSize: 28, marginBottom: 8 }}>{item.icon}</div>
            <p style={{ fontSize: 12, color: 'var(--text3)', marginBottom: 4 }}>{item.title}</p>
            {item.link ? (
              <a href={item.link} style={{ fontSize: 14, fontWeight: 600, color: '#FF6B00', textDecoration: 'none' }}>{item.value}</a>
            ) : (
              <p style={{ fontSize: 14, fontWeight: 600, color: 'var(--text)' }}>{item.value}</p>
            )}
          </div>
        ))}
      </div>

      {/* Map embed */}
      {d.map_embed && (
        <div style={{ marginBottom: 40, borderRadius: 14, overflow: 'hidden', border: '1px solid var(--border)' }}
          dangerouslySetInnerHTML={{ __html: d.map_embed }} />
      )}

      <div style={{ display: 'flex', gap: 12, justifyContent: 'center' }}>
        {d.social.map((s: any) => (
          <a key={s.label} href={s.url} target="_blank" rel="noopener noreferrer"
            style={{ padding: '10px 20px', borderRadius: 10, border: '1px solid var(--border)', background: 'var(--surface)', color: 'var(--text2)', textDecoration: 'none', fontSize: 13 }}>
            {s.icon} {s.label}
          </a>
        ))}
      </div>
    </div>
  )
}
