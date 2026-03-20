'use client'

import { useSiteSettings } from '@/contexts/SiteSettingsContext'

const F = "'DM Sans','Segoe UI',system-ui,sans-serif"

export default function Footer() {
  const { settings } = useSiteSettings()

  const siteName = settings.site_name || 'BizPrint'
  const description = settings.footer_description || ''
  const copyright = settings.footer_copyright || ''
  const location = settings.footer_location || ''
  const columns = settings.footer_columns || []
  const showSocial = settings.footer_show_social !== false
  const showLocation = settings.footer_show_location !== false
  const facebook = settings.site_facebook || ''
  const instagram = settings.site_instagram || ''
  const youtube = settings.site_youtube || ''

  const socialLinks = [
    { icon: '📘', url: facebook, label: 'Facebook' },
    { icon: '📷', url: instagram, label: 'Instagram' },
    { icon: '🎬', url: youtube, label: 'YouTube' },
  ]

  return (
    <footer style={{ background: 'var(--surface)', borderTop: '1px solid var(--border)', fontFamily: F, color: 'var(--text)' }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '60px 24px 40px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '40px', marginBottom: '48px' }} className="grid-4">
          {/* Brand */}
          <div>
            <a href="/" style={{ fontSize: '20px', fontWeight: 700, color: 'var(--text)', textDecoration: 'none', display: 'inline-block', marginBottom: '14px' }}>
              <span style={{ color: '#FF6B00' }}>{siteName.substring(0, 3)}</span>{siteName.substring(3)}
            </a>
            <p style={{ fontSize: '13px', color: 'var(--text2)', lineHeight: 1.7, margin: '0 0 20px' }}>
              {description}
            </p>
            {showSocial && (
              <div style={{ display: 'flex', gap: '8px' }}>
                {socialLinks.map((s, i) => (
                  <a
                    key={i}
                    href={s.url || '#'}
                    target={s.url ? '_blank' : undefined}
                    rel={s.url ? 'noopener noreferrer' : undefined}
                    aria-label={s.label}
                    style={{
                      width: '34px', height: '34px', borderRadius: '8px',
                      background: 'var(--surface2)', border: '1px solid var(--border)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      textDecoration: 'none', fontSize: '14px',
                      transition: 'border-color 0.2s',
                    }}
                    onMouseEnter={e => (e.currentTarget.style.borderColor = '#FF6B00')}
                    onMouseLeave={e => (e.currentTarget.style.borderColor = 'var(--border)')}
                  >
                    {s.icon}
                  </a>
                ))}
              </div>
            )}
          </div>

          {/* Dynamic columns */}
          {Array.isArray(columns) && columns.map((col: any, idx: number) => (
            <div key={idx}>
              <h4 style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text)', margin: '0 0 16px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                {col.title}
              </h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {Array.isArray(col.links) && col.links.map((link: any, li: number) => (
                  <a
                    key={li}
                    href={link.url || '#'}
                    style={{ fontSize: '13px', color: 'var(--text2)', textDecoration: 'none', transition: 'color 0.2s' }}
                    onMouseEnter={e => (e.currentTarget.style.color = '#FF6B00')}
                    onMouseLeave={e => (e.currentTarget.style.color = 'var(--text2)')}
                  >
                    {link.label}
                  </a>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Bottom bar */}
        <div style={{ borderTop: '1px solid var(--border)', paddingTop: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
          <p style={{ fontSize: '12px', color: 'var(--text3)', margin: 0 }}>{copyright}</p>
          {showLocation && location && (
            <p style={{ fontSize: '12px', color: 'var(--text3)', margin: 0 }}>{location}</p>
          )}
        </div>
      </div>
    </footer>
  )
}
