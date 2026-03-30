'use client'

import { createContext, useContext, useEffect, useState, useCallback, ReactNode } from 'react'
import { useRealtime } from './RealtimeContext'

const API = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000'

// Default settings fallback
const DEFAULT_SETTINGS: Record<string, any> = {
  // site
  site_name: 'BizPrint',
  site_logo_url: '',
  site_phone: '+976 XXXX-XXXX',
  site_email: 'info@bizprint.mn',
  site_address: 'Улаанбаатар, Монгол',
  site_facebook: 'https://facebook.com/bizprint.mn',
  site_instagram: 'https://instagram.com/bizprint.mn',
  site_youtube: 'https://youtube.com/@bizprint',
  site_primary_color: '#FF6B00',
  // header
  header_logo_url: '',
  header_show_search: true,
  header_show_login: true,
  header_cta_text: 'Start →',
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
    { title: 'БҮТЭЭГДЭХҮҮН', links: [{label:'Визит карт',url:'/shop?cat=business-card'},{label:'Флаер & Постер',url:'/shop?cat=flyer'},{label:'Баннер',url:'/shop?cat=banner'},{label:'Ном & Каталог',url:'/shop?cat=book'},{label:'Хайрцаг & Уут',url:'/shop?cat=packaging'}]},
    { title: 'ҮЙЛЧИЛГЭЭ', links: [{label:'Үнийн санал',url:'/quote'},{label:'Онлайн дизайн',url:'/design'},{label:'Хүргэлт',url:'/delivery'},{label:'Партнер хөтөлбөр',url:'/partner'}]},
    { title: 'КОМПАНИ', links: [{label:'Бидний тухай',url:'/about'},{label:'Холбоо барих',url:'/contact'},{label:'Үйлчилгээний нөхцөл',url:'/terms'},{label:'Нууцлалын бодлого',url:'/privacy'}]},
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

const DEFAULT_MEGA_MENU = [
  {
    id: '1', nav_label: 'Products', nav_url: '/shop', nav_type: 'MEGA', is_active: true, sort_order: 1,
    columns: [
      { title: 'ОФСЕТ ХЭВЛЭЛ', icon: '🖨️', color: '#378ADD', items: [{label:'Визит карт',url:'/shop?cat=business-card',desc:'90×50мм, 250-400gsm'},{label:'Флаер',url:'/shop?cat=flyer',desc:'A4, A5, A6'},{label:'Брошур',url:'/shop?cat=brochure',desc:'Гурвалсан нугалалт'},{label:'Каталог',url:'/shop?cat=catalog',desc:'8-100+ хуудас'},{label:'Ном',url:'/shop?cat=book',desc:'Хавтас, дотор хуудас'}]},
      { title: 'ДИЖИТАЛ ХЭВЛЭЛ', icon: '🏷️', color: '#22c55e', items: [{label:'Стикер',url:'/shop?cat=sticker',desc:'Өнгөт наалт'},{label:'Наалт/Label',url:'/shop?cat=label',desc:'Бүтээгдэхүүний шошго'},{label:'DTF хэвлэл',url:'/shop?cat=dtf',desc:'Даавуун хэвлэл'}]},
      { title: 'ӨРГӨН ФОРМАТ', icon: '🪧', color: '#eab308', items: [{label:'Баннер',url:'/shop?cat=banner',desc:'Гадна/дотор баннер'},{label:'Роллап',url:'/shop?cat=rollup',desc:'Зөөврийн стенд'},{label:'Хаяг/Үсэг',url:'/shop?cat=signage',desc:'3D, LED, нерж'}]},
      { title: 'ПРОМО', icon: '👕', color: '#a855f7', items: [{label:'Цамц хэвлэл',url:'/shop?cat=tshirt',desc:'DTF, Screen print'},{label:'Бусад промо',url:'/shop?cat=promo',desc:'Аяга, дэвтэр, бал'}]},
    ],
    featured: { badge: 'ШИНЭ', title: 'AI Үнийн Тооцоолуур', description: 'Секундэд үнэ тооцоолоорой', cta_text: 'Тооцоолох →', cta_url: '/quote', bg_color: '#1a1a1a' },
  },
  { id: '2', nav_label: 'Дэлгүүр', nav_url: '/shop', nav_type: 'LINK', is_active: true, sort_order: 2, columns: null, featured: null },
  {
    id: '3', nav_label: 'Үйлчилгээ', nav_url: '#', nav_type: 'DROPDOWN', is_active: true, sort_order: 3,
    columns: [{ items: [{label:'Үнийн санал',url:'/quote'},{label:'Онлайн дизайн',url:'/designer'},{label:'Хүргэлт',url:'/delivery'},{label:'Партнер хөтөлбөр',url:'/partner'}]}],
    featured: null,
  },
  {
    id: '4', nav_label: 'Загвар сан', nav_url: '/templates', nav_type: 'DROPDOWN', is_active: true, sort_order: 4,
    columns: [{ items: [
      { label: 'Нэрийн хуудас загвар', url: '/templates?category=business_card', desc: '90×50мм бэлэн загвар' },
      { label: 'Флаер & Постер загвар', url: '/templates?category=flyer', desc: 'A4, A5, A6 хэмжээт' },
      { label: 'Баннер загвар', url: '/templates?category=banner', desc: 'Гадна & дотор баннер' },
      { label: 'Стикер загвар', url: '/templates?category=sticker', desc: 'Өнгөт наалт загвар' },
      { label: 'Сошиал медиа загвар', url: '/templates?category=social', desc: 'FB, IG постер & story' },
      { label: '→ Бүх загвар харах', url: '/templates', desc: '' },
    ]}],
    featured: null,
  },
  { id: '5', nav_label: 'Партнер', nav_url: '/partner', nav_type: 'LINK', is_active: true, sort_order: 5, columns: null, featured: null },
  { id: '6', nav_label: 'Quote', nav_url: '/quote', nav_type: 'LINK', is_active: true, sort_order: 6, columns: null, featured: null },
  { id: '7', nav_label: 'Үйлдвэрүүд', nav_url: '/factory', nav_type: 'LINK', is_active: true, sort_order: 7, columns: null, featured: null },
]

interface SiteSettingsContextType {
  settings: Record<string, any>
  megaMenu: any[]
  loading: boolean
  refetch: () => void
}

const SiteSettingsContext = createContext<SiteSettingsContextType>({
  settings: DEFAULT_SETTINGS,
  megaMenu: DEFAULT_MEGA_MENU,
  loading: true,
  refetch: () => {},
})

export function SiteSettingsProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<Record<string, any>>(DEFAULT_SETTINGS)
  const [megaMenu, setMegaMenu] = useState<any[]>(DEFAULT_MEGA_MENU)
  const [loading, setLoading] = useState(true)
  const { subscribe, onReconnect } = useRealtime()

  const fetchSettings = useCallback(() => {
    Promise.all([
      fetch(`${API}/cms/settings/public`).then(r => r.ok ? r.json() : null).catch(() => null),
      fetch(`${API}/cms/mega-menu/public`).then(r => r.ok ? r.json() : null).catch(() => null),
    ]).then(([s, m]) => {
      if (s && typeof s === 'object') {
        // Хоосон утгаар default-ийг дарахгүй байх — зөвхөн утгатай талбаруудыг override хийнэ
        const filtered: Record<string, any> = {}
        for (const [key, val] of Object.entries(s)) {
          if (val !== null && val !== undefined && val !== '') {
            filtered[key] = val
          }
        }
        setSettings(prev => {
          const next = { ...prev, ...filtered }
          // Sync CSS variable
          if (typeof document !== 'undefined' && next.site_primary_color) {
            document.documentElement.style.setProperty('--primary-color', next.site_primary_color)
          }
          return next
        })
      }
      if (Array.isArray(m) && m.length > 0) setMegaMenu(m)
    }).finally(() => setLoading(false))
  }, [])

  useEffect(() => {
    // Initial fetch
    fetchSettings()

    // Subscribe to /sync namespace CMS events
    const unsubs = [
      subscribe('SETTINGS_UPDATED', ({ key, value }: { key: string; value: any }) => {
        if (key && value !== undefined && value !== null && value !== '') {
          setSettings(prev => ({ ...prev, [key]: value }))
        }
      }),
      subscribe('SETTINGS_BULK_UPDATED', ({ settings: updated }: { settings: Record<string, any> }) => {
        if (updated && typeof updated === 'object') {
          setSettings(prev => ({ ...prev, ...updated }))
        }
      }),
      subscribe('MENU_UPDATED', ({ menu }: { menu: any[] }) => {
        if (Array.isArray(menu) && menu.length > 0) setMegaMenu(menu)
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
    <SiteSettingsContext.Provider value={{ settings, megaMenu, loading, refetch: fetchSettings }}>
      {children}
    </SiteSettingsContext.Provider>
  )
}

export const useSiteSettings = () => useContext(SiteSettingsContext)
export { DEFAULT_SETTINGS, DEFAULT_MEGA_MENU }
