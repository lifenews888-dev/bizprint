import {
  Home, BarChart3, Megaphone, ClipboardList, Pencil, Calculator,
  RefreshCw, Cog, Package, LayoutGrid, Users, UserSearch,
  LifeBuoy, Building2, Wallet, CreditCard, Image, FileText,
  Settings, Edit3, Mail, Ticket, Archive, BarChart2,
  MessageCircle, Server, Shield, TrendingUp, Link, DollarSign,
  BookOpen, CreditCard as CreditCardIcon, ExternalLink, LogOut,
  PanelTop, GalleryHorizontalEnd, Bot,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'

export interface AdminNavItem {
  label: string
  href: string
  icon: LucideIcon
}

export interface AdminNavGroup {
  section: string
  items: AdminNavItem[]
}

export const SUPERADMIN_NAV: AdminNavGroup[] = [
  {
    section: 'Систем (SA)',
    items: [
      { label: 'System Control', href: '/admin/system', icon: Server },
      { label: 'Vendor Tier', href: '/admin/vendors', icon: Shield },
      { label: 'Ашиг тайлан', href: '/admin/reports', icon: TrendingUp },
      { label: 'API Webhooks', href: '/admin/webhooks', icon: Link },
      { label: 'Систем тохиргоо', href: '/admin/settings', icon: Settings },
    ],
  },
]

export const ADMIN_NAV: AdminNavGroup[] = [
  {
    section: 'Хяналт',
    items: [
      { label: 'Dashboard', href: '/admin', icon: Home },
      { label: 'Тайлан', href: '/admin/reports', icon: BarChart3 },
      { label: 'Маркетинг', href: '/admin/marketing', icon: Megaphone },
      { label: 'Имэйл маркетинг', href: '/admin/email-marketing', icon: Mail },
    ],
  },
  {
    section: 'Захиалга & Workflow',
    items: [
      { label: 'Захиалгууд', href: '/admin/orders', icon: ClipboardList },
      { label: 'Дизайн хүсэлт', href: '/admin/design-requests', icon: Pencil },
      { label: 'Үнийн санал', href: '/admin/pricing-rules', icon: Calculator },
      { label: 'Workflow', href: '/admin/workflow', icon: RefreshCw },
      { label: 'Тоног төхөөрөмж', href: '/admin/machines', icon: Cog },
    ],
  },
  {
    section: 'Бүтээгдэхүүн & Үнэ',
    items: [
      { label: 'Бүтээгдэхүүн', href: '/admin/products', icon: Package },
      { label: 'Үнийн удирдлага', href: '/admin/product-pricing', icon: DollarSign },
      { label: 'Үнийн каталог', href: '/admin/pricing-catalog', icon: BookOpen },
      { label: 'Нэрийн хуудас', href: '/admin/business-cards', icon: CreditCardIcon },
      { label: 'Ангилал', href: '/admin/categories', icon: LayoutGrid },
    ],
  },
  {
    section: 'Хэрэглэгч & Партнер',
    items: [
      { label: 'Хэрэглэгчид', href: '/admin/users', icon: Users },
      { label: 'CRM', href: '/admin/customers', icon: UserSearch },
      { label: 'Тикет', href: '/admin/support', icon: LifeBuoy },
      { label: 'Vendors', href: '/admin/vendors', icon: Building2 },
    ],
  },
  {
    section: 'Санхүү',
    items: [
      { label: 'Commission', href: '/admin/commission', icon: Wallet },
      { label: 'Wallet хүсэлт', href: '/admin/wallet-requests', icon: CreditCard },
    ],
  },
  {
    section: 'Контент & CMS',
    items: [
      { label: 'Hero Slider', href: '/admin/hero-slides', icon: Image },
      { label: 'Баннер', href: '/admin/banners', icon: Image },
      { label: 'Хуудсууд', href: '/admin/pages', icon: FileText },
      { label: 'Тохиргоо', href: '/admin/settings', icon: Settings },
      { label: 'CMS / Меню', href: '/admin/cms', icon: Edit3 },
      { label: 'Mega Menu Builder', href: '/admin/mega-menu', icon: PanelTop },
      { label: 'Галерей', href: '/admin/gallery', icon: GalleryHorizontalEnd },
    ],
  },
  {
    section: 'Дижитал платформ',
    items: [
      { label: 'Урилгууд', href: '/admin/invitations', icon: Mail },
      { label: 'Эрх & Багц', href: '/admin/subscriptions', icon: Ticket },
      { label: 'Багцын удирдлага', href: '/admin/subscription-plans', icon: Archive },
      { label: 'Үнийн удирдлага', href: '/admin/product-pricing', icon: DollarSign },
      { label: 'Аналитик', href: '/admin/analytics', icon: BarChart2 },
    ],
  },
  {
    section: 'Харилцаа',
    items: [
      { label: 'Chat', href: '/admin/chat', icon: MessageCircle },
      { label: 'Чатбот холболт', href: '/admin/chatbot', icon: Bot },
    ],
  },
]

export { ExternalLink, LogOut }
