import { Injectable, NotFoundException } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository } from 'typeorm'
import { PricingRule, RuleType, ConditionOperator, EffectType } from './entities/pricing-rule.entity'
import { PricingTier } from './entities/pricing-tier.entity'
import { CompetitorPrice } from './entities/competitor-price.entity'

export interface CalculatePriceDto {
  product_code: string
  material_code?: string
  size_code?: string
  custom_width_m?: number
  custom_height_m?: number
  quantity: number
  finishing_codes?: string[]
  addon_codes?: string[]
  rush_hours?: number
  pricing_tier: string
  apply_competitor_tactic?: boolean
  // These are passed from the product master lookup
  base_price?: number
  material_cost?: number
  finishing_data?: { code: string; price_per_m2: number; price_per_piece: number }[]
  addon_data?: { code: string; price: number; price_type: string }[]
  area_m2?: number
  unit_type?: string
}

export interface RuleApplied {
  rule_name: string
  rule_type: string
  effect: string
  amount: number
}

export interface BreakdownItem {
  label: string
  amount: number
  type: 'base' | 'discount' | 'surcharge' | 'finishing' | 'addon' | 'margin' | 'total'
}

@Injectable()
export class PricingEngineService {
  constructor(
    @InjectRepository(PricingRule) private ruleRepo: Repository<PricingRule>,
    @InjectRepository(PricingTier) private tierRepo: Repository<PricingTier>,
    @InjectRepository(CompetitorPrice) private compRepo: Repository<CompetitorPrice>,
  ) {}

