/**
 * Үнийн тооцоолуурын хамгаалалтын тест.
 * catalog.json-ыг шинэчлэх бүрт `npm test` ажиллуулна — Excel-ээс алдаатай үнэ орж ирвэл,
 * тооцооны дүрэм эвдэрвэл, эсвэл сайт ба серверийн үнэ зөрвөл энд унана.
 */
import { describe, expect, it } from 'vitest'
import {
  BOOK_MIN,
  catalog,
  fromPrice,
  getItem,
  priceLine,
  shippingFee,
  tierFor,
  tierTotal,
  type Line,
  type Priced,
} from './index'
// Сервер сагсанд нэмэхэд үнийг энэ функцээр дахин боддог
import { priceCatalogLine, type CatalogFormula } from '../../../backend/src/products/catalog-pricing'

const sellable = catalog.items.filter((i) => !i.addon)
const tiered = sellable.filter((i) => i.unit === 'tier')
const serverFormula = { type: 'catalog', variants: catalog.items, books: catalog.books } as unknown as CatalogFormula

/** Бараа бүрийн жишиг мөрүүд (м² бараанд бэлэн болон дурын хэмжээ) */
function sampleLines(): Line[] {
  const lines: Line[] = []
  for (const i of sellable) {
    if (i.unit === 'm2') {
      lines.push({ id: i.code, kind: 'item', code: i.code, w: 1.3, h: 0.7, qty: 2 })
      lines.push({ id: i.code, kind: 'item', code: i.code, w: 2, h: 1, qty: 1, rope: true })
      for (const p of i.presets || []) lines.push({ id: i.code, kind: 'item', code: i.code, w: p.w, h: p.h, qty: 3 })
    } else if (i.unit === 'tier') {
      for (const q of [1, i.min || 1, 49, 50, 299, 300, 999, 1000, 2500]) lines.push({ id: i.code, kind: 'item', code: i.code, qty: q })
    } else if (i.unit === 'lm') {
      lines.push({ id: i.code, kind: 'item', code: i.code, qty: 2.5 })
    } else {
      lines.push({ id: i.code, kind: 'item', code: i.code, qty: 3 })
    }
  }
  for (const b of catalog.books) for (const q of [50, 200, 299, 300, 999, 1000, 4999]) lines.push({ id: b.code, kind: 'book', code: b.code, qty: q })
  return lines
}

describe('catalog.json — өгөгдлийн бүрэн бүтэн байдал', () => {
  it('код давхардаагүй', () => {
    const codes = [...catalog.items.map((i) => i.code), ...catalog.books.map((b) => b.code)]
    expect(new Set(codes).size).toBe(codes.length)
  })

  it('бараа бүр эерэг үнэтэй; НӨАТ-гүй үнэ байвал НӨАТ-тэйтэй нь таарна', () => {
    for (const i of catalog.items) {
      expect(i.inc, i.code).toBeGreaterThan(0)
      if (i.ex) expect(Math.abs(i.inc - i.ex * (1 + catalog.vatRate)), i.code).toBeLessThanOrEqual(100)
    }
  })

  it('багц бараа багцын тоотой', () => {
    for (const i of catalog.items.filter((x) => x.unit === 'pack')) expect(i.pack, i.code).toBeGreaterThan(0)
  })

  it('шатлал өсөх дарааллаар, их тоонд нэгжийн үнэ өсөхгүй', () => {
    const all = [
      ...tiered.map((i) => ({ code: i.code, u: (i.tiers || []).map((t) => [t.min, t.inc]) })),
      ...catalog.books.map((b) => ({ code: b.code, u: b.tiers.map((t) => [t.min, t.ex]) })),
    ]
    for (const { code, u } of all) {
      expect(u.length, code).toBeGreaterThan(0)
      for (let k = 1; k < u.length; k++) {
        expect(u[k][0], code).toBeGreaterThan(u[k - 1][0])
        expect(u[k][1], code).toBeLessThanOrEqual(u[k - 1][1])
      }
    }
  })

  it('олс, бөгж нэмэлт зөвхөн м² бараанд', () => {
    for (const i of catalog.items.filter((x) => x.rope)) expect(i.unit, i.code).toBe('m2')
  })

  it('төрөл бүрийн код каталогт байна', () => {
    for (const t of catalog.types) for (const c of t.codes) expect(getItem(c), `${t.slug}:${c}`).toBeDefined()
  })

  it('хүргэлтийн бүс бүр тохиргоотой', () => {
    for (const l of catalog.delivery.locations) expect(catalog.delivery.zoneAdd[String(l.zone)], l.name).toBeDefined()
  })
})

