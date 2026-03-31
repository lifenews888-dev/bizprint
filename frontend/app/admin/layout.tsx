'use client'

import { useState } from 'react'
import { useRoleGuard } from '@/lib/use-role-guard'
import { AdminSidebar } from '@/components/admin/AdminSidebar'
import { AdminTopbar } from '@/components/admin/AdminTopbar'
import { CommandPalette } from '@/components/admin/CommandPalette'

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const [collapsed, setCollapsed] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  const { user, loading } = useRoleGuard(['admin', 'superadmin'])

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <div className="text-center">
          <div className="mx-auto mb-3 h-10 w-10 animate-spin rounded-full border-[3px] border-border border-t-primary" />
          <div className="text-sm text-muted-foreground">Уншиж байна...</div>
        </div>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen bg-background text-foreground">
      <AdminSidebar
        user={user}
        collapsed={collapsed}
        setCollapsed={setCollapsed}
        mobileOpen={mobileOpen}
        setMobileOpen={setMobileOpen}
      />
      <div className="flex flex-1 flex-col min-w-0">
        <AdminTopbar onMobileOpen={() => setMobileOpen(true)} />
        <main className="flex-1 overflow-y-auto">
          {children}
        </main>
        <CommandPalette />
      </div>
    </div>
  )
}
