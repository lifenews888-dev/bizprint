'use client'

import Link from 'next/link'
import { useMemo, useState } from 'react'
import { ArrowLeft, ArrowRight, Check, ImagePlus, Loader2, Pencil, X } from 'lucide-react'
import ItemBuilder, { input, label } from '@/components/site/ItemBuilder'
import { fmt, getType, vatPart, type Line, type Priced } from '@/lib/pricing'
import { apiFetch } from '@/lib/api'
import { BIZCARD_COUNT, bizcardCodes, bizcardImg } from '@/lib/bizcard-templates'

type Card = {
  name: string; title: string; company: string; phone: string; phone2: string
  email: string; web: string; address: string; extra: string
}
const EMPTY: Card = { name: '', title: '', company: '', phone: '', phone2: '', email: '', web: '', address: '', extra: '' }

const FIELDS: { k: keyof Card; l: string; ph: string; req?: boolean; type?: string; wide?: boolean }[] = [
  { k: 'name', l: 'Овог нэр', ph: 'Б. Бат-Эрдэнэ', req: true },
  { k: 'title', l: 'Албан тушаал', ph: 'Гүйцэтгэх захирал' },
  { k: 'company', l: 'Байгууллага', ph: 'Компанийн нэр', wide: true },
  { k: 'phone', l: 'Утас', ph: '9911 2233', req: true, type: 'tel' },
  { k: 'phone2', l: 'Утас 2', ph: 'Нэмэлт утас', type: 'tel' },
  { k: 'email', l: 'Имэйл', ph: 'name@company.mn', type: 'email' },
  { k: 'web', l: 'Вэб сайт', ph: 'www.company.mn' },
  { k: 'address', l: 'Хаяг', ph: 'Дүүрэг, хороо, байр', wide: true },
  { k: 'extra', l: 'Нэмэлт (QR линк, сошиал, ар талын текст)', ph: 'facebook.com/… эсвэл QR-т орох холбоос', wide: true },
]

const MAX_LOGO = 15 * 1024 * 1024

