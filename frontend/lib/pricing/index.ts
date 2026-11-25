/**
 * BizPrint үнийн тооцоо — сайтын албан үнийн жагсаалтаас (catalog.json) шууд бодно.
 * catalog.json-ыг scripts/build-price-catalog.py → scripts/build-shop-catalog.py үүсгэнэ.
 * Энд зөвхөн дүрэм байна. Backend-ийн хуулбар: backend/src/products/catalog-pricing.ts
 */
import raw from './catalog.json'

export type Unit = 'm2' | 'pcs' | 'pack' | 'tier' | 'lm'
export type DeliveryClass = 'S' | 'M' | 'L' | 'XL' | 'INSTALL'
export type Tier = { min: number; inc: number }
export type BookTier = { min: number; ex: number }
export type Preset = { w: number; h: number; inc?: number }

export type Item = {
  code: string
  cat: string
  type: string
  family: string
  option: string
  unit: Unit
  pack?: number | null
  inc: number // НӨАТ орсон үнэ (албан жагсаалт)
  ex?: number // НӨАТ-гүй (м² тооцоонд)
  tiers?: Tier[]
  min?: number
  presets?: Preset[]
  delivery: DeliveryClass
  rope?: number // олс, бөгж — НӨАТ орсон, м²-аар
  addon?: boolean
  about: string
  needs: string
}

export type Book = { code: string; size: string; paper: string; pages: number; binding: string; tiers: BookTier[] }
export type Location = { name: string; district: string; zone: number }

export type ProductType = {
  name: string
  slug: string
  cat: string
  catSlug: string
  img: string[]
  codes: string[]
  addons?: string[]
  books?: boolean
  note?: string
  external?: { url: string; label: string; note: string }
  about: string
  sort: number
}

