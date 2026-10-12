'use client'

import ChangePasswordForm from '@/components/account/ChangePasswordForm'

export default function AdminChangePasswordPage() {
  return (
    <div className="p-4 md:p-6 max-w-[1200px] mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-extrabold tracking-tight">Миний бүртгэл</h1>
        <p className="text-sm text-muted-foreground mt-1">Өөрийн нэвтрэх нууц үгийг солих</p>
      </div>
      <ChangePasswordForm />
    </div>
  )
}
