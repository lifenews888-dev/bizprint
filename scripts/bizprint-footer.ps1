# BizPrint Footer Setup
$COMP = "C:\Users\User\projects\bizprint\frontend\components"
$LAYOUT = "C:\Users\User\projects\bizprint\frontend\app\layout.tsx"

function Write-File($path, $content) {
    $dir = Split-Path $path
    if (!(Test-Path $dir)) { New-Item -ItemType Directory -Path $dir -Force | Out-Null }
    [System.IO.File]::WriteAllText($path, $content, [System.Text.Encoding]::UTF8)
    Write-Host "  [OK] $path" -ForegroundColor Green
}

Write-Host "=======================================" -ForegroundColor Cyan
Write-Host "  BizPrint Footer Setup" -ForegroundColor Cyan
Write-Host "=======================================" -ForegroundColor Cyan

Write-File "$COMP\Footer.tsx" @"
import Link from 'next/link'

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

  const socials = [
    { key: 'social_facebook',  label: 'Facebook',  href: s.social_facebook },
    { key: 'social_instagram', label: 'Instagram', href: s.social_instagram },
    { key: 'social_twitter',   label: 'Twitter/X', href: s.social_twitter },
    { key: 'social_youtube',   label: 'YouTube',   href: s.social_youtube },
  ].filter(s => s.href)

  return (
    <footer style={{ background: '#0a0a0f', borderTop: '1px solid rgba(255,255,255,0.08)', marginTop: 80 }}>
      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '48px 24px 24px' }}>

        {/* Top grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(220px,1fr))', gap: 40, marginBottom: 48 }}>

          {/* Brand */}
          <div>
            <div style={{ fontSize: 22, fontWeight: 800, color: '#FF6B00', marginBottom: 10 }}>
              {s.site_name || 'BizPrint'}
            </div>
            <p style={{ color: '#9ca3af', fontSize: 13, lineHeight: 1.7, margin: '0 0 16px' }}>
              {s.site_tagline || ''}
            </p>
            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
              {socials.map(sc => (
                <a key={sc.key} href={sc.href} target="_blank" rel="noreferrer"
                  style={{ fontSize: 12, color: '#6b7280', padding: '4px 10px', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 6, textDecoration: 'none', transition: 'color 0.2s' }}
                  onMouseOver={e => (e.currentTarget.style.color = '#FF6B00')}
                  onMouseOut={e => (e.currentTarget.style.color = '#6b7280')}
                >
                  {sc.label}
                </a>
              ))}
            </div>
          </div>

          {/* Links */}
          <div>
            <div style={{ fontSize: 13, fontWeight: 700, color: '#fff', marginBottom: 16, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Холбоосууд
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {[
                { href: '/', label: 'Нүүр хуудас' },
                { href: '/shop', label: 'Дэлгүүр' },
                { href: '/quote', label: 'Үнийн санал' },
                { href: '/designer', label: 'Дизайнер' },
                { href: '/dashboard', label: 'Dashboard' },
              ].map(l => (
                <Link key={l.href} href={l.href}
                  style={{ color: '#9ca3af', fontSize: 13, textDecoration: 'none' }}>
                  {l.label}
                </Link>
              ))}
            </div>
          </div>

          {/* Contact */}
          <div>
            <div style={{ fontSize: 13, fontWeight: 700, color: '#fff', marginBottom: 16, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Холбоо барих
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {s.phone && (
                <a href={'tel:' + s.phone} style={{ color: '#9ca3af', fontSize: 13, textDecoration: 'none' }}>
                  📞 {s.phone}
                </a>
              )}
              {s.phone2 && (
                <a href={'tel:' + s.phone2} style={{ color: '#9ca3af', fontSize: 13, textDecoration: 'none' }}>
                  📞 {s.phone2}
                </a>
              )}
              {s.email && (
                <a href={'mailto:' + s.email} style={{ color: '#9ca3af', fontSize: 13, textDecoration: 'none' }}>
                  ✉️ {s.email}
                </a>
              )}
              {s.working_hours && (
                <div style={{ color: '#9ca3af', fontSize: 13 }}>
                  🕐 {s.working_hours}
                </div>
              )}
            </div>
          </div>

          {/* Address */}
          <div>
            <div style={{ fontSize: 13, fontWeight: 700, color: '#fff', marginBottom: 16, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Хаяг
            </div>
            {s.address && (
              <p style={{ color: '#9ca3af', fontSize: 13, lineHeight: 1.7, margin: 0 }}>
                📍 {s.address}
              </p>
            )}
            {s.city && (
              <p style={{ color: '#6b7280', fontSize: 12, margin: '8px 0 0' }}>
                {s.city}
              </p>
            )}
          </div>
        </div>

        {/* Bottom */}
        <div style={{ borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: 20, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 10 }}>
          <p style={{ color: '#6b7280', fontSize: 12, margin: 0 }}>
            {s.footer_text || '© 2025 BizPrint. Бүх эрх хуулиар хамгаалагдсан.'}
          </p>
          <div style={{ display: 'flex', gap: 16 }}>
            {s.social_whatsapp && (
              <a href={'https://wa.me/' + s.social_whatsapp.replace('+','')} target="_blank" rel="noreferrer"
                style={{ color: '#25D366', fontSize: 12, textDecoration: 'none' }}>
                WhatsApp
              </a>
            )}
            {s.social_phone && (
              <a href={'tel:' + s.social_phone} style={{ color: '#6b7280', fontSize: 12, textDecoration: 'none' }}>
                {s.social_phone}
              </a>
            )}
          </div>
        </div>

      </div>
    </footer>
  )
}
"@

# Update layout.tsx
Write-Host "[2/2] Updating layout.tsx..." -ForegroundColor Yellow
$layout = [System.IO.File]::ReadAllText($LAYOUT, [System.Text.Encoding]::UTF8)
if ($layout -notmatch "Footer") {
    $layout = $layout -replace "import \{ AnnouncementBar, ChatWidget \} from '@/components/marketing'", "import { AnnouncementBar, ChatWidget } from '@/components/marketing'`nimport Footer from '@/components/Footer'"
    $layout = $layout -replace "<ChatWidget />", "<ChatWidget />`n        <Footer />"
    [System.IO.File]::WriteAllText($LAYOUT, $layout, [System.Text.Encoding]::UTF8)
    Write-Host "  [OK] layout.tsx updated" -ForegroundColor Green
} else {
    Write-Host "  [SKIP] Footer already in layout.tsx" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "=======================================" -ForegroundColor Cyan
Write-Host "  DONE! Footer added." -ForegroundColor Green
Write-Host "=======================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Check: http://localhost:3000" -ForegroundColor Yellow
