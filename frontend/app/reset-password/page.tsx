'use client'
import { useState, useEffect, Suspense, useMemo } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { apiFetch } from '@/lib/api'
import Link from 'next/link'
import { Lock, CheckCircle, XCircle, Loader2, Eye, EyeOff, ShieldCheck } from 'lucide-react'
import { toast } from 'sonner'

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center bg-[var(--bg)]"><Loader2 className="w-8 h-8 animate-spin text-[#FF6B00]" /></div>}>
      <ResetPasswordInner />
    </Suspense>
  )
}

function getPasswordStrength(pw: string): { score: number; label: string; color: string } {
  if (!pw) return { score: 0, label: '', color: '' }
  let score = 0
  if (pw.length >= 8) score++
  if (pw.length >= 12) score++
  if (/[A-Z]/.test(pw)) score++
  if (/[0-9]/.test(pw)) score++
  if (/[^A-Za-z0-9]/.test(pw)) score++

  if (score <= 1) return { score: 1, label: 'Сул', color: '#EF4444' }
  if (score <= 2) return { score: 2, label: 'Дунд', color: '#F59E0B' }
  if (score <= 3) return { score: 3, label: 'Сайн', color: '#3B82F6' }
  return { score: 4, label: 'Хүчтэй', color: '#10B981' }
}

function ResetPasswordInner() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const token = searchParams.get('token') || ''

  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [showPw, setShowPw] = useState(false)
  const [loading, setLoading] = useState(false)
  const [validating, setValidating] = useState(true)
  const [valid, setValid] = useState(false)
  const [done, setDone] = useState(false)
  const [error, setError] = useState('')

  const strength = useMemo(() => getPasswordStrength(password), [password])

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
      toast.success('Нууц үг амжилттай шинэчлэгдлээ!')
      setTimeout(() => router.push('/login'), 3000)
    } catch (err: any) {
      setError(err.message || 'Алдаа гарлаа')
      toast.error(err.message || 'Алдаа гарлаа')
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
            <div className="text-center py-4">
              <div className="w-16 h-16 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="w-8 h-8 text-emerald-500" strokeWidth={1.5} />
              </div>
              <h2 className="text-lg font-bold text-[var(--text)] mb-2">Нууц үг шинэчлэгдлээ!</h2>
              <p className="text-sm text-[var(--text3)] mb-2">Шинэ нууц үгээрээ нэвтэрнэ үү.</p>
              <p className="text-xs text-[var(--text3)] mb-6">3 секундын дараа нэвтрэх хуудас руу шилжинэ...</p>
              <Link href="/login" className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#FF6B00] text-white rounded-lg text-sm font-semibold hover:bg-[#E55D00] transition-colors">
                Нэвтрэх
              </Link>
            </div>
          ) : (
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
                <div className="relative mb-1">
                  <input type={showPw ? 'text' : 'password'} value={password} onChange={e => setPassword(e.target.value)}
                    placeholder="8+ тэмдэгт" autoFocus
                    className="w-full h-11 px-4 pr-10 rounded-lg border border-[var(--border)] bg-[var(--surface)] text-sm text-[var(--text)] outline-none focus:border-[#FF6B00] transition-colors" />
                  <button type="button" onClick={() => setShowPw(!showPw)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--text3)] hover:text-[var(--text)] cursor-pointer">
                    {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>

                {/* Password strength */}
                {password && (
                  <div className="mb-3">
                    <div className="flex gap-1 mb-1">
                      {[1, 2, 3, 4].map(i => (
                        <div key={i} className="h-1.5 flex-1 rounded-full transition-colors"
                          style={{ background: i <= strength.score ? strength.color : 'var(--border)' }} />
                      ))}
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-semibold" style={{ color: strength.color }}>
                        <ShieldCheck className="w-3 h-3 inline mr-0.5" />{strength.label}
                      </span>
                      <span className="text-[10px] text-[var(--text3)]">
                        {password.length < 8 ? `${8 - password.length} тэмдэгт дутуу` : 'OK'}
                      </span>
                    </div>
                  </div>
                )}

                <label className="block text-xs font-semibold text-[var(--text2)] mb-1.5">Нууц үг давтах</label>
                <input type="password" value={confirm} onChange={e => setConfirm(e.target.value)}
                  placeholder="Дахин оруулна уу"
                  className="w-full h-11 px-4 rounded-lg border border-[var(--border)] bg-[var(--surface)] text-sm text-[var(--text)] outline-none focus:border-[#FF6B00] transition-colors mb-1" />
                {confirm && password !== confirm && (
                  <p className="text-xs text-red-500 mb-3">Нууц үг таарахгүй байна</p>
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
