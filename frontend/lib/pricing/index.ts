/**
 * BizPrint үнийн тооцоо — албан ёсны үнийн жагсаалтаас (catalog.json) шууд бодно.
 * catalog.json-ыг scripts/build-price-catalog.py үүсгэнэ. Энд дүрэм л байна, үнэ байхгүй.
 */
import raw from './catalog.json'

export type Unit = 'm2' | 'pcs' | 'pack' | 'tier' | 'lm'
export type DeliveryClass = 'S' | 'M' | 'L' | 'XL' | 'INSTALL'
export type Tier = { min: number; ex: number }

export type Item = {
  code: string
  cat: string
  family: string
  option: string
  spec: string
  unit: Unit
  pack?: number | null
  ex?: number
  inc?: number
  tiers?: Tier[]
  min?: number
  delivery: DeliveryClass
  rope: number
  about: string
  needs: string
}

export type Book = {
  code: string
  size: string
  paper: string
  pages: number
  binding: string
  tiers: Tier[]
}

export type Location = { name: string; district: string; zone: number }

type Catalog = {
  version: string
  vatRate: number
  categories: string[]
  items: Item[]
  books: Book[]
  presets: Record<string, [number, number][]>
  delivery: {
    base: Record<'S' | 'M' | 'L' | 'XL', number>
    zoneAdd: Record<string, number>
    max: number
    countryside: string
    pickup: string
    time: string
    locations: Location[]
  }
}

export const catalog = raw as unknown as Catalog
export const BOOK_CAT = 'Ном, сэтгүүл'
export const BOOK_MIN = 200

/* ---------- Мөр (захиалгын нэг бараа) ---------- */

export type Line =
  | { id: string; kind: 'item'; code: string; w?: number; h?: number; qty: number; rope?: boolean }
  | { id: string; kind: 'book'; code: string; qty: number }

export type Priced = {
  title: string
  subtitle: string
  ex: number // НӨАТ-гүй
  inc: number // НӨАТ-тэй
  steps: string[] // ил тооцоо
  delivery: DeliveryClass
  warning?: string
}

const itemByCode = new Map(catalog.items.map((i) => [i.code, i]))
const bookByCode = new Map(catalog.books.map((b) => [b.code, b]))
export const getItem = (code: string) => itemByCode.get(code)
export const getBook = (code: string) => bookByCode.get(code)

export const vat = (ex: number) => Math.round(ex * (1 + catalog.vatRate))
export const fmt = (n: number) => Math.round(n).toLocaleString('en-US').replace(/,/g, ',') + '₮'
const num = (n: number) => (Math.round(n * 100) / 100).toLocaleString('en-US', { maximumFractionDigits: 2 })

/** Тоо ширхэгт таарах шатлал (хамгийн өндөр min ≤ qty) */
export function tierFor(tiers: Tier[], qty: number): Tier {
  let t = tiers[0]
  for (const x of tiers) if (qty >= x.min) t = x
  return t
}

export function unitLabel(u: Unit) {
  return u === 'm2' ? 'м²' : u === 'pack' ? 'багц' : u === 'lm' ? 'м' : 'ш'
}

/** Хэрэглэгчид харуулах «эхлэх үнэ» (НӨАТ-тэй) */
export function fromPrice(it: Item): { inc: number; per: string } {
  if (it.unit === 'tier' && it.tiers) {
    const last = it.tiers[it.tiers.length - 1]
    return { inc: vat(last.ex), per: 'ш' }
  }
  if (it.unit === 'pack') return { inc: vat(it.ex || 0), per: `${it.pack}ш` }
  return { inc: vat(it.ex || 0), per: unitLabel(it.unit) }
}

