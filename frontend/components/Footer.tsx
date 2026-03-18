async function getSettings() {
  try {
    const res = await fetch('http://localhost:4000/settings/public', { cache: 'no-store' })
    return res.json()
  } catch {
    return {}
  }
}

export default async function Footer() {
  const s = await getSettings()
  const tagline = s.footer_about || s.site_tagline || ''
  const copyright = s.footer_copy || s.footer_text || 'c 2025 BizPrint'

  const socials = [
    { label: 'Facebook',  href: s.social_facebook },
    { label: 'Instagram', href: s.social_instagram },
    { label: 'Twitter/X', href: s.social_twitter },
    { label: 'YouTube',   href: s.social_youtube },
  ].filter(x => x.href)

  const links = [
    { href: '/',          label: 'Нүүр хуудас' },
    { href: '/shop',      label: 'Дэлгүүр' },
    { href: '/quote',     label: 'Үнийн санал' },
    { href: '/designer',  label: 'Дизайнер' },
    { href: '/dashboard', label: 'Dashboard' },
  ]

  return (
    <footer style={{ background: 'var(--surface)', borderTop: '1px solid var(--border)', marginTop: 80, fontFamily: 'inherit' }}>
      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '48px 24px 24px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(200px,1fr))', gap: 40, marginBottom: 48 }}>

          <div>
            <div style={{ fontSize: 22, fontWeight: 800, color: 'var(--orange)', marginBottom: 10 }}>
              {s.site_name || 'BizPrint'}
            </div>
            <p style={{ color: 'var(--text2)', fontSize: 13, lineHeight: 1.7, margin: '0 0 16px' }}>
              {tagline}
            </p>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' as const }}>
              {socials.map(sc => (
                <a key={sc.label} href={sc.href} target="_blank" rel="noreferrer"
                  style={{ fontSize: 12, color: 'var(--text2)', padding: '4px 10px', border: '1px solid var(--border)', borderRadius: 6, textDecoration: 'none' }}>
                  {sc.label}
                </a>
              ))}
            </div>
          </div>

          <div>
            <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text)', marginBottom: 16, textTransform: 'uppercase' as const, letterSpacing: '0.08em' }}>
              Холбоосууд
            </div>
            <div style={{ display: 'flex', flexDirection: 'column' as const, gap: 10 }}>
              {links.map(l => (
                <a key={l.href} href={l.href} style={{ color: 'var(--text2)', fontSize: 13, textDecoration: 'none' }}>
                  {l.label}
                </a>
              ))}
            </div>
          </div>

          <div>
            <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text)', marginBottom: 16, textTransform: 'uppercase' as const, letterSpacing: '0.08em' }}>
              Холбоо барих
            </div>
            <div style={{ display: 'flex', flexDirection: 'column' as const, gap: 10 }}>
              {s.phone && <a href={'tel:' + s.phone} style={{ color: 'var(--text2)', fontSize: 13, textDecoration: 'none' }}>📞 {s.phone}</a>}
              {s.phone2 && <a href={'tel:' + s.phone2} style={{ color: 'var(--text2)', fontSize: 13, textDecoration: 'none' }}>📞 {s.phone2}</a>}
              {s.email && <a href={'mailto:' + s.email} style={{ color: 'var(--text2)', fontSize: 13, textDecoration: 'none' }}>✉️ {s.email}</a>}
              {s.working_hours && <div style={{ color: 'var(--text2)', fontSize: 13 }}>🕐 {s.working_hours}</div>}
            </div>
          </div>

          <div>
            <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text)', marginBottom: 16, textTransform: 'uppercase' as const, letterSpacing: '0.08em' }}>
              Хаяг
            </div>
            {s.address && <p style={{ color: 'var(--text2)', fontSize: 13, lineHeight: 1.7, margin: 0 }}>📍 {s.address}</p>}
            {s.city && <p style={{ color: 'var(--text3)', fontSize: 12, margin: '8px 0 0' }}>{s.city}</p>}
          </div>

        </div>

        <div style={{ borderTop: '1px solid var(--border)', paddingTop: 20, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap' as const, gap: 10 }}>
          <p style={{ color: 'var(--text3)', fontSize: 12, margin: 0 }}>{copyright}</p>
          <div style={{ display: 'flex', gap: 16 }}>
            {s.social_whatsapp && (
              <a href={'https://wa.me/' + s.social_whatsapp.replace('+', '')} target="_blank" rel="noreferrer"
                style={{ color: '#25D366', fontSize: 12, textDecoration: 'none' }}>
                WhatsApp
              </a>
            )}
          </div>
        </div>

      </div>
    </footer>
  )
}