  async calculate(dto: CalculatePriceDto) {
    const { quantity, rush_hours, pricing_tier, product_code } = dto

    // Get tier
    const tier = await this.tierRepo.findOne({ where: { code: pricing_tier || 'RETAIL' } })
    const marginRate = tier ? Number(tier.margin_rate) : 0.45

    // Calculate base price
    let basePrice = Number(dto.base_price || 0) * quantity
    const baseCost = Number(dto.material_cost || dto.base_price || 0) * quantity

    // Calculate area if applicable
    const area_m2 = dto.area_m2 || (dto.custom_width_m && dto.custom_height_m ? dto.custom_width_m * dto.custom_height_m : 0)

    // Get all active rules for this product
    const rules = await this.ruleRepo.find({
      where: { is_active: true },
      order: { priority: 'ASC' },
    })

    const applicableRules = rules.filter(r => !r.product_code || r.product_code === product_code)

    const rulesApplied: RuleApplied[] = []
    let discountTotal = 0
    let surchargeTotal = 0

    // Apply rules
    for (const rule of applicableRules) {
      const fieldValue = this.getFieldValue(rule.condition_field, { quantity, rush_hours: rush_hours || 0, area_m2, size_cm: area_m2 ? Math.sqrt(area_m2) * 100 : 0 })

      if (!this.evaluateCondition(rule, fieldValue)) continue

      const effect = this.applyEffect(rule, basePrice)

      if (rule.rule_type === RuleType.QUANTITY_DISCOUNT || rule.rule_type === RuleType.SIZE_FACTOR) {
        if (rule.effect_type === EffectType.MULTIPLY && Number(rule.effect_value) < 1) {
          const discount = basePrice - effect
          discountTotal += discount
          basePrice = effect
          rulesApplied.push({ rule_name: rule.name, rule_type: rule.rule_type, effect: `×${rule.effect_value}`, amount: -discount })
        } else {
          basePrice = effect
          rulesApplied.push({ rule_name: rule.name, rule_type: rule.rule_type, effect: `×${rule.effect_value}`, amount: effect - basePrice })
        }
      } else if (rule.rule_type === RuleType.RUSH_FEE) {
        const surcharge = basePrice * Number(rule.effect_value)
        surchargeTotal += surcharge
        rulesApplied.push({ rule_name: rule.name, rule_type: rule.rule_type, effect: `+${Number(rule.effect_value) * 100}%`, amount: surcharge })
      }
    }

    // Calculate finishing costs
    let finishingCost = 0
    if (dto.finishing_data && dto.finishing_codes) {
      for (const code of dto.finishing_codes) {
        const f = dto.finishing_data.find(fd => fd.code === code)
        if (f) {
          if (area_m2 > 0) {
            finishingCost += Number(f.price_per_m2) * area_m2 * quantity
          } else {
            finishingCost += Number(f.price_per_piece) * quantity
          }
        }
      }
    }

    // Calculate addon costs
    let addonCost = 0
    if (dto.addon_data && dto.addon_codes) {
      for (const code of dto.addon_codes) {
        const a = dto.addon_data.find(ad => ad.code === code)
        if (a) {
          if (a.price_type === 'PER_M2' && area_m2 > 0) {
            addonCost += Number(a.price) * area_m2
          } else if (a.price_type === 'PER_PIECE') {
            addonCost += Number(a.price) * quantity
          } else {
            addonCost += Number(a.price)
          }
        }
      }
    }

    const subtotal = basePrice + surchargeTotal + finishingCost + addonCost
    const marginAmount = subtotal * marginRate
    const finalPrice = Math.round(subtotal + marginAmount)
    const unitPrice = Math.round(finalPrice / quantity)

    // Competitor analysis
    let competitorAnalysis: any = undefined
    let tacticApplied = false
    let vsMarketPct: number | undefined = undefined

    if (dto.apply_competitor_tactic) {
      const compPrices = await this.compRepo.find({ where: { product_code } })
      if (compPrices.length > 0) {
        const prices = compPrices.map(c => Number(c.price))
        const avgPrice = prices.reduce((a, b) => a + b, 0) / prices.length
        const minPrice = Math.min(...prices)
        vsMarketPct = Math.round(((finalPrice - avgPrice) / avgPrice) * 100)
        competitorAnalysis = {
          competitors: compPrices.map(c => ({ name: c.competitor_name, price: Number(c.price) })),
          market_avg: Math.round(avgPrice),
          market_min: minPrice,
          our_price: finalPrice,
          position: finalPrice < avgPrice ? 'ХЯМД' : finalPrice > avgPrice * 1.1 ? 'ҮНЭТЭЙ' : 'ДУНДАЖ',
        }
        tacticApplied = true
      }
    }

    // Build breakdown
    const breakdown: BreakdownItem[] = [
      { label: 'Суурь үнэ', amount: Math.round(Number(dto.base_price || 0) * quantity), type: 'base' },
    ]
    if (discountTotal > 0) breakdown.push({ label: 'Хөнгөлөлт', amount: -Math.round(discountTotal), type: 'discount' })
    if (surchargeTotal > 0) breakdown.push({ label: 'Яаралтай нэмэгдэл', amount: Math.round(surchargeTotal), type: 'surcharge' })
    if (finishingCost > 0) breakdown.push({ label: 'Finishing', amount: Math.round(finishingCost), type: 'finishing' })
    if (addonCost > 0) breakdown.push({ label: 'Нэмэлт ажил', amount: Math.round(addonCost), type: 'addon' })
    breakdown.push({ label: `Маржин (${Math.round(marginRate * 100)}%)`, amount: Math.round(marginAmount), type: 'margin' })
    breakdown.push({ label: 'Нийт', amount: finalPrice, type: 'total' })

    return {
      base_cost: Math.round(baseCost),
      base_price: Math.round(Number(dto.base_price || 0) * quantity),
      rules_applied: rulesApplied,
      discounts: rulesApplied.filter(r => r.amount < 0).map(r => ({ name: r.rule_name, amount: Math.abs(r.amount) })),
      surcharges: rulesApplied.filter(r => r.amount > 0 && r.rule_type === 'RUSH_FEE').map(r => ({ name: r.rule_name, amount: r.amount })),
      finishing_cost: Math.round(finishingCost),
      addon_cost: Math.round(addonCost),
      subtotal: Math.round(subtotal),
      margin_amount: Math.round(marginAmount),
      final_price: finalPrice,
      unit_price: unitPrice,
      competitor_analysis: competitorAnalysis,
      tactic_applied: tacticApplied,
      vs_market_pct: vsMarketPct,
      price_breakdown: breakdown,
      validity_hours: 72,
      novat_note: 'НӨАТ ороогүй',
    }
  }

