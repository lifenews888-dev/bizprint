import { Injectable } from '@nestjs/common'
import { existsSync, readFileSync } from 'fs'
import { join } from 'path'
import {
  PricingCatalog,
  PricingItem,
  QuoteRequest,
  QuoteResponse,
} from './pricing-catalog.interfaces'

/** Re-read catalog.manual.json from disk at most once per minute */
const CATALOG_TTL_MS = 60_000

@Injectable()
export class PricingCatalogService {
  private catalog:    PricingCatalog | null = null
  private loadedAt:   number = 0

  // ── Catalog loading ────────────────────────────────────────────────────────

  loadCatalog(): PricingCatalog {
    const now = Date.now()
    if (this.catalog && now - this.loadedAt < CATALOG_TTL_MS) {
      return this.catalog
    }
    const filePath = join(__dirname, '..', 'pricing-rules', 'catalog.manual.json')
    if (!existsSync(filePath)) {
      throw new Error('pricing catalog file not found: ' + filePath)
    }
    this.catalog   = JSON.parse(readFileSync(filePath, 'utf8')) as PricingCatalog
    this.loadedAt  = now
    return this.catalog
  }

  /** Force-reload from disk immediately (admin use). */
  reloadCatalog(): { reloaded: boolean; items: number } {
    this.catalog  = null
    this.loadedAt = 0
    const catalog = this.loadCatalog()
    return { reloaded: true, items: catalog.items.length }
  }

  // ── Item listing ───────────────────────────────────────────────────────────

  /** Return all items, optionally filtered by category. */
  listItems(category?: string): PricingItem[] {
    const { items } = this.loadCatalog()
    return category ? items.filter(i => i.category === category) : items
  }

  /** Return all distinct categories with their item counts. */
  listCategories(): { category: string; count: number; unit: string }[] {
    const { items } = this.loadCatalog()
    const map = new Map<string, { count: number; unit: string }>()
    for (const item of items) {
      const entry = map.get(item.category)
      if (entry) {
        entry.count++
      } else {
        map.set(item.category, { count: 1, unit: item.unit })
      }
    }
    return Array.from(map.entries()).map(([category, v]) => ({ category, ...v }))
  }

  // ── Quote calculation ──────────────────────────────────────────────────────

  quote(req: QuoteRequest): QuoteResponse {
    const catalog  = this.loadCatalog()
    const item     = this.pickItem(catalog.items, req)
    const quantity = Math.max(1, req.quantity ?? 1)

    // Total area (m²) for all pieces; undefined for pcs items
    const area_m2 = req.area_m2 ?? this.calcTotalArea(req.width_mm, req.height_mm, quantity)

    // Base total before VAT
    const base_total_raw =
      item.unit === 'm2' && area_m2 != null
        ? item.price * area_m2
        : item.price * quantity
    const base_total = Math.round(base_total_raw)

    // ── VAT logic ─────────────────────────────────────────────────────────
    //   price_vat === null    → VAT not applicable
    //   price_vat === price   → VAT already embedded in price (extract for display)
    //   price_vat  >  price   → price is pre-VAT; add vatPct% on top
    const applyVat  = req.apply_vat ?? true
    const vatPct    = catalog.meta.vat_percent   // 10
    const vatApplicable = item.price_vat !== null

    let vat:      number | undefined
    let vat_mode: 'added' | 'included' | undefined
    let total     = base_total

    if (applyVat && vatApplicable) {
      const alreadyIncluded = item.price_vat === item.price

      if (alreadyIncluded) {
        // Price is VAT-inclusive — extract VAT for the breakdown display
        vat      = Math.round(base_total - base_total / (1 + vatPct / 100))
        vat_mode = 'included'
        total    = base_total          // customer pays price as-is
      } else {
        // Price is pre-VAT — add VAT on top
        vat      = Math.round(base_total * vatPct / 100)
        vat_mode = 'added'
        total    = base_total + vat
      }
    }

    return {
      product_type: req.product_type,
      item,
      unit_price:   item.price,
      total,
      total_vat:    vat != null ? total : undefined,
      quantity,
      area_m2,
      vat_percent:  applyVat && vatApplicable ? vatPct : undefined,
      breakdown: {
        base_total,
        vat,
        vat_mode,
      },
    }
  }

  // ── Private helpers ────────────────────────────────────────────────────────

  /**
   * Pick the best matching PricingItem for a request.
   *
   * Priority:
   *   1. Exact item_name match (ignores category)
   *   2. material keyword match within category (case-insensitive substring)
   *   3. First item in category (fallback)
   */
  private pickItem(items: PricingItem[], req: QuoteRequest): PricingItem {
    const { product_type, item_name, material } = req

    // 1. Exact name
    if (item_name) {
      const hit = items.find(i => i.name === item_name)
      if (hit) return hit
    }

    // 2. Material keyword within category
    if (material) {
      const kw = material.toLowerCase()
      const hit = items.find(
        i => i.category === product_type &&
             (i.material?.toLowerCase().includes(kw) ||
              i.name.toLowerCase().includes(kw)),
      )
      if (hit) return hit
    }

    // 3. First in category
    const hit =
      items.find(i => i.category === product_type) ||
      items.find(i => i.name     === product_type)

    if (!hit) {
      throw new Error(`pricing item not found for product_type="${product_type}"`)
    }
    return hit
  }

  /**
   * Convert mm dimensions → total m² for `quantity` pieces (3-decimal precision).
   * Returns undefined when dimensions are missing.
   */
  private calcTotalArea(w?: number, h?: number, qty?: number): number | undefined {
    if (!w || !h) return undefined
    const one = (w / 1000) * (h / 1000)
    return Math.round(one * (qty ?? 1) * 1000) / 1000
  }
}
