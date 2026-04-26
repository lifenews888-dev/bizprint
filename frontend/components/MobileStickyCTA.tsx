'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

/**
 * Mobile-only sticky bottom CTA bar.
 * Hides automatically on dashboard/admin/auth routes where it would be intrusive.
 */
const HIDE_ON = [
  '/admin', '/dashboard', '/login', '/register', '/forgot-password',
  '/reset-password', '/checkout', '/design/editor', '/creator', '/designer',
  '/courier', '/sales', '/factory', '/mobile',
]

export default function MobileStickyCTA() {
  const pathname = usePathname() || '/'
  const hide = HIDE_ON.some(p => pathname === p || pathname.startsWith(p + '/'))
  if (hide) return null

  return (
    <div
      aria-label="Хурдан холбоо барих"
      className="md:hidden fixed left-0 right-0 bottom-0 z-[60]"
      style={{
        paddingBottom: 'env(safe-area-inset-bottom, 0px)',
        background: 'rgba(10,10,10,0.92)',
        backdropFilter: 'blur(16px)',
        borderTop: '1px solid rgba(255,255,255,0.08)',
      }}
    >
      <div className="grid grid-cols-3 gap-1 p-2">
        <a
          href="tel:72000444"
          aria-label="72000444 руу залгах"
          className="flex flex-col items-center justify-center gap-0.5 py-2.5 rounded-lg bg-[#FF6B00] text-white text-[11px] font-bold no-underline active:scale-95 transition-transform"
        >
          <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24" aria-hidden="true">
            <path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07 19.5 19.5 0 01-6-6 19.79 19.79 0 01-3.07-8.67A2 2 0 014.11 2h3a2 2 0 012 1.72 12.84 12.84 0 00.7 2.81 2 2 0 01-.45 2.11L8.09 9.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45 12.84 12.84 0 002.81.7A2 2 0 0122 16.92z" />
          </svg>
          <span>Залгах</span>
        </a>
        <Link
          href="/quick-order"
          aria-label="Чатаар захиалга өгөх"
          className="flex flex-col items-center justify-center gap-0.5 py-2.5 rounded-lg bg-white/10 border border-white/10 text-white text-[11px] font-semibold no-underline active:scale-95 transition-transform"
        >
          <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" aria-hidden="true">
            <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" />
          </svg>
          <span>Чатаар</span>
        </Link>
        <Link
          href="/quote"
          aria-label="Үнийн санал авах"
          className="flex flex-col items-center justify-center gap-0.5 py-2.5 rounded-lg bg-white/10 border border-white/10 text-white text-[11px] font-semibold no-underline active:scale-95 transition-transform"
        >
          <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" aria-hidden="true">
            <path d="M9 11l3 3L22 4M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11" />
          </svg>
          <span>Үнэ авах</span>
        </Link>
      </div>
    </div>
  )
}
