'use client'

import { createContext, useContext, useEffect, useState, useCallback, ReactNode } from 'react'
import { useRealtime } from './RealtimeContext'

const API = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000'

interface SettingsMap extends Record<string, unknown> {
  maintenance_mode?: boolean | string
  site_name?: string
  site_logo_url?: string
  site_phone?: string
  site_email?: string
  site_facebook?: string
  site_twitter?: string
  site_instagram?: string
  site_linkedin?: string
  site_tiktok?: string
  site_youtube?: string
  site_pinterest?: string
  site_primary_color?: string
  header_logo_url?: string
  header_show_search?: boolean | string
  header_show_login?: boolean | string
  header_cta_text?: string
  header_cta_url?: string
  header_announcement?: string
  header_announcement_active?: boolean | string
  header_announcement_color?: string
  footer_logo_url?: string
  footer_description?: string
  footer_copyright?: string
  footer_location?: string
  footer_columns?: unknown
  footer_show_social?: boolean | string
  footer_show_location?: boolean | string
  footer_help_cards?: unknown
  footer_payments?: unknown
  chatbot_embed_code?: string
  header_quick_links?: unknown
  hero_title?: string
  hero_subtitle?: string
  hero_cta_primary_text?: string
  hero_cta_primary_url?: string
  hero_cta_secondary_text?: string
  hero_cta_secondary_url?: string
  qr_price_yearly: number
}

export interface MegaMenuLink {
  label?: string
  url?: string
  desc?: string
  name?: string
  link?: string
  description?: string
  badge?: string
  [key: string]: unknown
}

export interface MegaMenuCategory {
  items?: MegaMenuLink[]
  [key: string]: unknown
}

export interface MegaMenuColumn {
  title?: string
  icon?: string
  color?: string
  items?: MegaMenuLink[]
  categories?: MegaMenuCategory[]
  [key: string]: unknown
}

export interface MegaMenuFeatured {
  badge?: string
  title?: string
  description?: string
  cta_text?: string
  cta_url?: string
  bg_color?: string
  [key: string]: unknown
}

export interface MegaMenuItem {
  id?: string
  nav_label?: string
  nav_url?: string
  nav_type?: string
  is_active?: boolean
  sort_order?: number
  columns?: MegaMenuColumn[] | null
  featured?: MegaMenuFeatured | null
  [key: string]: unknown
}

export interface MegaMenuPromo {
  is_ai?: boolean
  title?: string
  description?: string
  cta_text?: string
  link?: string
  bg_color?: string
  [key: string]: unknown
}

export interface MegaMenuV2Data {
  columns: MegaMenuColumn[]
  promos: MegaMenuPromo[]
}

const isRecord = (value: unknown): value is Record<string, unknown> =>
  value !== null && typeof value === 'object' && !Array.isArray(value)

const stringValue = (value: unknown, fallback = ''): string =>
  typeof value === 'string' ? value : fallback

const toMegaMenuItems = (value: unknown): MegaMenuItem[] =>
  Array.isArray(value) ? value.filter(isRecord).map(item => item as MegaMenuItem) : []

const toMegaMenuV2 = (value: unknown): MegaMenuV2Data | null => {
  if (!isRecord(value)) return null
  const columns = Array.isArray(value.columns)
    ? value.columns.filter(isRecord).map(column => column as MegaMenuColumn)
    : []
  const promos = Array.isArray(value.promos)
    ? value.promos.filter(isRecord).map(promo => promo as MegaMenuPromo)
    : []
  return { columns, promos }
}

