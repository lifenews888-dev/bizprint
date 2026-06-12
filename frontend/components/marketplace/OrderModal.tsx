'use client'

import { useState, useRef } from 'react'
import type { Creator } from './CreatorCard'

/* ═══════════════════════════════════════
 *  Order Modal — 6-step hiring flow
 * ═══════════════════════════════════════ */

interface Package {
  name: string
  label: string
  price: number
  deliveryDays: number
  revisions: number
  features: string[]
}

const DAY_MS = 86400000

const PACKAGES: Package[] = [
  {
    name: 'starter',
    label: 'Starter',
    price: 50000,
    deliveryDays: 5,
    revisions: 1,
    features: ['1 контент', 'Стандарт чанар', '1 засвар'],
  },
  {
    name: 'business',
    label: 'Business',
    price: 150000,
    deliveryDays: 3,
    revisions: 3,
    features: ['3 контент', 'Өндөр чанар', '3 засвар', 'Эх файл'],
  },
  {
    name: 'pro',
    label: 'Pro',
    price: 350000,
    deliveryDays: 2,
    revisions: 5,
    features: ['5 контент', 'Премиум чанар', '5 засвар', 'Эх файл', 'Экспресс хүргэлт'],
  },
]

const STEPS = [
  'Үйлчилгээ сонгох',
  'Багц сонгох',
  'Шаардлага',
  'Файл хавсаргах',
  'Хугацаа',
  'Баталгаажуулах',
]

