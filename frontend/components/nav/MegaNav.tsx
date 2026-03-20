'use client'

import { useState, useRef, useEffect } from 'react'
import { usePathname } from 'next/navigation'
import { useSiteSettings } from '@/contexts/SiteSettingsContext'

const F = "'DM Sans','Segoe UI',system-ui,sans-serif"

export default function MegaNav() {
  const pathname = usePathname()
  const { settings, megaMenu } = useSiteSettings()
  const [openId, setOpenId] = useState<string | null>(null)
  const [mobileOpen, setMobileOpen] = useState(false)
  const [mobileAccordion, setMobileAccordion] = useState<string | null>(null)
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  const headerLogoUrl = settings.header_logo_url || ''
  const showSearch = settings.header_show_search !== false
  const showLogin = settings.header_show_login !== false
  const ctaText = settings.header_cta_text || 'Start →'
  const ctaUrl = settings.header_cta_url || '/quote'
  const siteName = settings.site_name || 'BizPrint'

  const activeItems = megaMenu
    .filter((item: any) => item.is_active !== false)
    .sort((a: any, b: any) => (a.sort_order || 0) - (b.sort_order || 0))

  // Close mobile menu on route change
  useEffect(() => {
    setMobileOpen(false)
    setMobileAccordion(null)
  }, [pathname])

  function handleMouseEnter(id: string) {
    if (closeTimer.current) clearTimeout(closeTimer.current)
    setOpenId(id)
  }

  function handleMouseLeave() {
    closeTimer.current = setTimeout(() => setOpenId(null), 150)
  }

  function toggleMobileAccordion(id: string) {
    setMobileAccordion(prev => prev === id ? null : id)
  }

  return (
    <>
      <nav style={{
        background: 'var(--surface, #fff)',
        borderBottom: '1px solid var(--border, #EBEBEB)',
        position: 'sticky',
        top: 0,
        zIndex: 200,
        fontFamily: F,
      }}>
        <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 24px', height: 64, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>

          {/* Logo */}
          <a href="/" style={{ display: 'flex', alignItems: 'center', gap: 10, textDecoration: 'none', flexShrink: 0 }}>
            {headerLogoUrl ? (
              <img src={headerLogoUrl} alt={siteName} style={{ height: 32 }} />
            ) : (
              <>
                <div style={{ width: 32, height: 32, background: '#FF6B00', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <svg width="16" height="16" fill="none" viewBox="0 0 18 18">
                    <rect x="2" y="2" width="6" height="6" rx="1.5" fill="white"/>
                    <rect x="10" y="2" width="6" height="6" rx="1.5" fill="white" opacity=".5"/>
                    <rect x="2" y="10" width="6" height="6" rx="1.5" fill="white" opacity=".5"/>
                    <rect x="10" y="10" width="6" height="6" rx="1.5" fill="white"/>
                  </svg>
                </div>
                <span style={{ fontSize: 16, fontWeight: 700, color: 'var(--text, #0F0F0F)' }}>
                  <span style={{ color: '#FF6B00' }}>{siteName.substring(0, 3)}</span>{siteName.substring(3)}
                </span>
              </>
            )}
          </a>

          {/* Desktop nav links */}
          <div className="nav-desktop" style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            {activeItems.map((item: any) => {
              const isActive = pathname === item.nav_url
              const hasDropdown = item.nav_type === 'MEGA' || item.nav_type === 'DROPDOWN'

              return (
                <div
                  key={item.id}
                  style={{ position: 'relative' }}
                  onMouseEnter={() => hasDropdown ? handleMouseEnter(item.id) : undefined}
                  onMouseLeave={() => hasDropdown ? handleMouseLeave() : undefined}
                >
                  {hasDropdown ? (
                    <button
                      style={{
                        padding: '8px 14px', border: 'none', background: 'transparent',
                        fontSize: 14, fontWeight: 500,
                        color: isActive ? '#FF6B00' : 'var(--text, #333)',
                        cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4,
                        fontFamily: F, borderRadius: 8,
                      }}
                    >
                      {item.nav_label}
                      <svg width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                        <path d="M6 9l6 6 6-6"/>
                      </svg>
                    </button>
                  ) : (
                    <a
                      href={item.nav_url || '#'}
                      style={{
                        padding: '8px 14px', fontSize: 14, fontWeight: 500,
                        color: isActive ? '#FF6B00' : 'var(--text, #333)',
                        textDecoration: 'none', borderRadius: 8,
                        background: isActive ? 'rgba(255,107,0,0.06)' : 'transparent',
                      }}
                    >
                      {item.nav_label}
                    </a>
                  )}

                  {/* MEGA dropdown */}
                  {item.nav_type === 'MEGA' && openId === item.id && Array.isArray(item.columns) && (
                    <div
                      onMouseEnter={() => handleMouseEnter(item.id)}
                      onMouseLeave={handleMouseLeave}
                      style={{
                        position: 'fixed', top: 64, left: 0, right: 0,
                        background: 'var(--surface, #fff)',
                        borderBottom: '1px solid var(--border, #EBEBEB)',
                        boxShadow: '0 8px 32px rgba(0,0,0,0.08)',
                        zIndex: 300, padding: '28px 0',
                      }}
                    >
                      <div style={{
                        maxWidth: 1200, margin: '0 auto', padding: '0 32px',
                        display: 'grid',
                        gridTemplateColumns: `repeat(${Math.min((item.columns?.length || 0) + (item.featured ? 1 : 0), 6)}, 1fr)`,
                        gap: 32,
                      }}>
                        {item.columns.map((col: any, ci: number) => (
                          <div key={ci}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14, paddingBottom: 10, borderBottom: `2px solid ${(col.color || '#FF6B00')}30` }}>
                              {col.icon && <span style={{ fontSize: 18 }}>{col.icon}</span>}
                              <span style={{ fontSize: 12, fontWeight: 700, color: col.color || '#FF6B00', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                                {col.title}
                              </span>
                            </div>
                            {Array.isArray(col.items) && col.items.map((link: any, li: number) => (
                              <a
                                key={li}
                                href={link.url || '#'}
                                style={{ display: 'block', padding: '8px 0', textDecoration: 'none', transition: 'padding-left 0.15s' }}
                                onMouseEnter={e => { e.currentTarget.style.paddingLeft = '6px' }}
                                onMouseLeave={e => { e.currentTarget.style.paddingLeft = '0' }}
                              >
                                <div style={{ fontSize: 14, fontWeight: 500, color: 'var(--text, #0F0F0F)' }}>{link.label}</div>
                                {link.desc && <div style={{ fontSize: 12, color: 'var(--text3, #999)', marginTop: 2 }}>{link.desc}</div>}
                              </a>
                            ))}
                          </div>
                        ))}
                        {item.featured && (
                          <div style={{ background: item.featured.bg_color || '#1a1a1a', borderRadius: 12, padding: 20, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                            <div>
                              {item.featured.badge && (
                                <div style={{ fontSize: 11, color: '#FF6B00', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 8 }}>
                                  {item.featured.badge}
                                </div>
                              )}
                              <div style={{ fontSize: 16, fontWeight: 700, color: '#fff', lineHeight: 1.4, marginBottom: 8 }}>
                                {item.featured.title}
                              </div>
                              <div style={{ fontSize: 12, color: '#888', lineHeight: 1.6 }}>
                                {item.featured.description}
                              </div>
                            </div>
                            <a
                              href={item.featured.cta_url || '/quote'}
                              style={{
                                marginTop: 16, display: 'block', background: '#FF6B00', color: '#fff',
                                textAlign: 'center', padding: '10px', borderRadius: 8,
                                textDecoration: 'none', fontSize: 13, fontWeight: 700,
                              }}
                            >
                              {item.featured.cta_text || 'Learn more'}
                            </a>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* DROPDOWN */}
                  {item.nav_type === 'DROPDOWN' && openId === item.id && Array.isArray(item.columns) && (
                    <div
                      onMouseEnter={() => handleMouseEnter(item.id)}
                      onMouseLeave={handleMouseLeave}
                      style={{
                        position: 'absolute', top: '100%', left: 0,
                        background: 'var(--surface, #fff)',
                        border: '1px solid var(--border, #EBEBEB)',
                        borderRadius: 12,
                        boxShadow: '0 8px 24px rgba(0,0,0,0.08)',
                        zIndex: 300, padding: '8px 0',
                        minWidth: 200, marginTop: 4,
                      }}
                    >
                      {item.columns.flatMap((col: any) => col.items || []).map((link: any, li: number) => (
                        <a
                          key={li}
                          href={link.url || '#'}
                          style={{
                            display: 'block', padding: '10px 16px',
                            fontSize: 14, fontWeight: 500,
                            color: 'var(--text, #333)', textDecoration: 'none',
                            transition: 'background 0.15s',
                          }}
                          onMouseEnter={e => { e.currentTarget.style.background = 'var(--surface2, #f5f5f5)' }}
                          onMouseLeave={e => { e.currentTarget.style.background = 'transparent' }}
                        >
                          {link.label}
                        </a>
                      ))}
                    </div>
                  )}
                </div>
              )
            })}
          </div>

          {/* Desktop actions */}
          <div className="nav-desktop" style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            {showSearch && (
              <div style={{ position: 'relative' }}>
                <input
                  placeholder="Хайх..."
                  style={{
                    padding: '8px 14px 8px 36px',
                    border: '1px solid var(--border, #EBEBEB)',
                    borderRadius: 10, fontSize: 13, outline: 'none',
                    background: 'var(--surface2, #F5F5F0)',
                    color: 'var(--text, #333)',
                    width: 180, fontFamily: F,
                  }}
                />
                <svg style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)' }} width="14" height="14" fill="none" stroke="var(--text3, #999)" strokeWidth="2" viewBox="0 0 24 24">
                  <circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/>
                </svg>
              </div>
            )}
            {showLogin && (
              <a href="/login" style={{
                fontSize: 14, fontWeight: 500, color: 'var(--text, #333)',
                textDecoration: 'none', padding: '8px 16px', borderRadius: 8,
                border: '1px solid var(--border, #EBEBEB)',
              }}>
                Нэвтрэх
              </a>
            )}
            <a href={ctaUrl} style={{
              fontSize: 14, fontWeight: 700, color: '#fff',
              textDecoration: 'none', padding: '9px 20px', borderRadius: 10,
              background: '#FF6B00',
            }}>
              {ctaText}
            </a>
          </div>

          {/* Mobile right side */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <a href={ctaUrl} className="nav-mobile" style={{
              display: 'none', fontSize: 13, fontWeight: 700, color: '#fff',
              textDecoration: 'none', padding: '7px 14px', borderRadius: 8,
              background: '#FF6B00',
            }}>
              {ctaText.replace(' →', '')}
            </a>
            {/* Hamburger */}
            <button
              className="nav-mobile"
              onClick={() => setMobileOpen(!mobileOpen)}
              style={{
                display: 'none', background: 'transparent', border: 'none',
                cursor: 'pointer', padding: 4, borderRadius: 8,
                color: 'var(--text, #333)',
              }}
            >
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
          background: 'var(--surface, #fff)', zIndex: 190, overflowY: 'auto',
          padding: '16px 24px 32px', fontFamily: F,
        }}>
          {/* Search */}
          {showSearch && (
            <div style={{ position: 'relative', marginBottom: 20 }}>
              <input
                placeholder="Хайх..."
                style={{
                  width: '100%', padding: '10px 14px 10px 38px',
                  border: '1px solid var(--border, #EBEBEB)',
                  borderRadius: 10, fontSize: 14, outline: 'none',
                  background: 'var(--surface2, #F5F5F0)',
                  color: 'var(--text, #333)',
                  fontFamily: F, boxSizing: 'border-box',
                }}
              />
              <svg style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)' }} width="16" height="16" fill="none" stroke="var(--text3, #999)" strokeWidth="2" viewBox="0 0 24 24">
                <circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/>
              </svg>
            </div>
          )}

          {/* Nav links with accordion */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4, marginBottom: 24 }}>
            {activeItems.map((item: any) => {
              const hasChildren = (item.nav_type === 'MEGA' || item.nav_type === 'DROPDOWN') && Array.isArray(item.columns)
              const isOpen = mobileAccordion === item.id
              const isActivePath = pathname === item.nav_url

              if (!hasChildren) {
                return (
                  <a
                    key={item.id}
                    href={item.nav_url || '#'}
                    onClick={() => setMobileOpen(false)}
                    style={{
                      padding: '14px 16px', fontSize: 15, fontWeight: 500,
                      color: isActivePath ? '#FF6B00' : 'var(--text, #0F0F0F)',
                      textDecoration: 'none', borderRadius: 10,
                      background: isActivePath ? 'rgba(255,107,0,0.06)' : 'transparent',
                      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    }}
                  >
                    {item.nav_label}
                    <svg width="16" height="16" fill="none" stroke="var(--text3, #999)" strokeWidth="2" viewBox="0 0 24 24">
                      <path d="M9 18l6-6-6-6"/>
                    </svg>
                  </a>
                )
              }

              // Accordion for MEGA / DROPDOWN
              const allLinks = item.nav_type === 'MEGA'
                ? item.columns.flatMap((col: any) => (col.items || []).map((it: any) => ({ ...it, section: col.title, color: col.color })))
                : item.columns.flatMap((col: any) => col.items || [])

              return (
                <div key={item.id}>
                  <button
                    onClick={() => toggleMobileAccordion(item.id)}
                    style={{
                      width: '100%', padding: '14px 16px', fontSize: 15, fontWeight: 500,
                      color: 'var(--text, #0F0F0F)', background: 'transparent',
                      border: 'none', borderRadius: 10, cursor: 'pointer',
                      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                      fontFamily: F, textAlign: 'left',
                    }}
                  >
                    {item.nav_label}
                    <svg
                      width="16" height="16" fill="none" stroke="var(--text3, #999)" strokeWidth="2" viewBox="0 0 24 24"
                      style={{ transition: 'transform 0.2s', transform: isOpen ? 'rotate(90deg)' : 'rotate(0deg)' }}
                    >
                      <path d="M9 18l6-6-6-6"/>
                    </svg>
                  </button>
                  {isOpen && (
                    <div style={{ paddingLeft: 16, paddingBottom: 8 }}>
                      {item.nav_type === 'MEGA' ? (
                        // Group by section
                        item.columns.map((col: any, ci: number) => (
                          <div key={ci} style={{ marginBottom: 12 }}>
                            <div style={{ fontSize: 11, fontWeight: 700, color: col.color || '#FF6B00', textTransform: 'uppercase', letterSpacing: '0.05em', padding: '6px 16px', display: 'flex', alignItems: 'center', gap: 6 }}>
                              {col.icon && <span>{col.icon}</span>}
                              {col.title}
                            </div>
                            {(col.items || []).map((link: any, li: number) => (
                              <a
                                key={li}
                                href={link.url || '#'}
                                onClick={() => setMobileOpen(false)}
                                style={{
                                  display: 'block', padding: '10px 16px',
                                  fontSize: 14, color: 'var(--text, #333)',
                                  textDecoration: 'none',
                                }}
                              >
                                {link.label}
                                {link.desc && <span style={{ fontSize: 12, color: 'var(--text3, #999)', marginLeft: 8 }}>{link.desc}</span>}
                              </a>
                            ))}
                          </div>
                        ))
                      ) : (
                        allLinks.map((link: any, li: number) => (
                          <a
                            key={li}
                            href={link.url || '#'}
                            onClick={() => setMobileOpen(false)}
                            style={{
                              display: 'block', padding: '10px 16px',
                              fontSize: 14, color: 'var(--text, #333)',
                              textDecoration: 'none',
                            }}
                          >
                            {link.label}
                          </a>
                        ))
                      )}
                    </div>
                  )}
                </div>
              )
            })}
          </div>

          {/* CTA buttons */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <a href={ctaUrl} onClick={() => setMobileOpen(false)} style={{
              padding: '14px', background: '#FF6B00', color: '#fff',
              textDecoration: 'none', borderRadius: 12, textAlign: 'center',
              fontSize: 15, fontWeight: 700,
            }}>
              {ctaText}
            </a>
            {showLogin && (
              <a href="/login" onClick={() => setMobileOpen(false)} style={{
                padding: '14px', background: 'transparent',
                color: 'var(--text, #333)',
                textDecoration: 'none', borderRadius: 12, textAlign: 'center',
                fontSize: 15, fontWeight: 500,
                border: '1px solid var(--border, #EBEBEB)',
              }}>
                Нэвтрэх
              </a>
            )}
          </div>
        </div>
      )}
    </>
  )
}
