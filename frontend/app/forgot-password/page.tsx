'use client'
import { useState } from 'react'
import { apiFetch } from '@/lib/api'
import Link from 'next/link'
import { Mail, ArrowLeft, CheckCircle, Loader2 } from 'lucide-react'

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email.trim()) { setError('Имэйл хаяг оруулна уу'); return }
    setLoading(true); setError('')
    try {
      await apiFetch('/auth/forgot-password', { method: 'POST', body: { email }, auth: false })
      setSent(true)
    } catch (err: any) {
      setError(err.message || 'Алдаа гарлаа')
    } finally { setLoading(false) }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[var(--bg)] px-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <Link href="/" className="text-2xl font-extrabold text-[#FF6B00]">BizPrint</Link>
          <p className="text-sm text-[var(--text3)] mt-2">Нууц үг сэргээх</p>
        </div>

        <div className="bg-[var(--surface)] border border-[var(--border)] rounded-2xl p-8">
          {sent ? (
            /* Success state */
            <div className="text-center py-4">
              <div className="w-16 h-16 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="w-8 h-8 text-emerald-500" strokeWidth={1.5} />
              </div>
              <h2 className="text-lg font-bold text-[var(--text)] mb-2">Имэйл илгээгдлээ!</h2>
              <p className="text-sm text-[var(--text3)] mb-6">
                <strong>{email}</strong> хаяг руу нууц үг сэргээх линк илгээгдлээ. Имэйлээ шалгана уу.
              </p>
              <p className="text-xs text-[var(--text3)] mb-4">
                Имэйл ирээгүй бол spam/junk хавтас шалгана уу. Линк 2 цагийн дотор хүчинтэй.
              </p>
              <Link href="/login" className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#FF6B00] text-white rounded-lg text-sm font-semibold hover:bg-[#E55D00] transition-colors">
                <ArrowLeft className="w-4 h-4" /> Нэвтрэх хуудас руу
              </Link>
            </div>
          ) : (
            /* Form state */
            <>
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-xl bg-[#FF6B00]/10 flex items-center justify-center">
                  <Mail className="w-5 h-5 text-[#FF6B00]" strokeWidth={1.5} />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-[var(--text)]">Нууц үг мартсан</h2>
                  <p className="text-xs text-[var(--text3)]">Бүртгэлтэй имэйл хаягаа оруулна уу</p>
                </div>
              </div>

              {error && (
                <div className="mb-4 p-3 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-sm text-red-600 dark:text-red-400">
                  {error}
                </div>
              )}

              <form onSubmit={handleSubmit}>
                <label className="block text-xs font-semibold text-[var(--text2)] mb-1.5">Имэйл хаяг</label>
                <input type="email" value={email} onChange={e => setEmail(e.target.value)}
                  placeholder="example@mail.com" autoFocus
                  className="w-full h-11 px-4 rounded-lg border border-[var(--border)] bg-[var(--surface)] text-sm text-[var(--text)] outline-none focus:border-[#FF6B00] transition-colors mb-4" />

                <button type="submit" disabled={loading}
                  className="w-full h-11 rounded-lg bg-[#FF6B00] text-white font-semibold text-sm hover:bg-[#E55D00] transition-colors disabled:opacity-50 cursor-pointer flex items-center justify-center gap-2">
                  {loading ? <><Loader2 className="w-4 h-4 animate-spin" /> Илгээж байна...</> : 'Сэргээх линк илгээх'}
                </button>
              </form>

              <div className="mt-6 text-center">
                <Link href="/login" className="text-sm text-[var(--text3)] hover:text-[#FF6B00] transition-colors">
                  ← Нэвтрэх хуудас руу буцах
                </Link>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
