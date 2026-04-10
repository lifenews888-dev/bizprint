'use client'

import { useState, useRef, useEffect } from 'react'
import { usePathname } from 'next/navigation'
import { useSiteSettings } from '@/contexts/SiteSettingsContext'
import { useStore } from '@/lib/store'

/* ─── SVG Icons ─── */
const SearchIcon = () => (
  <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/></svg>
)
const UserIcon = () => (
  <svg width="22" height="22" fill="none" stroke="currentColor" strokeWidth="1.6" viewBox="0 0 24 24"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
)
const HeartIcon = () => (
  <svg width="22" height="22" fill="none" stroke="currentColor" strokeWidth="1.6" viewBox="0 0 24 24"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>
)
const CartIcon = () => (
  <svg width="22" height="22" fill="none" stroke="currentColor" strokeWidth="1.6" viewBox="0 0 24 24"><path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/><path d="M16 10a4 4 0 0 1-8 0"/></svg>
)
const PhoneIcon = () => (
  <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07A19.5 19.5 0 013.07 9.61 19.79 19.79 0 01.02 1 2 2 0 012 0h3a2 2 0 012 1.72c.127.96.361 1.903.7 2.81a2 2 0 01-.45 2.11L6.91 7.91a16 16 0 006.18 6.18l1.27-1.27a2 2 0 012.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0122 15v1.92z"/></svg>
)
const MenuIcon = () => (
  <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M4 6h16M4 12h16M4 18h16"/></svg>
)
const CloseIcon = () => (
  <svg width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M18 6L6 18M6 6l12 12"/></svg>
)
const ChevronDown = () => (
  <svg width="10" height="10" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path d="M6 9l6 6 6-6"/></svg>
)
const ChevronRight = () => (
  <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M9 18l6-6-6-6"/></svg>
)

