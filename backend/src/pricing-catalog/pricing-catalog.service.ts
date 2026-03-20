import { Injectable } from '@nestjs/common'
import { existsSync, readFileSync } from 'fs'
import { join } from 'path'
import {
  PricingCatalog,
  PricingItem,
  QuoteRequest,
  QuoteResponse,
} from './pricing-catalog.interfaces'

@Injectable()
export class PricingCatalogService {
  private catalog: PricingCatalog | null = null

  loadCatalog(): PricingCatalog {
    if (this.catalog) return this.catalog
    const filePath = join(__dirname, '..', 'pricing-rules', 'catalog.manual.json')
    if (!existsSync(filePath)) {
      throw new Error('pricing catalog file not found: ' + filePath)
    }
    const json = readFileSync(filePath, 'utf8')
    this.catalog = JSON.parse(json) as PricingCatalog
    return this.catalog
  }

  quote(req: QuoteRequest): QuoteResponse {
    const catalog = this.loadCatalog()
    const item = this.pickItem(catalog.items, req.product_type)
    const quantity = req.quantity ?? 1
    const area_m2 = req.area_m2 ?? this.calcArea(req.width_mm, req.height_mm, quantity)

    const base_total =
      item.unit === 'm2' && area_m2
        ? item.price * area_m2
        : item.price * quantity

    const applyVat = req.apply_vat ?? true
    const vatPct = catalog.meta.vat_percent
    const vat = applyVat && item.price_vat
      ? base_total * (vatPct / 100)
      : undefined

    return {
      product_type: req.product_type,
      item,
      unit_price: item.price,
      total: vat ? Math.round(base_total + vat) : Math.round(base_total),
      total_vat: vat ? Math.round(base_total + vat) : undefined,
      quantity,
      area_m2,
      vat_percent: applyVat ? vatPct : undefined,
      breakdown: {
        base_total: Math.round(base_total),
        vat: vat ? Math.round(vat) : undefined,
      },
    }
  }

  private pickItem(items: PricingItem[], product_type: string): PricingItem {
    const hit = items.find(i => i.category === product_type) || items.find(i => i.name === product_type)
    if (!hit) {
      throw new Error(`pricing item not found for product_type=${product_type}`)
    }
    return hit
  }

  private calcArea(w?: number, h?: number, qty?: number) {
    if (!w || !h || !qty) return undefined
    // mm -> m2
    const one = (w / 1000) * (h / 1000)
    return Math.round(one * qty * 1000) / 1000 // 3 decimals
  }
}
