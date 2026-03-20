'use client'

import { createContext, useContext, useEffect, useState, ReactNode } from 'react'

const API = 'http://localhost:4000'

// Default settings fallback
const DEFAULT_SETTINGS: Record<string, any> = {
  // site
  site_name: 'BizPrint',
  site_logo_url: '',
  site_phone: '+976 XXXX-XXXX',
  site_email: 'info@bizprint.mn',
  site_address: 'Улаанбаатар, Монгол',
  site_facebook: '',
  site_instagram: '',
  site_youtube: '',
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
  { id: '4', nav_label: 'Партнер', nav_url: '/partner', nav_type: 'LINK', is_active: true, sort_order: 4, columns: null, featured: null },
  { id: '5', nav_label: 'Quote', nav_url: '/quote', nav_type: 'LINK', is_active: true, sort_order: 5, columns: null, featured: null },
  { id: '6', nav_label: 'Үйлдвэрүүд', nav_url: '/factory', nav_type: 'LINK', is_active: true, sort_order: 6, columns: null, featured: null },
]

interface SiteSettingsContextType {
  settings: Record<string, any>
  megaMenu: any[]
  loading: boolean
}

const SiteSettingsContext = createContext<SiteSettingsContextType>({
  settings: DEFAULT_SETTINGS,
  megaMenu: DEFAULT_MEGA_MENU,
  loading: true,
})

export function SiteSettingsProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<Record<string, any>>(DEFAULT_SETTINGS)
  const [megaMenu, setMegaMenu] = useState<any[]>(DEFAULT_MEGA_MENU)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([
      fetch(`${API}/cms/settings/public`).then(r => r.ok ? r.json() : null).catch(() => null),
      fetch(`${API}/cms/mega-menu/public`).then(r => r.ok ? r.json() : null).catch(() => null),
    ]).then(([s, m]) => {
      if (s && typeof s === 'object') setSettings({ ...DEFAULT_SETTINGS, ...s })
      if (Array.isArray(m) && m.length > 0) setMegaMenu(m)
    }).finally(() => setLoading(false))
  }, [])

  return (
    <SiteSettingsContext.Provider value={{ settings, megaMenu, loading }}>
      {children}
    </SiteSettingsContext.Provider>
  )
}

export const useSiteSettings = () => useContext(SiteSettingsContext)
export { DEFAULT_SETTINGS, DEFAULT_MEGA_MENU }