export default function OrderModal({
  creator,
  open,
  onClose,
}: {
  creator: Creator
  open: boolean
  onClose: () => void
}) {
  const [step, setStep] = useState(0)
  const [service, setService] = useState('')
  const [selectedPkg, setSelectedPkg] = useState<Package | null>(null)
  const [isCustom, setIsCustom] = useState(false)
  const [requirements, setRequirements] = useState('')
  const [files, setFiles] = useState<File[]>([])
  const [deadline, setDeadline] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [dateBounds] = useState(() => {
    const now = Date.now()
    const optionDates = [1, 3, 7, 14].reduce<Record<number, { value: string; label: string }>>((dates, days) => {
      const date = new Date(now + days * DAY_MS)
      dates[days] = {
        value: date.toISOString().split('T')[0],
        label: date.toLocaleDateString('mn-MN', { month: 'short', day: 'numeric', weekday: 'short' }),
      }
      return dates
    }, {})

    return {
      now,
      minDate: new Date(now + DAY_MS).toISOString().split('T')[0],
      maxDate: new Date(now + 90 * DAY_MS).toISOString().split('T')[0],
      optionDates,
    }
  })
  const fileRef = useRef<HTMLInputElement>(null)

  if (!open) return null

  // Combine creator's tags with universal design/prepress services
  const UNIVERSAL_SERVICES = ['Эх бэлтгэл (дизайн файл)', 'Logo дизайн']
  const baseServices = creator.tags.length > 0 ? creator.tags : ['Контент бүтээх']
  const services = Array.from(new Set([...baseServices, ...UNIVERSAL_SERVICES]))

  const canNext = () => {
    if (step === 0) return !!service
    if (step === 1) return !!selectedPkg || isCustom
    if (step === 2) return requirements.trim().length > 10
    if (step === 3) return true // files optional
    if (step === 4) return !!deadline
    return true
  }

  const handleSubmit = async () => {
    setSubmitting(true)
    // In production, this would POST to /orders/creator
    await new Promise(r => setTimeout(r, 1500))
    setSubmitting(false)
    onClose()
    alert('Захиалга амжилттай илгээгдлээ!')
  }

  const reset = () => {
    setStep(0)
    setService('')
    setSelectedPkg(null)
    setIsCustom(false)
    setRequirements('')
    setFiles([])
    setDeadline('')
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => { reset(); onClose() }} />

      {/* Modal */}
      <div
        className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl"
        style={{ background: 'var(--bg)', border: '1px solid var(--border)' }}
      >
        {/* Header */}
        <div
          className="sticky top-0 z-10 px-6 py-4 flex items-center justify-between"
          style={{ background: 'var(--bg)', borderBottom: '1px solid var(--border)' }}
        >
          <div>
            <h2 className="font-bold text-lg" style={{ color: 'var(--text)' }}>
              Захиалга үүсгэх
            </h2>
            <p className="text-xs mt-0.5" style={{ color: 'var(--text3)' }}>
              {creator.name} — Алхам {step + 1}/{STEPS.length}
            </p>
          </div>
          <button
            onClick={() => { reset(); onClose() }}
            className="w-8 h-8 rounded-lg flex items-center justify-center"
            style={{ background: 'var(--surface2)', color: 'var(--text2)' }}
          >
            ✕
          </button>
        </div>

        {/* Progress */}
        <div className="px-6 pt-4">
          <div className="flex gap-1">
            {STEPS.map((s, i) => (
              <div key={s} className="flex-1">
                <div
                  className="h-1 rounded-full transition-colors"
                  style={{
                    background: i <= step ? 'var(--primary)' : 'var(--border)',
                  }}
                />
                <p
                  className="text-[10px] mt-1 truncate"
                  style={{ color: i <= step ? 'var(--primary)' : 'var(--text3)' }}
                >
                  {s}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Content */}
        <div className="px-6 py-5 min-h-[280px]">
          {/* Step 0: Choose service */}
          {step === 0 && (
            <div className="space-y-3">
              <p className="text-sm font-medium mb-4" style={{ color: 'var(--text)' }}>
                Ямар үйлчилгээ авах вэ?
              </p>
              {services.map(s => (
                <button
                  key={s}
                  onClick={() => setService(s)}
                  className="w-full text-left px-4 py-3 rounded-xl text-sm font-medium transition-colors"
                  style={{
                    background: service === s ? 'var(--orange-10)' : 'var(--surface)',
                    border: `1.5px solid ${service === s ? 'var(--primary)' : 'var(--border)'}`,
                    color: service === s ? 'var(--primary)' : 'var(--text)',
                  }}
                >
                  {s}
                </button>
              ))}
            </div>
          )}

          {/* Step 1: Choose package */}
          {step === 1 && (
            <div className="space-y-3">
              <p className="text-sm font-medium mb-4" style={{ color: 'var(--text)' }}>
                Багц сонгоно уу
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {PACKAGES.map(pkg => (
                  <button
                    key={pkg.name}
                    onClick={() => { setSelectedPkg(pkg); setIsCustom(false) }}
                    className="text-left p-4 rounded-xl transition-colors"
                    style={{
                      background: selectedPkg?.name === pkg.name ? 'var(--orange-10)' : 'var(--surface)',
                      border: `1.5px solid ${selectedPkg?.name === pkg.name ? 'var(--primary)' : 'var(--border)'}`,
                    }}
                  >
                    <p className="font-semibold text-sm" style={{ color: 'var(--text)' }}>{pkg.label}</p>
                    <p className="text-lg font-bold mt-1" style={{ color: 'var(--primary)' }}>
                      ₮{pkg.price.toLocaleString()}
                    </p>
                    <p className="text-xs mt-1" style={{ color: 'var(--text3)' }}>
                      {pkg.deliveryDays} хоног · {pkg.revisions} засвар
                    </p>
                    <ul className="mt-2 space-y-1">
                      {pkg.features.map(f => (
                        <li key={f} className="text-xs flex items-center gap-1" style={{ color: 'var(--text2)' }}>
                          <span style={{ color: '#10B981' }}>✓</span> {f}
                        </li>
                      ))}
                    </ul>
                  </button>
                ))}
              </div>
              <button
                onClick={() => { setIsCustom(true); setSelectedPkg(null) }}
                className="w-full text-center py-2.5 rounded-xl text-sm font-medium transition-colors"
                style={{
                  background: isCustom ? 'var(--orange-10)' : 'var(--surface)',
                  border: `1.5px solid ${isCustom ? 'var(--primary)' : 'var(--border)'}`,
                  color: isCustom ? 'var(--primary)' : 'var(--text2)',
                }}
              >
                Захиалгат багц
              </button>
            </div>
          )}

          {/* Step 2: Requirements */}
          {step === 2 && (
            <div>
              <p className="text-sm font-medium mb-3" style={{ color: 'var(--text)' }}>
                Шаардлага, тайлбар бичнэ үү
              </p>
              <textarea
                value={requirements}
                onChange={e => setRequirements(e.target.value)}
                rows={6}
                placeholder="Контентийн зорилго, хэв маяг, брэнд өнгө, бусад шаардлага..."
                className="w-full px-4 py-3 rounded-xl text-sm resize-none"
                style={{
                  background: 'var(--surface)',
                  border: '1px solid var(--border)',
                  color: 'var(--text)',
                }}
              />
              <p className="text-xs mt-1" style={{ color: 'var(--text3)' }}>
                {requirements.length} тэмдэгт (10-ээс дээш)
              </p>
            </div>
          )}

          {/* Step 3: Upload files */}
          {step === 3 && (
            <div>
              <p className="text-sm font-medium mb-3" style={{ color: 'var(--text)' }}>
                Холбогдох файл хавсаргах (заавал биш)
              </p>
              <input
                ref={fileRef}
                type="file"
                multiple
                className="hidden"
                onChange={e => {
                  if (e.target.files) setFiles(prev => [...prev, ...Array.from(e.target.files!)])
                }}
              />
              <button
                onClick={() => fileRef.current?.click()}
                className="w-full py-8 rounded-xl text-sm font-medium transition-colors flex flex-col items-center gap-2"
                style={{
                  background: 'var(--surface)',
                  border: '2px dashed var(--border)',
                  color: 'var(--text2)',
                }}
              >
                <span className="text-2xl">📎</span>
                Файл сонгох
                <span className="text-xs" style={{ color: 'var(--text3)' }}>PNG, JPG, PDF, AI, PSD — 50MB хүртэл</span>
              </button>
              {files.length > 0 && (
                <div className="mt-3 space-y-2">
                  {files.map((f, i) => (
                    <div
                      key={i}
                      className="flex items-center justify-between px-3 py-2 rounded-lg text-sm"
                      style={{ background: 'var(--surface2)', color: 'var(--text2)' }}
                    >
                      <span className="truncate">{f.name}</span>
                      <button
                        onClick={() => setFiles(prev => prev.filter((_, j) => j !== i))}
                        className="text-xs ml-2 shrink-0"
                        style={{ color: '#EF4444' }}
                      >
                        ✕
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Step 4: Deadline */}
          {step === 4 && (
            <div>
              <p className="text-sm font-medium mb-1" style={{ color: 'var(--text)' }}>
                Дуусгах хугацаа сонгоно уу
              </p>
              <p className="text-xs mb-4" style={{ color: 'var(--text3)' }}>
                Энэ creator ердийн захиалгыг <strong style={{ color: 'var(--text)' }}>{creator.deliveryDays} өдөрт</strong> гүйцэтгэдэг
              </p>

              {/* Preset options */}
              <div className="space-y-2 mb-4">
                {[
                  { days: 1, label: 'Яаралтай', desc: 'Маргаашаар', surcharge: '+50%', color: '#EF4444' },
                  { days: 3, label: 'Хурдан', desc: '3 өдрийн дотор', surcharge: '+20%', color: '#F59E0B' },
                  { days: 7, label: 'Энгийн', desc: '1 долоо хоногт', surcharge: '', color: '#10B981' },
                  { days: 14, label: 'Уян', desc: '2 долоо хоногт', surcharge: '-10%', color: '#378ADD' },
                ].map(opt => {
                  const dateInfo = dateBounds.optionDates[opt.days]
                  const dateStr = dateInfo.value
                  const selected = deadline === dateStr
                  const isBelowCreatorMin = opt.days < creator.deliveryDays
                  return (
                    <button
                      key={opt.days}
                      onClick={() => setDeadline(dateStr)}
                      className="w-full flex items-center justify-between px-4 py-3 rounded-xl text-left transition-colors"
                      style={{
                        background: selected ? 'var(--orange-10)' : 'var(--surface)',
                        border: `1.5px solid ${selected ? 'var(--primary)' : 'var(--border)'}`,
                      }}
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className="w-9 h-9 rounded-lg flex items-center justify-center text-sm font-bold flex-shrink-0"
                          style={{ background: opt.color + '15', color: opt.color }}
                        >
                          {opt.days}
                        </div>
                        <div>
                          <div className="text-sm font-semibold flex items-center gap-2" style={{ color: selected ? 'var(--primary)' : 'var(--text)' }}>
                            {opt.label}
                            {isBelowCreatorMin && (
                              <span className="text-[10px] px-1.5 py-0.5 rounded" style={{ background: '#FEF3C7', color: '#92400E' }}>
                                ⚠ Creator-ийн хугацаанаас доогуур
                              </span>
                            )}
                          </div>
                          <div className="text-xs" style={{ color: 'var(--text3)' }}>
                            {opt.desc} · {dateInfo.label}
                          </div>
                        </div>
                      </div>
                      {opt.surcharge && (
                        <span
                          className="text-xs font-semibold flex-shrink-0"
                          style={{ color: opt.surcharge.startsWith('-') ? '#10B981' : '#EF4444' }}
                        >
                          {opt.surcharge}
                        </span>
                      )}
                    </button>
                  )
                })}
              </div>

              {/* Custom date fallback */}
              <div className="pt-3" style={{ borderTop: '1px solid var(--border)' }}>
                <label className="text-xs block mb-2" style={{ color: 'var(--text3)' }}>
                  Эсвэл тодорхой огноо сонгох:
                </label>
                <input
                  type="date"
                  value={deadline}
                  onChange={e => setDeadline(e.target.value)}
                  min={dateBounds.minDate}
                  max={dateBounds.maxDate}
                  className="w-full px-4 py-2.5 rounded-xl text-sm"
                  style={{
                    background: 'var(--surface)',
                    border: '1px solid var(--border)',
                    color: 'var(--text)',
                  }}
                />
                {deadline && (
                  <p className="text-xs mt-2" style={{ color: 'var(--text3)' }}>
                    Сонгосон: <strong style={{ color: 'var(--text)' }}>
                      {new Date(deadline).toLocaleDateString('mn-MN', { year: 'numeric', month: 'long', day: 'numeric', weekday: 'long' })}
                    </strong>
                    {' · '}
                    {Math.max(1, Math.ceil((Date.parse(deadline) - dateBounds.now) / DAY_MS))} өдөрт
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Step 5: Confirm */}
          {step === 5 && (
            <div className="space-y-4">
              <p className="text-sm font-semibold" style={{ color: 'var(--text)' }}>
                Захиалга баталгаажуулах
              </p>
              <div
                className="rounded-xl p-4 space-y-3"
                style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}
              >
                <Row label="Creator" value={creator.name} />
                <Row label="Үйлчилгээ" value={service} />
                <Row label="Багц" value={selectedPkg?.label || 'Захиалгат'} />
                <Row label="Үнэ" value={selectedPkg ? `₮${selectedPkg.price.toLocaleString()}` : 'Тохиролцоно'} highlight />
                <Row label="Хугацаа" value={deadline} />
                <Row label="Файл" value={files.length > 0 ? `${files.length} файл` : 'Байхгүй'} />
                <Row label="Шаардлага" value={requirements.slice(0, 80) + (requirements.length > 80 ? '...' : '')} />
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div
          className="sticky bottom-0 px-6 py-4 flex items-center justify-between gap-3"
          style={{ background: 'var(--bg)', borderTop: '1px solid var(--border)' }}
        >
          {step > 0 ? (
            <button
              onClick={() => setStep(s => s - 1)}
              className="px-4 py-2 rounded-xl text-sm font-medium"
              style={{ background: 'var(--surface2)', color: 'var(--text2)' }}
            >
              Буцах
            </button>
          ) : (
            <div />
          )}
          {step < STEPS.length - 1 ? (
            <button
              disabled={!canNext()}
              onClick={() => setStep(s => s + 1)}
              className="px-6 py-2 rounded-xl text-sm font-semibold text-white transition-opacity disabled:opacity-40"
              style={{ background: 'var(--primary)' }}
            >
              Үргэлжлүүлэх
            </button>
          ) : (
            <button
              disabled={submitting}
              onClick={handleSubmit}
              className="px-6 py-2 rounded-xl text-sm font-semibold text-white transition-opacity disabled:opacity-60"
              style={{ background: '#10B981' }}
            >
              {submitting ? 'Илгээж байна...' : 'Захиалга илгээх'}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

function Row({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div className="flex justify-between text-sm">
      <span style={{ color: 'var(--text3)' }}>{label}</span>
      <span className="font-medium" style={{ color: highlight ? 'var(--primary)' : 'var(--text)' }}>
        {value}
      </span>
    </div>
  )
}
