import { Injectable } from '@nestjs/common';

/**
 * Smart Print Estimator — Universal Price Calculator
 *
 * Price = BaseSetup + MaterialCost + AddonsCost - VolumeDiscount
 *
 * Strategies:
 * 1. FIXED: base_price × quantity
 * 2. AREA_BASED: (W × H / 1M) × price_per_m2 + options
 * 3. TIER_BASED: material_cost + size_cost, then tier multiplier
 * 4. QUOTE_REQUIRED: estimate only, manual approval needed
 */

export interface PriceInput {
  quantity: number
  width_mm?: number
  height_mm?: number
  material_key?: string
  size_key?: string
  finishing_keys?: string[]
  addon_keys?: string[]
  options?: Record<string, boolean>  // has_lighting, has_frame, etc.
}

export interface PriceBreakdown {
  base_setup: number       // Тогтмол зардал (дизайн, тохиргоо)
  material_cost: number    // Материалын зардал
  area_m2?: number         // Талбай (м²)
  addons_cost: number      // Нэмэлт зардал
  subtotal: number         // Дүн
  volume_discount: number  // Тоо ширхгийн хөнгөлөлт
  total: number            // Нийт
  unit_price: number       // Нэгж үнэ
  currency: string
  formula_used: string
  notes: string[]
}

@Injectable()
export class ProductPriceCalculatorService {

  /**
   * Main entry point — delegates to correct strategy
   */
  calculate(product: any, input: PriceInput): PriceBreakdown {
    const mode = product.pricing_mode || 'fixed'
    const formula = product.price_formula || {}

    switch (mode) {
      case 'formula':
        if (formula.type === 'area_based') return this.calculateAreaBased(product, input, formula)
        return this.calculateFixed(product, input)
      case 'tier':
        return this.calculateTierBased(product, input, formula)
      case 'quote_required':
        return this.calculateEstimate(product, input, formula)
      default:
        return this.calculateFixed(product, input)
    }
  }

  /**
   * Strategy 1: FIXED — Shop products
   * Price = base_price × quantity
   */
  private calculateFixed(product: any, input: PriceInput): PriceBreakdown {
    const basePrice = Number(product.sale_price || product.base_price || 0)
    const qty = Math.max(1, input.quantity)
    const total = basePrice * qty

    return {
      base_setup: 0,
      material_cost: basePrice * qty,
      addons_cost: 0,
      subtotal: total,
      volume_discount: 0,
      total,
      unit_price: basePrice,
      currency: 'MNT',
      formula_used: 'fixed',
      notes: ['Тогтмол үнэ'],
    }
  }

  /**
   * Strategy 2: AREA_BASED — Signage products (хаяг, самбар)
   * Price = (W × H / 1,000,000) × price_per_m2 + option_costs
   */
  private calculateAreaBased(product: any, input: PriceInput, formula: any): PriceBreakdown {
    const w = input.width_mm || 1000
    const h = input.height_mm || 1000
    const qty = Math.max(1, input.quantity)

    const area_m2 = Math.max((w * h) / 1_000_000, formula.min_area_m2 || 0.25)
    const pricePerM2 = Number(formula.price_per_m2 || 0)
    const materialCost = area_m2 * pricePerM2

    // Calculate option costs
    let addonsCost = 0
    const notes: string[] = [`${w}×${h}мм = ${area_m2.toFixed(2)} м²`]
    const options = formula.options || {}

    if (input.options) {
      for (const [key, enabled] of Object.entries(input.options)) {
        if (!enabled || !options[key]) continue
        const opt = options[key]
        if (opt.type === 'PER_M2') {
          const cost = area_m2 * Number(opt.price)
          addonsCost += cost
          notes.push(`${key}: ${area_m2.toFixed(2)}м² × ₮${Number(opt.price).toLocaleString()} = ₮${Math.round(cost).toLocaleString()}`)
        } else {
          addonsCost += Number(opt.price)
          notes.push(`${key}: ₮${Number(opt.price).toLocaleString()}`)
        }
      }
    }

    // Volume discount
    const discountRate = this.getVolumeDiscount(qty, formula.quantity_tiers)
    const subtotal = (materialCost + addonsCost) * qty
    const discount = subtotal * discountRate
    const total = subtotal - discount

    if (discountRate > 0) notes.push(`Тоо ширхгийн хөнгөлөлт: ${(discountRate * 100).toFixed(0)}%`)

    return {
      base_setup: 0,
      material_cost: materialCost * qty,
      area_m2,
      addons_cost: addonsCost * qty,
      subtotal,
      volume_discount: discount,
      total: Math.round(total),
      unit_price: Math.round((materialCost + addonsCost)),
      currency: 'MNT',
      formula_used: 'area_based',
      notes,
    }
  }

