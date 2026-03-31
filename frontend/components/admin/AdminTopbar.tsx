'use client'

import { usePathname } from 'next/navigation'
import { Menu, Search } from 'lucide-react'
import ThemeToggle from '@/components/ThemeToggle'
import { ADMIN_NAV, SUPERADMIN_NAV } from '@/config/admin-nav'

interface Props {
  onMobileOpen: () => void
}

export function AdminTopbar({ onMobileOpen }: Props) {
  const path = usePathname()
  const allItems = [...SUPERADMIN_NAV, ...ADMIN_NAV].flatMap(g => g.items)
  const active = allItems.find(i => i.href === path)
  const label = active?.label || 'Dashboard'

  return (
    <header className="sticky top-0 z-10 flex h-[52px] shrink-0 items-center justify-between border-b border-border bg-card px-6">
      <div className="flex items-center gap-3">
        <button
          onClick={onMobileOpen}
          className="hidden max-md:block rounded p-1 text-foreground hover:bg-accent border-none bg-transparent cursor-pointer"
        >
          <Menu className="h-5 w-5" />
        </button>
        <div className="flex items-center gap-1.5 rounded-md border border-primary/15 bg-primary/8 px-2.5 py-0.5">
          <div className="h-[5px] w-[5px] rounded-full bg-primary" />
          <span className="text-xs font-medium text-primary">{label}</span>
        </div>
      </div>
      <div className="flex items-center gap-2">
        <button
          onClick={() => document.dispatchEvent(new KeyboardEvent('keydown', { key: 'k', metaKey: true }))}
          className="hidden sm:flex items-center gap-1.5 rounded-md border border-border bg-muted/50 px-2.5 py-1 text-xs text-muted-foreground hover:bg-muted hover:text-foreground transition-colors cursor-pointer"
        >
          <Search className="h-3 w-3" />
          <span>Хайх</span>
          <kbd className="ml-1 rounded border border-border bg-card px-1 py-0.5 text-[10px] font-mono">Ctrl+K</kbd>
        </button>
        <div className="flex items-center gap-1.5 rounded-md border border-emerald-500/15 bg-emerald-500/8 px-2.5 py-0.5">
          <div className="h-[5px] w-[5px] rounded-full bg-emerald-500" />
          <span className="text-xs font-medium text-emerald-500">Live</span>
        </div>
        <ThemeToggle />
      </div>
    </header>
  )
}
