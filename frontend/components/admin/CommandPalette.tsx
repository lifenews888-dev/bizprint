'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Command } from 'cmdk'
import { ADMIN_NAV, SUPERADMIN_NAV, type AdminNavGroup } from '@/config/admin-nav'
import { Search } from 'lucide-react'

export function CommandPalette() {
  const [open, setOpen] = useState(false)
  const router = useRouter()

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault()
        setOpen(prev => !prev)
      }
    }
    document.addEventListener('keydown', down)
    return () => document.removeEventListener('keydown', down)
  }, [])

  const navigate = (href: string) => {
    router.push(href)
    setOpen(false)
  }

  const allGroups: AdminNavGroup[] = [...SUPERADMIN_NAV, ...ADMIN_NAV]

  if (!open) return null

  return (
    <div className="fixed inset-0 z-[100]">
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setOpen(false)} />

      {/* Dialog */}
      <div className="fixed left-1/2 top-[20%] -translate-x-1/2 w-full max-w-[520px] px-4">
        <Command
          className="rounded-xl border border-border bg-card shadow-2xl overflow-hidden"
          shouldFilter={true}
        >
          {/* Search input */}
          <div className="flex items-center gap-2 border-b border-border px-4">
            <Search className="h-4 w-4 text-muted-foreground shrink-0" />
            <Command.Input
              placeholder="Хайх... (хуудас, тохиргоо, үйлдэл)"
              className="w-full py-3.5 text-sm bg-transparent outline-none placeholder:text-muted-foreground text-foreground"
            />
            <kbd className="hidden sm:inline-flex h-5 items-center rounded border border-border bg-muted px-1.5 text-[10px] font-medium text-muted-foreground">ESC</kbd>
          </div>

          {/* Results */}
          <Command.List className="max-h-[320px] overflow-y-auto p-2">
            <Command.Empty className="py-8 text-center text-sm text-muted-foreground">
              Илэрц олдсонгүй
            </Command.Empty>

            {allGroups.map(group => (
              <Command.Group key={group.section} heading={group.section}
                className="[&_[cmdk-group-heading]]:px-2 [&_[cmdk-group-heading]]:py-1.5 [&_[cmdk-group-heading]]:text-[10px] [&_[cmdk-group-heading]]:font-semibold [&_[cmdk-group-heading]]:uppercase [&_[cmdk-group-heading]]:tracking-wider [&_[cmdk-group-heading]]:text-muted-foreground/60"
              >
                {group.items.map(item => {
                  const Icon = item.icon
                  return (
                    <Command.Item
                      key={item.href}
                      value={`${item.label} ${group.section}`}
                      onSelect={() => navigate(item.href)}
                      className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm cursor-pointer transition-colors data-[selected=true]:bg-primary/10 data-[selected=true]:text-primary text-foreground"
                    >
                      <Icon className="h-4 w-4 shrink-0 text-muted-foreground" strokeWidth={1.6} />
                      <span className="flex-1">{item.label}</span>
                      <span className="text-[10px] text-muted-foreground/50">{group.section}</span>
                    </Command.Item>
                  )
                })}
              </Command.Group>
            ))}
          </Command.List>

          {/* Footer */}
          <div className="flex items-center justify-between border-t border-border px-4 py-2 text-[11px] text-muted-foreground">
            <span>↑↓ шилжих</span>
            <span>↵ нээх</span>
            <span>esc хаах</span>
          </div>
        </Command>
      </div>
    </div>
  )
}