// Default settings fallback
const DEFAULT_SETTINGS: SettingsMap = {
  // site
  site_name: 'BizPrint',
  site_logo_url: '',
  site_phone: '+976 7711-7700',
  site_email: 'info@bizprint.mn',
  site_address: 'Улаанбаатар, Монгол',
  site_facebook: 'https://facebook.com/bizprint.mn',
  site_instagram: 'https://instagram.com/bizprint.mn',
  site_youtube: 'https://youtube.com/@bizprint',
  site_primary_color: '#FF6B00',
  qr_price_yearly: 49000,
  // header
  header_logo_url: '',
  header_show_search: true,
  header_show_login: true,
  header_cta_text: 'Үнэ авах →',
  header_cta_url: '/quote',
  header_announcement: '',
  header_announcement_active: false,
  header_announcement_color: '#FF6B35',
  // footer
  footer_logo_url: '',
  footer_description: 'Хэвлэлийн салбарын бүх оролцогчдыг нэгтгэсэн экосистем.',
  footer_copyright: '© 2026 BizPrint. Бүх эрх хуулиар хамгаалагдсан.',
  footer_location: 'Улаанбаатар, Монгол',
  footer_columns: [
    { title: 'БҮТЭЭГДЭХҮҮН', links: [{label:'Нэрийн хуудас',url:'/shop/category/business-card'},{label:'Флаер',url:'/shop/category/flyer'},{label:'Баннер',url:'/shop/category/banner'},{label:'Стикер',url:'/shop/category/sticker'},{label:'Бүх бүтээгдэхүүн',url:'/shop'}]},
    { title: 'ҮЙЛЧИЛГЭЭ', links: [{label:'Үнэ тооцоолох',url:'/quote'},{label:'Захиалга өгөх',url:'/orders/new'},{label:'Creator Marketplace',url:'/marketplace'}]},
    { title: 'КОМПАНИ', links: [{label:'Бидний тухай',url:'/about'},{label:'Холбоо барих',url:'/contact'},{label:'FAQ',url:'/faq'}]},
  ],
  footer_show_social: true,
  footer_show_location: true,
  // homepage
  hero_title: 'Хэвлэлийн үйлчилгээ — хурдан, хямд, найдвартай',
  hero_subtitle: 'AI-тай үнэ тооцоолол. 1 секундэд үнэ мэдэх.',
  hero_cta_primary_text: 'Үнэ авах',
  hero_cta_primary_url: '/quote',
  hero_cta_secondary_text: 'Дэлгүүр',
  hero_cta_secondary_url: '/shop',
  hero_background_type: 'color',
  hero_background_value: '#0F0F0F',
  features_title: 'Яагаад BizPrint вэ?',
  features_active: true,
  features_items: [
    {icon:'⚡',title:'1 секундэд үнэ',desc:'AI системтэй үнэ тооцоолол'},
    {icon:'🏭',title:'Олон үйлдвэр',desc:'Монголын шилдэг үйлдвэрүүдтэй'},
    {icon:'🚚',title:'Хурдан хүргэлт',desc:'Хотын дотор 24-48 цагт'},
    {icon:'💯',title:'Чанарын баталгаа',desc:'100% чанарын баталгаатай'},
  ],
  stats_active: true,
  stats_items: [
    {value:'500+',label:'Идэвхтэй хэрэглэгч'},
    {value:'50+',label:'Үйлдвэрлэгч түнш'},
    {value:'10,000+',label:'Дууссан захиалга'},
    {value:'99%',label:'Хэрэглэгчийн сэтгэл ханамж'},
  ],
  cta_section_active: true,
  cta_title: 'Өнөөдөр эхэл',
  cta_subtitle: 'Үнэгүй бүртгүүлж, хэдхэн минутанд үнэ аваарай',
  cta_button_text: 'Үнийн санал авах',
  cta_button_url: '/quote',
  features_subtitle: 'Хэвлэлийн салбарын бүх оролцогчдыг нэгтгэсэн иж бүрэн экосистем',
  // social design
  social_design_active: true,
  social_design_title: 'Сошиал медиа дизайн үйлчилгээ',
  social_design_subtitle: 'Facebook, Instagram постер, story, reels cover — мэргэжлийн дизайнер таны брэндэд тохирсон контент бэлтгэнэ.',
  social_design_items: [
    { label: 'FB/IG Постер', price: '15,000₮~', color: '#FF6B00', icon: '📱' },
    { label: 'Story дизайн', price: '10,000₮~', color: '#8B5CF6', icon: '📸' },
    { label: 'Нэрийн хуудас', price: '25,000₮~', color: '#10B981', icon: '💼' },
    { label: 'Сарын багц', price: '200,000₮~', color: '#3B82F6', icon: '📅' },
  ],
  // combo
  combo_active: true,
  combo_title: 'Print + Social Combo',
  combo_subtitle: 'Хэвлэл + сошиал дизайныг хамт захиалвал 15-20% хямд',
  combo_items: [
    { title: 'Starter combo', items: ['Нэрийн хуудас 100ш хэвлэл', 'FB/IG постер 1ш', 'Story дизайн 1ш'], price: '45,000', save: '12,000', color: '#FF6B00' },
    { title: 'Business combo', items: ['Нэрийн хуудас + Флаер хэвлэл', 'Social media постер 5ш', 'Story + Reels cover 3ш', 'Brand guideline'], price: '180,000', save: '55,000', color: '#8B5CF6', popular: true },
    { title: 'Monthly Pro', items: ['Сар бүрийн 20 пост дизайн', 'Story 10ш / Reels cover 5ш', 'Content calendar', 'Хэвлэл 20% хямдрал'], price: '350,000', save: '100,000+', color: '#10B981' },
  ],
  // how it works
  how_it_works_active: true,
  how_it_works_title: 'Хэрхэн ажилладаг вэ?',
  how_it_works_steps: [
    { step: '01', title: 'Үйлчилгээ сонгох', desc: 'Постер, story, нэрийн хуудас эсвэл combo багц', color: '#FF6B00' },
    { step: '02', title: 'Мэдээлэл өгөх', desc: 'Лого, текст, зураг, brand color-оо оруулна', color: '#8B5CF6' },
    { step: '03', title: 'Дизайнер ажиллана', desc: 'Мэргэжлийн дизайнер 24 цагт бэлтгэнэ', color: '#3B82F6' },
    { step: '04', title: 'Хүлээн авах', desc: 'Файл татах + хэвлэл захиалах боломж', color: '#10B981' },
  ],
}