describe('tierFor / tierTotal', () => {
  const tiers = [
    { min: 10, inc: 1000 },
    { min: 50, inc: 900 },
  ]
  it('хамгийн өндөр тохирох шатлалыг сонгоно', () => {
    expect(tierFor(tiers, 49).min).toBe(10)
    expect(tierFor(tiers, 50).min).toBe(50)
  })
  it('цөөн тоо дараагийн шатлалын нийт дүнгээс хэтрэхгүй', () => {
    expect(tierTotal(tiers, 49, (t) => t.inc).total).toBe(45_000) // 49×1000 биш, 50×900
    expect(tierTotal(tiers, 49, (t) => t.inc).capped?.min).toBe(50)
    expect(tierTotal(tiers, 40, (t) => t.inc).total).toBe(40_000)
    expect(tierTotal(tiers, 40, (t) => t.inc).capped).toBeUndefined()
  })
})

const monotonic = (mk: (q: number) => Line, from: number, to: number, label: string) => {
  let prev = -1
  for (let q = from; q <= to; q++) {
    const p = priceLine(mk(q))!
    expect(p.inc, `${label} ${q}ш`).toBeGreaterThanOrEqual(prev)
    prev = p.inc
  }
}

describe('priceLine — бүх бараа', () => {
  it('бараа бүр эерэг, бүхэл төгрөгийн дүн гаргана', () => {
    for (const l of sampleLines()) {
      const p = priceLine(l) as Priced
      expect(p, l.code).not.toBeNull()
      expect(Number.isInteger(p.inc) && p.inc > 0, `${l.code} ${JSON.stringify(l)}`).toBe(true)
      expect(p.cartQty, l.code).toBeGreaterThan(0)
      expect(p.steps.length, l.code).toBeGreaterThan(0)
    }
  })

  it('их авах тусам нийт дүн буурахгүй (шатлалтай бараа)', () => {
    for (const i of tiered) monotonic((q) => ({ id: 'x', kind: 'item', code: i.code, qty: q }), i.min || 1, 2000, i.code)
  })

  it('их авах тусам нийт дүн буурахгүй (ном)', () => {
    for (const b of catalog.books) monotonic((q) => ({ id: 'x', kind: 'book', code: b.code, qty: q }), BOOK_MIN, 2000, b.code)
  })

  it('танихгүй код null буцаана', () => {
    expect(priceLine({ id: 'x', kind: 'item', code: 'NOPE', qty: 1 })).toBeNull()
    expect(priceLine({ id: 'x', kind: 'book', code: 'NOPE', qty: 1 })).toBeNull()
  })

  it('«эхлэх үнэ» эерэг', () => {
    for (const i of sellable) expect(fromPrice(i).inc, i.code).toBeGreaterThan(0)
  })
})

describe('Сайт ба серверийн үнэ яг ижил (parity)', () => {
  it('каталогийн бүх мөрөөр сайтын болон серверийн нийт дүн таарна', () => {
    const lines = sampleLines()
    expect(lines.length).toBeGreaterThan(500)
    for (const l of lines) {
      const site = priceLine(l)!
      const server = priceCatalogLine(serverFormula, l as any)
      expect(server, `${l.code} ${JSON.stringify(l)}`).not.toBeNull()
      expect(server!.total, `${l.code} ${JSON.stringify(l)}`).toBe(site.inc)
      expect(server!.cartQty, `${l.code} ${JSON.stringify(l)}`).toBe(site.cartQty)
    }
  })

  it('нэмэлт бүрэлдэхүүнтэй (реле, кран…) мөр ч таарна', () => {
    const addons = catalog.items.filter((i) => i.addon)
    const base = sellable.find((i) => i.unit === 'pcs')!
    const l: Line = { id: 'x', kind: 'item', code: base.code, qty: 2, addons: Object.fromEntries(addons.map((a) => [a.code, 2])) }
    expect(priceCatalogLine(serverFormula, l as any)!.total).toBe(priceLine(l)!.inc)
  })
})

describe('Албан үнэ (жишиг)', () => {
  it('нэрийн хуудас 200ш энгийн = 55,000₮ (НӨАТ-тэй)', () => {
    expect(getItem('BP-076')).toMatchObject({ unit: 'pack', pack: 200, inc: 55_000 })
  })
  it('гадна туг нимгэн силк = 55,000₮/м², дотор зузаан атлас = 66,000₮/м²', () => {
    expect(getItem('BP-041')?.inc).toBe(55_000)
    expect(getItem('BP-040')?.inc).toBe(66_000)
  })
})

describe('shippingFee', () => {
  const p = (delivery: Priced['delivery']): Priced => ({ title: '', subtitle: '', inc: 1, steps: [], delivery, cartQty: 1 })
  it('өөрөө ирж авбал үнэгүй', () => {
    expect(shippingFee([p('XL')], { mode: 'pickup' }).fee).toBe(0)
  })
  it('хамгийн том ачааны ангиллаар бодно, дээд хязгаараас хэтрэхгүй', () => {
    for (const l of catalog.delivery.locations) {
      const r = shippingFee([p('S'), p('L')], { mode: 'city', location: l.name })
      expect(r.fee).toBeLessThanOrEqual(catalog.delivery.max)
      expect(r.fee).toBeGreaterThanOrEqual(Math.min(catalog.delivery.base.L, catalog.delivery.max))
    }
  })
})