export function priceLine(line: Line): Priced | null {
  if (line.kind === 'book') {
    const b = getBook(line.code)
    if (!b) return null
    const qty = Math.max(BOOK_MIN, Math.round(line.qty))
    const t = tierFor(b.tiers, qty)
    const ex = t.ex * qty
    return {
      title: `Ном, сэтгүүл ${b.size}`,
      subtitle: `${b.pages} нүүр · ${b.paper} · ${b.binding}`,
      ex,
      inc: vat(ex),
      steps: [`${qty.toLocaleString('en-US')} ш × ${fmt(vat(t.ex))} (${t.min.toLocaleString('en-US')}+ ширхгийн үнэ)`],
      delivery: qty >= 1000 ? 'L' : 'M',
      warning: line.qty < BOOK_MIN ? `Хамгийн бага захиалга ${BOOK_MIN} ш` : undefined,
    }
  }

  const it = getItem(line.code)
  if (!it) return null
  const title = it.family
  const subtitle = [it.option, it.unit === 'pack' ? `${it.pack}ш багц` : ''].filter(Boolean).join(' · ')
  const qty = Math.max(1, Math.round(line.qty || 1))
  const steps: string[] = []
  let ex = 0
  let warning: string | undefined

  switch (it.unit) {
    case 'm2': {
      const w = Math.max(0, line.w || 0)
      const h = Math.max(0, line.h || 0)
      const area = w * h
      const per = (it.ex || 0) + (line.rope && it.rope ? it.rope : 0)
      ex = area * qty * per
      steps.push(`${num(w)} × ${num(h)} м = ${num(area)} м²${qty > 1 ? ` × ${qty} ш = ${num(area * qty)} м²` : ''}`)
      steps.push(`${num(area * qty)} м² × ${fmt(vat(it.ex || 0))}`)
      if (line.rope && it.rope) steps.push(`Олс, бөгж: ${num(area * qty)} м² × ${fmt(vat(it.rope))}`)
      if (area <= 0) warning = 'Хэмжээгээ оруулна уу'
      break
    }
    case 'pack': {
      ex = (it.ex || 0) * qty
      steps.push(`${qty} багц × ${it.pack}ш = ${(qty * (it.pack || 0)).toLocaleString('en-US')} ш`)
      steps.push(`${qty} × ${fmt(vat(it.ex || 0))}`)
      break
    }
    case 'tier': {
      const min = it.min || 1
      const q = Math.max(min, Math.round(line.qty || min))
      const t = tierFor(it.tiers || [], q)
      ex = t.ex * q
      steps.push(`${q.toLocaleString('en-US')} ш × ${fmt(vat(t.ex))} (${t.min.toLocaleString('en-US')}+ ширхгийн үнэ)`)
      if ((line.qty || 0) < min) warning = `Хамгийн бага захиалга ${min} ш`
      break
    }
    case 'lm': {
      const len = Math.max(0, line.qty || 0)
      ex = (it.ex || 0) * len
      steps.push(`${num(len)} м × ${fmt(vat(it.ex || 0))}`)
      break
    }
    default: {
      ex = (it.ex || 0) * qty
      steps.push(`${qty} ш × ${fmt(vat(it.ex || 0))}`)
    }
  }

  return { title, subtitle, ex, inc: vat(ex), steps, delivery: it.delivery, warning }
}

/* ---------- Хүргэлт ---------- */

export type Shipping = { mode: 'pickup' } | { mode: 'city'; location: string } | { mode: 'countryside' }

const ORDER: DeliveryClass[] = ['S', 'M', 'L', 'XL']

export function shippingFee(priced: Priced[], ship: Shipping) {
  const classes = priced.map((p) => p.delivery).filter((c) => c !== 'INSTALL') as ('S' | 'M' | 'L' | 'XL')[]
  const hasInstall = priced.some((p) => p.delivery === 'INSTALL')
  if (ship.mode === 'pickup' || classes.length === 0) return { fee: 0, note: ship.mode === 'pickup' ? catalog.delivery.pickup : '', hasInstall }
  const cls = classes.reduce((a, c) => (ORDER.indexOf(c) > ORDER.indexOf(a) ? c : a), 'S' as 'S' | 'M' | 'L' | 'XL')
  let zone = 1
  let place = 'Аймаг, сум (унаа, каргоны цэг хүртэл)'
  if (ship.mode === 'city') {
    const loc = catalog.delivery.locations.find((l) => l.name === ship.location)
    zone = loc?.zone || 1
    place = loc ? `${loc.name} (${loc.district})` : ''
  }
  const fee = Math.min(catalog.delivery.base[cls] + (catalog.delivery.zoneAdd[String(zone)] || 0), catalog.delivery.max)
  return { fee, note: `${place} · Бүс ${zone} · ${SIZE_LABEL[cls]} ачаа`, hasInstall }
}

export const SIZE_LABEL: Record<'S' | 'M' | 'L' | 'XL', string> = { S: 'жижиг', M: 'дунд', L: 'том', XL: 'маш том' }

/* ---------- Ангилал, бүтээгдэхүүн ---------- */

export function familiesOf(cat: string) {
  const map = new Map<string, Item[]>()
  for (const it of catalog.items) {
    if (it.cat !== cat) continue
    const arr = map.get(it.family) || []
    arr.push(it)
    map.set(it.family, arr)
  }
  return [...map.entries()].map(([name, items]) => ({ name, items }))
}

export const categories = catalog.categories.filter(
  (c) => c === BOOK_CAT || catalog.items.some((i) => i.cat === c),
)
