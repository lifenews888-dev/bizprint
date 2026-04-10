'use client'

import { useState, useEffect, useMemo } from 'react'
import { apiFetch } from '@/lib/api'
import { Input } from '@/components/ui/input'
import {
  FileText, ChevronDown, Search, Home, ShoppingCart, Calculator,
  Sparkles, LayoutGrid, Handshake, Factory, DollarSign, UserPlus,
  LogIn, ShoppingBag, CreditCard, Truck, Palette, BookOpen, PenTool,
  Users, Star, Smartphone, Package,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'

interface SystemPage {
  label: string
  url: string
  icon: LucideIcon
  group: string
}

const SYSTEM_PAGES: SystemPage[] = [
  // Үндсэн
  { label: 'Нүүр хуудас', url: '/', icon: Home, group: 'Үндсэн' },
  { label: 'Дэлгүүр', url: '/shop', icon: ShoppingCart, group: 'Үндсэн' },
  { label: 'Загвар сан', url: '/templates', icon: LayoutGrid, group: 'Үндсэн' },
  { label: 'Мэдээ', url: '/posts', icon: FileText, group: 'Үндсэн' },

  // Үйлчилгээ
  { label: 'Үнийн санал', url: '/quote', icon: Calculator, group: 'Үйлчилгээ' },
  { label: 'AI Quote', url: '/quote?tab=ai', icon: Sparkles, group: 'Үйлчилгээ' },
  { label: 'Нэрийн хуудас захиалах', url: '/business-cards', icon: CreditCard, group: 'Үйлчилгээ' },
  { label: 'Хүргэлт', url: '/order', icon: Truck, group: 'Үйлчилгээ' },

  // Marketplace
  { label: 'Marketplace', url: '/marketplace', icon: Palette, group: 'Marketplace' },
  { label: 'Дизайнерүүд', url: '/creators', icon: PenTool, group: 'Marketplace' },
  { label: 'Үйлдвэрүүд', url: '/factory', icon: Factory, group: 'Marketplace' },
  { label: 'Партнер', url: '/partner', icon: Handshake, group: 'Marketplace' },

  // Бүтээгдэхүүн
  { label: 'Үнийн багцууд', url: '/pricing', icon: DollarSign, group: 'Бүтээгдэхүүн' },
  { label: 'Loyalty програм', url: '/loyalty', icon: Star, group: 'Бүтээгдэхүүн' },
  { label: 'Сагс', url: '/cart', icon: ShoppingBag, group: 'Бүтээгдэхүүн' },
  { label: 'Төлбөр', url: '/checkout', icon: CreditCard, group: 'Бүтээгдэхүүн' },

  // Хэрэглэгч
  { label: 'Бүртгүүлэх', url: '/register', icon: UserPlus, group: 'Хэрэглэгч' },
  { label: 'Нэвтрэх', url: '/login', icon: LogIn, group: 'Хэрэглэгч' },
  { label: 'Курьер апп', url: '/courier', icon: Truck, group: 'Хэрэглэгч' },
  { label: 'Борлуулалт', url: '/sales', icon: Users, group: 'Хэрэглэгч' },

  // Мобайл
  { label: 'Урилга', url: '/invite', icon: FileText, group: 'Бусад' },
  { label: 'Мобайл', url: '/mobile', icon: Smartphone, group: 'Бусад' },
  { label: 'Vendor дэлгүүр', url: '/vendor/store', icon: Package, group: 'Бусад' },
]

interface Props {
  onSelect: (url: string) => void
}

export function PageSelector({ onSelect }: Props) {
  const [pages, setPages] = useState<any[]>([])
  const [open, setOpen] = useState(false)
  const [search, setSearch] = useState('')

  useEffect(() => {
    if (!open) return
    apiFetch<any>('/pages/all').then(d => {
      if (Array.isArray(d)) setPages(d.filter(p => p.is_published !== false))
    }).catch(() => {})
  }, [open])

  const groups = useMemo(() => {
    const s = search.toLowerCase()
    const filtered = s
      ? SYSTEM_PAGES.filter(p => p.label.toLowerCase().includes(s) || p.url.includes(s))
      : SYSTEM_PAGES

    const grouped: Record<string, SystemPage[]> = {}
    filtered.forEach(p => {
      if (!grouped[p.group]) grouped[p.group] = []
      grouped[p.group].push(p)
    })
    return grouped
  }, [search])

  const filteredCms = useMemo(() => {
    const s = search.toLowerCase()
    return s ? pages.filter(p => p.title?.toLowerCase().includes(s) || p.slug?.includes(s)) : pages
  }, [search, pages])

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="flex items-center gap-2 w-full rounded-md border border-input bg-background px-3 py-2 text-sm cursor-pointer hover:bg-muted transition-colors"
      >
        <FileText className="h-3.5 w-3.5 text-muted-foreground" />
        <span className="text-muted-foreground flex-1 text-left">Хуудас сонгох...</span>
        <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => { setOpen(false); setSearch('') }} />
          <div className="absolute z-50 top-full left-0 mt-1 w-full min-w-[320px] rounded-xl border border-border bg-card shadow-xl overflow-hidden">
            {/* Search */}
            <div className="p-2 border-b border-border">
              <div className="relative">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                <Input value={search} onChange={e => setSearch(e.target.value)} placeholder="Хуудас хайх..." className="pl-8 h-8 text-xs" autoFocus />
              </div>
            </div>

            <div className="max-h-[320px] overflow-y-auto">
              {/* System pages by group */}
              {Object.entries(groups).map(([group, items]) => (
                <div key={group}>
                  <div className="px-3 py-1.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/50 bg-muted/30">
                    {group}
                  </div>
                  {items.map(p => {
                    const Icon = p.icon
                    return (
                      <button
                        key={p.url}
                        type="button"
                        onClick={() => { onSelect(p.url); setOpen(false); setSearch('') }}
                        className="flex items-center gap-2.5 w-full px-3 py-2 text-sm text-foreground hover:bg-primary/5 hover:text-primary transition-colors cursor-pointer text-left border-none bg-transparent"
                      >
                        <Icon className="h-3.5 w-3.5 text-muted-foreground shrink-0" strokeWidth={1.6} />
                        <span className="flex-1">{p.label}</span>
                        <code className="text-[10px] text-muted-foreground/40 font-mono">{p.url}</code>
                      </button>
                    )
                  })}
                </div>
              ))}

              {/* CMS pages from DB */}
              {filteredCms.length > 0 && (
                <div>
                  <div className="px-3 py-1.5 text-[10px] font-semibold uppercase tracking-wider text-primary/60 bg-primary/5">
                    CMS хуудсууд ({filteredCms.length})
                  </div>
                  {filteredCms.map(p => (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => { onSelect(`/page/${p.slug}`); setOpen(false); setSearch('') }}
                      className="flex items-center gap-2.5 w-full px-3 py-2 text-sm text-foreground hover:bg-primary/5 hover:text-primary transition-colors cursor-pointer text-left border-none bg-transparent"
                    >
                      <BookOpen className="h-3.5 w-3.5 text-primary shrink-0" strokeWidth={1.6} />
                      <span className="flex-1">{p.title}</span>
                      <code className="text-[10px] text-muted-foreground/40 font-mono">/page/{p.slug}</code>
                    </button>
                  ))}
                </div>
              )}

              {Object.keys(groups).length === 0 && filteredCms.length === 0 && (
                <div className="py-6 text-center text-sm text-muted-foreground">Олдсонгүй</div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  )
}
