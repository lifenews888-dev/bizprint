'use client'
import { useState, useEffect, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import { apiFetch } from '@/lib/api'
import Link from 'next/link'
import { Lock, CheckCircle, XCircle, Loader2, Eye, EyeOff } from 'lucide-react'

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center bg-[var(--bg)]"><Loader2 className="w-8 h-8 animate-spin text-[#FF6B00]" /></div>}>
      <ResetPasswordInner />
    </Suspense>
  )
}

function ResetPasswordInner() {
  const searchParams = useSearchParams()
  const token = searchParams.get('token') || ''

  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [showPw, setShowPw] = useState(false)
  const [loading, setLoading] = useState(false)
  const [validating, setValidating] = useState(true)
  const [valid, setValid] = useState(false)
  const [done, setDone] = useState(false)
  const [error, setError] = useState('')

  // Validate token on mount
  useEffect(() => {
    if (!token) { setValidating(false); return }
    apiFetch(`/auth/validate-reset-token/${token}`, { auth: false })
      .then((res: any) => setValid(res?.valid === true))
      .catch(() => setValid(false))
      .finally(() => setValidating(false))
  }, [token])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (password.length < 8) { setError('Нууц үг хамгийн багадаа 8 тэмдэгт'); return }
    if (password !== confirm) { setError('Нууц үг таарахгүй байна'); return }
    setLoading(true); setError('')
    try {
      await apiFetch('/auth/reset-password', { method: 'POST', body: { token, password }, auth: false })
      setDone(true)
    } catch (err: any) {
      setError(err.message || 'Алдаа гарлаа')
    } finally { setLoading(false) }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[var(--bg)] px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link href="/" className="text-2xl font-extrabold text-[#FF6B00]">BizPrint</Link>
        </div>

        <div className="bg-[var(--surface)] border border-[var(--border)] rounded-2xl p-8">
          {validating ? (
            <div className="text-center py-8">
              <Loader2 className="w-8 h-8 animate-spin text-[#FF6B00] mx-auto mb-3" />
              <p className="text-sm text-[var(--text3)]">Линк шалгаж байна...</p>
            </div>
          ) : !token || !valid ? (
            /* Invalid token */
            <div className="text-center py-4">
              <div className="w-16 h-16 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center mx-auto mb-4">
                <XCircle className="w-8 h-8 text-red-500" strokeWidth={1.5} />
              </div>
              <h2 className="text-lg font-bold text-[var(--text)] mb-2">Линк хүчингүй</h2>
              <p className="text-sm text-[var(--text3)] mb-6">
                Нууц үг сэргээх линкийн хугацаа дууссан эсвэл аль хэдийн ашиглагдсан байна.
              </p>
              <Link href="/forgot-password" className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#FF6B00] text-white rounded-lg text-sm font-semibold hover:bg-[#E55D00] transition-colors">
                Дахин хүсэлт илгээх
              </Link>
            </div>
          ) : done ? (
            /* Success */
            <div className="text-center py-4">
              <div className="w-16 h-16 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="w-8 h-8 text-emerald-500" strokeWidth={1.5} />
              </div>
              <h2 className="text-lg font-bold text-[var(--text)] mb-2">Нууц үг шинэчлэгдлээ!</h2>
              <p className="text-sm text-[var(--text3)] mb-6">Шинэ нууц үгээрээ нэвтэрнэ үү.</p>
              <Link href="/login" className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#FF6B00] text-white rounded-lg text-sm font-semibold hover:bg-[#E55D00] transition-colors">
                Нэвтрэх
              </Link>
            </div>
          ) : (
            /* Reset form */
            <>
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-xl bg-[#FF6B00]/10 flex items-center justify-center">
                  <Lock className="w-5 h-5 text-[#FF6B00]" strokeWidth={1.5} />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-[var(--text)]">Шинэ нууц үг</h2>
                  <p className="text-xs text-[var(--text3)]">Шинэ нууц үгээ оруулна уу</p>
                </div>
              </div>

              {error && (
                <div className="mb-4 p-3 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-sm text-red-600 dark:text-red-400">
                  {error}
                </div>
              )}

              <form onSubmit={handleSubmit}>
                <label className="block text-xs font-semibold text-[var(--text2)] mb-1.5">Шинэ нууц үг</label>
                <div className="relative mb-3">
                  <input type={showPw ? 'text' : 'password'} value={password} onChange={e => setPassword(e.target.value)}
                    placeholder="8+ тэмдэгт" autoFocus
                    className="w-full h-11 px-4 pr-10 rounded-lg border border-[var(--border)] bg-[var(--surface)] text-sm text-[var(--text)] outline-none focus:border-[#FF6B00] transition-colors" />
                  <button type="button" onClick={() => setShowPw(!showPw)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--text3)] hover:text-[var(--text)] cursor-pointer">
                    {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>

                <label className="block text-xs font-semibold text-[var(--text2)] mb-1.5">Нууц үг давтах</label>
                <input type="password" value={confirm} onChange={e => setConfirm(e.target.value)}
                  placeholder="Дахин оруулна уу"
                  className="w-full h-11 px-4 rounded-lg border border-[var(--border)] bg-[var(--surface)] text-sm text-[var(--text)] outline-none focus:border-[#FF6B00] transition-colors mb-1" />
                {confirm && password !== confirm && (
                  <p className="text-xs text-red-500 mb-3">Нууц үг таарахгүй байна</p>
                )}
                {password && password.length < 8 && (
                  <p className="text-xs text-amber-500 mb-3">Хамгийн багадаа 8 тэмдэгт</p>
                )}

                <button type="submit" disabled={loading || password.length < 8 || password !== confirm}
                  className="w-full h-11 rounded-lg bg-[#FF6B00] text-white font-semibold text-sm hover:bg-[#E55D00] transition-colors disabled:opacity-50 cursor-pointer flex items-center justify-center gap-2 mt-4">
                  {loading ? <><Loader2 className="w-4 h-4 animate-spin" /> Шинэчилж байна...</> : 'Нууц үг шинэчлэх'}
                </button>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