export default function BizcardTemplateView({ code }: { code: string }) {
  const type = getType('bizcard')
  const idx = bizcardCodes.indexOf(code)
  const prev = bizcardCodes[(idx + BIZCARD_COUNT - 1) % BIZCARD_COUNT]
  const next = bizcardCodes[(idx + 1) % BIZCARD_COUNT]

  const [view, setView] = useState<'mock' | 'f' | 'b'>('mock')
  const [pick, setPick] = useState<{ line: Line; priced: Priced } | null>(null)
  const [card, setCard] = useState<Card>(EMPTY)
  const [logo, setLogo] = useState<File | null>(null)
  const [noLogo, setNoLogo] = useState(false)
  const [orderer, setOrderer] = useState({ name: '', phone: '', email: '' })
  const [notes, setNotes] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [done, setDone] = useState<{ number: string } | null>(null)

  const logoUrl = useMemo(() => (logo && logo.type.startsWith('image/') ? URL.createObjectURL(logo) : ''), [logo])
  const set = (k: keyof Card, v: string) => setCard((c) => ({ ...c, [k]: v }))

  const onLogo = (f: File | undefined) => {
    setError('')
    if (!f) return
    if (f.size > MAX_LOGO) return setError('Логоны файл 15MB-аас ихгүй байх ёстой.')
    setLogo(f)
    setNoLogo(false)
  }

  const submit = async () => {
    setError('')
    if (!pick) return setError('Цаас, бүрэлт, тоо ширхэгээ сонгоод «Энэ сонголтоор үргэлжлүүлэх» дарна уу.')
    if (!card.name.trim()) return setError('Нэрийн хуудсанд орох нэрээ оруулна уу.')
    if (card.phone.replace(/\D/g, '').length < 6) return setError('Нэрийн хуудсанд орох утасны дугаараа оруулна уу.')
    if (!logo && !noLogo) return setError('Логогоо оруулна уу, эсвэл «Логогүй» гэдгийг сонгоно уу.')
    const contactName = orderer.name.trim() || card.name.trim()
    const contactPhone = orderer.phone.trim() || card.phone.trim()
    const contactEmail = orderer.email.trim() || card.email.trim()

    const cardLines = FIELDS.filter((f) => card[f.k].trim()).map((f) => `${f.l}: ${card[f.k].trim()}`)
    const body = [
      `Загвар: ${code}`,
      `Сонголт: ${pick.priced.title} — ${pick.priced.subtitle}`,
      `Урьдчилсан үнэ: ${fmt(pick.priced.inc)} (НӨАТ орсон)`,
      '',
      'Нэрийн хуудсанд орох мэдээлэл:',
      ...cardLines,
      `Лого: ${logo ? logo.name : 'логогүй'}`,
      notes.trim() ? `\nТайлбар: ${notes.trim()}` : '',
    ].filter((x) => x !== '').join('\n')

    const fd = new FormData()
    fd.append('customer_name', contactName)
    fd.append('customer_phone', contactPhone)
    if (contactEmail) fd.append('customer_email', contactEmail)
    if (card.company.trim()) fd.append('customer_company', card.company.trim())
    fd.append('product_name', `Нэрийн хуудас — ${code}`)
    fd.append('category', 'business_card')
    fd.append('quantity', String(pick.priced.cartQty || pick.line.qty || 1))
    fd.append('estimated_price', String(pick.priced.inc))
    fd.append('preferred_contact', 'phone')
    fd.append('needs_design', 'true')
    fd.append('has_design', 'false')
    fd.append('notes', body)
    fd.append('pricing_snapshot', JSON.stringify({ source: 'bizcard-template', template: code, line: pick.line, priced: { title: pick.priced.title, subtitle: pick.priced.subtitle, inc: pick.priced.inc }, card }))
    if (logo) fd.append('files', logo)

    setBusy(true)
    try {
      const res = await apiFetch<{ id: string; inquiry_number?: string }>('/inquiries', { method: 'POST', body: fd, auth: false })
      setDone({ number: res?.inquiry_number || res?.id?.slice(0, 8) || '' })
      window.scrollTo({ top: 0, behavior: 'smooth' })
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Илгээж чадсангүй. Дахин оролдоно уу эсвэл утсаар холбогдоно уу.')
    } finally {
      setBusy(false)
    }
  }

  if (done) {
    return (
      <main className="min-h-screen bg-[#F7F5F2] px-5 py-14">
        <div className="mx-auto max-w-xl rounded-3xl bg-white p-7 text-center sm:p-10">
          <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-[#FF6B00] text-white"><Check className="h-7 w-7" /></span>
          <h1 className="mt-5 text-[26px] font-semibold tracking-[-0.02em] text-gray-900">Захиалга хүлээн авлаа</h1>
          {done.number && <p className="mt-2 text-[15px] text-gray-600">Дугаар: <span className="font-medium text-gray-900">{done.number}</span></p>}
          <p className="mt-1 text-[14px] text-gray-500">Загвар {code} · {pick && fmt(pick.priced.inc)}</p>
          <ol className="mt-7 space-y-3 text-left text-[14px] text-gray-700">
            <li className="flex gap-3"><b className="text-[#FF6B00]">1.</b> Манай дизайнер таны мэдээлэл, логогоор {code} загварын эх бэлтгэлийг хийнэ.</li>
            <li className="flex gap-3"><b className="text-[#FF6B00]">2.</b> Бэлэн болсон загварыг утас эсвэл имэйлээр илгээж батлуулна. Засвар байвал хэлээрэй.</li>
            <li className="flex gap-3"><b className="text-[#FF6B00]">3.</b> Батласны дараа төлбөрөө төлж, хэвлэлд орно.</li>
          </ol>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <Link href="/business-cards" className="rounded-full border border-gray-300 px-6 py-3 text-[14px] font-medium text-gray-900 hover:border-gray-900">Өөр загвар үзэх</Link>
            <Link href="/" className="rounded-full bg-gray-900 px-6 py-3 text-[14px] font-medium text-white hover:opacity-90">Нүүр хуудас</Link>
          </div>
        </div>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-[#F7F5F2]">
      <div className="mx-auto max-w-6xl px-5 pb-20 pt-6 md:pt-10">
        <nav className="mb-5 flex items-center justify-between gap-3 text-[13px] text-gray-500">
          <Link href="/business-cards" className="inline-flex items-center gap-1.5 hover:text-gray-900"><ArrowLeft className="h-4 w-4" /> Бүх загвар</Link>
          <span className="flex items-center gap-2">
            <Link href={`/business-cards/${prev}`} className="rounded-full bg-white px-3 py-1.5 hover:text-gray-900">← {prev}</Link>
            <Link href={`/business-cards/${next}`} className="rounded-full bg-white px-3 py-1.5 hover:text-gray-900">{next} →</Link>
          </span>
        </nav>

        <div className="grid gap-8 lg:grid-cols-[1fr_1fr] lg:gap-12">
          {/* Зураг */}
          <div className="lg:sticky lg:top-24 lg:self-start">
            <div className="overflow-hidden rounded-3xl bg-white">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={bizcardImg(code, view)} alt={`${code} ${view === 'f' ? 'нүүр' : view === 'b' ? 'ар' : 'мокап'}`}
                className={`w-full ${view === 'mock' ? 'aspect-square object-cover' : 'p-6'}`} />
            </div>
            <div className="mt-3 grid grid-cols-3 gap-2">
              {([['mock', 'Мокап'], ['f', 'Нүүр тал'], ['b', 'Ар тал']] as const).map(([v, t]) => (
                <button key={v} type="button" onClick={() => setView(v)}
                  className={`overflow-hidden rounded-2xl border-2 bg-white text-[12px] ${view === v ? 'border-gray-900' : 'border-transparent'}`}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={bizcardImg(code, v)} alt="" loading="lazy" className={`h-20 w-full ${v === 'mock' ? 'object-cover' : 'object-contain p-2'}`} />
                  <span className="block py-1.5 text-gray-700">{t}</span>
                </button>
              ))}
            </div>
            <p className="mt-3 text-[12px] leading-[1.5] text-gray-500">
              Зураг дээрх нэр, утас, лого жишээ. Таны мэдээллээр солиод, өнгө, байрлалыг загварт нь тааруулна. 90×55 мм.
            </p>
          </div>

          {/* Захиалга */}
          <div>
            <p className="text-[12px] font-medium uppercase tracking-[0.1em] text-[#FF6B00]">Нэрийн хуудасны загвар</p>
            <h1 className="mt-1 text-[clamp(1.9rem,4vw,2.75rem)] font-semibold leading-[1.05] tracking-[-0.03em] text-gray-900">{code}</h1>
            <p className="mt-3 text-[14px] leading-[1.6] text-gray-600">Эх бэлтгэл үнэд багтсан. Батлуулсны дараа хэвлэнэ.</p>

            {/* 1. Сонголт */}
            <section className="mt-6 rounded-3xl bg-white/60 p-5 sm:p-6">
              {pick ? (
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <span className={label}>Цаас, бүрэлт, тоо</span>
                    <p className="text-[15px] font-medium text-gray-900">{pick.priced.title}</p>
                    <p className="text-[13px] text-gray-600">{pick.priced.subtitle}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-[22px] font-medium text-gray-900">{fmt(pick.priced.inc)}</p>
                    <button type="button" onClick={() => setPick(null)} className="inline-flex items-center gap-1 text-[12px] text-[#FF6B00] hover:underline"><Pencil className="h-3 w-3" /> Өөрчлөх</button>
                  </div>
                </div>
              ) : type ? (
                <ItemBuilder types={[type]} firstStep={1} actionLabel="Энэ сонголтоор үргэлжлүүлэх"
                  onAction={(line, priced) => { setPick({ line, priced }); setError('') }} />
              ) : (
                <p className="text-[14px] text-gray-600">Үнийн мэдээлэл ачааллаж чадсангүй.</p>
              )}
            </section>

            {/* 2. Мэдээлэл */}
            <section className="mt-5 rounded-3xl bg-white p-5 sm:p-6">
              <span className={label}>4. Нэрийн хуудсанд орох мэдээлэл</span>
              <div className="grid gap-3 sm:grid-cols-2">
                {FIELDS.map((f) => (
                  <label key={f.k} className={f.wide ? 'sm:col-span-2' : ''}>
                    <span className="mb-1 block text-[13px] text-gray-700">{f.l}{f.req && <span className="text-[#FF6B00]"> *</span>}</span>
                    <input className={input} type={f.type || 'text'} value={card[f.k]} placeholder={f.ph} onChange={(e) => set(f.k, e.target.value)} />
                  </label>
                ))}
              </div>
            </section>

            {/* 3. Лого */}
            <section className="mt-5 rounded-3xl bg-white p-5 sm:p-6">
              <span className={label}>5. Лого</span>
              {logo ? (
                <div className="flex items-center gap-4 rounded-2xl border border-gray-200 p-3">
                  {logoUrl
                    // eslint-disable-next-line @next/next/no-img-element
                    ? <img src={logoUrl} alt="Лого" className="h-16 w-16 rounded-xl bg-gray-50 object-contain" />
                    : <span className="flex h-16 w-16 items-center justify-center rounded-xl bg-gray-100 text-[11px] text-gray-500">{logo.name.split('.').pop()?.toUpperCase()}</span>}
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-[14px] text-gray-900">{logo.name}</span>
                    <span className="block text-[12px] text-gray-500">{(logo.size / 1024 / 1024).toFixed(1)} MB</span>
                  </span>
                  <button type="button" aria-label="Устгах" onClick={() => setLogo(null)} className="rounded-full p-2 text-gray-500 hover:bg-gray-100"><X className="h-4 w-4" /></button>
                </div>
              ) : (
                <label className={`flex cursor-pointer flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed px-4 py-8 text-center transition-colors ${noLogo ? 'border-gray-200 opacity-50' : 'border-gray-300 hover:border-[#FF6B00]'}`}>
                  <ImagePlus className="h-7 w-7 text-[#FF6B00]" />
                  <span className="text-[14px] font-medium text-gray-900">Лого оруулах</span>
                  <span className="text-[12px] text-gray-500">AI, PDF, SVG, EPS эсвэл өндөр чанартай PNG/JPG · 15MB хүртэл</span>
                  <input type="file" className="hidden" accept=".ai,.pdf,.svg,.eps,.png,.jpg,.jpeg,.webp,.cdr,.psd" onChange={(e) => onLogo(e.target.files?.[0])} />
                </label>
              )}
              {!logo && (
                <label className="mt-3 flex items-center gap-2 text-[13px] text-gray-700">
                  <input type="checkbox" checked={noLogo} onChange={(e) => setNoLogo(e.target.checked)} className="h-4 w-4 accent-[#FF6B00]" />
                  Логогүй (зөвхөн нэр, текстээр)
                </label>
              )}
            </section>

            {/* 4. Захиалагч */}
            <section className="mt-5 rounded-3xl bg-white p-5 sm:p-6">
              <span className={label}>6. Захиалагч (хоосон бол нэрийн хуудасны мэдээллийг ашиглана)</span>
              <div className="grid gap-3 sm:grid-cols-3">
                <input className={input} placeholder="Нэр" value={orderer.name} onChange={(e) => setOrderer((o) => ({ ...o, name: e.target.value }))} />
                <input className={input} type="tel" placeholder="Утас" value={orderer.phone} onChange={(e) => setOrderer((o) => ({ ...o, phone: e.target.value }))} />
                <input className={input} type="email" placeholder="Имэйл" value={orderer.email} onChange={(e) => setOrderer((o) => ({ ...o, email: e.target.value }))} />
              </div>
              <textarea className={`${input} mt-3 min-h-[90px]`} placeholder="Тайлбар: өнгө өөрчлөх, хоёр хүний нэрийн хуудас, хүргэлтийн хаяг…" value={notes} onChange={(e) => setNotes(e.target.value)} />
            </section>

            {/* Баталгаажуулах */}
            <section className="mt-5 rounded-3xl bg-gray-900 p-5 text-white sm:p-6">
              <div className="flex flex-wrap items-end justify-between gap-3">
                <div className="text-[13px] text-white/70">
                  <p>Загвар {code}{pick ? ` · ${pick.priced.subtitle}` : ''}</p>
                  <p>Эх бэлтгэл · батлуулсны дараа хэвлэнэ</p>
                </div>
                <div className="text-right">
                  <p className="text-[12px] text-white/60">НӨАТ орсон</p>
                  <p className="text-[28px] font-medium leading-none">{pick ? fmt(pick.priced.inc) : '—'}</p>
                  {pick && <p className="mt-1 text-[11px] text-white/50">Үүнээс НӨАТ {fmt(vatPart(pick.priced.inc))}</p>}
                </div>
              </div>
              {error && <p role="alert" className="mt-4 rounded-xl bg-[#FF6B00]/15 px-4 py-3 text-[13px] text-[#FFB37A]">{error}</p>}
              <button type="button" onClick={submit} disabled={busy}
                className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-full bg-[#FF6B00] px-6 py-4 text-[15px] font-medium text-white hover:opacity-90 disabled:opacity-60">
                {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <ArrowRight className="h-4 w-4" />} Захиалга баталгаажуулах
              </button>
              <p className="mt-3 text-center text-[12px] text-white/50">Төлбөрийг эх бэлтгэл батласны дараа төлнө.</p>
            </section>
          </div>
        </div>
      </div>
    </main>
  )
}
