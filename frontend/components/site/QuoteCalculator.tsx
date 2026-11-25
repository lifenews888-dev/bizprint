'use client'

import { useMemo, useState } from 'react'
import { Check, Copy, Mail, MessageCircle, Minus, Phone, Plus, Trash2 } from 'lucide-react'
import {
  BOOK_CAT,
  BOOK_MIN,
  catalog,
  categories,
  familiesOf,
  fmt,
  fromPrice,
  getItem,
  priceLine,
  shippingFee,
  type Item,
  type Line,
  type Shipping,
} from '@/lib/pricing'

const chip = (on: boolean) =>
  `rounded-full border px-4 py-2 text-[13px] transition-colors ${
    on ? 'border-gray-900 bg-gray-900 text-white' : 'border-gray-200 bg-white text-gray-800 hover:border-gray-400'
  }`
const label = 'mb-2 block text-[12px] font-medium uppercase tracking-[0.08em] text-gray-500'
const input =
  'w-full rounded-[14px] border border-gray-200 bg-white px-4 py-3 text-[15px] text-gray-900 outline-none focus:border-gray-900'

const PHONE = '7200-0444'
const EMAIL = 'info@bizprint.mn'
const MESSENGER = 'https://m.me/bizprintpro'

let seq = 0
const uid = () => `l${Date.now().toString(36)}${(seq++).toString(36)}`

function Stepper({ value, onChange, min = 1, step = 1 }: { value: number; onChange: (n: number) => void; min?: number; step?: number }) {
  return (
    <div className="flex items-center gap-2">
      <button type="button" aria-label="Хасах" className="flex h-11 w-11 items-center justify-center rounded-full border border-gray-200 bg-white hover:border-gray-400" onClick={() => onChange(Math.max(min, value - step))}>
        <Minus className="h-4 w-4" />
      </button>
      <input type="number" inputMode="numeric" min={min} value={value || ''} onChange={(e) => onChange(Number(e.target.value))} className={`${input} w-28 text-center`} />
      <button type="button" aria-label="Нэмэх" className="flex h-11 w-11 items-center justify-center rounded-full border border-gray-200 bg-white hover:border-gray-400" onClick={() => onChange(value + step)}>
        <Plus className="h-4 w-4" />
      </button>
    </div>
  )
}

/** URL-аас эхний сонголтыг тааруулна (?code=BP-005, ?cat=..., хуучин ?tab=offset) */
function initialFrom(params?: { code?: string; cat?: string; tab?: string }) {
  const it = params?.code ? getItem(params.code) : undefined
  if (it) return { cat: it.cat, family: it.family, code: it.code }
  const legacy: Record<string, string> = { offset: 'Офсет хэвлэл', ai: 'Хаяг реклам', detailed: 'Өргөн хэвлэл', quick: 'Офсет хэвлэл' }
  const cat = params?.cat && categories.includes(params.cat) ? params.cat : legacy[params?.tab || ''] || categories[0]
  if (cat === BOOK_CAT) return { cat, family: '', code: '' }
  const fam = familiesOf(cat)[0]
  return { cat, family: fam?.name || '', code: fam?.items[0]?.code || '' }
}

