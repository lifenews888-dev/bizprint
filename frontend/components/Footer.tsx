'use client'

import { useSiteSettings } from '@/contexts/SiteSettingsContext'

/* ─── Social SVG Icons ─── */
const SOCIAL_ICONS: Record<string, () => React.ReactElement> = {
  facebook: () => <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>,
  instagram: () => <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/></svg>,
  youtube: () => <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/></svg>,
  tiktok: () => <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-2.88 2.5 2.89 2.89 0 01-2.89-2.89 2.89 2.89 0 012.89-2.89c.28 0 .54.04.79.11V9a6.33 6.33 0 00-.79-.05A6.34 6.34 0 003.15 15.3a6.34 6.34 0 006.34 6.34 6.34 6.34 0 006.34-6.34V9.06a8.24 8.24 0 004.77 1.52V7.17a4.85 4.85 0 01-1.01-.48z"/></svg>,
  twitter: () => <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>,
  linkedin: () => <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/></svg>,
  pinterest: () => <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M12.017 0C5.396 0 .029 5.367.029 11.987c0 5.079 3.158 9.417 7.618 11.162-.105-.949-.199-2.403.041-3.439.219-.937 1.406-5.957 1.406-5.957s-.359-.72-.359-1.781c0-1.668.967-2.914 2.171-2.914 1.023 0 1.518.769 1.518 1.69 0 1.029-.655 2.568-.994 3.995-.283 1.194.599 2.169 1.777 2.169 2.133 0 3.772-2.249 3.772-5.495 0-2.873-2.064-4.882-5.012-4.882-3.414 0-5.418 2.561-5.418 5.207 0 1.031.397 2.138.893 2.738a.36.36 0 01.083.345l-.333 1.36c-.053.22-.174.267-.402.161-1.499-.698-2.436-2.889-2.436-4.649 0-3.785 2.75-7.262 7.929-7.262 4.163 0 7.398 2.967 7.398 6.931 0 4.136-2.607 7.464-6.227 7.464-1.216 0-2.359-.631-2.75-1.378l-.748 2.853c-.271 1.043-1.002 2.35-1.492 3.146C9.57 23.812 10.763 24 12.017 24c6.624 0 11.99-5.367 11.99-11.988C24.007 5.367 18.641.001 12.017.001z"/></svg>,
}

const SOCIAL_LABELS: Record<string, string> = {
  facebook: 'Facebook', instagram: 'Instagram', youtube: 'YouTube',
  tiktok: 'TikTok', twitter: 'X (Twitter)', linkedin: 'LinkedIn', pinterest: 'Pinterest',
}

/* ─── Other Icons ─── */
const PhoneIcon = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07A19.5 19.5 0 013.07 9.61 19.79 19.79 0 01.02 1 2 2 0 012 0h3a2 2 0 012 1.72c.127.96.361 1.903.7 2.81a2 2 0 01-.45 2.11L6.91 7.91a16 16 0 006.18 6.18l1.27-1.27a2 2 0 012.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0122 15v1.92z"/></svg>
const EmailIcon = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>
const MapPinIcon = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z"/><circle cx="12" cy="10" r="3"/></svg>
const ArrowRightIcon = () => <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
const HelpIcon = () => <svg width="28" height="28" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 015.83 1c0 2-3 3-3 3"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
const FeedbackIcon = () => <svg width="28" height="28" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24"><path d="M14 9V5a3 3 0 0 0-3-3l-4 9v11h11.28a2 2 0 0 0 2-1.7l1.38-9a2 2 0 0 0-2-2.3zM7 22H4a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2h3"/></svg>

/* ─── Fallback columns ─── */
const FALLBACK_COLUMNS = [
  { title: 'ҮЙЛЧИЛГЭЭ', links: [{ label: 'Нэрийн хуудас', url: '/shop?cat=business-card' }, { label: 'Стикер', url: '/shop?cat=sticker' }, { label: 'Баннер', url: '/shop?cat=banner' }, { label: 'B2B харилцагч', url: '/b2b' }] },
  { title: 'КОМПАНИ', links: [{ label: 'Бидний тухай', url: '/page/about' }, { label: 'Холбоо барих', url: '/contact' }] },
  { title: 'ТУСЛАМЖ', links: [{ label: 'FAQ', url: '/faq' }, { label: 'Хүргэлт', url: '/delivery' }, { label: 'Захиалга хянах', url: '/track' }] },
]

