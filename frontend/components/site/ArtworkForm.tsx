'use client'

import { useState } from 'react'
import { Check, FileUp, Loader2, Palette, X } from 'lucide-react'
import { apiUpload } from '@/lib/api'

/**
 * Хэвлэх эх — төлбөрийн дараа заавал авна.
 *  1) Бэлэн файлтай: хэвлэх файлаа илгээнэ (олон файл болно).
 *  2) Файлгүй: хаяг/бараан дээр гарах нэр, лого, имэйлээ үлдээнэ — BizPrint загварыг имэйлээр илгээнэ.
 */
type Mode = 'file' | 'design'
const ACCEPT = '.pdf,.ai,.eps,.psd,.cdr,.svg,.tif,.tiff,.jpg,.jpeg,.png,.zip,.rar'
const input = 'w-full rounded-[14px] border border-gray-200 bg-white px-4 py-3 text-[15px] text-gray-900 outline-none focus:border-gray-900'

export default function ArtworkForm({ orderId, defaultEmail = '', onDone }: { orderId: string; defaultEmail?: string; onDone?: () => void }) {
  const [mode, setMode] = useState<Mode>('file')
  const [files, setFiles] = useState<File[]>([])
  const [logo, setLogo] = useState<File | null>(null)
  const [brand, setBrand] = useState('')
  const [email, setEmail] = useState(defaultEmail)
  const [notes, setNotes] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [done, setDone] = useState<string | null>(null)

  const submit = async () => {
    setError('')
    if (mode === 'file' && !files.length) return setError('Хэвлэх файлаа сонгоно уу')
    if (mode === 'design') {
      if (!brand.trim()) return setError('Хаяг, бараан дээр гарах нэр/текстээ бичнэ үү')
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) return setError('Загвар илгээх имэйлээ зөв оруулна уу')
    }
    setBusy(true)
    try {
      if (mode === 'file') {
        for (const f of files) {
          const fd = new FormData()
          fd.append('file', f)
          await apiUpload(`/orders/${orderId}/upload-file`, fd)
        }
        setDone(`${files.length} файл хүлээн авлаа. Манай баг шалгаад үйлдвэрт оруулна.`)
      } else {
        const fd = new FormData()
        fd.append('brand_text', brand.trim())
        fd.append('email', email.trim())
        if (notes.trim()) fd.append('notes', notes.trim())
        if (logo) fd.append('logo', logo)
        await apiUpload(`/orders/${orderId}/design-request`, fd)
        setDone(`Хүсэлтийг хүлээн авлаа. Загварыг ${email.trim()} хаяг руу илгээнэ — батласны дараа хэвлэнэ.`)
      }
      onDone?.()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Илгээж чадсангүй, дахин оролдоно уу')
    } finally {
      setBusy(false)
    }
  }

  if (done) {
    return (
      <div className="flex items-start gap-3 rounded-2xl bg-[#F0FDF4] p-5 text-left text-[14px] leading-[1.55] text-[#166534]">
        <Check className="mt-0.5 h-5 w-5 shrink-0" />
        <span>{done}</span>
      </div>
    )
  }

  const card = (on: boolean) =>
    `flex flex-1 items-start gap-3 rounded-2xl border p-4 text-left transition-colors ${on ? 'border-gray-900 bg-white' : 'border-gray-200 bg-white/60 hover:border-gray-400'}`

  return (
    <div className="space-y-5 text-left">
      <div>
        <p className="text-[18px] font-medium tracking-[-0.01em] text-gray-900">Хэвлэх эхээ илгээнэ үү</p>
        <p className="mt-1 text-[13px] leading-[1.5] text-gray-600">Захиалга файл эсвэл лого, нэргүйгээр үйлдвэрт орохгүй. Аль нэгийг нь сонгоно уу.</p>
      </div>

      <div className="flex flex-col gap-2 sm:flex-row">
        <button type="button" className={card(mode === 'file')} onClick={() => setMode('file')}>
          <FileUp className="mt-0.5 h-5 w-5 shrink-0" />
          <span><span className="block text-[14px] font-medium text-gray-900">Бэлэн файлтай</span><span className="block text-[12px] text-gray-500">PDF, AI, PSD, CDR, JPG, PNG…</span></span>
        </button>
        <button type="button" className={card(mode === 'design')} onClick={() => setMode('design')}>
          <Palette className="mt-0.5 h-5 w-5 shrink-0" />
          <span><span className="block text-[14px] font-medium text-gray-900">Загвар хийлгэх</span><span className="block text-[12px] text-gray-500">Лого, нэрээ илгээнэ — загварыг имэйлээр авна</span></span>
        </button>
      </div>

      {mode === 'file' ? (
        <div className="space-y-2">
          <label className="flex cursor-pointer flex-col items-center justify-center gap-1 rounded-2xl border-2 border-dashed border-gray-300 bg-white px-4 py-8 text-center hover:border-gray-500">
            <FileUp className="h-6 w-6 text-gray-500" />
            <span className="text-[14px] text-gray-900">Файл сонгох</span>
            <span className="text-[12px] text-gray-500">Нэг дор олон файл, нэг бүр 50MB хүртэл</span>
            <input type="file" multiple accept={ACCEPT} className="hidden"
              onChange={(e) => setFiles((x) => [...x, ...Array.from(e.target.files || [])])} />
          </label>
          {files.map((f, i) => (
            <div key={`${f.name}-${i}`} className="flex items-center justify-between gap-3 rounded-xl bg-white px-3 py-2 text-[13px]">
              <span className="truncate">{f.name}</span>
              <button type="button" aria-label="Хасах" onClick={() => setFiles((x) => x.filter((_, j) => j !== i))}><X className="h-4 w-4 text-gray-400" /></button>
            </div>
          ))}
        </div>
      ) : (
        <div className="space-y-3">
          <label className="block text-[13px] text-gray-600">Хаяг, бараан дээр гарах нэр/текст *
            <textarea rows={2} value={brand} onChange={(e) => setBrand(e.target.value)} className={`${input} mt-1`} placeholder="Жишээ: «Наран кафе» · 7200-0444" />
          </label>
          <label className="block text-[13px] text-gray-600">Лого (байвал)
            <input type="file" accept={ACCEPT} onChange={(e) => setLogo(e.target.files?.[0] || null)} className="mt-1 block w-full text-[13px]" />
          </label>
          <label className="block text-[13px] text-gray-600">Загвар хүлээн авах имэйл *
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className={`${input} mt-1`} placeholder="name@company.mn" />
          </label>
          <label className="block text-[13px] text-gray-600">Нэмэлт хүсэлт (өнгө, загварын санаа)
            <textarea rows={2} value={notes} onChange={(e) => setNotes(e.target.value)} className={`${input} mt-1`} />
          </label>
        </div>
      )}

      {error && <p className="text-[13px] text-[#DC2626]">{error}</p>}
      <button type="button" onClick={submit} disabled={busy}
        className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-gray-900 px-6 py-3.5 text-[14px] font-medium text-white hover:opacity-90 disabled:opacity-50">
        {busy && <Loader2 className="h-4 w-4 animate-spin" />}
        {mode === 'file' ? 'Файл илгээх' : 'Загварын хүсэлт илгээх'}
      </button>
    </div>
  )
}