const DEFAULT_MEGA_MENU: MegaMenuItem[] = [
  {
    id: '1', nav_label: 'Бүтээгдэхүүн', nav_url: '/shop', nav_type: 'MEGA', is_active: true, sort_order: 1,
    columns: [
      { title: 'ОФСЕТ ХЭВЛЭЛ', icon: '🖨️', color: '#378ADD', items: [{label:'Визит карт',url:'/shop?cat=business-card',desc:'90×50мм, 250-400gsm'},{label:'Флаер',url:'/shop?cat=flyer',desc:'A4, A5, A6'},{label:'Брошур',url:'/shop?cat=brochure',desc:'Гурвалсан нугалалт'},{label:'Каталог',url:'/shop?cat=catalog',desc:'8-100+ хуудас'},{label:'Ном',url:'/shop?cat=book',desc:'Хавтас, дотор хуудас'}]},
      { title: 'ДИЖИТАЛ ХЭВЛЭЛ', icon: '🏷️', color: '#22c55e', items: [{label:'Стикер',url:'/shop?cat=sticker',desc:'Өнгөт наалт'},{label:'Наалт/Label',url:'/shop?cat=label',desc:'Бүтээгдэхүүний шошго'},{label:'DTF хэвлэл',url:'/shop?cat=dtf',desc:'Даавуун хэвлэл'}]},
      { title: 'ӨРГӨН ФОРМАТ', icon: '🪧', color: '#eab308', items: [{label:'Баннер',url:'/shop?cat=banner',desc:'Гадна/дотор баннер'},{label:'Роллап',url:'/shop?cat=rollup',desc:'Зөөврийн стенд'},{label:'Хаяг/Үсэг',url:'/shop?cat=signage',desc:'3D, LED, нерж'}]},
      { title: 'ПРОМО', icon: '👕', color: '#a855f7', items: [{label:'Цамц хэвлэл',url:'/shop?cat=tshirt',desc:'DTF, Screen print'},{label:'Бусад промо',url:'/shop?cat=promo',desc:'Аяга, дэвтэр, бал'}]},
    ],
    featured: { badge: 'ШИНЭ', title: 'AI Үнийн Тооцоолуур', description: 'Секундэд үнэ тооцоолоорой', cta_text: 'Тооцоолох →', cta_url: '/quote?tab=ai', bg_color: '#1a1a1a' },
  },
  {
    id: '2', nav_label: 'Үйлчилгээ', nav_url: '#', nav_type: 'DROPDOWN', is_active: true, sort_order: 2,
    columns: [{ items: [{label:'Үнийн санал авах',url:'/quote'},{label:'Нэрийн хуудас захиалах',url:'/business-cards'},{label:'AI Үнэ тооцоолох',url:'/quote?tab=ai'},{label:'Партнер хөтөлбөр',url:'/partner'}]}],
    featured: null,
  },
  { id: '3', nav_label: 'Загвар сан', nav_url: '/templates', nav_type: 'LINK', is_active: true, sort_order: 3, columns: null, featured: null },
  { id: '4', nav_label: 'Үйлдвэрүүд', nav_url: '/factory', nav_type: 'LINK', is_active: true, sort_order: 4, columns: null, featured: null },
  { id: '5', nav_label: 'Захиалга өгөх', nav_url: '/orders/new', nav_type: 'LINK', is_active: true, sort_order: 5, columns: null, featured: null },
]

