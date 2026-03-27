'use client'
import DashboardLayout from '@/components/layouts/DashboardLayout'
import { useRoleGuard } from '@/lib/use-role-guard'
import { CREATOR_MENU } from '@/config/sidebar-config'

export default function CreatorLayout({ children }: { children: React.ReactNode }) {
  useRoleGuard(['customer', 'creator', 'designer', 'admin', 'superadmin'])

  return (
    <DashboardLayout navGroups={CREATOR_MENU} creatorNavGroups={CREATOR_MENU}>
      {children}
    </DashboardLayout>
  )
}
