'use client'

import { useMemo, useState } from 'react'
import Image from 'next/image'
import { ExternalLink, Minus, Plus } from 'lucide-react'
import {
  BOOK_MIN,
  catalog,
  familiesOfType,
  fmt,
  getItem,
  priceLine,
  typeFromPrice,
  vatPart,
  type Item,
  type Line,
  type Priced,
  type ProductType,
} from '@/lib/pricing'

/* Тооцоолуур (/quote) ба барааны хуудас хоёулаа энэ нэг сонгогчийг ашиглана — нэг дүрэм, нэг үнэ. */

export const chip = (on: boolean) =>
  `rounded-full border px-4 py-2 text-[13px] transition-colors ${
    on ? 'border-gray-900 bg-gray-900 text-white' : 'border-gray-200 bg-white text-gray-800 hover:border-gray-400'
  }`
export const label = 'mb-2 block text-[12px] font-medium uppercase tracking-[0.08em] text-gray-500'
export const input =
  'w-full rounded-[14px] border border-gray-200 bg-white px-4 py-3 text-[15px] text-gray-900 outline-none focus:border-gray-900'

export function Stepper({ value, onChange, min = 1, step = 1 }: { value: number; onChange: (n: number) => void; min?: number; step?: number }) {
  return (
    <div className="flex items-center gap-2">
      <button type="button" aria-label="Хасах" className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-gray-200 bg-white hover:border-gray-400" onClick={() => onChange(Math.max(min, value - step))}>
        <Minus className="h-4 w-4" />
      </button>
      <input type="number" inputMode="numeric" min={min} value={Number.isFinite(value) ? value : ''} onChange={(e) => onChange(Number(e.target.value))} className="w-24 rounded-[14px] border border-gray-200 bg-white px-3 py-3 text-center text-[15px] text-gray-900 outline-none focus:border-gray-900" />
      <button type="button" aria-label="Нэмэх" className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-gray-200 bg-white hover:border-gray-400" onClick={() => onChange(value + step)}>
        <Plus className="h-4 w-4" />
      </button>
    </div>
  )
}

const BOOK_FAMILY = '__book'

function defaultQty(it: Item) {
  return it.unit === 'tier' ? Math.max(it.min || 10, 50) : 1
}

type Props = {
  types: ProductType[]
  initialCode?: string
  actionLabel: string
  onAction: (line: Line, priced: Priced, item: Item | undefined) => void
  /** Бүтээгдэхүүний алхмын дугаарыг эхлүүлэх (тооцоолуурт 2, барааны хуудсанд 1) */
  firstStep?: number
}

let seq = 0
const uid = () => `l${Date.now().toString(36)}${(seq++).toString(36)}`