/* ─── Payment Icons ─── */
const PaymentIcon = ({ label, color }: { label: string; color: string }) => (
  <div className="w-12 h-8 bg-white rounded border border-gray-200 flex items-center justify-center px-1">
    <span className="text-[9px] font-bold" style={{ color }}>{label}</span>
  </div>
)
const VisaIcon = () => <div className="w-12 h-8 bg-white rounded border border-gray-200 flex items-center justify-center"><svg width="30" height="10" viewBox="0 0 50 16" fill="#1A1F71"><path d="M19.13 15.16h-3.95l2.47-15.16h3.95l-2.47 15.16zm16.45-14.79c-.78-.31-2.01-.64-3.54-.64-3.91 0-6.66 2.08-6.68 5.06-.03 2.2 1.97 3.43 3.47 4.16 1.54.75 2.06 1.23 2.06 1.9-.01 1.03-1.23 1.5-2.37 1.5-1.59 0-2.43-.23-3.73-.8l-.51-.24-.56 3.44c.93.43 2.64.8 4.42.82 4.15 0 6.85-2.05 6.88-5.24.01-1.74-1.04-3.07-3.33-4.16-1.39-.71-2.24-1.18-2.23-1.9 0-.64.72-1.32 2.27-1.32 1.3-.02 2.24.28 2.97.59l.36.18.54-3.35zM43.89.37l-3.06 0c-.95 0-1.66.27-2.07 1.27l-5.88 14.05h4.15s.68-1.89.83-2.3h5.07c.12.54.48 2.3.48 2.3h3.67L43.89.37zm-4.88 9.79c.33-.89 1.58-4.31 1.58-4.31-.02.04.33-.89.53-1.47l.27 1.33s.76 3.66.92 4.44h-3.3zM14.69.37L10.8 10.38l-.42-2.11C9.56 5.47 6.96 2.5 4.07 1.02l3.54 13.35h4.18L18.88.37h-4.19z"/><path d="M7.35.37H.97L.92.68c4.93 1.26 8.19 4.3 9.54 7.96L9.06 1.66C8.83.7 8.18.39 7.35.37z" fill="#F7A600"/></svg></div>
const MastercardIcon = () => <div className="w-12 h-8 bg-white rounded border border-gray-200 flex items-center justify-center"><svg width="28" height="18" viewBox="0 0 36 24"><circle cx="12" cy="12" r="10" fill="#EB001B"/><circle cx="24" cy="12" r="10" fill="#F79E1B"/><path d="M18 4.4a10 10 0 0 0-3.8 7.6A10 10 0 0 0 18 19.6a10 10 0 0 0 3.8-7.6A10 10 0 0 0 18 4.4z" fill="#FF5F00"/></svg></div>

