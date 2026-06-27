'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { apiFetch } from '@/lib/api'

export default function EmailUnsubscribePage() {
  const [email] = useState(() => {
    if (typeof window === 'undefined') return ''
    return new URLSearchParams(window.location.search).get('email') || ''
  })
  const [status, setStatus] = useState<'loading' | 'done' | 'error'>(() => email ? 'loading' : 'error')
  const [message, setMessage] = useState(() => email ? 'И-мэйл бүртгэлээс гаргаж байна...' : 'И-мэйл хаяг олдсонгүй.')

  useEffect(() => {
    if (!email) {
      return
    }
    apiFetch(`/marketing/email/unsubscribe?email=${encodeURIComponent(email)}`, { auth: false })
      .then(() => {
        setStatus('done')
        setMessage('Та BizPrint-ийн маркетингийн имэйлээс амжилттай гарлаа.')
      })
      .catch(() => {
        setStatus('error')
        setMessage('Одоогоор хүсэлтийг боловсруулахад алдаа гарлаа. Түр хүлээгээд дахин оролдоно уу.')
      })
  }, [email])

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-50 px-5 py-12 text-slate-900">
      <section className="w-full max-w-md rounded-md border border-slate-200 bg-white p-8 text-center shadow-sm">
        <div className={`mx-auto mb-5 flex h-12 w-12 items-center justify-center rounded-full text-xl font-bold ${
          status === 'done' ? 'bg-emerald-50 text-emerald-600' : status === 'error' ? 'bg-red-50 text-red-600' : 'bg-orange-50 text-orange-600'
        }`}>
          {status === 'done' ? '✓' : status === 'error' ? '!' : '...'}
        </div>
        <h1 className="text-xl font-bold">Имэйл тохиргоо</h1>
        <p className="mt-3 text-sm leading-6 text-slate-600">{message}</p>
        {email && <p className="mt-3 rounded-md bg-slate-50 px-3 py-2 text-sm font-semibold text-slate-700">{email}</p>}
        <Link href="/" className="mt-6 inline-flex h-10 items-center justify-center rounded-md bg-orange-600 px-4 text-sm font-semibold text-white hover:bg-orange-700">
          BizPrint рүү буцах
        </Link>
      </section>
    </main>
  )
}
