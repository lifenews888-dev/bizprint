'use client'
import { ShieldAlert, Clock, XCircle } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'

const STATUS_CONFIG: Record<string, { icon: LucideIcon; bg: string; border: string; text: string; label: string; desc: string }> = {
  pending: {
    icon: Clock, bg: 'bg-amber-50 dark:bg-amber-900/20', border: 'border-amber-200 dark:border-amber-800',
    text: 'text-amber-700 dark:text-amber-300', label: 'Баталгаажуулалт хүлээгдэж байна',
    desc: 'Таны бүртгэлийг админ шалгаж байна. Баримт бичгээ оруулснаар хурдан шийдвэрлэгдэнэ.',
  },
  under_review: {
    icon: ShieldAlert, bg: 'bg-blue-50 dark:bg-blue-900/20', border: 'border-blue-200 dark:border-blue-800',
    text: 'text-blue-700 dark:text-blue-300', label: 'Шалгаж байна',
    desc: 'Таны баримт бичгийг шалгаж байна. Удахгүй баталгаажуулагдана.',
  },
  rejected: {
    icon: XCircle, bg: 'bg-red-50 dark:bg-red-900/20', border: 'border-red-200 dark:border-red-800',
    text: 'text-red-700 dark:text-red-300', label: 'Татгалзсан',
    desc: 'Таны бүртгэл баталгаажуулагдсангүй. Дэлгэрэнгүй мэдээллийг имэйлээр авна уу.',
  },
}

export default function VerificationBanner({ status, note }: { status: string; note?: string }) {
  if (!status || status === 'verified') return null
  const config = STATUS_CONFIG[status]
  if (!config) return null
  const Icon = config.icon

  return (
    <div className={`${config.bg} ${config.border} border rounded-xl p-4 mb-4`}>
      <div className="flex items-start gap-3">
        <Icon className={`w-5 h-5 shrink-0 mt-0.5 ${config.text}`} strokeWidth={1.5} />
        <div className="flex-1">
          <div className={`text-sm font-bold ${config.text}`}>{config.label}</div>
          <p className="text-xs text-[var(--text3)] mt-1">{config.desc}</p>
          {note && <p className="text-xs mt-2 p-2 rounded bg-[var(--surface2)] text-[var(--text2)]">Тэмдэглэл: {note}</p>}
        </div>
      </div>
    </div>
  )
}