export default function Footer() {
  const { settings } = useSiteSettings()

  const siteName    = settings.site_name         || 'BizPrint'
  const description = settings.footer_description || 'BizPrint — Хэвлэлийн үйлчилгээний платформ'
  const copyright   = settings.footer_copyright   || '© 2026 BizPrint. Бүх эрх хуулиар хамгаалагдсан.'
  const location    = settings.footer_location     || 'Улаанбаатар, Монгол'
  const phone       = settings.site_phone          || '7711-8899'
  const email       = settings.site_email          || 'info@bizprint.mn'

  const rawColumns = settings.footer_columns
  const columns: any[] = Array.isArray(rawColumns) && rawColumns.length > 0 ? rawColumns : FALLBACK_COLUMNS

  const showSocial   = settings.footer_show_social !== false && settings.footer_show_social !== 'false'
  const showLocation = settings.footer_show_location !== false && settings.footer_show_location !== 'false'

  // Build social links from all CMS settings (dynamic — any platform admin adds will show)
  const socialLinks = [
    { platform: 'facebook',  url: settings.site_facebook },
    { platform: 'twitter',   url: settings.site_twitter },
    { platform: 'instagram', url: settings.site_instagram },
    { platform: 'linkedin',  url: settings.site_linkedin },
    { platform: 'tiktok',    url: settings.site_tiktok },
    { platform: 'youtube',   url: settings.site_youtube },
    { platform: 'pinterest', url: settings.site_pinterest },
  ].filter(s => s.url && s.url !== '' && s.url !== '#')

  // Help cards — from CMS or fallback
  const helpCards = (() => {
    try {
      const raw = settings.footer_help_cards
      const parsed = typeof raw === 'string' ? JSON.parse(raw) : raw
      if (Array.isArray(parsed) && parsed.length > 0) return parsed
    } catch {}
    return [
      { title: 'Хайж байгаа зүйлээ олсонгүй?', cta: 'Холбоо барих', url: '/contact', icon: 'phone' },
      { title: 'Тусламж хэрэгтэй юу?', cta: 'Тусламжийн төв', url: '/faq', icon: 'help' },
      { title: 'Санал хүсэлт илгээх', cta: 'Санал өгөх', url: '/contact', icon: 'feedback' },
    ]
  })()

  // Payment methods — from CMS or default
  const paymentMethods = (() => {
    try {
      const raw = settings.footer_payments
      const parsed = typeof raw === 'string' ? JSON.parse(raw) : raw
      if (Array.isArray(parsed) && parsed.length > 0) return parsed
    } catch {}
    return ['visa', 'mastercard', 'qpay', 'socialpay', 'monpay']
  })()

  const PAYMENT_MAP: Record<string, () => React.ReactElement> = {
    visa: VisaIcon,
    mastercard: MastercardIcon,
    qpay: () => <PaymentIcon label="QPay" color="#00B140" />,
    socialpay: () => <PaymentIcon label="Social Pay" color="#3B82F6" />,
    monpay: () => <PaymentIcon label="MonPay" color="#FF6B00" />,
  }

  const HELP_ICONS: Record<string, () => React.ReactElement> = {
    phone: PhoneIcon,
    help: HelpIcon,
    feedback: FeedbackIcon,
  }

  return (
    <footer className="bg-[#1E1033] text-white">
      <div className="max-w-[1200px] mx-auto px-5 pt-14 pb-8">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-[280px_repeat(3,1fr)_280px] gap-10 mb-12">

          {/* Brand column */}
          <div>
            <a href="/" className="inline-block mb-4 no-underline">
              {settings.footer_logo_url ? (
                <img src={settings.footer_logo_url} alt={siteName} className="h-8" />
              ) : (
                <span className="text-xl font-extrabold text-white tracking-tight">
                  <span className="text-[#FF6B00]">{siteName.substring(0, 3)}</span>{siteName.substring(3)}
                </span>
              )}
            </a>
            <p className="text-sm text-gray-400 leading-relaxed mb-5">{description}</p>

            <div className="flex flex-col gap-2.5 mb-5">
              {showLocation && location && (
                <span className="flex items-center gap-2 text-sm text-gray-400">
                  <span className="text-[#FF6B00]"><MapPinIcon /></span>{location}
                </span>
              )}
              <a href={`mailto:${email}`} className="flex items-center gap-2 text-sm text-gray-400 no-underline hover:text-white transition-colors">
                <span className="text-[#FF6B00]"><EmailIcon /></span>{email}
              </a>
            </div>

            <a href={`tel:${phone}`} className="flex items-center gap-2 text-lg font-bold text-white no-underline hover:text-[#FF6B00] transition-colors">
              <PhoneIcon />{phone}
            </a>
          </div>

          {/* Dynamic columns */}
          {columns.map((col: any, idx: number) => (
            <div key={idx}>
              <h4 className="text-xs font-bold text-white uppercase tracking-widest mb-5">{col.title}</h4>
              <div className="flex flex-col gap-3">
                {Array.isArray(col.links) && col.links.map((link: any, li: number) => (
                  <a key={li} href={link.url || '#'} className="text-sm text-gray-400 no-underline hover:text-white transition-colors">{link.label}</a>
                ))}
              </div>
            </div>
          ))}

          {/* Newsletter + Social */}
          <div>
            <h4 className="text-base font-bold text-white mb-2">Мэдээлэл авах</h4>
            <p className="text-sm text-gray-400 mb-4">Шинэ бүтээгдэхүүн, хямдралын мэдээлэл авах</p>
            <form onSubmit={e => e.preventDefault()} className="flex items-center bg-[#2D1F4E] rounded-xl overflow-hidden border border-[#3D2A60] focus-within:border-[#FF6B00] transition-colors">
              <input type="email" placeholder="И-мэйл хаяг..." className="flex-1 bg-transparent text-sm text-white px-4 py-3 outline-none placeholder:text-gray-500" />
              <button type="submit" className="bg-transparent text-[#FF6B00] hover:text-white px-4 py-3 transition-colors border-none cursor-pointer"><ArrowRightIcon /></button>
            </form>

            {/* Social icons — all from CMS */}
            {showSocial && socialLinks.length > 0 && (
              <div className="flex gap-2.5 mt-5">
                {socialLinks.map(s => {
                  const IconComp = SOCIAL_ICONS[s.platform]
                  if (!IconComp) return null
                  return (
                    <a key={s.platform} href={s.url} target="_blank" rel="noopener noreferrer"
                      aria-label={SOCIAL_LABELS[s.platform] || s.platform}
                      title={SOCIAL_LABELS[s.platform] || s.platform}
                      className="w-9 h-9 rounded-lg bg-[#2D1F4E] border border-[#3D2A60] flex items-center justify-center text-gray-400 no-underline transition-all duration-200 hover:text-white hover:border-gray-500"
                    >
                      <IconComp />
                    </a>
                  )
                })}
              </div>
            )}
          </div>
        </div>

        {/* Help section */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-10">
          {helpCards.map((card: any, i: number) => {
            const IconComp = HELP_ICONS[card.icon] || PhoneIcon
            return (
              <a key={i} href={card.url || '#'} className="flex items-center gap-4 bg-[#2D1F4E] rounded-xl p-5 no-underline group hover:bg-[#3D2A60] transition-colors">
                <span className="text-gray-400"><IconComp /></span>
                <div>
                  <div className="text-sm font-bold text-white">{card.title}</div>
                  <span className="text-xs text-[#FF6B00] underline">{card.cta}</span>
                </div>
              </a>
            )
          })}
        </div>

        {/* Bottom bar */}
        <div className="border-t border-[#2D1F4E] pt-6 flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-xs text-gray-500 m-0">{copyright}</p>
          <div className="flex items-center gap-2">
            {paymentMethods.map((method: string) => {
              const IconComp = PAYMENT_MAP[method]
              return IconComp ? <span key={method}><IconComp /></span> : null
            })}
          </div>
        </div>
      </div>
    </footer>
  )
}