export default function ItemBuilder({ types, initialCode, actionLabel, onAction, firstStep = 1 }: Props) {
  const startType = (initialCode && types.find((t) => t.codes.includes(initialCode))) || types[0]
  const startItem = getItem(initialCode && startType?.codes.includes(initialCode) ? initialCode : startType?.codes[0] || '')
  const [typeSlug, setTypeSlug] = useState(startType?.slug || '')
  const [family, setFamily] = useState(startItem?.family || '')
  const [code, setCode] = useState(startItem?.code || '')
  const firstPreset = startItem?.presets?.[0]
  const [w, setW] = useState(firstPreset?.w ?? 1)
  const [h, setH] = useState(firstPreset?.h ?? 1)
  const [qty, setQty] = useState(startItem ? defaultQty(startItem) : 1)
  const [rope, setRope] = useState(true)
  const [addons, setAddons] = useState<Record<string, number>>({})
  // ном
  const [bSize, setBSize] = useState('A5')
  const [bPaper, setBPaper] = useState('80 гр')
  const [bPages, setBPages] = useState(32)
  const [bQty, setBQty] = useState(BOOK_MIN)

  const type = types.find((t) => t.slug === typeSlug) || types[0]
  const families = useMemo(() => (type ? familiesOfType(type) : []), [type])
  const fam = families.find((f) => f.name === family)
  const item = getItem(code)
  const isBook = family === BOOK_FAMILY

  const pickItem = (it: Item) => {
    setCode(it.code)
    setFamily(it.family)
    setQty(defaultQty(it))
    if (it.unit === 'm2') {
      const p = it.presets?.[0]
      setW(p?.w ?? 1)
      setH(p?.h ?? 1)
    }
  }
  const pickType = (t: ProductType) => {
    setTypeSlug(t.slug)
    setAddons({})
    const it = getItem(t.codes[0])
    if (it) pickItem(it)
  }
  const pickFamily = (name: string) => {
    if (name === BOOK_FAMILY) { setFamily(BOOK_FAMILY); return }
    const f = families.find((x) => x.name === name)
    if (f) pickItem(f.items[0])
  }

  // Багцын бараа: сонголт (цаас, бүрэлт) ба тираж тусдаа
  const optionNames = useMemo(() => [...new Set((fam?.items || []).map((i) => i.option))], [fam])
  const packSizes = useMemo(() => (item?.unit === 'pack' ? (fam?.items || []).filter((i) => i.option === item.option) : []), [fam, item])
  const pickOption = (opt: string) => {
    const same = (fam?.items || []).filter((i) => i.option === opt)
    pickItem(same.find((i) => i.pack && i.pack === item?.pack) || same[0])
  }

  const book = useMemo(
    () => (isBook ? catalog.books.find((b) => b.size === bSize && b.paper === bPaper && b.pages === bPages) : undefined),
    [isBook, bSize, bPaper, bPages],
  )
  const bookSizes = useMemo(() => [...new Set(catalog.books.map((b) => b.size))], [])
  const bookPapers = useMemo(() => [...new Set(catalog.books.map((b) => b.paper))], [])
  const bookPages = useMemo(() => [...new Set(catalog.books.map((b) => b.pages))].sort((a, b) => a - b), [])

  const activeAddons = Object.fromEntries(Object.entries(addons).filter(([, n]) => n > 0))
  const draft: Line | null = isBook
    ? book ? { id: 'draft', kind: 'book', code: book.code, qty: bQty } : null
    : item ? { id: 'draft', kind: 'item', code: item.code, w, h, qty, rope, addons: activeAddons } : null
  const priced = draft ? priceLine(draft) : null

  const act = () => {
    if (!draft || !priced || priced.inc <= 0) return
    onAction({ ...draft, id: uid() } as Line, priced, item)
    setAddons({})
  }

  if (!type) return null
  const step = (n: number) => `${firstStep + n}. `
  let s = 0
  const presets = item?.unit === 'm2' ? item.presets || [] : []

  return (
    <div className="space-y-6">
      {types.length > 1 && (
        <div>
          <span className={label}>{step(s++)}Бүтээгдэхүүн</span>
          <div className="grid gap-2 sm:grid-cols-2">
            {types.map((t) => {
              const fp = typeFromPrice(t)
              const on = t.slug === type.slug
              return (
                <button key={t.slug} type="button" onClick={() => pickType(t)}
                  className={`flex items-center gap-3 rounded-2xl border p-2 pr-4 text-left transition-colors ${on ? 'border-gray-900 bg-white' : 'border-transparent bg-white/70 hover:bg-white'}`}>
                  <span className="relative h-12 w-12 shrink-0 overflow-hidden rounded-xl bg-gray-100">
                    <Image src={t.img[0]} alt="" fill sizes="48px" className="object-cover" />
                  </span>
                  <span className="min-w-0 flex-1 text-[14px] leading-tight text-gray-900">{t.name}</span>
                  <span className="shrink-0 text-[12px] text-gray-500">{fmt(fp.inc)}/{fp.per}-с</span>
                </button>
              )
            })}
          </div>
        </div>
      )}

      {(families.length > 1 || type.books) && (
        <div>
          <span className={label}>{step(s++)}Төрөл</span>
          <div className="flex flex-wrap gap-2">
            {families.map((f) => (
              <button key={f.name} type="button" className={chip(f.name === family)} onClick={() => pickFamily(f.name)}>{f.name}</button>
            ))}
            {type.books && (
              <button type="button" className={chip(isBook)} onClick={() => pickFamily(BOOK_FAMILY)}>Ном, сэтгүүл ({BOOK_MIN}+ ш)</button>
            )}
          </div>
        </div>
      )}

      {!isBook && item && (
        <>
          {(optionNames.length > 1 || optionNames[0]) && (
            <div>
              <span className={label}>{step(s++)}Сонголт</span>
              <div className="flex flex-wrap gap-2">
                {optionNames.map((o) => (
                  <button key={o || '—'} type="button" className={chip(o === item.option)} onClick={() => pickOption(o)}>{o || 'Стандарт'}</button>
                ))}
              </div>
            </div>
          )}

          {packSizes.length > 0 && (
            <div>
              <span className={label}>{step(s++)}Тираж</span>
              <div className="flex flex-wrap gap-2">
                {packSizes.map((p) => (
                  <button key={p.code} type="button" className={chip(p.code === item.code)} onClick={() => pickItem(p)}>
                    {p.pack?.toLocaleString('en-US')} ш · {fmt(p.inc)}
                  </button>
                ))}
              </div>
            </div>
          )}

          <div>
            <span className={label}>{step(s++)}{item.unit === 'm2' ? 'Хэмжээ ба тоо' : 'Тоо хэмжээ'}</span>
            {item.unit === 'm2' && (
              <div className="space-y-3">
                {presets.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {presets.map((p) => (
                      <button key={`${p.w}x${p.h}`} type="button" className={chip(p.w === w && p.h === h)} onClick={() => { setW(p.w); setH(p.h) }}>
                        {p.w} × {p.h} м{p.inc ? ` · ${fmt(p.inc)}` : ''}
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
                {!!item.rope && (
                  <label className="flex cursor-pointer items-center gap-3 text-[14px] text-gray-800">
                    <input type="checkbox" checked={rope} onChange={(e) => setRope(e.target.checked)} className="h-5 w-5 accent-gray-900" />
                    Олс, бөгж тавих (+{fmt(item.rope)}/м²)
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
                    <span key={t.min} className="rounded-full bg-white px-3 py-1">{t.min.toLocaleString('en-US')}+ ш: {fmt(t.inc)}</span>
                  ))}
                </div>
              </div>
            )}
          </div>

          {!!type.addons?.length && (
            <div>
              <span className={label}>{step(s++)}Нэмэлт бүрэлдэхүүн</span>
              <div className="space-y-2">
                {type.addons.map((c) => {
                  const a = getItem(c)
                  if (!a) return null
                  return (
                    <div key={c} className="flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-white px-4 py-3">
                      <span className="text-[14px] text-gray-900">{a.family}<span className="ml-2 text-[12px] text-gray-500">{fmt(a.inc)}/ш</span></span>
                      <Stepper value={addons[c] || 0} min={0} onChange={(n) => setAddons((x) => ({ ...x, [c]: n }))} />
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {(item.about || item.needs || type.note) && (
            <div className="space-y-2 rounded-2xl bg-white p-4 text-[13px] leading-[1.55] text-gray-600">
              {item.about && <p>{item.about}</p>}
              {item.needs && <p><span className="font-medium text-gray-900">Захиалахад хэрэгтэй: </span>{item.needs}</p>}
              {type.note && <p className="text-gray-900">{type.note}</p>}
            </div>
          )}
        </>
      )}

      {isBook && (
        <div className="space-y-5">
          <div>
            <span className={label}>{step(s++)}Хэмжээ</span>
            <div className="flex flex-wrap gap-2">{bookSizes.map((x) => <button key={x} type="button" className={chip(x === bSize)} onClick={() => setBSize(x)}>{x}</button>)}</div>
          </div>
          <div>
            <span className={label}>{step(s++)}Дотор цаас</span>
            <div className="flex flex-wrap gap-2">{bookPapers.map((x) => <button key={x} type="button" className={chip(x === bPaper)} onClick={() => setBPaper(x)}>{x}</button>)}</div>
          </div>
          <div>
            <span className={label}>{step(s++)}Нүүрний тоо</span>
            <div className="flex flex-wrap gap-2">{bookPages.map((x) => <button key={x} type="button" className={chip(x === bPages)} onClick={() => setBPages(x)}>{x}</button>)}</div>
            {book && <p className="mt-2 text-[13px] text-gray-500">Хавтаслалт: {book.binding}</p>}
          </div>
          <div>
            <span className={label}>{step(s++)}Тираж (хамгийн багадаа {BOOK_MIN} ш)</span>
            <Stepper value={bQty} onChange={setBQty} min={BOOK_MIN} step={50} />
          </div>
        </div>
      )}

      {type.external && (
        <div className="rounded-2xl border border-gray-200 bg-white p-4 text-[13px] leading-[1.55] text-gray-700">{type.external.note}</div>
      )}

      {priced && (
        <div className="rounded-2xl bg-white p-5">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div className="min-w-0 space-y-1 text-[13px] text-gray-600">
              {priced.steps.map((x) => <p key={x}>{x}</p>)}
              {priced.warning && <p className="text-[#FF6B00]">{priced.warning}</p>}
            </div>
            <div className="text-right">
              <p className="text-[12px] text-gray-500">НӨАТ орсон</p>
              <p className="text-[28px] font-medium leading-none tracking-[-0.02em] text-gray-900">{fmt(priced.inc)}</p>
              <p className="mt-1 text-[11px] text-gray-400">Үүнээс НӨАТ {fmt(vatPart(priced.inc))}</p>
            </div>
          </div>
          {type.external ? (
            <a href={type.external.url} target="_blank" rel="noopener noreferrer"
              className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-full bg-[#FF6B00] px-6 py-3.5 text-[14px] font-medium text-white hover:opacity-90">
              <ExternalLink className="h-4 w-4" /> {type.external.label}
            </a>
          ) : (
            <button type="button" onClick={act} disabled={priced.inc <= 0}
              className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-full bg-gray-900 px-6 py-3.5 text-[14px] font-medium text-white transition-opacity hover:opacity-90 disabled:opacity-40">
              <Plus className="h-4 w-4" /> {actionLabel}
            </button>
          )}
        </div>
      )}
    </div>
  )
}

