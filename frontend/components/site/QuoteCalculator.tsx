'use client'

import { useMemo, useState } from 'react'
import { Check, Copy, Mail, MessageCircle, Phone, Trash2 } from 'lucide-react'
import ItemBuilder, { chip, input, label } from './ItemBuilder'
import {
  catalog,
  catBySlug,
  categories,
  fmt,
  getItem,
  priceLine,
  shippingFee,
  typesOf,
  vatPart,
  type Line,
  type Shipping,
} from '@/lib/pricing'

const PHONE = '7200-0444'
const EMAIL = 'info@bizprint.mn'
const MESSENGER = 'https://m.me/bizprintpro'

/** URL-аас эхний сонголт: ?code=BP-005, ?cat=banner|Баннер, стенд, хуучин ?tab=offset */
function initialFrom(params?: { code?: string; cat?: string; tab?: string }) {
  const it = params?.code ? getItem(params.code) : undefined
  if (it && !it.addon) return { cat: it.cat, code: it.code }
  const legacy: Record<string, string> = { offset: 'Маркетингийн хэвлэл', ai: 'Хаяг реклам', detailed: 'Баннер, стенд', quick: 'Нэрийн хуудас' }
  const c = params?.cat
  const cat = (c && (categories.includes(c) ? c : catBySlug(c))) || legacy[params?.tab || ''] || categories[0]
  return { cat, code: undefined }
}

