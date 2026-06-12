'use client'

import { useRouter, usePathname } from 'next/navigation'
import Link from 'next/link'
import { cn } from '@/lib/utils'
import { ADMIN_NAV, SUPERADMIN_NAV, ExternalLink, LogOut } from '@/config/admin-nav'
import type { AdminNavGroup } from '@/config/admin-nav'
import { clearAuthSession } from '@/lib/auth-session'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { Separator } from '@/components/ui/separator'

interface Props {
  user: { role?: string; email?: string } | null
  collapsed: boolean
  setCollapsed: (v: boolean) => void
  mobileOpen: boolean
  setMobileOpen: (v: boolean) => void
}

export function AdminSidebar({ user, collapsed, setCollapsed, mobileOpen, setMobileOpen }: Props) {
  const router = useRouter()
  const path = usePathname()
  const isSuperAdmin = user?.role === 'superadmin'
  const fullNav: AdminNavGroup[] = isSuperAdmin ? [...SUPERADMIN_NAV, ...ADMIN_NAV] : ADMIN_NAV

  const navigate = (href: string) => {
    router.push(href)
    setMobileOpen(false)
  }

  const logout = () => {
    clearAuthSession()
    router.push('/')
  }

  return (
    <>
      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 md:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      <aside
        className={cn(
          'flex h-screen flex-col border-r border-sidebar-border bg-sidebar sticky top-0 z-50 transition-all duration-200 overflow-hidden',
          collapsed ? 'w-14 min-w-14' : 'w-[230px] min-w-[230px]',
          // Mobile
          'max-md:fixed max-md:h-screen max-md:transition-transform',
          mobileOpen ? 'max-md:translate-x-0' : 'max-md:-translate-x-full',
        )}
      >
        {/* Logo header */}
        <div className="flex h-[52px] items-center shrink-0 border-b border-sidebar-border px-3">
          {!collapsed && (
            <Link href="/" className="flex items-center gap-2 no-underline flex-1">
              <div className="flex h-[26px] w-[26px] shrink-0 items-center justify-center rounded-md bg-primary">
                <span className="text-xs font-bold text-white">B</span>
              </div>
              <div>
                <div className="text-[13px] font-semibold leading-none text-sidebar-foreground">
                  <span className="text-primary">Biz</span>Print
                </div>
                <div className={cn('text-[10px]', isSuperAdmin ? 'text-red-500' : 'text-muted-foreground')}>
                  {isSuperAdmin ? 'Super Admin' : 'Admin Panel'}
                </div>
              </div>
            </Link>
          )}
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="shrink-0 rounded p-1 text-muted-foreground hover:bg-sidebar-accent hover:text-sidebar-foreground transition-colors"
          >
            {collapsed ? <ChevronRight className="h-3.5 w-3.5" /> : <ChevronLeft className="h-3.5 w-3.5" />}
          </button>
        </div>

        {/* User info */}
        {!collapsed && (
          <div className="flex items-center gap-2 border-b border-sidebar-border px-3.5 py-3">
            <div
              className={cn(
                'flex h-[30px] w-[30px] shrink-0 items-center justify-center rounded-full text-xs font-bold text-white',
                isSuperAdmin
                  ? 'bg-gradient-to-br from-red-600 to-red-400'
                  : 'bg-gradient-to-br from-primary to-orange-400',
              )}
            >
              {isSuperAdmin ? 'SA' : 'A'}
            </div>
            <div className="overflow-hidden">
              <div className={cn(
                'truncate text-[13px] font-semibold',
                isSuperAdmin ? 'text-red-500' : 'text-sidebar-foreground',
              )}>
                {isSuperAdmin ? 'Супер Админ' : 'Системийн Админ'}
              </div>
              <div className="truncate text-[10px] text-muted-foreground">
                {user?.email || 'test@bizprint.mn'}
              </div>
            </div>
          </div>
        )}

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto p-1.5 scrollbar-none">
          {fullNav.map((group) => (
            <div key={group.section} className="mb-1">
              {!collapsed && (
                <div className="px-2.5 pb-1 pt-2.5 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/60">
                  {group.section}
                </div>
              )}
              {group.items.map((item) => {
                const active = path === item.href || (item.href !== '/admin' && path.startsWith(item.href))
                const Icon = item.icon
                return (
                  <button
                    key={item.href}
                    onClick={() => navigate(item.href)}
                    title={collapsed ? item.label : undefined}
                    className={cn(
                      'group mb-px flex w-full items-center gap-2.5 rounded-lg border-none px-2.5 py-2 text-[13px] transition-colors cursor-pointer',
                      collapsed && 'justify-center px-0',
                      active
                        ? 'bg-primary/10 font-medium text-primary'
                        : 'bg-transparent text-muted-foreground hover:bg-sidebar-accent hover:text-sidebar-foreground',
                    )}
                  >
                    <Icon className="h-[15px] w-[15px] shrink-0" strokeWidth={1.6} />
                    {!collapsed && (
                      <span className="truncate">{item.label}</span>
                    )}
                    {!collapsed && active && (
                      <div className="ml-auto h-[5px] w-[5px] shrink-0 rounded-full bg-primary" />
                    )}
                  </button>
                )
              })}
            </div>
          ))}
        </nav>

        {/* Footer */}
        <div className="shrink-0 border-t border-sidebar-border p-1.5">
          <button
            onClick={() => navigate('/')}
            className={cn(
              'mb-0.5 flex w-full items-center gap-2.5 rounded-lg border-none bg-transparent px-2.5 py-2 text-[13px] text-muted-foreground/70 transition-colors hover:bg-sidebar-accent hover:text-sidebar-foreground cursor-pointer',
              collapsed && 'justify-center px-0',
            )}
          >
            <ExternalLink className="h-3.5 w-3.5 shrink-0" strokeWidth={1.6} />
            {!collapsed && <span>Сайт харах</span>}
          </button>
          <button
            onClick={logout}
            className={cn(
              'flex w-full items-center gap-2.5 rounded-lg border-none bg-transparent px-2.5 py-2 text-[13px] text-muted-foreground/70 transition-colors hover:bg-red-500/10 hover:text-red-500 cursor-pointer',
              collapsed && 'justify-center px-0',
            )}
          >
            <LogOut className="h-3.5 w-3.5 shrink-0" strokeWidth={1.6} />
            {!collapsed && <span>Гарах</span>}
          </button>
        </div>
      </aside>
    </>
  )
}
