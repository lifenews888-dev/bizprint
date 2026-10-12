'use client'

import ChangePasswordForm from '@/components/account/ChangePasswordForm'

export default function CustomerChangePasswordPage() {
  return (
    <div className="p-4 md:p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight">Нууц үг солих</h1>
        <p className="text-sm text-muted-foreground mt-1">Өөрийн нэвтрэх нууц үгийг шинэчлэх</p>
      </div>
      <ChangePasswordForm />
    </div>
  )
}
