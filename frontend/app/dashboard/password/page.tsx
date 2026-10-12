'use client'

import { useRouter } from 'next/navigation'
import { ArrowLeft } from 'lucide-react'
import ChangePasswordForm from '@/components/account/ChangePasswordForm'

/** Бүх үүргийн (vendor, designer, sales, courier, factory ...) хэрэглэгчдэд зориулсан нийтлэг хуудас */
export default function ChangePasswordPage() {
  const router = useRouter()
  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="mx-auto max-w-xl p-4 md:p-8">
        <button
          type="button"
          onClick={() => (window.history.length > 1 ? router.back() : router.push('/dashboard'))}
          className="mb-6 inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground bg-transparent border-none cursor-pointer"
        >
          <ArrowLeft className="h-4 w-4" /> Буцах
        </button>
        <h1 className="text-2xl font-bold tracking-tight mb-1">Нууц үг солих</h1>
        <p className="text-sm text-muted-foreground mb-6">Өөрийн нэвтрэх нууц үгийг шинэчлэх</p>
        <ChangePasswordForm />
      </div>
    </div>
  )
}
