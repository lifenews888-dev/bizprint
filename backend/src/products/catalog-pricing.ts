/**
 * Албан үнийн жагсаалтын бараа (pricing_mode = 'catalog') — серверийн үнийн шалгалт.
 * Frontend-ийн lib/pricing/index.ts-ийн priceLine()-тэй ижил дүрэм; өгөгдөл нь
 * products.price_formula.variants (migration 2026-11-25-01-shop-catalog-v1.sql).
 */

type Tier = { min: number; inc: number };
type Variant = {
  code: string;
  unit: 'm2' | 'pcs' | 'pack' | 'tier' | 'lm';
  inc: number;
  ex?: number;
  pack?: number;
  tiers?: Tier[];
  min?: number;
  presets?: { w: number; h: number; inc?: number }[];
  rope?: number;
  addon?: boolean;
};
type Book = { code: string; tiers: { min: number; ex: number }[] };
export type CatalogFormula = { type: 'catalog'; variants: Variant[]; books?: Book[] };
export type CatalogLine = {
  kind: 'item' | 'book';
  code: string;
  w?: number;
  h?: number;
  qty: number;
  rope?: boolean;
  addons?: Record<string, number>;
};

const VAT = 0.1;
const BOOK_MIN = 200;
export const roundp = (x: number) => (x >= 10000 ? Math.round(x / 100) * 100 : Math.round(x / 10) * 10);
const tierFor = <T extends { min: number }>(tiers: T[], qty: number): T => {
  let t = tiers[0];
  for (const x of tiers) if (qty >= x.min) t = x;
  return t;
};

/** Мөрийн НӨАТ орсон нийт үнэ ба сагсны тоо. Таарахгүй бол null. */
export function priceCatalogLine(formula: CatalogFormula, line: CatalogLine): { total: number; cartQty: number } | null {
  if (!formula || formula.type !== 'catalog' || !line?.code) return null;

  if (line.kind === 'book') {
    const b = formula.books?.find((x) => x.code === line.code);
    if (!b) return null;
    const qty = Math.max(BOOK_MIN, Math.round(Number(line.qty) || 0));
    const per = roundp(tierFor(b.tiers, qty).ex * (1 + VAT));
    return { total: per * qty, cartQty: qty };
  }

  const v = formula.variants.find((x) => x.code === line.code && !x.addon);
  if (!v) return null;
  const qty = Math.max(1, Math.round(Number(line.qty) || 1));
  let total = 0;
  let cartQty = qty;

  switch (v.unit) {
    case 'm2': {
      const w = Math.max(0, Number(line.w) || 0);
      const h = Math.max(0, Number(line.h) || 0);
      const preset = v.presets?.find((p) => p.w === w && p.h === h && p.inc);
      const ex = v.ex ?? v.inc / (1 + VAT);
      const piece = preset?.inc ?? roundp(ex * (1 + VAT) * w * h);
      const rope = line.rope && v.rope ? roundp(v.rope * w * h) : 0;
      total = (piece + rope) * qty;
      break;
    }
    case 'tier': {
      const min = v.min || 1;
      const q = Math.max(min, Math.round(Number(line.qty) || min));
      total = tierFor(v.tiers?.length ? v.tiers : [{ min, inc: v.inc }], q).inc * q;
      cartQty = q;
      break;
    }
    case 'lm':
      total = Math.round(v.inc * Math.max(0, Number(line.qty) || 0));
      cartQty = 1;
      break;
    default: // pcs, pack
      total = v.inc * qty;
  }

  for (const [code, n] of Object.entries(line.addons || {})) {
    const a = formula.variants.find((x) => x.code === code && x.addon);
    const q = Math.max(0, Math.round(Number(n) || 0));
    if (!a || !q) continue;
    total += a.inc * q;
    cartQty = 1;
  }
  return total > 0 ? { total, cartQty } : null;
}