export default function QuoteCalculator({ initial }: { initial?: { code?: string; cat?: string; tab?: string } }) {
  const start = useMemo(() => initialFrom(initial), [initial])
  const [cat, setCat] = useState(start.cat)
  const [family, setFamily] = useState(start.family)
  const [code, setCode] = useState(start.code)
  const [w, setW] = useState(1)
  const [h, setH] = useState(1)
  const [qty, setQty] = useState(1)
  const [rope, setRope] = useState(true)
  // ном
  const [bSize, setBSize] = useState('A5')
  const [bPaper, setBPaper] = useState('80 гр')
  const [bPages, setBPages] = useState(32)
  const [bQty, setBQty] = useState(BOOK_MIN)

  const [lines, setLines] = useState<Line[]>([])
  const [ship, setShip] = useState<Shipping>({ mode: 'pickup' })
  const [copied, setCopied] = useState(false)

  const families = useMemo(() => (cat === BOOK_CAT ? [] : familiesOf(cat)), [cat])
  const fam = families.find((f) => f.name === family)
  const item = getItem(code)

  const pickItem = (it: Item) => {
    setCode(it.code)
    if (it.unit === 'tier') setQty(Math.max(it.min || 10, 50))
    else if (it.unit === 'm2') {
      const p = catalog.presets[it.code]?.[0]
      if (p) { setW(p[0]); setH(p[1]) }
      setQty(1)
    } else setQty(1)
  }
  const pickCat = (c: string) => {
    setCat(c)
    if (c === BOOK_CAT) { setFamily(''); setCode(''); return }
    const f = familiesOf(c)[0]
    setFamily(f.name)
    pickItem(f.items[0])
  }
  const pickFamily = (name: string) => {
    const f = families.find((x) => x.name === name)
    if (!f) return
    setFamily(name)
    pickItem(f.items[0])
  }

  // Багцын бараа: сонголт (цаас, бүрэлт) ба тираж хоёр тусдаа мөр
  const optionNames = useMemo(() => [...new Set((fam?.items || []).map((i) => i.option))], [fam])
  const packSizes = useMemo(
    () => (item?.unit === 'pack' ? (fam?.items || []).filter((i) => i.option === item.option) : []),
    [fam, item],
  )
  const pickOption = (opt: string) => {
    const same = (fam?.items || []).filter((i) => i.option === opt)
    const keepPack = same.find((i) => i.pack && i.pack === item?.pack)
    pickItem(keepPack || same[0])
  }

  // Ном
  const book = useMemo(() => {
    if (cat !== BOOK_CAT) return undefined
    return catalog.books.find((b) => b.size === bSize && b.paper === bPaper && b.pages === bPages)
  }, [cat, bSize, bPaper, bPages])
  const bookSizes = useMemo(() => [...new Set(catalog.books.map((b) => b.size))], [])
  const bookPapers = useMemo(() => [...new Set(catalog.books.map((b) => b.paper))], [])
  const bookPages = useMemo(() => [...new Set(catalog.books.map((b) => b.pages))].sort((a, b) => a - b), [])

  const draft: Line | null =
    cat === BOOK_CAT
      ? book ? { id: 'draft', kind: 'book', code: book.code, qty: bQty } : null
      : item ? { id: 'draft', kind: 'item', code: item.code, w, h, qty, rope } : null
  const draftPrice = draft ? priceLine(draft) : null

  const add = () => {
    if (!draft || !draftPrice || draftPrice.ex <= 0) return
    setLines((ls) => [...ls, { ...draft, id: uid() } as Line])
  }

  const priced = lines.map((l) => ({ line: l, p: priceLine(l)! })).filter((x) => x.p)
  const subtotalEx = priced.reduce((s, x) => s + x.p.ex, 0)
  const subtotalInc = priced.reduce((s, x) => s + x.p.inc, 0)
  const shipping = shippingFee(priced.map((x) => x.p), ship)
  const total = subtotalInc + shipping.fee

  const summaryText = () => {
    const rows = priced.map((x, i) => `${i + 1}. ${x.p.title}${x.p.subtitle ? ` (${x.p.subtitle})` : ''} — ${x.p.steps[0]} = ${fmt(x.p.inc)}`)
    const shipRow =
      ship.mode === 'pickup' ? 'Хүргэлт: өөрөө ирж авна' : `Хүргэлт: ${shipping.note} — ${fmt(shipping.fee)}`
    return [`BizPrint үнийн тооцоо (${catalog.version})`, ...rows, shipRow, `Нийт (НӨАТ-тэй): ${fmt(total)}`].join('\n')
  }
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(summaryText())
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {}
  }

  const presets = item?.unit === 'm2' ? catalog.presets[item.code] || [] : []

  return (
    <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_400px]">
      {/* ---------- Сонголт ---------- */}
      <div className="space-y-6 rounded-3xl bg-[#F5F5F5] p-5 sm:p-8">
        <div>
          <span className={label}>1. Ангилал</span>
          <div className="flex flex-wrap gap-2">
            {categories.map((c) => (
              <button key={c} type="button" className={chip(c === cat)} onClick={() => pickCat(c)}>{c}</button>
            ))}
          </div>
        </div>

        {cat !== BOOK_CAT && (
          <div>
            <span className={label}>2. Бүтээгдэхүүн</span>
            <div className="grid gap-2 sm:grid-cols-2">
              {families.map((f) => {
                const cheapest = f.items.reduce((a, b) => (fromPrice(b).inc < fromPrice(a).inc ? b : a))
                const fp = fromPrice(cheapest)
                const on = f.name === family
                return (
                  <button key={f.name} type="button" onClick={() => pickFamily(f.name)}
                    className={`flex items-center justify-between gap-3 rounded-2xl border px-4 py-3 text-left transition-colors ${on ? 'border-gray-900 bg-white' : 'border-transparent bg-white/70 hover:bg-white'}`}>
                    <span className="text-[14px] text-gray-900">{f.name}</span>
                    <span className="shrink-0 text-[12px] text-gray-500">{fmt(fp.inc)}/{fp.per}-с</span>
                  </button>
                )
              })}
            </div>
          </div>
        )}

        {cat !== BOOK_CAT && item && (
          <>
            {optionNames.length > 1 || optionNames[0] ? (
              <div>
                <span className={label}>3. Сонголт</span>
                <div className="flex flex-wrap gap-2">
                  {optionNames.map((o) => (
                    <button key={o || '—'} type="button" className={chip(o === item.option)} onClick={() => pickOption(o)}>{o || 'Стандарт'}</button>
                  ))}
                </div>
              </div>
            ) : null}

            {packSizes.length > 0 && (
              <div>
                <span className={label}>Тираж</span>
                <div className="flex flex-wrap gap-2">
                  {packSizes.map((p) => (
                    <button key={p.code} type="button" className={chip(p.code === item.code)} onClick={() => pickItem(p)}>
                      {p.pack?.toLocaleString('en-US')} ш · {fmt(fromPrice(p).inc)}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div>
              <span className={label}>{item.unit === 'm2' ? '4. Хэмжээ ба тоо' : '4. Тоо хэмжээ'}</span>
              {item.unit === 'm2' && (
                <div className="space-y-3">
                  {presets.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {presets.map(([pw, ph]) => (
                        <button key={`${pw}x${ph}`} type="button" className={chip(pw === w && ph === h)} onClick={() => { setW(pw); setH(ph) }}>
                          {pw} × {ph} м
                        </button>
                      ))}
                    </div>
                  )}
                  <div className="grid grid-cols-2 gap-3 sm:max-w-sm">
                    <label className="text-[13px] text-gray-600">Өргөн (м)
                      <input type="number" step="0.1" min="0" value={w || ''} onChange={(e) => setW(Number(e.target.value))} className={`${input} mt-1`} />
                    </label>
                    <label className="text-[13px] text-gray-600">Өндөр (м)
                      <input type="number" step="0.1" min="0" value={h || ''} onChange={(e) => setH(Number(e.target.value))} className={`${input} mt-1`} />
                    </label>
                  </div>
                  <div className="flex flex-wrap items-center gap-3">
                    <span className="text-[13px] text-gray-600">Ширхэг</span>
                    <Stepper value={qty} onChange={setQty} />
                  </div>
                  {item.rope > 0 && (
                    <label className="flex cursor-pointer items-center gap-3 text-[14px] text-gray-800">
                      <input type="checkbox" checked={rope} onChange={(e) => setRope(e.target.checked)} className="h-5 w-5 accent-gray-900" />
                      Олс, бөгж тавих (+{fmt(Math.round(item.rope * (1 + catalog.vatRate)))}/м²)
                    </label>
                  )}
                </div>
              )}
              {item.unit === 'pack' && (
                <div className="flex flex-wrap items-center gap-3">
                  <span className="text-[13px] text-gray-600">Багцын тоо</span>
                  <Stepper value={qty} onChange={setQty} />
                </div>
              )}
              {item.unit === 'pcs' && <Stepper value={qty} onChange={setQty} />}
              {item.unit === 'lm' && (
                <label className="block text-[13px] text-gray-600 sm:max-w-[200px]">Урт (м)
                  <input type="number" step="0.5" min="0" value={qty || ''} onChange={(e) => setQty(Number(e.target.value))} className={`${input} mt-1`} />
                </label>
              )}
              {item.unit === 'tier' && (
                <div className="space-y-3">
                  <Stepper value={qty} onChange={setQty} min={item.min || 10} step={10} />
                  <div className="flex flex-wrap gap-2 text-[12px] text-gray-600">
                    {item.tiers?.map((t) => (
                      <span key={t.min} className="rounded-full bg-white px-3 py-1">{t.min.toLocaleString('en-US')}+ ш: {fmt(Math.round(t.ex * (1 + catalog.vatRate)))}</span>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {(item.about || item.needs) && (
              <div className="space-y-2 rounded-2xl bg-white p-4 text-[13px] leading-[1.55] text-gray-600">
                {item.about && <p>{item.about}</p>}
                {item.needs && <p><span className="font-medium text-gray-900">Захиалахад хэрэгтэй: </span>{item.needs}</p>}
                {item.delivery === 'INSTALL' && <p className="text-gray-900">Ачилт, тээвэр, суурилуулалтыг газар дээр нь хэмжээд тусад нь үнийн санал гаргана.</p>}
              </div>
            )}
          </>
        )}

        {cat === BOOK_CAT && (
          <div className="space-y-5">
            <div>
              <span className={label}>2. Хэмжээ</span>
              <div className="flex flex-wrap gap-2">{bookSizes.map((s) => <button key={s} type="button" className={chip(s === bSize)} onClick={() => setBSize(s)}>{s}</button>)}</div>
            </div>
            <div>
              <span className={label}>3. Дотор цаас</span>
              <div className="flex flex-wrap gap-2">{bookPapers.map((s) => <button key={s} type="button" className={chip(s === bPaper)} onClick={() => setBPaper(s)}>{s}</button>)}</div>
            </div>
            <div>
              <span className={label}>4. Нүүрний тоо</span>
              <div className="flex flex-wrap gap-2">{bookPages.map((s) => <button key={s} type="button" className={chip(s === bPages)} onClick={() => setBPages(s)}>{s}</button>)}</div>
              {book && <p className="mt-2 text-[13px] text-gray-500">Хавтаслалт: {book.binding}</p>}
            </div>
            <div>
              <span className={label}>5. Тираж (хамгийн багадаа {BOOK_MIN} ш)</span>
              <Stepper value={bQty} onChange={setBQty} min={BOOK_MIN} step={50} />
              {book && (
                <div className="mt-3 flex flex-wrap gap-2 text-[12px] text-gray-600">
                  {book.tiers.map((t) => <span key={t.min} className="rounded-full bg-white px-3 py-1">{t.min.toLocaleString('en-US')}+ ш: {fmt(Math.round(t.ex * (1 + catalog.vatRate)))}/ш</span>)}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Энэ барааны тооцоо */}
        {draftPrice && (
          <div className="rounded-2xl bg-white p-5">
            <div className="flex flex-wrap items-end justify-between gap-4">
              <div className="min-w-0 space-y-1 text-[13px] text-gray-600">
                {draftPrice.steps.map((s) => <p key={s}>{s}</p>)}
                {draftPrice.warning && <p className="text-[#FF6B00]">{draftPrice.warning}</p>}
              </div>
              <div className="text-right">
                <p className="text-[12px] text-gray-500">НӨАТ-тэй</p>
                <p className="text-[28px] font-medium leading-none tracking-[-0.02em] text-gray-900">{fmt(draftPrice.inc)}</p>
              </div>
            </div>
            <button type="button" onClick={add} disabled={draftPrice.ex <= 0}
              className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-full bg-gray-900 px-6 py-3.5 text-[14px] font-medium text-white transition-opacity hover:opacity-90 disabled:opacity-40">
              <Plus className="h-4 w-4" /> Захиалгад нэмэх
            </button>
          </div>
        )}
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
          <div className="flex justify-between text-gray-600"><dt>Бараа (НӨАТ-тэй)</dt><dd>{fmt(subtotalInc)}</dd></div>
          <div className="flex justify-between text-gray-600">
            <dt>Хүргэлт</dt>
            <dd>{ship.mode === 'pickup' ? '0₮' : priced.length ? fmt(shipping.fee) : '—'}</dd>
          </div>
          {ship.mode !== 'pickup' && priced.length > 0 && shipping.note && <p className="text-[12px] text-gray-500">{shipping.note}</p>}
          <div className="flex items-baseline justify-between pt-2">
            <dt className="text-gray-900">Нийт</dt>
            <dd className="text-[30px] font-medium leading-none tracking-[-0.02em] text-[#FF6B00]">{fmt(total)}</dd>
          </div>
          <p className="text-right text-[12px] text-gray-500">Үүнээс НӨАТ {fmt(subtotalInc - subtotalEx)}</p>
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
          Албан ёсны үнийн жагсаалт {catalog.version}. Бүх үнэ НӨАТ-тэй. Дизайн хийлгэх, яаралтай гүйцэтгэл, онцгой материалын үнийг менежер баталгаажуулна.
        </p>
      </aside>
    </div>
  )
}