interface SiteSettingsContextType {
  settings: SettingsMap
  megaMenu: MegaMenuItem[]
  megaMenuV2: MegaMenuV2Data | null
  loading: boolean
  refetch: () => void
}

const SiteSettingsContext = createContext<SiteSettingsContextType>({
  settings: DEFAULT_SETTINGS,
  megaMenu: DEFAULT_MEGA_MENU,
  megaMenuV2: null,
  loading: true,
  refetch: () => {},
})

export function SiteSettingsProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<SettingsMap>(DEFAULT_SETTINGS)
  const [megaMenu, setMegaMenu] = useState<MegaMenuItem[]>(DEFAULT_MEGA_MENU)
  const [megaMenuV2, setMegaMenuV2] = useState<MegaMenuV2Data | null>(null)
  const [loading, setLoading] = useState(true)
  const { subscribe, onReconnect } = useRealtime()

  const fetchSettings = useCallback(() => {
    Promise.all([
      fetch(`${API}/api/cms/settings/public`).then(r => r.ok ? r.json() : null).catch(() => null),
      fetch(`${API}/api/cms/mega-menu/public`).then(r => r.ok ? r.json() : null).catch(() => null),
      fetch(`${API}/api/mega-menu/public`).then(r => r.ok ? r.json() : null).catch(() => null),
    ]).then(([s, m, v2]) => {
      const legacyMenu = toMegaMenuItems(m)
      const v2Menu = toMegaMenuV2(v2)
      // V2 mega menu → convert to unified megaMenu format
      // Use V2 only if columns actually have categories with items inside
      const v2HasContent = v2Menu?.columns.some(c =>
        stringValue(c.title) && (c.categories || []).some(cat => (cat.items || []).length > 0)
      )
      if (v2HasContent && v2Menu) {
        setMegaMenuV2(v2Menu)
        // Build a unified "Бүтээгдэхүүн" mega nav item from V2 data
        const v2MegaItem = {
          id: 'v2-products',
          nav_label: 'Бүтээгдэхүүн',
          nav_url: '/shop',
          nav_type: 'MEGA',
          is_active: true,
          sort_order: 0,
          columns: v2Menu.columns.map(col => ({
            title: stringValue(col.title),
            icon: stringValue(col.icon),
            color: stringValue(col.color),
            items: (col.categories || []).flatMap(cat =>
              (cat.items || []).map(item => ({
                label: stringValue(item.name),
                url: stringValue(item.link),
                desc: stringValue(item.description),
                badge: stringValue(item.badge) || undefined,
              }))
            ),
          })),
          featured: v2Menu.promos[0] ? {
            badge: v2Menu.promos[0].is_ai ? '⚡ AI' : 'ШИНЭ',
            title: stringValue(v2Menu.promos[0].title),
            description: stringValue(v2Menu.promos[0].description),
            cta_text: stringValue(v2Menu.promos[0].cta_text, 'Дэлгэрэнгүй'),
            cta_url: stringValue(v2Menu.promos[0].link, '/quote?tab=ai'),
            bg_color: stringValue(v2Menu.promos[0].bg_color, '#0f172a'),
          } : null,
        }
        // Use DEFAULT_MEGA_MENU for non-MEGA items (cleaned up nav)
        const otherItems = DEFAULT_MEGA_MENU
          .filter(item => item.nav_type !== 'MEGA')
          .map((item, idx) => ({ ...item, sort_order: idx + 1 }))
        setMegaMenu([v2MegaItem, ...otherItems])
      }
      // No V2 but legacy CMS items exist — use them directly
      else if (legacyMenu.length > 0) {
        // DB-ийн бүх active item-ийг ашиглана
        const dbItems = legacyMenu.filter(item => item.is_active !== false)
        if (dbItems.length > 0) {
          setMegaMenu(dbItems)
        }
      }
      if (s && typeof s === 'object') {
        const filtered: Partial<SettingsMap> & Record<string, unknown> = {}
        for (const [key, val] of Object.entries(s)) {
          if (val !== null && val !== undefined && val !== '') {
            filtered[key] = val
          }
        }

        // Map legacy CMS fields → Frontend expected fields (only if not already set by bulk save)
        const phone = stringValue(filtered.phone)
        const email = stringValue(filtered.email)
        const facebook = stringValue(filtered.facebook)
        const instagram = stringValue(filtered.instagram)
        if (phone && !filtered.site_phone) filtered.site_phone = phone
        if (email && !filtered.site_email) filtered.site_email = email
        if (facebook && !filtered.site_facebook) filtered.site_facebook = facebook
        if (instagram && !filtered.site_instagram) filtered.site_instagram = instagram

        // Map footer sub-object (legacy format — don't override bulk-saved values)
        if (isRecord(filtered.footer)) {
          const f = filtered.footer
          const footerDescription = stringValue(f.description)
          const footerCopyright = stringValue(f.copyright)
          if (footerDescription && !filtered.footer_description) filtered.footer_description = footerDescription
          if (footerCopyright && !filtered.footer_copyright) filtered.footer_copyright = footerCopyright
          if (f.columns && !filtered.footer_columns) filtered.footer_columns = f.columns
          if (Array.isArray(f.socials)) {
            f.socials.filter(isRecord).forEach(soc => {
              if (soc.enabled && soc.url) {
                const key = `site_${stringValue(soc.platform)}`
                if (!filtered[key]) filtered[key] = soc.url
              }
            })
          }
          const firstBranch = Array.isArray(f.branches) && isRecord(f.branches[0]) ? f.branches[0] : null
          if (firstBranch) {
            const branchAddress = stringValue(firstBranch.address)
            const branchPhone = stringValue(firstBranch.phone)
            if (branchAddress && !filtered.footer_location) filtered.footer_location = branchAddress
            if (branchPhone && !filtered.site_phone) filtered.site_phone = branchPhone
          }
        }

        setSettings(prev => {
          const next = { ...prev, ...filtered }
          // Sync CSS variable
          if (typeof document !== 'undefined' && typeof next.site_primary_color === 'string') {
            document.documentElement.style.setProperty('--primary-color', next.site_primary_color)
          }
          return next
        })
      }
      if (!v2HasContent && legacyMenu.length > 0) setMegaMenu(legacyMenu)
    }).finally(() => setLoading(false))
  }, [])

  useEffect(() => {
    // Initial fetch
    fetchSettings()

    // Subscribe to /sync namespace CMS events
    const unsubs = [
      subscribe('SETTINGS_UPDATED', ({ key, value }) => {
        if (key && value !== undefined && value !== null && value !== '') {
          setSettings(prev => ({ ...prev, [key]: value }))
        }
      }),
      subscribe('SETTINGS_BULK_UPDATED', ({ settings: updated }) => {
        if (updated && typeof updated === 'object') {
          setSettings(prev => ({ ...prev, ...updated }))
        }
      }),
      subscribe('MENU_UPDATED', ({ menu }) => {
        const menuItems = toMegaMenuItems(menu)
        if (menuItems.length > 0) setMegaMenu(menuItems)
      }),
      // Re-fetch on reconnect (in case we missed updates while disconnected)
      onReconnect(fetchSettings),
    ]

    return () => { unsubs.forEach(fn => fn()) }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Maintenance mode check
  const isMaintenanceMode = settings.maintenance_mode === true || settings.maintenance_mode === 'true'
  const isAdminPage = typeof window !== 'undefined' && window.location.pathname.startsWith('/admin')

  if (isMaintenanceMode && !isAdminPage && !loading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: '#0a0a0a', color: '#f5f5f5', fontFamily: 'system-ui', textAlign: 'center', padding: 40 }}>
        <div style={{ fontSize: 64, marginBottom: 16 }}>🔧</div>
        <h1 style={{ fontSize: 28, fontWeight: 800, marginBottom: 8 }}>Систем түр засвартай</h1>
        <p style={{ fontSize: 16, color: '#888', maxWidth: 400 }}>Бид системийг сайжруулж байна. Удахгүй буцаж ирнэ.</p>
        <p style={{ fontSize: 14, color: '#555', marginTop: 20 }}>BizPrint — Print Operating System</p>
      </div>
    )
  }

  return (
    <SiteSettingsContext.Provider value={{ settings, megaMenu, megaMenuV2, loading, refetch: fetchSettings }}>
      {children}
    </SiteSettingsContext.Provider>
  )
}

export const useSiteSettings = () => useContext(SiteSettingsContext)
export { DEFAULT_SETTINGS, DEFAULT_MEGA_MENU }