  async simulate(dto: CalculatePriceDto & { override_margin?: number }) {
    // Simulate with all tiers
    const tiers = await this.tierRepo.find({ where: { is_active: true } })
    const results: any[] = []
    for (const tier of tiers) {
      const result = await this.calculate({ ...dto, pricing_tier: tier.code })
      results.push({ tier: tier.code, tier_name: tier.name_mn, margin_rate: tier.margin_rate, ...result })
    }
    return { simulations: results }
  }

  private getFieldValue(field: string, context: Record<string, number>): number {
    return context[field] || 0
  }

  private evaluateCondition(rule: PricingRule, value: number): boolean {
    const v1 = Number(rule.condition_value)
    const v2 = rule.condition_value2 ? Number(rule.condition_value2) : 0
    switch (rule.condition_operator) {
      case ConditionOperator.GTE: return value >= v1
      case ConditionOperator.LTE: return value <= v1
      case ConditionOperator.EQ: return value === v1
      case ConditionOperator.BETWEEN: return value >= v1 && value <= v2
      default: return false
    }
  }

  private applyEffect(rule: PricingRule, currentPrice: number): number {
    const val = Number(rule.effect_value)
    switch (rule.effect_type) {
      case EffectType.MULTIPLY: return currentPrice * val
      case EffectType.ADD: return currentPrice + val
      case EffectType.SUBTRACT: return currentPrice - val
      case EffectType.SET_MAX: return Math.min(currentPrice, val)
      case EffectType.SET_MIN: return Math.max(currentPrice, val)
      default: return currentPrice
    }
  }

  // Rule CRUD
  async findAllRules() {
    return this.ruleRepo.find({ order: { priority: 'ASC' } })
  }

  async createRule(data: Partial<PricingRule>) {
    return this.ruleRepo.save(this.ruleRepo.create(data))
  }

  async updateRule(id: string, data: Partial<PricingRule>) {
    await this.ruleRepo.update(id, data)
    return this.ruleRepo.findOne({ where: { id } })
  }

  // Tier CRUD
  async findAllTiers() {
    return this.tierRepo.find({ order: { margin_rate: 'ASC' } })
  }

  async updateTier(id: string, data: Partial<PricingTier>) {
    await this.tierRepo.update(id, data)
    return this.tierRepo.findOne({ where: { id } })
  }

  // Competitor CRUD
  async findAllCompetitorPrices(filters?: { product_type?: string; product_subtype?: string; is_active?: boolean }) {
    const qb = this.compRepo.createQueryBuilder('cp').orderBy('cp.factory_name', 'ASC').addOrderBy('cp.product_type', 'ASC')
    if (filters?.product_type) qb.andWhere('cp.product_type = :pt', { pt: filters.product_type })
    if (filters?.product_subtype) qb.andWhere('cp.product_subtype = :ps', { ps: filters.product_subtype })
    if (filters?.is_active !== undefined) qb.andWhere('cp.is_active = :active', { active: filters.is_active })
    return qb.getMany()
  }

  async saveCompetitorPrice(data: Partial<CompetitorPrice>) {
    // Backward compat: map old fields to new
    if (data.competitor_name && !data.factory_name) (data as any).factory_name = data.competitor_name
    if (data.price && !data.unit_price) (data as any).unit_price = data.price
    return this.compRepo.save(this.compRepo.create(data))
  }

  async updateCompetitorPrice(id: string, data: Partial<CompetitorPrice>) {
    await this.compRepo.update(id, data)
    return this.compRepo.findOne({ where: { id } })
  }

  async deleteCompetitorPrice(id: string) {
    await this.compRepo.delete(id)
    return { deleted: true }
  }