type Catalog = {
  version: string
  vatRate: number
  categories: string[]
  categorySlugs: Record<string, string>
  types: ProductType[]
  items: Item[]
  books: Book[]
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
export const BOOK_MIN = 200

/* ---------- Хайлт ---------- */

const itemByCode = new Map(catalog.items.map((i) => [i.code, i]))
const bookByCode = new Map(catalog.books.map((b) => [b.code, b]))
const typeBySlug = new Map(catalog.types.map((t) => [t.slug, t]))
export const getItem = (code: string) => itemByCode.get(code)
export const getBook = (code: string) => bookByCode.get(code)
export const getType = (slug: string) => typeBySlug.get(slug)
export const typeOfCode = (code: string) => catalog.types.find((t) => t.codes.includes(code))
export const typesOf = (cat: string) => catalog.types.filter((t) => t.cat === cat)
export const categories = catalog.categories
export const catSlug = (cat: string) => catalog.categorySlugs[cat]
export const catBySlug = (slug: string) => Object.keys(catalog.categorySlugs).find((c) => catalog.categorySlugs[c] === slug)

/** Тухайн бүтээгдэхүүний үндсэн сонголтуудыг «төрөл» (family)-өөр бүлэглэнэ */
export function familiesOfType(t: ProductType) {
  const map = new Map<string, Item[]>()
  for (const code of t.codes) {
    const it = getItem(code)
    if (!it) continue
    const arr = map.get(it.family) || []
    arr.push(it)
    map.set(it.family, arr)
  }
  return [...map.entries()].map(([name, items]) => ({ name, items }))
}

/* ---------- Мөнгө ---------- */

/** Албан жагсаалтын бөөрөнхийлөлт: 10,000₮-өөс дээш 100₮, доош 10₮ хүртэл */
export const roundp = (x: number) => (x >= 10000 ? Math.round(x / 100) * 100 : Math.round(x / 10) * 10)
export const fmt = (n: number) => Math.round(n).toLocaleString('en-US') + '₮'
export const vatPart = (inc: number) => inc - Math.round(inc / (1 + catalog.vatRate))
const num = (n: number) => (Math.round(n * 100) / 100).toLocaleString('en-US', { maximumFractionDigits: 2 })
const qtyFmt = (n: number) => n.toLocaleString('en-US')

export function tierFor<T extends { min: number }>(tiers: T[], qty: number): T {
  let t = tiers[0]
  for (const x of tiers) if (qty >= x.min) t = x
  return t
}

export function unitLabel(u: Unit) {
  return u === 'm2' ? 'м²' : u === 'pack' ? 'багц' : u === 'lm' ? 'м' : 'ш'
}

/** «…₮-с» эхлэх үнэ */
export function fromPrice(it: Item): { inc: number; per: string } {
  if (it.unit === 'tier' && it.tiers?.length) return { inc: it.tiers[it.tiers.length - 1].inc, per: 'ш' }
  if (it.unit === 'pack') return { inc: it.inc, per: `${it.pack}ш` }
  return { inc: it.inc, per: unitLabel(it.unit) }
}

export function typeFromPrice(t: ProductType) {
  const fps = t.codes.map((c) => getItem(c)).filter(Boolean).map((i) => fromPrice(i!))
  return fps.reduce((a, b) => (b.inc < a.inc ? b : a), fps[0] || { inc: 0, per: 'ш' })
}

/** м² барааны нэг ширхгийн үнэ (бэлэн хэмжээ бол жагсаалтынх) */
export function m2PiecePrice(it: Item, w: number, h: number) {
  const p = it.presets?.find((x) => x.w === w && x.h === h && x.inc)
  if (p?.inc) return { inc: p.inc, preset: true }
  const ex = it.ex ?? it.inc / (1 + catalog.vatRate)
  return { inc: roundp(ex * (1 + catalog.vatRate) * w * h), preset: false }
}

/* ---------- Мөр ---------- */

export type Line =
  | { id: string; kind: 'item'; code: string; w?: number; h?: number; qty: number; rope?: boolean; addons?: Record<string, number> }
  | { id: string; kind: 'book'; code: string; qty: number }

export type Priced = {
  title: string
  subtitle: string
  inc: number // НӨАТ орсон нийт
  steps: string[]
  delivery: DeliveryClass
  cartQty: number // сагсанд орох тоо (unit_price = inc / cartQty)
  warning?: string
}

export function priceLine(line: Line): Priced | null {
  if (line.kind === 'book') {
    const b = getBook(line.code)
    if (!b) return null
    const qty = Math.max(BOOK_MIN, Math.round(line.qty || 0))
    const t = tierFor(b.tiers, qty)
    const per = roundp(t.ex * (1 + catalog.vatRate))
    return {
      title: `Ном, сэтгүүл ${b.size}`,
      subtitle: `${b.pages} нүүр · ${b.paper} · ${b.binding}`,
      inc: per * qty,
      steps: [`${qtyFmt(qty)} ш × ${fmt(per)} (${qtyFmt(t.min)}+ ширхгийн үнэ)`],
      delivery: qty >= 1000 ? 'L' : 'M',
      cartQty: qty,
      warning: (line.qty || 0) < BOOK_MIN ? `Хамгийн бага захиалга ${BOOK_MIN} ш` : undefined,
    }
  }

  const it = getItem(line.code)
  if (!it) return null
  const subtitle = [it.option, it.unit === 'pack' ? `${qtyFmt(it.pack || 0)}ш багц` : ''].filter(Boolean).join(' · ')
  const qty = Math.max(1, Math.round(line.qty || 1))
  const steps: string[] = []
  let inc = 0
  let cartQty = qty
  let warning: string | undefined

  switch (it.unit) {
    case 'm2': {
      const w = Math.max(0, line.w || 0)
      const h = Math.max(0, line.h || 0)
      const area = w * h
      const piece = m2PiecePrice(it, w, h)
      const rope = line.rope && it.rope ? roundp(it.rope * area) : 0
      inc = (piece.inc + rope) * qty
      steps.push(
        piece.preset
          ? `Бэлэн хэмжээ ${num(w)} × ${num(h)} м: ${fmt(piece.inc)}`
          : `${num(w)} × ${num(h)} м = ${num(area)} м² × ${fmt(it.inc)}/м² = ${fmt(piece.inc)}`,
      )
      if (rope) steps.push(`Олс, бөгж: ${num(area)} м² × ${fmt(it.rope!)} = ${fmt(rope)}`)
      if (qty > 1) steps.push(`× ${qty} ш`)
      if (area <= 0) warning = 'Хэмжээгээ оруулна уу'
      break
    }
    case 'pack':
      inc = it.inc * qty
      steps.push(`${qty} багц × ${qtyFmt(it.pack || 0)}ш = ${qtyFmt(qty * (it.pack || 0))} ш`, `${qty} × ${fmt(it.inc)}`)
      break
    case 'tier': {
      const min = it.min || 1
      const q = Math.max(min, Math.round(line.qty || min))
      const t = tierFor(it.tiers || [{ min, inc: it.inc }], q)
      inc = t.inc * q
      cartQty = q
      steps.push(`${qtyFmt(q)} ш × ${fmt(t.inc)} (${qtyFmt(t.min)}+ ширхгийн үнэ)`)
      if ((line.qty || 0) < min) warning = `Хамгийн бага захиалга ${min} ш`
      break
    }
    case 'lm': {
      const len = Math.max(0, line.qty || 0)
      inc = Math.round(it.inc * len)
      cartQty = 1
      steps.push(`${num(len)} м × ${fmt(it.inc)}`)
      break
    }
    default:
      inc = it.inc * qty
      steps.push(`${qty} ш × ${fmt(it.inc)}`)
  }

  // Хаягийн нэмэлт бүрэлдэхүүн (реле, тог бууруулагч, кран…)
  for (const [code, n] of Object.entries(line.addons || {})) {
    const a = getItem(code)
    const q = Math.max(0, Math.round(n || 0))
    if (!a || !q) continue
    inc += a.inc * q
    steps.push(`+ ${a.family}: ${q} × ${fmt(a.inc)}`)
    cartQty = 1 // нэмэлттэй бол нэг иж бүрдэл болгож сагслана
  }

  return { title: it.family, subtitle, inc, steps, delivery: it.delivery, cartQty, warning }
}

/* ---------- Хүргэлт ---------- */

export type Shipping = { mode: 'pickup' } | { mode: 'city'; location: string } | { mode: 'countryside' }

const ORDER: DeliveryClass[] = ['S', 'M', 'L', 'XL']
export const SIZE_LABEL: Record<'S' | 'M' | 'L' | 'XL', string> = { S: 'жижиг', M: 'дунд', L: 'том', XL: 'маш том' }

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