export default function QuoteCalculator({ initial }: { initial?: { code?: string; cat?: string; tab?: string } }) {
  const start = useMemo(() => initialFrom(initial), [initial])
  const [cat, setCat] = useState(start.cat)
  const [lines, setLines] = useState<Line[]>([])
  const [ship, setShip] = useState<Shipping>({ mode: 'pickup' })
  const [copied, setCopied] = useState(false)

  const priced = lines.map((l) => ({ line: l, p: priceLine(l)! })).filter((x) => x.p)
  const subtotal = priced.reduce((s, x) => s + x.p.inc, 0)
  const shipping = shippingFee(priced.map((x) => x.p), ship)
  const total = subtotal + shipping.fee

  const summaryText = () => {
    const rows = priced.map((x, i) => `${i + 1}. ${x.p.title}${x.p.subtitle ? ` (${x.p.subtitle})` : ''} — ${x.p.steps.join('; ')} = ${fmt(x.p.inc)}`)
    const shipRow = ship.mode === 'pickup' ? 'Хүргэлт: өөрөө ирж авна' : `Хүргэлт: ${shipping.note} — ${fmt(shipping.fee)}`
    return [`BizPrint үнийн тооцоо (${catalog.version})`, ...rows, shipRow, `Нийт (НӨАТ орсон): ${fmt(total)}`].join('\n')
  }
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(summaryText())
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {}
  }

  return (
    <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_400px]">
      {/* ---------- Сонголт ---------- */}
      <div className="space-y-6 rounded-3xl bg-[#F5F5F5] p-5 sm:p-8">
        <div>
          <span className={label}>1. Ангилал</span>
          <div className="flex flex-wrap gap-2">
            {categories.map((c) => (
              <button key={c} type="button" className={chip(c === cat)} onClick={() => setCat(c)}>{c}</button>
            ))}
          </div>
        </div>
        <ItemBuilder key={cat} types={typesOf(cat)} initialCode={cat === start.cat ? start.code : undefined} firstStep={2}
          actionLabel="Захиалгад нэмэх" onAction={(line) => setLines((ls) => [...ls, line])} />
      </div>

      {/* ---------- Захиалгын дүн ---------- */}
      <aside className="space-y-4 rounded-3xl border border-gray-200 bg-white p-5 sm:p-6 lg:sticky lg:top-28">
        <div className="flex items-baseline justify-between">
          <h2 className="text-[20px] font-medium tracking-[-0.02em] text-gray-900">Таны захиалга</h2>
          <span className="text-[12px] text-gray-500">{lines.length} бараа</span>
        </div>

        {priced.length === 0 ? (
          <p className="rounded-2xl bg-[#F5F5F5] p-4 text-[13px] leading-[1.55] text-gray-600">
            Бараагаа сонгоод «Захиалгад нэмэх» дарна уу. Олон бараа нэг захиалгад нэмж болно — хүргэлт нэг л удаа бодогдоно.
          </p>
        ) : (
          <ul className="divide-y divide-gray-100">
            {priced.map(({ line, p }) => (
              <li key={line.id} className="flex gap-3 py-3">
                <div className="min-w-0 flex-1">
                  <p className="text-[14px] text-gray-900">{p.title}</p>
                  {p.subtitle && <p className="text-[12px] text-gray-500">{p.subtitle}</p>}
                  {p.steps.map((s) => <p key={s} className="text-[12px] text-gray-500">{s}</p>)}
                  {p.delivery === 'INSTALL' && <p className="text-[12px] text-[#FF6B00]">Суурилуулалт тусдаа үнийн санал</p>}
                </div>
                <div className="flex shrink-0 flex-col items-end gap-1">
                  <span className="text-[14px] font-medium text-gray-900">{fmt(p.inc)}</span>
                  <button type="button" aria-label="Устгах" onClick={() => setLines((ls) => ls.filter((l) => l.id !== line.id))} className="text-gray-400 hover:text-gray-900">
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}

        <div>
          <span className={label}>Хүргэлт</span>
          <div className="flex flex-wrap gap-2">
            <button type="button" className={chip(ship.mode === 'pickup')} onClick={() => setShip({ mode: 'pickup' })}>Очиж авна</button>
            <button type="button" className={chip(ship.mode === 'city')} onClick={() => setShip({ mode: 'city', location: catalog.delivery.locations[0].name })}>Хотод хүргүүлэх</button>
            <button type="button" className={chip(ship.mode === 'countryside')} onClick={() => setShip({ mode: 'countryside' })}>Орон нутаг</button>
          </div>
          {ship.mode === 'city' && (
            <select value={ship.location} onChange={(e) => setShip({ mode: 'city', location: e.target.value })} className={`${input} mt-3`}>
              {catalog.delivery.locations.map((l) => (
                <option key={l.name} value={l.name}>{l.name} — {l.district} (Бүс {l.zone})</option>
              ))}
            </select>
          )}
          <p className="mt-2 text-[12px] leading-[1.5] text-gray-500">
            {ship.mode === 'pickup' ? catalog.delivery.pickup : ship.mode === 'countryside' ? catalog.delivery.countryside : catalog.delivery.time}
          </p>
        </div>

        <dl className="space-y-1.5 border-t border-gray-100 pt-4 text-[14px]">
          <div className="flex justify-between text-gray-600"><dt>Бараа (НӨАТ орсон)</dt><dd>{fmt(subtotal)}</dd></div>
          <div className="flex justify-between text-gray-600">
            <dt>Хүргэлт</dt>
            <dd>{ship.mode === 'pickup' ? '0₮' : priced.length ? fmt(shipping.fee) : '—'}</dd>
          </div>
          {ship.mode !== 'pickup' && priced.length > 0 && shipping.note && <p className="text-[12px] text-gray-500">{shipping.note}</p>}
          <div className="flex items-baseline justify-between pt-2">
            <dt className="text-gray-900">Нийт</dt>
            <dd className="text-[30px] font-medium leading-none tracking-[-0.02em] text-[#FF6B00]">{fmt(total)}</dd>
          </div>
          <p className="text-right text-[12px] text-gray-500">Үүнээс НӨАТ {fmt(vatPart(subtotal))}</p>
          {shipping.hasInstall && <p className="text-[12px] text-gray-600">Хаяг реклам, лайтбокс зэрэг суурилуулалттай барааны ачилт, суурилуулалт энд ороогүй.</p>}
        </dl>

        <div className="space-y-2">
          <a href={`${MESSENGER}?text=${encodeURIComponent(priced.length ? summaryText() : 'Сайн байна уу, үнийн санал авмаар байна.')}`} target="_blank" rel="noopener noreferrer"
            className="flex w-full items-center justify-center gap-2 rounded-full bg-[#FF6B00] px-6 py-3.5 text-[14px] font-medium text-white hover:opacity-90">
            <MessageCircle className="h-4 w-4" /> Messenger-ээр захиалах
          </a>
          <div className="grid grid-cols-[1.3fr_1fr_1fr] gap-2 whitespace-nowrap">
            <a href={`tel:${PHONE.replace('-', '')}`} className="flex items-center justify-center gap-1.5 rounded-full border border-gray-200 px-3 py-2.5 text-[13px] text-gray-900 hover:border-gray-400"><Phone className="h-4 w-4" />{PHONE}</a>
            <a href={`mailto:${EMAIL}?subject=${encodeURIComponent('Үнийн санал')}&body=${encodeURIComponent(summaryText())}`} className="flex items-center justify-center gap-1.5 rounded-full border border-gray-200 px-3 py-2.5 text-[13px] text-gray-900 hover:border-gray-400"><Mail className="h-4 w-4" />Имэйл</a>
            <button type="button" onClick={copy} disabled={!priced.length} className="flex items-center justify-center gap-1.5 rounded-full border border-gray-200 px-3 py-2.5 text-[13px] text-gray-900 hover:border-gray-400 disabled:opacity-40">
              {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}{copied ? 'Хуулсан' : 'Хуулах'}
            </button>
          </div>
        </div>
        <p className="text-[11px] leading-[1.5] text-gray-400">
          {catalog.version}. Бүх үнэ НӨАТ орсон. Дизайн хийлгэх, яаралтай гүйцэтгэл, онцгой материалын үнийг менежер баталгаажуулна.
        </p>
      </aside>
    </div>
  )
}
