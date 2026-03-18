'use client'
import { useState, useEffect } from 'react'
import { usePathname } from 'next/navigation'

const API = 'http://localhost:4000'
const F = "'DM Sans','Segoe UI',system-ui,sans-serif"

const NAV_LINKS = [
  { label: 'Products', key: 'products', hasMega: true },
  { label: 'Shop', href: '/shop' },
  { label: 'Services', href: '/services' },
  { label: 'Partner', href: '/partner' },
  { label: 'Quote', href: '/quote' },
  { label: 'Factories', href: '/factories' },
]

export default function MegaNav() {
  const pathname = usePathname()
  const [megaItems, setMegaItems] = useState<any[]>([])
  const [megaOpen, setMegaOpen] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  const [cta, setCta] = useState({
    title: 'AI Quote Calculator',
    desc: 'Upload PDF and get instant pricing',
    button: 'Get Started',
    url: '/quote',
  })

  useEffect(() => {
    fetch(API + '/menus')
      .then(r => r.json())
      .then(data => {
        if (Array.isArray(data)) {
          setMegaItems(data.filter((i: any) => (i.location === 'mega' || i.is_mega) && i.isActive))
        }
      })
      .catch(() => {})
  }, [])

  useEffect(() => {
    fetch(API + '/settings/public')
      .then(r => r.json())
      .then(data => {
        const m: any = {}
        if (Array.isArray(data)) data.forEach((s: any) => { m[s.key] = s.value })
        else if (data && typeof data === 'object') Object.assign(m, data)
        setCta({
          title: m['mega_cta_title'] || 'AI Quote Calculator',
          desc: m['mega_cta_desc'] || 'Upload PDF and get instant pricing',
          button: m['mega_cta_button'] || 'Get Started',
          url: m['mega_cta_url'] || '/quote',
        })
      })
      .catch(() => {})
  }, [])

  const sections = Array.from(new Set(megaItems.map((i: any) => i.section_title).filter(Boolean)))

  return (
    <>
      <nav style={{ background: '#fff', borderBottom: '1px solid #EBEBEB', position: 'sticky', top: 0, zIndex: 200, fontFamily: F }}>
        <div style={{ maxWidth: 1280, margin: '0 auto', padding: '0 24px', height: 64, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>

          {/* Logo */}
          <a href="/" style={{ display: 'flex', alignItems: 'center', gap: 10, textDecoration: 'none', flexShrink: 0 }}>
            <div style={{ width: 32, height: 32, background: '#FF6B35', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <svg width="16" height="16" fill="none" viewBox="0 0 18 18">
                <rect x="2" y="2" width="6" height="6" rx="1.5" fill="white"/>
                <rect x="10" y="2" width="6" height="6" rx="1.5" fill="white" opacity=".5"/>
                <rect x="2" y="10" width="6" height="6" rx="1.5" fill="white" opacity=".5"/>
                <rect x="10" y="10" width="6" height="6" rx="1.5" fill="white"/>
              </svg>
            </div>
            <span style={{ fontSize: 16, fontWeight: 700, color: '#0F0F0F' }}>Biz<span style={{ color: '#FF6B35' }}>Print</span></span>
          </a>

          {/* Desktop nav */}
          <div className="nav-desktop" style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            {NAV_LINKS.map((link) => (
              link.hasMega ? (
                <div key="products" style={{ position: 'relative' }}>
                  <button
                    onMouseEnter={() => setMegaOpen(true)}
                    onMouseLeave={() => setMegaOpen(false)}
                    style={{ padding: '8px 14px', border: 'none', background: 'transparent', fontSize: 14, fontWeight: 500, color: '#333', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4, fontFamily: F, borderRadius: 8 }}>
                    {link.label}
                    <svg width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                      <path d="M6 9l6 6 6-6"/>
                    </svg>
                  </button>
                  {megaOpen && sections.length > 0 && (
                    <div
                      onMouseEnter={() => setMegaOpen(true)}
                      onMouseLeave={() => setMegaOpen(false)}
                      style={{ position: 'fixed', top: 64, left: 0, right: 0, background: '#fff', borderBottom: '1px solid #EBEBEB', boxShadow: '0 8px 32px rgba(0,0,0,0.08)', zIndex: 300, padding: '28px 0' }}>
                      <div style={{ maxWidth: 1280, margin: '0 auto', padding: '0 32px', display: 'grid', gridTemplateColumns: `repeat(${Math.min(sections.length + 1, 6)}, 1fr)`, gap: 32 }}>
                        {sections.map((section: any) => {
                          const sItems = megaItems.filter((i: any) => i.section_title === section)
                          const color = sItems[0]?.color || '#FF6B35'
                          const icon = sItems[0]?.icon || ''
                          return (
                            <div key={section}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14, paddingBottom: 10, borderBottom: `2px solid ${color}30` }}>
                                <span style={{ fontSize: 18 }}>{icon}</span>
                                <span style={{ fontSize: 12, fontWeight: 700, color, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{section}</span>
                              </div>
                              {sItems.map((item: any) => (
                                <a key={item.id} href={item.url}
                                  style={{ display: 'block', padding: '8px 0', textDecoration: 'none' }}
                                  onMouseEnter={e => { (e.currentTarget as HTMLElement).style.paddingLeft = '6px' }}
                                  onMouseLeave={e => { (e.currentTarget as HTMLElement).style.paddingLeft = '0' }}>
                                  <div style={{ fontSize: 14, fontWeight: 500, color: '#0F0F0F' }}>{item.label_mn || item.label}</div>
                                  {item.description && <div style={{ fontSize: 12, color: '#999', marginTop: 2 }}>{item.description}</div>}
                                </a>
                              ))}
                            </div>
                          )
                        })}
                        <div style={{ background: '#0F0F0F', borderRadius: 12, padding: 20, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                          <div>
                            <div style={{ fontSize: 11, color: '#FF6B35', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 8 }}>Featured</div>
                            <div style={{ fontSize: 16, fontWeight: 700, color: '#fff', lineHeight: 1.4, marginBottom: 8 }}>{cta.title}</div>
                            <div style={{ fontSize: 12, color: '#666', lineHeight: 1.6 }}>{cta.desc}</div>
                          </div>
                          <a href={cta.url} style={{ marginTop: 16, display: 'block', background: '#FF6B35', color: '#fff', textAlign: 'center', padding: '10px', borderRadius: 8, textDecoration: 'none', fontSize: 13, fontWeight: 700 }}>
                            {cta.button} →
                          </a>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <a key={link.href} href={link.href || '#'}
                  style={{ padding: '8px 14px', fontSize: 14, fontWeight: 500, color: pathname === link.href ? '#FF6B35' : '#333', textDecoration: 'none', borderRadius: 8, background: pathname === link.href ? 'rgba(255,107,53,0.06)' : 'transparent' }}>
                  {link.label}
                </a>
              )
            ))}
          </div>

          {/* Desktop actions */}
          <div className="nav-desktop" style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ position: 'relative' }}>
              <input placeholder="Search..." style={{ padding: '8px 14px 8px 36px', border: '1px solid #EBEBEB', borderRadius: 10, fontSize: 13, outline: 'none', background: '#F5F5F0', width: 180, fontFamily: F }} />
              <svg style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)' }} width="14" height="14" fill="none" stroke="#999" strokeWidth="2" viewBox="0 0 24 24">
                <circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/>
              </svg>
            </div>
            <a href="/login" style={{ fontSize: 14, fontWeight: 500, color: '#333', textDecoration: 'none', padding: '8px 16px', borderRadius: 8, border: '1px solid #EBEBEB' }}>Login</a>
            <a href="/quote" style={{ fontSize: 14, fontWeight: 700, color: '#fff', textDecoration: 'none', padding: '9px 20px', borderRadius: 10, background: '#FF6B35' }}>Start →</a>
          </div>

          {/* Mobile right side */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <a href="/quote" className="nav-mobile" style={{ display: 'none', fontSize: 13, fontWeight: 700, color: '#fff', textDecoration: 'none', padding: '7px 14px', borderRadius: 8, background: '#FF6B35' }}>
              Start
            </a>
            {/* Hamburger */}
            <button
              className="nav-mobile"
              onClick={() => setMobileOpen(!mobileOpen)}
              style={{ display: 'none', background: 'transparent', border: 'none', cursor: 'pointer', padding: 4, borderRadius: 8, color: '#333' }}>
              {mobileOpen ? (
                <svg width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path d="M18 6L6 18M6 6l12 12"/>
                </svg>
              ) : (
                <svg width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path d="M4 6h16M4 12h16M4 18h16"/>
                </svg>
              )}
            </button>
          </div>
        </div>
      </nav>

      {/* Mobile menu overlay */}
      {mobileOpen && (
        <div style={{
          position: 'fixed', top: 64, left: 0, right: 0, bottom: 0,
          background: '#fff', zIndex: 190, overflowY: 'auto',
          padding: '16px 24px 32px',
          fontFamily: F,
        }}>
          {/* Search */}
          <div style={{ position: 'relative', marginBottom: 20 }}>
            <input placeholder="Search..." style={{ width: '100%', padding: '10px 14px 10px 38px', border: '1px solid #EBEBEB', borderRadius: 10, fontSize: 14, outline: 'none', background: '#F5F5F0', fontFamily: F, boxSizing: 'border-box' }} />
            <svg style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)' }} width="16" height="16" fill="none" stroke="#999" strokeWidth="2" viewBox="0 0 24 24">
              <circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/>
            </svg>
          </div>

          {/* Nav links */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4, marginBottom: 24 }}>
            {NAV_LINKS.map((link) => (
              <a key={link.href || link.key} href={link.href || '/shop'}
                onClick={() => setMobileOpen(false)}
                style={{
                  padding: '14px 16px', fontSize: 15, fontWeight: 500,
                  color: pathname === link.href ? '#FF6B35' : '#0F0F0F',
                  textDecoration: 'none', borderRadius: 10,
                  background: pathname === link.href ? 'rgba(255,107,53,0.06)' : 'transparent',
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                }}>
                {link.label}
                <svg width="16" height="16" fill="none" stroke="#999" strokeWidth="2" viewBox="0 0 24 24">
                  <path d="M9 18l6-6-6-6"/>
                </svg>
              </a>
            ))}
          </div>

          {/* CTA buttons */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <a href="/quote" onClick={() => setMobileOpen(false)} style={{
              padding: '14px', background: '#FF6B35', color: '#fff',
              textDecoration: 'none', borderRadius: 12, textAlign: 'center',
              fontSize: 15, fontWeight: 700,
            }}>
              Get a Quote →
            </a>
            <a href="/login" onClick={() => setMobileOpen(false)} style={{
              padding: '14px', background: 'transparent', color: '#333',
              textDecoration: 'none', borderRadius: 12, textAlign: 'center',
              fontSize: 15, fontWeight: 500, border: '1px solid #EBEBEB',
            }}>
              Login
            </a>
          </div>
        </div>
      )}
    </>
  )
}