  async getMarketAnalysis(params: { product_type: string; product_subtype?: string; size?: string; gsm?: number; quantity?: number }) {
    const qb = this.compRepo.createQueryBuilder('cp')
      .where('cp.is_active = true')
      .andWhere('cp.product_type = :pt', { pt: params.product_type })

    if (params.product_subtype) qb.andWhere('cp.product_subtype = :ps', { ps: params.product_subtype })
    if (params.size) qb.andWhere('cp.size = :sz', { sz: params.size })
    if (params.gsm) qb.andWhere('(cp.gsm = :gsm OR cp.gsm IS NULL)', { gsm: params.gsm })
    if (params.quantity) {
      qb.andWhere('(cp.quantity_min <= :qty)', { qty: params.quantity })
      qb.andWhere('(cp.quantity_max >= :qty OR cp.quantity_max IS NULL)', { qty: params.quantity })
    }

    const prices = await qb.getMany()
    if (prices.length === 0) return { has_data: false, sample_count: 0 }

    const unitPrices = prices.map(p => Number(p.unit_price))
    const avg = unitPrices.reduce((a, b) => a + b, 0) / unitPrices.length
    const min = Math.min(...unitPrices)
    const max = Math.max(...unitPrices)

    const factories = [...new Set(prices.map(p => p.factory_name))]

    return {
      has_data: true,
      market_avg_unit_price: Math.round(avg),
      market_min_unit_price: Math.round(min),
      market_max_unit_price: Math.round(max),
      sample_count: prices.length,
      factories,
      entries: prices.map(p => ({
        factory: p.factory_name,
        unit_price: Number(p.unit_price),
        size: p.size,
        gsm: p.gsm,
        qty_range: `${p.quantity_min}-${p.quantity_max || '∞'}`,
        date: p.date_collected,
      })),
    }
  }