export default function MegaNav() {
  const pathname = usePathname()
  const { settings, megaMenu } = useSiteSettings()

  // Get categories from the MEGA nav item (for mega dropdown)
  const megaItem = megaMenu.find((m: any) => m.nav_type === 'MEGA')

  // Fetch real categories from DB for АНГИЛАЛ flyout
  const [navCategories, setNavCategories] = useState<any[]>([])
  useEffect(() => {
    const api = typeof window !== 'undefined' ? (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000') : ''
    fetch(`${api}/categories/navigation`).then(r => r.ok ? r.json() : []).then(data => {
      if (Array.isArray(data) && data.length > 0) setNavCategories(data)
    }).catch(() => {})
  }, [])

  // For АНГИЛАЛ: use DB categories if available, fallback to mega menu columns
  const catGroups = navCategories.length > 0
    ? navCategories.filter((c: any) => c.children?.length > 0).map((c: any) => ({
        title: c.name_mn || c.name,
        icon: c.icon || '📦',
        color: c.color || '#FF6B00',
        slug: c.slug,
        items: c.children.map((ch: any) => ({
          label: ch.name_mn || ch.name,
          url: `/shop?category=${ch.slug}`,
          desc: '',
        })),
      }))
    : (megaItem?.columns || [])

  // Quick links from CMS settings (admin-managed)
  const headerQuickLinks = (() => {
    try {
      const raw = settings.header_quick_links
      if (typeof raw === 'string') return JSON.parse(raw)
      if (Array.isArray(raw)) return raw
    } catch {}
    return null
  })()

  const DEFAULT_QUICK_LINKS = [
    { label: 'AI Үнэ', url: '/quote?tab=ai', icon: '🤖', color: '#8B5CF6' },
    { label: 'Галерей', url: '/gallery', icon: '🖼️', color: '#10B981' },
    { label: 'Marketplace', url: '/marketplace', icon: '🎨', color: '#EC4899' },
  ]

  // Always use DEFAULT_QUICK_LINKS — DB may have stale items
  const quickLinks: { label: string; url: string; icon: string; color: string }[] = DEFAULT_QUICK_LINKS
  const [openId, setOpenId] = useState<string | null>(null)
  const [mobileOpen, setMobileOpen] = useState(false)
  const [mobileAccordion, setMobileAccordion] = useState<string | null>(null)
  const [searchOpen, setSearchOpen] = useState(false)
  const [catMenuOpen, setCatMenuOpen] = useState(false)
  const [activeCatIdx, setActiveCatIdx] = useState(0)
  const [searchQuery, setSearchQuery] = useState('')
  const [searchCat, setSearchCat] = useState('')
  const [searchResults, setSearchResults] = useState<any[] | null>(null)
  const [searching, setSearching] = useState(false)
  const searchTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  const { cartCount, wishlist } = useStore()
  const [mounted, setMounted] = useState(false)
  useEffect(() => setMounted(true), [])
  const headerLogoUrl = settings.header_logo_url || ''
  const siteName = settings.site_name || 'BizPrint'
  const phone = settings.site_phone || '+976 7711-7700'
  const showSearch = settings.header_show_search !== false && settings.header_show_search !== 'false'
  const showLogin = settings.header_show_login !== false && settings.header_show_login !== 'false'
  const ctaText = settings.header_cta_text || ''
  const ctaUrl = settings.header_cta_url || '/quote'

  // Auth state
  const [user, setUser] = useState<any>(null)
  useEffect(() => {
    try {
      const stored = localStorage.getItem('user')
      if (stored) setUser(JSON.parse(stored))
    } catch {}
    const onStorage = () => { try { setUser(JSON.parse(localStorage.getItem('user') || 'null')) } catch {} }
    window.addEventListener('storage', onStorage)
    return () => window.removeEventListener('storage', onStorage)
  }, [])

  // Search logic with debounce
  const doSearch = (q: string, cat: string) => {
    if (searchTimer.current) clearTimeout(searchTimer.current)
    if (q.length < 2) { setSearchResults(null); return }
    setSearching(true)
    searchTimer.current = setTimeout(async () => {
      try {
        const params = new URLSearchParams({ q })
        if (cat) params.set('category', cat)
        const res = await fetch(`${typeof window !== 'undefined' ? 'http://localhost:4000' : ''}/products/search?${params}`)
        const data = await res.json()
        setSearchResults(Array.isArray(data) ? data : [])
      } catch { setSearchResults([]) }
      setSearching(false)
    }, 300)
  }

  const handleSearchSubmit = () => {
    if (searchQuery.length < 2) return
    const params = new URLSearchParams({ q: searchQuery })
    if (searchCat) params.set('cat', searchCat)
    window.location.href = `/search?${params}`
  }

  const activeItems = megaMenu
    .filter((item: any) => item.is_active !== false)
    .sort((a: any, b: any) => (a.sort_order || 0) - (b.sort_order || 0))

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

  /* ═══════════════════════════════════════════════
     ROW 1 — TOP BAR: Logo | Phone | Search | Account/Heart/Cart
     ═══════════════════════════════════════════════ */
  return (
    <>
      <div className="bg-white border-b border-[#EBEBEB] hidden md:block relative z-[210]">
        <div className="max-w-[1280px] mx-auto px-6 h-[72px] flex items-center gap-4 overflow-hidden">

          {/* ── Logo ── */}
          <a href="/" className="flex items-center gap-2.5 no-underline flex-shrink-0 mr-2">
            {headerLogoUrl ? (
              <img src={headerLogoUrl} alt={siteName} className="h-10" />
            ) : (
              <>
                <svg width="38" height="38" viewBox="0 0 48 48" fill="none" className="flex-shrink-0">
                  <defs>
                    <linearGradient id="nav-og" x1="0" y1="0" x2="48" y2="24" gradientUnits="userSpaceOnUse">
                      <stop stopColor="#FF6B00"/><stop offset="1" stopColor="#F59E0B"/>
                    </linearGradient>
                    <linearGradient id="nav-pp" x1="0" y1="24" x2="48" y2="48" gradientUnits="userSpaceOnUse">
                      <stop stopColor="#8B5CF6"/><stop offset="1" stopColor="#6D28D9"/>
                    </linearGradient>
                  </defs>
                  <path d="M4 14C4 8.477 8.477 4 14 4h6c5.523 0 10 4.477 10 10v4c0 2.21-1.79 4-4 4H14c-5.523 0-10-4.477-10-10z" fill="url(#nav-og)"/>
                  <path d="M30 8a10 10 0 0114 0 10 10 0 010 14c-2 2-6 2-8 0l-6-6a10 10 0 010-8z" fill="url(#nav-og)" opacity="0.8"/>
                  <path d="M4 30c0-2.21 1.79-4 4-4h10c5.523 0 10 4.477 10 10v4c0 2.21-1.79 4-4 4H14c-5.523 0-10-4.477-10-10v-4z" fill="url(#nav-pp)"/>
                  <path d="M30 30c0-2.21 1.79-4 4-4h4c2.21 0 4 1.79 4 4v4c0 5.523-4.477 10-10 10h-2c-2.21 0-4-1.79-4-4v-6c0-2.21 1.79-4 4-4z" fill="url(#nav-pp)" opacity="0.8"/>
                </svg>
                <span className="text-[22px] font-extrabold text-[#111] tracking-tight leading-none">
                  <span className="text-[#FF6B00]">{siteName.substring(0, 3)}</span>{siteName.substring(3)}
                </span>
              </>
            )}
          </a>

          {/* ── Phone ── */}
          <div className="flex items-center gap-2 flex-shrink-0">
            <span className="text-[#FF6B00]"><PhoneIcon /></span>
            <div className="leading-tight">
              <div className="text-[11px] text-[#888]">Холбоо барих 24/7</div>
              <div className="text-[13px] font-bold text-[#111]">{phone}</div>
            </div>
          </div>

          {/* ── Search bar ── */}
          {showSearch && <div className="flex-1 max-w-[540px] mx-auto relative">
            <form onSubmit={e => { e.preventDefault(); handleSearchSubmit() }} className="flex items-stretch h-[44px] border-2 border-[#EBEBEB] rounded-lg overflow-hidden focus-within:border-[#FF6B00] transition-colors">
              <select value={searchCat} onChange={e => { setSearchCat(e.target.value); if (searchQuery.length >= 2) doSearch(searchQuery, e.target.value) }} className="bg-[#F8F8F8] text-[13px] font-medium text-[#555] px-3 border-r border-[#EBEBEB] outline-none cursor-pointer" style={{ appearance: 'auto', minWidth: 130 }}>
                <option value="">Бүх ангилал</option>
                {catGroups.map((c: any, i: number) => (
                  <option key={i} value={c.label}>{c.label}</option>
                ))}
              </select>
              <input
                type="text"
                value={searchQuery}
                onChange={e => { setSearchQuery(e.target.value); doSearch(e.target.value, searchCat) }}
                onFocus={() => { if (searchQuery.length >= 2) doSearch(searchQuery, searchCat) }}
                onBlur={() => setTimeout(() => setSearchResults(null), 200)}
                placeholder="Бүтээгдэхүүн хайх..."
                className="flex-1 bg-white text-[14px] text-[#111] px-4 outline-none placeholder:text-[#BBB]"
              />
              <button type="submit" className="bg-[#FF6B00] hover:bg-[#E55D00] text-white px-5 transition-colors flex items-center justify-center flex-shrink-0">
                <SearchIcon />
              </button>
            </form>

            {/* Search results dropdown */}
            {searchResults !== null && (
              <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-[#EBEBEB] rounded-xl shadow-xl z-[400] max-h-[360px] overflow-y-auto">
                {searching && <div className="px-4 py-3 text-sm text-[#999]">Хайж байна...</div>}
                {!searching && searchResults.length === 0 && (
                  <div className="px-4 py-6 text-center">
                    <div className="text-2xl mb-2">🔍</div>
                    <div className="text-sm text-[#999]">"{searchQuery}" олдсонгүй</div>
                    <a href={`/shop?q=${encodeURIComponent(searchQuery)}`} className="text-xs text-[#FF6B00] font-semibold mt-2 inline-block no-underline hover:underline">Дэлгүүрээс хайх →</a>
                  </div>
                )}
                {!searching && searchResults.length > 0 && (
                  <>
                    {searchResults.map((p: any) => (
                      <a key={p.id} href={`/product/${p.id}`} className="flex items-center gap-3 px-4 py-2.5 hover:bg-[#F8F8F8] transition-colors no-underline border-b border-[#F3F4F6] last:border-0">
                        {p.thumbnail_url ? (
                          <img src={p.thumbnail_url} alt="" className="w-10 h-10 rounded-lg object-cover flex-shrink-0" />
                        ) : (
                          <div className="w-10 h-10 rounded-lg bg-[#F3F4F6] flex items-center justify-center text-lg flex-shrink-0">📦</div>
                        )}
                        <div className="flex-1 min-w-0">
                          <div className="text-[13px] font-medium text-[#333] truncate">{p.name}</div>
                          {p.category && <div className="text-[11px] text-[#999]">{p.category}</div>}
                        </div>
                        {p.base_price > 0 && <div className="text-[13px] font-bold text-[#FF6B00] flex-shrink-0">₮{Number(p.base_price).toLocaleString()}</div>}
                      </a>
                    ))}
                    <a href={`/shop?q=${encodeURIComponent(searchQuery)}`} className="block px-4 py-2.5 text-center text-xs font-semibold text-[#FF6B00] bg-[#FFF7ED] hover:bg-[#FFEDD5] transition-colors no-underline">
                      Бүгдийг харах ({searchResults.length} илэрц) →
                    </a>
                  </>
                )}
              </div>
            )}
          </div>}

          {/* ── Right: Language, Currency, Account, Wishlist, Cart ── */}
          <div className="flex items-center gap-5 flex-shrink-0">
            <select className="bg-transparent text-[13px] font-medium text-[#555] outline-none cursor-pointer" style={{ appearance: 'auto' }}>
              <option>🇲🇳 Монгол</option>
              <option>🇬🇧 English</option>
            </select>
            <select className="bg-transparent text-[13px] font-medium text-[#555] outline-none cursor-pointer" style={{ appearance: 'auto' }}>
              <option>₮ MNT</option>
              <option>$ USD</option>
            </select>

            {/* CTA Button (from CMS) */}
            {ctaText && (
              <a href={ctaUrl} className="px-4 py-2 bg-[#FF6B00] hover:bg-[#E55D00] text-white text-[12px] font-bold rounded-lg no-underline transition-colors">
                {ctaText}
              </a>
            )}

            {/* Account */}
            {showLogin && (user ? (
              <a href="/dashboard/customer" className="flex items-center gap-2 text-[#333] hover:text-[#FF6B00] transition-colors no-underline">
                <div className="w-7 h-7 rounded-full bg-[#FF6B00] text-white text-[11px] font-bold flex items-center justify-center">
                  {(user.full_name || user.name || user.email || '?')[0]?.toUpperCase()}
                </div>
                <span className="text-[13px] font-medium max-w-[80px] truncate">{user.full_name || user.name || 'Миний бүртгэл'}</span>
              </a>
            ) : (
              <a href="/login" className="flex items-center gap-2 text-[#333] hover:text-[#FF6B00] transition-colors no-underline">
                <UserIcon />
                <span className="text-[13px] font-medium">Нэвтрэх</span>
              </a>
            ))}

            {/* Wishlist */}
            <a href="/dashboard/customer/wishlist" className="relative text-[#333] hover:text-[#FF6B00] transition-colors">
              <HeartIcon />
              {mounted && wishlist.length > 0 && <span className="absolute -top-2 -right-2 min-w-[18px] h-[18px] bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center px-1">{wishlist.length}</span>}
            </a>

            {/* Cart */}
            <a href="/cart" className="relative text-[#333] hover:text-[#FF6B00] transition-colors">
              <CartIcon />
              {mounted && cartCount() > 0 && <span className="absolute -top-2 -right-2 min-w-[18px] h-[18px] bg-[#FF6B00] text-white text-[10px] font-bold rounded-full flex items-center justify-center px-1 animate-pulse">{cartCount()}</span>}
            </a>
          </div>
        </div>
      </div>

      {/* ═══════════════════════════════════════════════
         ROW 2 — NAV BAR: Categories button | Nav links
         ═══════════════════════════════════════════════ */}
      <nav className="bg-white border-b border-[#EBEBEB] sticky top-0 z-[200]">
        <div className="max-w-[1280px] mx-auto px-6 h-[50px] flex items-center">

          {/* ── Desktop: АНГИЛАЛ — 2 panel (categories | subcategories) ── */}
          <div
            className="relative hidden md:block mr-6"
            onMouseEnter={() => { setCatMenuOpen(true); setActiveCatIdx(0) }}
            onMouseLeave={() => setCatMenuOpen(false)}
          >
            <button
              className="flex items-center gap-2.5 h-[50px] text-[13px] font-bold text-[#111] uppercase tracking-wide bg-transparent border-none cursor-pointer hover:text-[#FF6B00] transition-colors"
            >
              <MenuIcon />
              <span>Ангилал</span>
              <ChevronDown />
            </button>
            {catMenuOpen && (() => {
              const cols = catGroups
              const activeCol = cols[activeCatIdx]
              return (
                <div className="absolute top-full left-0 bg-white border border-[#EBEBEB] rounded-b-xl shadow-xl z-[300] flex" style={{ minWidth: 520 }}>
                  {/* Left: Categories */}
                  <div className="w-[220px] border-r border-[#F0F0F0] py-2">
                    {cols.map((col: any, ci: number) => (
                      <div
                        key={ci}
                        onMouseEnter={() => setActiveCatIdx(ci)}
                        className={`flex items-center gap-3 px-5 py-3 cursor-pointer transition-colors ${activeCatIdx === ci ? 'bg-[#FFF5EF]' : 'hover:bg-[#F8F8F8]'}`}
                      >
                        <span className="text-lg">{col.icon}</span>
                        <span className={`text-[13px] font-semibold ${activeCatIdx === ci ? 'text-[#FF6B00]' : 'text-[#333]'}`}>{col.title}</span>
                        <ChevronRight />
                      </div>
                    ))}
                    <div className="border-t border-[#F0F0F0] mt-1 pt-1">
                      <a href="/shop" className="flex items-center gap-3 px-5 py-3 text-[13px] font-medium text-[#FF6B00] no-underline hover:bg-[#FFF5EF] transition-colors">
                        Бүгдийг харах →
                      </a>
                    </div>
                  </div>
                  {/* Right: Subcategories */}
                  <div className="flex-1 py-3 px-5">
                    {activeCol && (
                      <>
                        <div className="flex items-center gap-2 mb-3 pb-2" style={{ borderBottom: `2px solid ${(activeCol.color || '#FF6B00')}30` }}>
                          <span className="text-base">{activeCol.icon}</span>
                          <span className="text-[12px] font-bold uppercase tracking-widest" style={{ color: activeCol.color || '#FF6B00' }}>{activeCol.title}</span>
                        </div>
                        <div className="grid grid-cols-1 gap-0.5">
                          {Array.isArray(activeCol.items) && activeCol.items.map((item: any, ii: number) => (
                            <a key={ii} href={item.url || '#'} className="flex items-center gap-3 py-2.5 px-3 rounded-lg no-underline hover:bg-[#F8F8F8] transition-colors group">
                              <div>
                                <div className="text-[13px] font-medium text-[#333] group-hover:text-[#FF6B00]">{item.label}</div>
                                {item.desc && <div className="text-[11px] text-[#999] mt-0.5">{item.desc}</div>}
                              </div>
                            </a>
                          ))}
                        </div>
                      </>
                    )}
                  </div>
                </div>
              )
            })()}
          </div>

          {/* ── Divider ── */}
          <div className="hidden md:block w-px h-6 bg-[#EBEBEB] mr-4" />

          {/* ── Desktop nav links ── */}
          <div className="hidden md:flex items-center gap-0 flex-1 h-[50px]">
            {activeItems.map((item: any) => {
              const isActive = pathname === item.nav_url
              const hasDropdown = item.nav_type === 'MEGA' || item.nav_type === 'DROPDOWN'

              return (
                <div
                  key={item.id}
                  className="relative flex items-stretch h-[50px]"
                  onMouseEnter={() => hasDropdown ? handleMouseEnter(item.id) : undefined}
                  onMouseLeave={() => hasDropdown ? handleMouseLeave() : undefined}
                >
                  {hasDropdown ? (
                    <button
                      className={`px-4 h-[50px] bg-transparent border-none text-[14px] flex items-center gap-1.5 cursor-pointer transition-colors ${
                        isActive
                          ? 'text-[#FF6B00] font-semibold'
                          : 'text-[#333] hover:text-[#FF6B00] font-medium'
                      }`}
                    >
                      {item.nav_label}
                      <ChevronDown />
                    </button>
                  ) : (
                    <a
                      href={item.nav_url || '#'}
                      className={`px-4 h-[50px] flex items-center text-[14px] no-underline transition-colors ${
                        isActive
                          ? 'text-[#FF6B00] font-semibold'
                          : 'text-[#333] hover:text-[#FF6B00] font-medium'
                      }`}
                    >
                      {item.nav_label}
                    </a>
                  )}

                  {/* MEGA dropdown */}
                  {item.nav_type === 'MEGA' && openId === item.id && Array.isArray(item.columns) && (
                    <div
                      onMouseEnter={() => handleMouseEnter(item.id)}
                      onMouseLeave={handleMouseLeave}
                      className="fixed top-[122px] left-0 right-0 bg-white border-b border-[#EBEBEB] shadow-2xl z-[300] py-7"
                    >
                      <div className="max-w-[1280px] mx-auto px-8 grid gap-8" style={{ gridTemplateColumns: `repeat(${Math.min((item.columns?.length || 0) + (item.featured ? 1 : 0), 6)}, 1fr)` }}>
                        {item.columns.map((col: any, ci: number) => (
                          <div key={ci}>
                            <div className="flex items-center gap-2 mb-4 pb-2.5" style={{ borderBottom: `2px solid ${(col.color || '#FF6B00')}30` }}>
                              {col.icon && <span className="text-lg">{col.icon}</span>}
                              <span className="text-[11px] font-bold uppercase tracking-widest" style={{ color: col.color || '#FF6B00' }}>
                                {col.title}
                              </span>
                            </div>
                            {Array.isArray(col.items) && col.items.map((link: any, li: number) => (
                              <a key={li} href={link.url || link.link || '#'} className="group block py-2 no-underline hover:pl-1.5 transition-all">
                                <div className="text-[14px] font-medium text-[#333] group-hover:text-[#FF6B00] flex items-center gap-1.5">
                                  {link.label || link.name}
                                  {link.badge && (
                                    <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full ${
                                      link.badge === 'AI' ? 'bg-violet-100 text-violet-600' :
                                      link.badge === 'NEW' ? 'bg-emerald-100 text-emerald-600' :
                                      link.badge === 'HOT' ? 'bg-red-100 text-red-600' :
                                      'bg-gray-100 text-gray-600'
                                    }`}>{link.badge === 'AI' ? '⚡ AI' : link.badge}</span>
                                  )}
                                </div>
                                {(link.desc || link.description) && <div className="text-[12px] text-[#999] mt-0.5">{link.desc || link.description}</div>}
                              </a>
                            ))}
                          </div>
                        ))}
                        {item.featured && (
                          <div className="rounded-xl p-5 flex flex-col justify-between" style={{ background: item.featured.bg_color || '#1a1a1a' }}>
                            <div>
                              {item.featured.badge && (
                                <div className="text-[11px] text-[#FF6B00] font-bold uppercase tracking-widest mb-2">{item.featured.badge}</div>
                              )}
                              <div className="text-[16px] font-bold text-white leading-snug mb-2">{item.featured.title}</div>
                              <div className="text-[12px] text-gray-400 leading-relaxed">{item.featured.description}</div>
                            </div>
                            <a href={item.featured.cta_url || '/quote'} className="mt-4 block bg-[#FF6B00] text-white text-center py-2.5 rounded-lg no-underline text-[13px] font-bold hover:bg-[#E55D00] transition-colors">
                              {item.featured.cta_text || 'Дэлгэрэнгүй'}
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
                      className="absolute top-full left-0 bg-white border border-[#EBEBEB] rounded-xl shadow-xl z-[300] py-2 min-w-[200px] mt-0.5"
                    >
                      {item.columns.flatMap((col: any) => col.items || []).map((link: any, li: number) => (
                        <a key={li} href={link.url || '#'} className="block px-4 py-2.5 text-[14px] font-medium text-[#333] no-underline hover:bg-[#F8F8F8] hover:text-[#FF6B00] transition-colors">
                          {link.label}
                        </a>
                      ))}
                    </div>
                  )}
                </div>
              )
            })}
          </div>

          {/* ── Desktop right: 3 systems ── */}
          <div className="hidden md:flex items-center gap-1 ml-auto">
            {quickLinks.map((ql, i) => (
              <a key={i} href={ql.url} className="flex items-center gap-1.5 text-[12px] font-semibold px-3 py-1.5 rounded-lg text-[#555] no-underline transition-colors" style={{ ['--ql-color' as any]: ql.color || '#FF6B00' }} onMouseEnter={e => { e.currentTarget.style.background = (ql.color || '#FF6B00') + '12'; e.currentTarget.style.color = ql.color || '#FF6B00' }} onMouseLeave={e => { e.currentTarget.style.background = ''; e.currentTarget.style.color = '#555' }}>
                <span className="text-sm">{ql.icon}</span>
                <span>{ql.label}</span>
              </a>
            ))}
          </div>

          {/* ═══ MOBILE TOP BAR ═══ */}
          <div className="flex md:hidden items-center justify-between w-full">
            {/* Logo */}
            <a href="/" className="flex items-center gap-2 no-underline flex-shrink-0">
              {headerLogoUrl ? (
                <img src={headerLogoUrl} alt={siteName} className="h-8" />
              ) : (
                <>
                  <svg width="30" height="30" viewBox="0 0 48 48" fill="none">
                    <defs>
                      <linearGradient id="m-og" x1="0" y1="0" x2="48" y2="24" gradientUnits="userSpaceOnUse">
                        <stop stopColor="#FF6B00"/><stop offset="1" stopColor="#F59E0B"/>
                      </linearGradient>
                      <linearGradient id="m-pp" x1="0" y1="24" x2="48" y2="48" gradientUnits="userSpaceOnUse">
                        <stop stopColor="#8B5CF6"/><stop offset="1" stopColor="#6D28D9"/>
                      </linearGradient>
                    </defs>
                    <path d="M4 14C4 8.477 8.477 4 14 4h6c5.523 0 10 4.477 10 10v4c0 2.21-1.79 4-4 4H14c-5.523 0-10-4.477-10-10z" fill="url(#m-og)"/>
                    <path d="M30 8a10 10 0 0114 0 10 10 0 010 14c-2 2-6 2-8 0l-6-6a10 10 0 010-8z" fill="url(#m-og)" opacity="0.8"/>
                    <path d="M4 30c0-2.21 1.79-4 4-4h10c5.523 0 10 4.477 10 10v4c0 2.21-1.79 4-4 4H14c-5.523 0-10-4.477-10-10v-4z" fill="url(#m-pp)"/>
                    <path d="M30 30c0-2.21 1.79-4 4-4h4c2.21 0 4 1.79 4 4v4c0 5.523-4.477 10-10 10h-2c-2.21 0-4-1.79-4-4v-6c0-2.21 1.79-4 4-4z" fill="url(#m-pp)" opacity="0.8"/>
                  </svg>
                  <span className="text-[17px] font-extrabold text-[#111] tracking-tight">
                    <span className="text-[#FF6B00]">{siteName.substring(0, 3)}</span>{siteName.substring(3)}
                  </span>
                </>
              )}
            </a>

            {/* Mobile right icons */}
            <div className="flex items-center gap-2">
              <button onClick={() => setSearchOpen(!searchOpen)} className="w-9 h-9 rounded-lg bg-[#F8F8F8] flex items-center justify-center text-[#555] border-none cursor-pointer">
                <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/></svg>
              </button>
              <a href="/cart" className="relative w-9 h-9 rounded-lg bg-[#F8F8F8] flex items-center justify-center text-[#555]">
                <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/><path d="M16 10a4 4 0 01-8 0"/></svg>
                {mounted && cartCount() > 0 && <span className="absolute -top-1 -right-1 w-4 h-4 bg-[#FF6B00] text-white text-[9px] font-bold rounded-full flex items-center justify-center">{cartCount()}</span>}
              </a>
              <button
                onClick={() => setMobileOpen(!mobileOpen)}
                className="w-9 h-9 rounded-lg flex items-center justify-center text-[#111] bg-transparent border-none cursor-pointer"
              >
                {mobileOpen ? <CloseIcon /> : <MenuIcon />}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile search bar */}
        {searchOpen && (
          <div className="md:hidden border-t border-[#EBEBEB] px-4 py-3 bg-white">
            <div className="flex items-stretch h-[40px] border border-[#EBEBEB] rounded-lg overflow-hidden focus-within:border-[#FF6B00] transition-colors">
              <input
                type="text"
                placeholder="Бүтээгдэхүүн хайх..."
                className="flex-1 bg-white text-[14px] text-[#111] px-4 outline-none placeholder:text-[#BBB]"
                autoFocus
              />
              <button className="bg-[#FF6B00] text-white px-4 border-none">
                <SearchIcon />
              </button>
            </div>
          </div>
        )}
      </nav>

      {/* ═══ MOBILE MENU OVERLAY ═══ */}
      {mobileOpen && (
        <div className="fixed top-[50px] left-0 right-0 bottom-0 bg-white z-[190] overflow-y-auto md:hidden">
          <div className="p-5">
            {/* User actions */}
            <div className="flex gap-3 mb-5 pb-5 border-b border-[#EBEBEB]">
              <a href="/login" className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl border border-[#EBEBEB] text-[14px] font-medium text-[#333] no-underline hover:border-[#FF6B00] transition-colors">
                <UserIcon /> Нэвтрэх
              </a>
              <a href="/dashboard/customer/wishlist" className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl border border-[#EBEBEB] text-[14px] font-medium text-[#333] no-underline hover:border-[#FF6B00] transition-colors">
                <HeartIcon /> Хадгалсан
              </a>
            </div>

            {/* Nav links */}
            <div className="flex flex-col gap-0.5 mb-6">
              {activeItems.map((item: any) => {
                const hasChildren = (item.nav_type === 'MEGA' || item.nav_type === 'DROPDOWN') && Array.isArray(item.columns)
                const isOpen = mobileAccordion === item.id
                const isActivePath = pathname === item.nav_url

                if (!hasChildren) {
                  return (
                    <a key={item.id} href={item.nav_url || '#'} onClick={() => setMobileOpen(false)}
                      className={`flex items-center justify-between px-4 py-3.5 rounded-xl text-[15px] font-medium no-underline transition-colors ${isActivePath ? 'text-[#FF6B00] bg-[#FFF3EB]' : 'text-[#111]'}`}>
                      {item.nav_label}
                      <ChevronRight />
                    </a>
                  )
                }

                return (
                  <div key={item.id}>
                    <button onClick={() => toggleMobileAccordion(item.id)}
                      className="w-full flex items-center justify-between px-4 py-3.5 rounded-xl text-[15px] font-medium text-[#111] bg-transparent border-none cursor-pointer text-left">
                      {item.nav_label}
                      <svg width="16" height="16" fill="none" stroke="#999" strokeWidth="2" viewBox="0 0 24 24"
                        className={`transition-transform duration-200 ${isOpen ? 'rotate-90' : ''}`}>
                        <path d="M9 18l6-6-6-6"/>
                      </svg>
                    </button>
                    {isOpen && (
                      <div className="pl-4 pb-2">
                        {item.nav_type === 'MEGA' ? (
                          item.columns.map((col: any, ci: number) => (
                            <div key={ci} className="mb-3">
                              <div className="flex items-center gap-1.5 px-4 py-1.5 text-[11px] font-bold uppercase tracking-widest" style={{ color: col.color || '#FF6B00' }}>
                                {col.icon && <span>{col.icon}</span>}
                                {col.title}
                              </div>
                              {(col.items || []).map((link: any, li: number) => (
                                <a key={li} href={link.url || '#'} onClick={() => setMobileOpen(false)}
                                  className="block px-4 py-2.5 text-[14px] text-[#333] no-underline hover:text-[#FF6B00]">
                                  {link.label}
                                </a>
                              ))}
                            </div>
                          ))
                        ) : (
                          item.columns.flatMap((col: any) => col.items || []).map((link: any, li: number) => (
                            <a key={li} href={link.url || '#'} onClick={() => setMobileOpen(false)}
                              className="block px-4 py-2.5 text-[14px] text-[#333] no-underline hover:text-[#FF6B00]">
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

            {/* Quick categories */}
            <div className="border-t border-[#EBEBEB] pt-4 mb-4">
              <div className="text-[11px] font-bold text-[#999] uppercase tracking-widest mb-3 px-1">Ангилал</div>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { label: 'Нэрийн хуудас', url: '/shop?cat=business-card', icon: '🪪' },
                  { label: 'Флаер & Постер', url: '/shop?cat=flyer', icon: '📄' },
                  { label: 'Стикер', url: '/shop?cat=sticker', icon: '🏷️' },
                  { label: 'Баннер', url: '/shop?cat=banner', icon: '🪧' },
                  { label: 'Ном & Каталог', url: '/shop?cat=book', icon: '📗' },
                  { label: 'Загвар сан', url: '/templates', icon: '🎨' },
                ].map(c => (
                  <a key={c.label} href={c.url} onClick={() => setMobileOpen(false)}
                    className="flex items-center gap-2 px-3 py-2.5 rounded-lg border border-[#EBEBEB] text-[13px] text-[#333] no-underline hover:border-[#FF6B00] transition-colors">
                    <span>{c.icon}</span> {c.label}
                  </a>
                ))}
              </div>
            </div>

            {/* Phone */}
            <a href={`tel:${phone}`} className="flex items-center gap-2 px-4 py-3 text-[14px] font-bold text-[#111] no-underline">
              <span className="text-[#FF6B00]"><PhoneIcon /></span> {phone}
            </a>
          </div>
        </div>
      )}
    </>
  )
}