  /**
   * Strategy 3: TIER_BASED — Print products (тоо ширхгээр шатлал)
   * Price = (material + size costs) × tier_multiplier × quantity
   */
  private calculateTierBased(product: any, input: PriceInput, formula: any): PriceBreakdown {
    const qty = Math.max(1, input.quantity)
    const baseCost = Number(product.base_price || 0)
    const notes: string[] = []

    // Tier multiplier
    const tiers = formula.quantity_tiers || [
      { min: 1, max: 99, multiplier: 1.0 },
      { min: 100, max: 499, multiplier: 0.85 },
      { min: 500, max: 999, multiplier: 0.70 },
      { min: 1000, max: null, multiplier: 0.55 },
    ]

    let multiplier = 1.0
    for (const tier of tiers) {
      if (qty >= tier.min && (tier.max === null || qty <= tier.max)) {
        multiplier = tier.multiplier
        if (multiplier < 1) notes.push(`${qty} ширхэг: ${((1 - multiplier) * 100).toFixed(0)}% хөнгөлөлт`)
        break
      }
    }

    const unitPrice = Math.round(baseCost * multiplier)
    const total = unitPrice * qty

    return {
      base_setup: formula.setup_cost || 0,
      material_cost: total,
      addons_cost: 0,
      subtotal: total + (formula.setup_cost || 0),
      volume_discount: Math.round(baseCost * qty * (1 - multiplier)),
      total: total + (formula.setup_cost || 0),
      unit_price: unitPrice,
      currency: 'MNT',
      formula_used: 'tier_based',
      notes: notes.length ? notes : ['Стандарт үнэ'],
    }
  }

  /**
   * Strategy 4: ESTIMATE — Quote required products
   */
  private calculateEstimate(product: any, input: PriceInput, formula: any): PriceBreakdown {
    // Use area-based estimation if dimensions provided
    if (input.width_mm && input.height_mm && formula.price_per_m2) {
      const result = this.calculateAreaBased(product, input, formula)
      result.formula_used = 'estimate'
      result.notes.push('⚠️ Энэ бол урьдчилсан тооцоо. Эцсийн үнэ өөрчлөгдөж болно.')
      return result
    }

    return {
      base_setup: 0,
      material_cost: 0,
      addons_cost: 0,
      subtotal: 0,
      volume_discount: 0,
      total: 0,
      unit_price: 0,
      currency: 'MNT',
      formula_used: 'quote_required',
      notes: ['Үнийн санал хүсэх шаардлагатай. Холбоо барих: 7711-8899'],
    }
  }

  /**
   * Get volume discount rate from tier config
   */
  private getVolumeDiscount(qty: number, tiers?: any[]): number {
    if (!tiers?.length) {
      // Default tiers
      if (qty >= 10) return 0.05
      if (qty >= 5) return 0.03
      return 0
    }
    for (const tier of tiers) {
      if (qty >= tier.min && (tier.max === null || qty <= tier.max)) {
        return 1 - (tier.multiplier || 1)
      }
    }
    return 0
  }
}