  // Seed rules and tiers
  async seed() {
    const ruleCount = await this.ruleRepo.count()
    if (ruleCount > 0) return { message: 'Already seeded' }

    // Seed tiers
    const tiers = [
      { code: 'B2B', name_mn: 'B2B хамтрагч', margin_rate: 0.20, min_order_amount: 100000, description: 'Хамтран ажиллагч газруудад' },
      { code: 'RETAIL', name_mn: 'Жижиглэн', margin_rate: 0.45, min_order_amount: 0, description: 'Эцсийн хэрэглэгчид' },
      { code: 'VIP', name_mn: 'VIP', margin_rate: 0.30, min_order_amount: 500000, description: 'Байнгын том захиалагчид' },
      { code: 'WHOLESALE', name_mn: 'Бөөний', margin_rate: 0.15, min_order_amount: 1000000, description: 'Бөөний захиалга 1M+ дүн' },
    ]
    for (const t of tiers) await this.tierRepo.save(this.tierRepo.create(t))

    // Seed rules
    const rules = [
      // Quantity discounts for offset
      { name: 'Офсет 100+ 5% хөнгөлөлт', product_code: 'OFFSET_A4', rule_type: RuleType.QUANTITY_DISCOUNT, condition_field: 'quantity', condition_operator: ConditionOperator.GTE, condition_value: 100, effect_type: EffectType.MULTIPLY, effect_value: 0.95, priority: 10 },
      { name: 'Офсет 500+ 10% хөнгөлөлт', product_code: 'OFFSET_A4', rule_type: RuleType.QUANTITY_DISCOUNT, condition_field: 'quantity', condition_operator: ConditionOperator.GTE, condition_value: 500, effect_type: EffectType.MULTIPLY, effect_value: 0.90, priority: 11 },
      { name: 'Офсет 1000+ 15% хөнгөлөлт', product_code: 'OFFSET_A4', rule_type: RuleType.QUANTITY_DISCOUNT, condition_field: 'quantity', condition_operator: ConditionOperator.GTE, condition_value: 1000, effect_type: EffectType.MULTIPLY, effect_value: 0.85, priority: 12 },
      { name: 'Офсет 5000+ 20% хөнгөлөлт', product_code: 'OFFSET_A4', rule_type: RuleType.QUANTITY_DISCOUNT, condition_field: 'quantity', condition_operator: ConditionOperator.GTE, condition_value: 5000, effect_type: EffectType.MULTIPLY, effect_value: 0.80, priority: 13 },
      // General quantity discounts
      { name: '100+ ширхэг 5% хөнгөлөлт', product_code: null, rule_type: RuleType.QUANTITY_DISCOUNT, condition_field: 'quantity', condition_operator: ConditionOperator.GTE, condition_value: 100, effect_type: EffectType.MULTIPLY, effect_value: 0.95, priority: 50 },
      { name: '500+ ширхэг 10% хөнгөлөлт', product_code: null, rule_type: RuleType.QUANTITY_DISCOUNT, condition_field: 'quantity', condition_operator: ConditionOperator.GTE, condition_value: 500, effect_type: EffectType.MULTIPLY, effect_value: 0.90, priority: 51 },
      // Rush fees
      { name: '24 цагийн яаралтай 30%', product_code: null, rule_type: RuleType.RUSH_FEE, condition_field: 'rush_hours', condition_operator: ConditionOperator.LTE, condition_value: 24, effect_type: EffectType.ADD, effect_value: 0.30, priority: 1 },
      { name: '48 цагийн яаралтай 15%', product_code: null, rule_type: RuleType.RUSH_FEE, condition_field: 'rush_hours', condition_operator: ConditionOperator.LTE, condition_value: 48, effect_type: EffectType.ADD, effect_value: 0.15, priority: 2 },
      // Size factor for signage
      { name: 'Том хэмжээ (100+ см) хямдрал', product_code: 'TOVGOR', rule_type: RuleType.SIZE_FACTOR, condition_field: 'size_cm', condition_operator: ConditionOperator.GTE, condition_value: 100, effect_type: EffectType.MULTIPLY, effect_value: 0.95, priority: 20 },
    ]
    for (const r of rules) await this.ruleRepo.save(this.ruleRepo.create(r as any))

    // Seed competitor prices (expanded)
    const competitors = [
      // Offset
      { factory_name: 'Гангар принт', product_type: 'offset', product_subtype: 'Нэрийн хуудас', size: 'BC', gsm: 300, quantity_min: 100, quantity_max: 500, unit_price: 180, date_collected: new Date() },
      { factory_name: 'Гангар принт', product_type: 'offset', product_subtype: 'Флаер', size: 'A4', gsm: 130, quantity_min: 100, quantity_max: 1000, unit_price: 160, date_collected: new Date() },
      { factory_name: 'Гангар принт', product_type: 'offset', product_subtype: 'Флаер', size: 'A5', gsm: 130, quantity_min: 100, quantity_max: 1000, unit_price: 95, date_collected: new Date() },
      { factory_name: 'Омо гүн', product_type: 'offset', product_subtype: 'Нэрийн хуудас', size: 'BC', gsm: 300, quantity_min: 100, quantity_max: 500, unit_price: 160, date_collected: new Date() },
      { factory_name: 'Омо гүн', product_type: 'offset', product_subtype: 'Флаер', size: 'A4', gsm: 130, quantity_min: 100, quantity_max: 1000, unit_price: 145, date_collected: new Date() },
      { factory_name: 'Адмон принт', product_type: 'offset', product_subtype: 'Флаер', size: 'A4', gsm: 150, quantity_min: 500, quantity_max: 5000, unit_price: 120, date_collected: new Date() },
      { factory_name: 'Адмон принт', product_type: 'offset', product_subtype: 'Боршур', size: 'A4', gsm: 170, quantity_min: 100, quantity_max: 1000, unit_price: 350, date_collected: new Date() },
      // Wide
      { factory_name: 'Гангар принт', product_type: 'wide', product_subtype: 'banner', size: null, quantity_min: 1, unit_price: 9000, date_collected: new Date() },
      { factory_name: 'Скай реклам', product_type: 'wide', product_subtype: 'banner', size: null, quantity_min: 1, unit_price: 8500, date_collected: new Date() },
      { factory_name: 'Скай реклам', product_type: 'wide', product_subtype: 'sticker', size: null, quantity_min: 1, unit_price: 13000, date_collected: new Date() },
      // Sign
      { factory_name: 'Гангар реклам', product_type: 'sign', product_subtype: 'tovgor', size: '30cm', quantity_min: 1, unit_price: 40000, date_collected: new Date() },
      { factory_name: 'Омо гүн', product_type: 'sign', product_subtype: 'tovgor', size: '30cm', quantity_min: 1, unit_price: 38000, date_collected: new Date() },
      { factory_name: 'Өрсөлдөгч 3', product_type: 'sign', product_subtype: 'tovgor', size: '30cm', quantity_min: 1, unit_price: 42000, date_collected: new Date() },
    ]
    for (const c of competitors) await this.compRepo.save(this.compRepo.create(c as any))

    return { message: 'Pricing engine seeded successfully' }
  }
}
