'use client'

import { useState } from 'react'
import { toast } from 'sonner'
import { Eye, EyeOff, KeyRound, Loader2 } from 'lucide-react'
import { apiFetch } from '@/lib/api'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'

const MIN_LEN = 8
const MAX_LEN = 72

type FieldKey = 'current' | 'next' | 'confirm'

function validate(current: string, next: string, confirm: string): Partial<Record<FieldKey, string>> {
  const errors: Partial<Record<FieldKey, string>> = {}
  if (!current) errors.current = 'Одоогийн нууц үгээ оруулна уу'
  if (!next) errors.next = 'Шинэ нууц үг оруулна уу'
  else if (next.length < MIN_LEN) errors.next = `Нууц үг хамгийн багадаа ${MIN_LEN} тэмдэгт байх ёстой`
  else if (next.length > MAX_LEN) errors.next = `Нууц үг хамгийн ихдээ ${MAX_LEN} тэмдэгт байна`
  else if (current && next === current) errors.next = 'Шинэ нууц үг одоогийн нууц үгээс өөр байх ёстой'
  if (!confirm) errors.confirm = 'Шинэ нууц үгээ дахин оруулна уу'
  else if (confirm !== next) errors.confirm = 'Нууц үг таарахгүй байна'
  return errors
}

function PasswordField({
  id, label, value, onChange, error, autoComplete, show, onToggle,
}: {
  id: string; label: string; value: string; onChange: (v: string) => void
  error?: string; autoComplete: string; show: boolean; onToggle: () => void
}) {
  return (
    <div className="space-y-1.5">
      <Label htmlFor={id}>{label}</Label>
      <div className="relative">
        <Input
          id={id}
          type={show ? 'text' : 'password'}
          value={value}
          onChange={e => onChange(e.target.value)}
          autoComplete={autoComplete}
          aria-invalid={!!error}
          className="pr-10"
        />
        <button
          type="button"
          onClick={onToggle}
          aria-label={show ? 'Нууц үгийг нуух' : 'Нууц үгийг харах'}
          className="absolute inset-y-0 right-0 flex w-10 items-center justify-center text-muted-foreground hover:text-foreground bg-transparent border-none cursor-pointer"
        >
          {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
        </button>
      </div>
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  )
}

/** Нэвтэрсэн хэрэглэгч өөрийн нууц үгийг солих форм (POST /auth/change-password) */
export default function ChangePasswordForm() {
  const [current, setCurrent] = useState('')
  const [next, setNext] = useState('')
  const [confirm, setConfirm] = useState('')
  const [show, setShow] = useState<Record<FieldKey, boolean>>({ current: false, next: false, confirm: false })
  const [errors, setErrors] = useState<Partial<Record<FieldKey, string>>>({})
  const [touched, setTouched] = useState(false)
  const [saving, setSaving] = useState(false)

  const toggle = (k: FieldKey) => setShow(s => ({ ...s, [k]: !s[k] }))
  const revalidate = (c: string, n: string, f: string) => { if (touched) setErrors(validate(c, n, f)) }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    setTouched(true)
    const errs = validate(current, next, confirm)
    setErrors(errs)
    if (Object.keys(errs).length > 0) return

    setSaving(true)
    try {
      const refresh_token = typeof window !== 'undefined' ? localStorage.getItem('refresh_token') || undefined : undefined
      await apiFetch('/auth/change-password', {
        method: 'POST',
        body: { currentPassword: current, newPassword: next, ...(refresh_token ? { refresh_token } : {}) },
      })
      toast.success('Нууц үг амжилттай солигдлоо. Бусад төхөөрөмж дээрх нэвтрэлт хаагдлаа.')
      setCurrent(''); setNext(''); setConfirm('')
      setErrors({}); setTouched(false)
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Алдаа гарлаа'
      toast.error(msg || 'Алдаа гарлаа')
      if (/одоогийн нууц үг буруу/i.test(msg)) setErrors(prev => ({ ...prev, current: msg }))
    } finally {
      setSaving(false)
    }
  }

  return (
    <form onSubmit={onSubmit} noValidate className="max-w-md space-y-4 rounded-2xl border border-border bg-card p-6 text-card-foreground">
      <div className="flex items-center gap-3 pb-1">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
          <KeyRound className="h-4 w-4" />
        </div>
        <div>
          <h2 className="text-base font-bold">Нууц үг солих</h2>
          <p className="text-xs text-muted-foreground">Хамгийн багадаа {MIN_LEN} тэмдэгт. Солисны дараа бусад төхөөрөмж дээрх нэвтрэлт хаагдана.</p>
        </div>
      </div>

      <PasswordField id="cp-current" label="Одоогийн нууц үг" value={current} autoComplete="current-password"
        onChange={v => { setCurrent(v); revalidate(v, next, confirm) }}
        error={errors.current} show={show.current} onToggle={() => toggle('current')} />
      <PasswordField id="cp-new" label="Шинэ нууц үг" value={next} autoComplete="new-password"
        onChange={v => { setNext(v); revalidate(current, v, confirm) }}
        error={errors.next} show={show.next} onToggle={() => toggle('next')} />
      <PasswordField id="cp-confirm" label="Шинэ нууц үг (давтах)" value={confirm} autoComplete="new-password"
        onChange={v => { setConfirm(v); revalidate(current, next, v) }}
        error={errors.confirm} show={show.confirm} onToggle={() => toggle('confirm')} />

      <Button type="submit" disabled={saving} className="w-full">
        {saving ? <><Loader2 className="h-4 w-4 animate-spin" /> Хадгалж байна...</> : 'Нууц үг солих'}
      </Button>
    </form>
  )
}
