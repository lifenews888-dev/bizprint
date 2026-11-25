'use client'

import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { useMemo, useState } from 'react'
import { Trash2 } from 'lucide-react'
import ItemBuilder, { chip, input, label } from '@/components/site/ItemBuilder'
import { catBySlug, categories, fmt, getItem, priceLine, typesOf, vatPart, type Line, type Priced } from '@/lib/pricing'
import { apiFetch, getToken } from '@/lib/api'
import { brand } from '@/components/site/content'

const MESSENGER = 'https://m.me/bizprintpro'

type CLine = { line: Line; type: string; people: number; notes: string }
type Done = { id: string; code: string; estimate: number; linked: boolean }

/** Нэр тус бүрээр хийгддэг бараа — анхнаасаа «хүний тоо» талбарыг харуулна */
const PERSONAL = new Set(['bizcard', 'idcard', 'badge', 'medal', 'letterhead'])

export default function CampaignRequestView() {
  const sp = useSearchParams()
  const startCat = useMemo(() => {
    const c = sp.get('cat') || ''
    return (categories.includes(c) ? c : catBySlug(c)) || categories[0]
  }, [sp])
  const [cat, setCat] = useState(startCat)
  const [lines, setLines] = useState<CLine[]>([])
  const [f, setF] = useState({ company: '', contact_name: '', phone: '', email: '', deadline: '', notes: '', budget: '' })
  const [sending, setSending] = useState(false)
  const [error, setError] = useState('')
  const [done, setDone] = useState<Done | null>(null)

  const priced = lines
    .map((l) => ({ ...l, p: priceLine(l.line) as Priced | null }))
    .filter((x): x is CLine & { p: Priced } => !!x.p)
  const total = priced.reduce((s, x) => s + x.p.inc * x.people, 0)
  const set = (k: keyof typeof f, v: string) => setF((o) => ({ ...o, [k]: v }))
  const patch = (id: string, p: Partial<CLine>) => setLines((ls) => ls.map((l) => (l.line.id === id ? { ...l, ...p } : l)))

  const add = (line: Line) => {
    const item = line.kind === 'item' ? getItem(line.code) : undefined
    const type = typesOf(cat).find((t) => t.codes.includes(line.code))?.slug || item?.type || ''
    setLines((ls) => [...ls, { line, type, people: 1, notes: '' }])
    setError('')
  }

  const submit = async () => {
    if (!priced.length) return setError('Дор хаяж нэг бүтээгдэхүүн нэмнэ үү.')
    if (!f.company.trim() || !f.contact_name.trim()) return setError('Байгууллага, холбогдох хүний нэрээ оруулна уу.')
    if (f.phone.replace(/\D/g, '').length < 6) return setError('Утасны дугаараа оруулна уу — бид утсаар холбогдоно.')
    setSending(true); setError('')
    try {
      const payload = {
        ...f,
        budget: Number(f.budget) || 0,
        lines: priced.map((x) => ({ type: x.type, title: x.p.title, subtitle: x.p.subtitle, people: x.people, notes: x.notes, line: x.line })),
      }
      let res: Done
      try {
        res = await apiFetch<Done>('/campaigns/request', { method: 'POST', body: payload })
      } catch (e) {
        // Backend шинэчлэгдээгүй (404) үед хүсэлт алдагдахгүй — нийтийн /inquiries руу илгээнэ
        if (!/cannot post|not found|404/i.test(String((e as Error)?.message || ''))) throw e
        const rows = priced.map((x, i) => `${i + 1}. ${x.p.title}${x.p.subtitle ? ` (${x.p.subtitle})` : ''}${x.people > 1 ? ` × ${x.people}` : ''} — ${fmt(x.p.inc * x.people)}${x.notes ? ` · ${x.notes}` : ''}`)
        const inq = await apiFetch<{ id: string; inquiry_number?: string }>('/inquiries', {
          method: 'POST',
          body: {
            customer_name: f.contact_name, customer_phone: f.phone, customer_email: f.email || undefined, customer_company: f.company,
            product_name: `Байгууллагын захиалга — ${priced.length} бараа`, category: 'campaign',
            quantity: Math.max(1, priced.reduce((s, x) => s + x.people, 0)),
            estimated_price: Math.round(total), preferred_contact: 'phone',
            notes: [...rows, `Урьдчилсан дүн (НӨАТ орсон): ${fmt(total)}`, f.deadline && `Хугацаа: ${f.deadline}`, f.budget && `Төсөв: ${fmt(Number(f.budget))}`, f.notes].filter(Boolean).join('\n'),
            pricing_snapshot: { source: 'campaign-request', lines: payload.lines, total },
          },
        })
        res = { id: inq.id, code: inq.inquiry_number || 'Хүсэлт', estimate: total, linked: false }
      }
      setDone(res)
      window.scrollTo({ top: 0, behavior: 'smooth' })
    } catch (e) {
      setError((e as Error)?.message || 'Илгээхэд алдаа гарлаа. Утсаар холбогдоно уу.')
    } finally {
      setSending(false)
    }
  }

  if (done) {
    return (
      <div className="bg-white">
        <section className="mx-auto max-w-[760px] px-5 py-16 text-center sm:py-24">
          <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-[#FF6B00] to-[#8B5CF6] text-[30px] text-white">✓</div>
          <p className="text-[12px] font-medium uppercase tracking-[0.12em] text-gray-500">Хүсэлтийн дугаар · {done.code}</p>
          <h1 className="mt-3">Хүсэлт хүлээн авлаа.</h1>
          <p className="mx-auto mt-4 max-w-lg text-[16px] leading-[1.6] text-gray-600">
            Манай менежер ажлын <b>24 цагийн дотор</b> {f.phone} дугаарт холбогдож эцсийн үнийн санал, хугацааг баталгаажуулна.
            Урьдчилсан дүн: <b className="text-gray-900">{fmt(done.estimate)}</b> (НӨАТ орсон).
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <a href={brand.phoneHref} className="rounded-full bg-[#FF6B00] px-5 py-3 text-[14px] font-semibold text-white hover:bg-[#e65f00]">Одоо залгах · {brand.phone}</a>
            <a href={MESSENGER} target="_blank" rel="noopener noreferrer" className="rounded-full border border-gray-200 px-5 py-3 text-[14px] font-medium text-gray-900 hover:border-gray-400">Messenger-ээр бичих</a>
            {done.linked && getToken() && (
              <Link href={`/campaign/${done.id}`} className="rounded-full border border-gray-200 px-5 py-3 text-[14px] font-medium text-gray-900 hover:border-gray-400">Хүсэлтээ харах</Link>
            )}
          </div>
          <button type="button" onClick={() => { setDone(null); setLines([]) }} className="mt-8 text-[13px] text-gray-500 underline underline-offset-4 hover:text-gray-900">Шинэ хүсэлт үүсгэх</button>
        </section>
      </div>
    )
  }

  return (
    <div className="bg-white">
      {/* HERO */}
      <section className="mx-auto max-w-[1440px] px-5 pb-8 pt-10 sm:px-8 sm:pt-14 lg:px-12">
        <p className="mb-4 text-[12px] font-medium uppercase tracking-[0.1em] text-gray-500">Байгууллагад · кампанит ажил</p>
        <h1 className="max-w-4xl">Олон бүтээгдэхүүнээ нэг хүсэлтээр.</h1>
        <p className="mt-4 max-w-2xl text-[15px] leading-[1.6] text-gray-600 sm:text-[17px]">
          Нэрийн хуудас, баннер, туг, брошур, бэлэг — бүгдийг сонгоод үнээ шууд хараарай. Эцсийн үнийн санал, хугацааг менежер 24 цагт баталгаажуулна.
        </p>
        <div className="mt-6 flex flex-wrap gap-2">
          <a href={brand.phoneHref} className="inline-flex items-center gap-2 rounded-full bg-gray-900 px-4 py-2.5 text-[13px] font-medium text-white hover:bg-black">📞 {brand.phone}</a>
          <a href={MESSENGER} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 rounded-full border border-gray-200 px-4 py-2.5 text-[13px] text-gray-800 hover:border-gray-400">💬 Messenger</a>
          <button type="button" onClick={() => window.dispatchEvent(new Event('bizprint:open-chat'))} className="inline-flex items-center gap-2 rounded-full border border-gray-200 px-4 py-2.5 text-[13px] text-gray-800 hover:border-gray-400">⚡ Онлайн чат</button>
          <a href={`mailto:${brand.email}`} className="inline-flex items-center gap-2 rounded-full border border-gray-200 px-4 py-2.5 text-[13px] text-gray-800 hover:border-gray-400">✉️ {brand.email}</a>
        </div>
        <ul className="mt-8 grid gap-3 sm:grid-cols-3">
          {[
            ['Үнэ шууд', 'Албан үнийн жагсаалтаар НӨАТ орсон урьдчилсан дүн тооцогдоно.'],
            ['24 цагт санал', 'Менежер утсаар холбогдож эцсийн үнийн санал, хугацааг илгээнэ.'],
            ['НӨАТ-тэй нэхэмжлэх', 'Байгууллагын нэр дээр нэхэмжлэх, И-баримт гаргана.'],
          ].map(([t, s], i) => (
            <li key={t} className="flex gap-3 rounded-2xl bg-[#F6F5FA] p-4">
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-[#FF6B00] to-[#8B5CF6] text-[13px] font-semibold text-white">{i + 1}</span>
              <span><b className="block text-[14px] text-gray-900">{t}</b><span className="text-[13px] leading-snug text-gray-600">{s}</span></span>
            </li>
          ))}
        </ul>
      </section>

      <section className="mx-auto max-w-[1440px] px-5 pb-24 sm:px-8 lg:px-12">
        <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_420px]">
          <div className="space-y-6">
            {/* 1. Бүтээгдэхүүн */}
            <div className="space-y-6 rounded-3xl bg-[#F5F5F5] p-5 sm:p-8">
              <div>
                <h2 className="mb-1 text-[22px] font-medium tracking-[-0.02em] text-gray-900">1. Бүтээгдэхүүн сонгох</h2>
                <p className="text-[13px] text-gray-500">Бараа бүрийг тохируулаад «Хүсэлтэд нэмэх» дарна. Хэдэн ч бараа нэмж болно.</p>
              </div>
              <div>
                <span className={label}>Ангилал</span>
                <div className="flex flex-wrap gap-2">
                  {categories.map((c) => (
                    <button key={c} type="button" className={chip(c === cat)} onClick={() => setCat(c)}>{c}</button>
                  ))}
                </div>
              </div>
              <ItemBuilder key={cat} types={typesOf(cat)} firstStep={2} actionLabel="Хүсэлтэд нэмэх" onAction={(line) => add(line)} />
            </div>

            {/* 2. Байгууллага */}
            <div className="rounded-3xl border border-gray-200 p-5 sm:p-8">
              <h2 className="mb-1 text-[22px] font-medium tracking-[-0.02em] text-gray-900">2. Байгууллагын мэдээлэл</h2>
              <p className="mb-6 text-[13px] text-gray-500">Нэвтрэх шаардлагагүй. Бид энэ утсаар холбогдоно.</p>
              <div className="grid gap-4 sm:grid-cols-2">
                <label className="block"><span className={label}>Байгууллага *</span>
                  <input className={input} value={f.company} onChange={(e) => set('company', e.target.value)} placeholder="ХХК, байгууллагын нэр" autoComplete="organization" /></label>
                <label className="block"><span className={label}>Холбогдох хүн *</span>
                  <input className={input} value={f.contact_name} onChange={(e) => set('contact_name', e.target.value)} placeholder="Нэр, албан тушаал" autoComplete="name" /></label>
                <label className="block"><span className={label}>Утас *</span>
                  <input className={input} value={f.phone} onChange={(e) => set('phone', e.target.value)} placeholder="9911-2233" inputMode="tel" autoComplete="tel" /></label>
                <label className="block"><span className={label}>Имэйл</span>
                  <input className={input} value={f.email} onChange={(e) => set('email', e.target.value)} placeholder="name@company.mn" type="email" autoComplete="email" /></label>
                <label className="block"><span className={label}>Хэзээ хэрэгтэй вэ</span>
                  <input className={input} type="date" value={f.deadline} onChange={(e) => set('deadline', e.target.value)} /></label>
                <label className="block"><span className={label}>Төсөв (₮, заавал биш)</span>
                  <input className={input} inputMode="numeric" value={f.budget} onChange={(e) => set('budget', e.target.value.replace(/\D/g, ''))} placeholder="Жишээ: 3000000" /></label>
                <label className="block sm:col-span-2"><span className={label}>Нэмэлт тайлбар</span>
                  <textarea className={`${input} min-h-[96px]`} value={f.notes} onChange={(e) => set('notes', e.target.value)} placeholder="Арга хэмжээ, брэндийн өнгө, загвар хийлгэх эсэх, хүргэх хаяг…" /></label>
              </div>
            </div>
          </div>

          {/* Хураангуй */}
          <aside className="space-y-4 rounded-3xl border border-gray-200 bg-white p-5 sm:p-6 lg:sticky lg:top-28">
            <div className="flex items-baseline justify-between">
              <h2 className="text-[20px] font-medium tracking-[-0.02em] text-gray-900">Таны хүсэлт</h2>
              <span className="text-[12px] text-gray-500">{priced.length} бараа</span>
            </div>
            {priced.length === 0 ? (
              <p className="rounded-2xl bg-[#F5F5F5] p-4 text-[13px] leading-[1.55] text-gray-600">
                Зүүн талаас бараагаа сонгоод «Хүсэлтэд нэмэх» дарна уу. Нэр тус бүрээр хийх бараанд (нэрийн хуудас, үнэмлэх) хүний тоог оруулна.
              </p>
            ) : (
              <ul className="divide-y divide-gray-100">
                {priced.map((x) => (
                  <li key={x.line.id} className="py-3">
                    <div className="flex gap-3">
                      <div className="min-w-0 flex-1">
                        <p className="text-[14px] text-gray-900">{x.p.title}</p>
                        {x.p.subtitle && <p className="text-[12px] text-gray-500">{x.p.subtitle}</p>}
                        {x.p.steps.map((s) => <p key={s} className="text-[12px] text-gray-500">{s}</p>)}
                      </div>
                      <div className="flex shrink-0 flex-col items-end gap-1">
                        <span className="text-[14px] font-medium text-gray-900">{fmt(x.p.inc * x.people)}</span>
                        <button type="button" aria-label="Устгах" onClick={() => setLines((ls) => ls.filter((l) => l.line.id !== x.line.id))} className="text-gray-400 hover:text-gray-900"><Trash2 className="h-4 w-4" /></button>
                      </div>
                    </div>
                    <div className="mt-2 flex flex-wrap items-center gap-2 text-[12px] text-gray-600">
                      <span>{PERSONAL.has(x.type) ? 'Хэдэн хүнд (нэр тус бүр)' : 'Хэдэн салбар/багц'}</span>
                      <input type="number" min={1} value={x.people} onChange={(e) => patch(x.line.id, { people: Math.max(1, Number(e.target.value) || 1) })}
                        className="w-20 rounded-lg border border-gray-200 px-2 py-1 text-center text-[13px] text-gray-900 outline-none focus:border-gray-900" />
                      {x.people > 1 && <span className="text-gray-500">× {fmt(x.p.inc)}</span>}
                    </div>
                    <input value={x.notes} onChange={(e) => patch(x.line.id, { notes: e.target.value })} placeholder="Тайлбар (өнгө, загвар, хаяг…)"
                      className="mt-2 w-full rounded-lg border border-gray-100 bg-[#FAFAFA] px-2.5 py-1.5 text-[12px] text-gray-800 outline-none focus:border-gray-300" />
                  </li>
                ))}
              </ul>
            )}
            <dl className="space-y-1.5 border-t border-gray-100 pt-4 text-[14px]">
              <div className="flex items-baseline justify-between">
                <dt className="text-gray-900">Урьдчилсан дүн</dt>
                <dd className="text-[30px] font-medium leading-none tracking-[-0.02em] text-[#FF6B00]">{fmt(total)}</dd>
              </div>
              <p className="text-right text-[12px] text-gray-500">НӨАТ орсон · үүнээс НӨАТ {fmt(vatPart(total))}</p>
              <p className="text-[12px] leading-[1.5] text-gray-500">Их тиражид хөнгөлөлт, хүргэлт, загварын үнийг менежер эцсийн санал дээр тохирно.</p>
            </dl>
            {error && <p className="rounded-xl bg-red-50 px-3 py-2 text-[13px] text-red-700">{error}</p>}
            <button type="button" onClick={submit} disabled={sending}
              className="w-full rounded-full bg-[#FF6B00] px-5 py-3.5 text-[15px] font-semibold text-white transition-colors hover:bg-[#e65f00] disabled:opacity-60">
              {sending ? 'Илгээж байна…' : 'Хүсэлт илгээх →'}
            </button>
            <p className="text-center text-[12px] text-gray-500">Ажлын 24 цагт үнийн саналтай холбогдоно · {brand.phone}</p>
          </aside>
        </div>
      </section>
    </div>
  )
}
