import { Injectable } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository } from 'typeorm'
import { Machine } from '../machines/machine.entity'
import { PricingRulesService } from '../pricing-rules/pricing-rules.service'
import { PricingConfigService } from '../pricing-config/pricing-config.service'
import { ProductsMasterService } from '../products-master/products-master.service'
import pdfParse from 'pdf-parse'

@Injectable()
export class QuoteEngineService {
  constructor(
    @InjectRepository(Machine)
    private machineRepo: Repository<Machine>,
    private pricingRulesService: PricingRulesService,
    private pricingConfig: PricingConfigService,
    private productsMasterService: ProductsMasterService,
  ) {}

  async calculateFromPdf(file: Express.Multer.File, input: any) {
    const data = await pdfParse(file.buffer)
    const pages = data.numpages || 1
    return this.calculate({ ...input, pages })
  }

  async calculate(input: any) {
    const quantity    = Number(input.quantity)  || 100
    const pages       = Number(input.pages)     || 1
    const width_mm    = Number(input.width_mm)  || 210
    const height_mm   = Number(input.height_mm) || 297
    const color_mode  = input.color_mode || 'color'
    const sides       = input.sides || 'single'
    const paper_gsm   = Number(input.paper_gsm) || 150
    const finishing   = input.finishing || 'none'
    const binding     = input.binding   || 'none'
    const express_hours = Number(input.express_hours) || 0
    const urgency     = express_hours === 24 ? 'rush_24h' : express_hours === 48 ? 'rush_48h' : (input.urgency || 'standard')
    const gang_run    = input.gang_run  || false
    const category_id = input.category_id || null
    const product_id  = input.product_id  || null
    // Print product fields (product_masters)
    const product_master_id = input.product_master_id || null
    const material_code     = input.material_code || null
    const size_code         = input.size_code || null

    // ── Load product_master material/size if provided ────────────────────────
    let selectedMaterial: any = null
    let selectedSize: any = null
    let productMasterName = ''
    if (product_master_id) {
      try {
        const pm = await this.productsMasterService.findOne(product_master_id)
        productMasterName = pm.name_mn || pm.name_en || ''
        if (material_code && pm.materials?.length) {
          selectedMaterial = pm.materials.find((m: any) => m.material_code === material_code) || pm.materials.find((m: any) => m.is_default) || null
        }
        if (size_code && pm.sizes?.length) {
          selectedSize = pm.sizes.find((s: any) => s.size_code === size_code) || null
        }
      } catch { /* product not found, continue */ }
    }

    const size = selectedSize ? selectedSize.size_label || size_code : this.detectSize(width_mm, height_mm)
    const sheets_per_copy = Math.ceil(pages / (sides === 'double' ? 2 : 1))

    // --- Machine selection ---
    const machineSelection = await this.selectBestMachine({ quantity, width_mm, height_mm, color_mode })
    const imposition    = machineSelection.bestFit ?? 1
    const total_sheets  = Math.ceil((quantity * sheets_per_copy) / imposition)
    const machine_name  = machineSelection.machine?.name ?? 'Digital Press'
    const machine_speed = machineSelection.machine?.speed_per_hour ?? 3000
    const hour_rate     = machineSelection.machine?.hour_rate ?? 50000
    const print_hours   = total_sheets / machine_speed
    const color_rate    = color_mode === 'color' ? 1.0 : 0.4

    // --- Base costs ---
    // If product_master with material/size → use their defined base costs
    const material_cost  = selectedMaterial ? Math.round(Number(selectedMaterial.base_cost || 0) * quantity) : 0
    const size_base      = selectedSize ? Number(selectedSize.base_price || 0) : 0
    const paper_cost     = material_cost > 0 ? material_cost : Math.round(total_sheets * this.getPaperPrice(paper_gsm))
    const print_cost     = Math.round(print_hours * hour_rate * color_rate)
    const finishing_cost = this.getFinishingCost(finishing, quantity)
    const binding_cost   = this.getBindingCost(binding, quantity)
    // Setup cost: if size has a base_price, use it; otherwise use quantity-based default
    const setup_cost     = size_base > 0 ? size_base : (quantity < 500 ? 50000 : quantity < 2000 ? 30000 : 0)

    let subtotal = paper_cost + print_cost + finishing_cost + binding_cost + setup_cost

    // ============================================
    // SMART PRICING ENGINE
    // ============================================

    const smart_adjustments: { name: string; type: string; value: number; description: string }[] = []

    // --- 1. Pricing Rules (DB-based) ---
    // Attributes include material_code and size_code so rules can match on them
    const ruleAttributes: Record<string, string> = {
      color_mode, finishing, binding,
      paper_gsm: String(paper_gsm), sides,
      ...(material_code ? { material: material_code } : {}),
      ...(size_code ? { size: size_code } : {}),
    }
    const matchingRules = await this.pricingRulesService.findMatchingRules({
      product_id,
      product_master_id,
      category_id,
      quantity,
      attributes: ruleAttributes,
    })
    if (matchingRules.length > 0) {
      const ruleResult = this.pricingRulesService.applyRules(subtotal, matchingRules)
      const rulesDiff = ruleResult.adjusted - subtotal
      if (rulesDiff !== 0) {
        smart_adjustments.push({
          name: 'pricing_rules',
          type: rulesDiff > 0 ? 'surcharge' : 'discount',
          value: rulesDiff,
          description: `DB rules: ${ruleResult.applied.join(', ')}`,
        })
        subtotal = ruleResult.adjusted
      }
    }

    // --- 2. Quantity Discount ---
    const qty_discount = this.getQuantityDiscount(quantity)
    if (qty_discount.percent > 0) {
      const discount_amount = -Math.round(subtotal * qty_discount.percent)
      smart_adjustments.push({
        name: 'quantity_discount',
        type: 'discount',
        value: discount_amount,
        description: qty_discount.label,
      })
      subtotal += discount_amount
    }

    // --- 3. Rush Fee ---
    const rush_fee = this.getRushFee(urgency)
    if (rush_fee.percent > 0) {
      const rush_amount = Math.round(subtotal * rush_fee.percent)
      smart_adjustments.push({
        name: 'rush_fee',
        type: 'surcharge',
        value: rush_amount,
        description: rush_fee.label,
      })
      subtotal += rush_amount
    }

    // --- 4. Gang-Run Discount ---
    if (gang_run) {
      const gang_discount = -Math.round(subtotal * 0.10)
      smart_adjustments.push({
        name: 'gang_run_discount',
        type: 'discount',
        value: gang_discount,
        description: 'Нэгтгэж хэвлэх хөнгөлөлт -10%',
      })
      subtotal += gang_discount
    }

    // --- 5. Category-Based Margin ---
    const overhead       = Math.round(subtotal * 0.10)
    const margin_rate    = await this.getCategoryMargin(category_id)
    const margin         = Math.round((subtotal + overhead) * margin_rate.percent)
    const total_price    = subtotal + overhead + margin
    const unit_price     = Math.round(total_price / quantity)

    smart_adjustments.push({
      name: 'overhead',
      type: 'fee',
      value: overhead,
      description: 'Нэмэлт зардал 10%',
    })
    smart_adjustments.push({
      name: 'margin',
      type: 'fee',
      value: margin,
      description: `${margin_rate.label} ${Math.round(margin_rate.percent * 100)}%`,
    })

    // --- Total discount/surcharge summary ---
    const total_discount = smart_adjustments
      .filter(a => a.type === 'discount')
      .reduce((s, a) => s + a.value, 0)
    const total_surcharge = smart_adjustments
      .filter(a => a.type === 'surcharge')
      .reduce((s, a) => s + a.value, 0)

    return {
      // Input
      quantity, pages, size, width_mm, height_mm,
      color_mode, sides, paper_gsm, finishing, binding,
      urgency, gang_run, category_id,
      // Product master fields
      product_master_id, material_code, size_code,
      product_name: productMasterName,
      selected_material: selectedMaterial ? { code: selectedMaterial.material_code, name: selectedMaterial.material_name_mn, base_cost: selectedMaterial.base_cost } : null,
      selected_size: selectedSize ? { code: selectedSize.size_code, label: selectedSize.size_label, base_price: selectedSize.base_price } : null,

      // Machine & sheets
      sheets_per_copy, total_sheets,
      imposition_per_sheet: imposition,
      rotated: machineSelection.rotated,
      machine: machine_name,
      machine_speed,
      machine_sheet: machineSelection.machine
        ? { w: machineSelection.machine.sheet_width_mm, h: machineSelection.machine.sheet_height_mm }
        : null,
      print_hours: Math.round(print_hours * 100) / 100,

      // Base costs
      paper_cost, print_cost, finishing_cost, binding_cost, setup_cost,

      // Smart pricing
      smart_adjustments,
      total_discount,
      total_surcharge,

      // Final
      subtotal, overhead, margin,
      total_price, unit_price,
      currency: 'MNT',

      breakdown: {
        paper_price_per_sheet: this.getPaperPrice(paper_gsm),
        material_cost, size_base_price: size_base,
        used_product_master: !!product_master_id,
        color_rate, hour_rate, print_hours,
        overhead_10pct: overhead,
        margin_rate: margin_rate.percent,
        margin_label: margin_rate.label,
        quantity_discount: qty_discount,
        rush_fee,
        gang_run_discount: gang_run ? 0.10 : 0,
        pricing_rules_applied: matchingRules.length,
      },
    }
  }

  async calculateOffset(params: any) {
    const size_code = params.size_code || 'A4'
    const pages = Number(params.pages) || 1
    const qty = Number(params.quantity) || 100
    const gsm = Number(params.gsm) || 130
    const color = params.color_mode || 'full'
    const sides = params.sides || 'single'
    const finishing = params.finishing || 'none'
    const fold = params.fold || 'none'
    const rush = params.rush_hours || 0
    const mode = params.pricing_mode || 'retail'

    // Get rates from DB with fallback
    const sf = await this.pricingConfig.getValue(`offset_size_${size_code}`) ?? ({ A6: 0.25, A5: 0.5, A4: 1.0, A3: 2.0, BC: 0.1 }[size_code] || 1.0)
    const gsmRate = await this.pricingConfig.getValue(`offset_gsm_${gsm}`) ?? 110
    const printRate = color === 'full'
      ? (await this.pricingConfig.getValue('offset_print_full') ?? 65)
      : (await this.pricingConfig.getValue('offset_print_bw') ?? 30)
    const setupCost = color === 'full'
      ? (await this.pricingConfig.getValue('offset_setup_full') ?? 35000)
      : (await this.pricingConfig.getValue('offset_setup_bw') ?? 15000)
    const finishRate = finishing !== 'none'
      ? (await this.pricingConfig.getValue(`offset_finish_${finishing}`) ?? 0)
      : 0
    const foldRate = fold !== 'none'
      ? (await this.pricingConfig.getValue(`offset_fold_${fold}`) ?? 0)
      : 0
    const marginRate = mode === 'b2b'
      ? (await this.pricingConfig.getValue('b2b_margin') ?? 0.20)
      : (await this.pricingConfig.getValue('retail_margin') ?? 0.45)

    // Calculate
    const paper = gsmRate * sf * pages * qty
    const print = printRate * sf * pages * qty * (sides === 'double' ? 1.8 : 1)
    const finish = finishRate * sf * qty
    const foldCost = foldRate * qty
    const subtotal = paper + print + finish + foldCost + setupCost

    // Quantity discount
    const disc = qty >= 5000 ? 0.20 : qty >= 1000 ? 0.15 : qty >= 500 ? 0.10 : qty >= 100 ? 0.05 : 0
    const discAmt = Math.round(subtotal * disc)
    const afterDisc = subtotal - discAmt

    // Rush
    const rushRate = rush === 24 ? 0.30 : rush === 48 ? 0.15 : 0
    const rushAmt = Math.round(afterDisc * rushRate)

    // Apply margin (hidden from user)
    const beforeMargin = afterDisc + rushAmt
    const total_price = Math.round(beforeMargin * (1 + marginRate))
    const unit_price = Math.round(total_price / qty)

    // Return - NO margin, NO cost info exposed
    return {
      paper_cost_label: 'Цаасны зардал',
      paper_cost: Math.round(paper),
      print_cost_label: 'Хэвлэлийн зардал',
      print_cost: Math.round(print),
      finishing_cost_label: 'Финиш',
      finishing_cost: Math.round(finish),
      fold_cost_label: 'Нугалалт',
      fold_cost: Math.round(foldCost),
      setup_cost_label: 'Setup',
      setup_cost: Math.round(setupCost),
      subtotal: Math.round(subtotal),
      discount_pct: Math.round(disc * 100),
      discount_amount: discAmt,
      rush_pct: Math.round(rushRate * 100),
      rush_amount: rushAmt,
      total_price,
      unit_price,
      quantity: qty,
      novat_note: 'НӨАТ ороогүй',
      valid_hours: 72,
    }
  }

  async calculateHadag(params: any) {
    const product = params.product || 'tovgor'
    const rush = params.rush_hours || 0
    const mode = params.pricing_mode || 'retail'

    const marginRate = mode === 'b2b'
      ? (await this.pricingConfig.getValue('b2b_margin') ?? 0.20)
      : (await this.pricingConfig.getValue('retail_margin') ?? 0.45)

    let base = 0
    let label = ''

    if (product === 'tovgor') {
      const size = Number(params.size) || 30
      const qty = Number(params.quantity) || 1
      const unit = await this.pricingConfig.getValue(`tovgor_${size}cm`) ?? 35000
      base = unit * qty
      label = `Товгор ${size}см × ${qty}ш`
    } else {
      const w = Number(params.width) || 1
      const h = Number(params.height) || 1
      const area = w * h
      // Map product to pricing key
      const keyMap: Record<string, string> = {
        nerj_off: 'nerj_off_m2', nerj_on: 'nerj_on_m2',
        d3_off: 'd3_off_m2', d3_on: 'd3_on_m2',
        pvc: 'pvc_m2', epoxy: 'epoxy_m2',
        sb_in4: 'sb_in4_m2', sb_in6: 'sb_in6_m2', sb_in8: 'sb_in8_m2',
        sb_out_corner: 'sb_out_corner_m2', sb_out_fold: 'sb_out_fold_m2',
        tmr: 'tmr_m2', font_back: 'font_back_m2', font_metal: 'font_metal_m2',
      }
      const pricingKey = params.pricing_key || keyMap[product] || 'pvc_m2'
      const rate = await this.pricingConfig.getValue(pricingKey) ?? 280000
      base = rate * area
      label = `${product} ${w}×${h}м`
    }

    // Extras
    let extras = 0
    const extraItems: { label: string; amount: number }[] = []
    if (params.extra_rele) {
      const v = await this.pricingConfig.getValue('extra_rele') ?? 30000
      extras += v; extraItems.push({ label: 'Цагийн реле', amount: v })
    }
    if (params.extra_tog) {
      const v = await this.pricingConfig.getValue('extra_tog') ?? 35000
      extras += v; extraItems.push({ label: 'Тог бууруулагч', amount: v })
    }
    if (params.extra_crane1) {
      const v = await this.pricingConfig.getValue('extra_crane1') ?? 200000
      extras += v; extraItems.push({ label: 'Кран 1 цаг', amount: v })
    }
    if (params.extra_crane8) {
      const v = await this.pricingConfig.getValue('extra_crane8') ?? 600000
      extras += v; extraItems.push({ label: 'Кран өдөр', amount: v })
    }

    // Rush
    const rushRate = rush === 24 ? 0.30 : rush === 48 ? 0.15 : 0
    const rushAmt = Math.round(base * rushRate)

    // Total with hidden margin
    const beforeMargin = base + extras + rushAmt
    const total_price = Math.round(beforeMargin * (1 + marginRate))
    const unit_price = total_price
    const qty = product === 'tovgor' ? (Number(params.quantity) || 1) : 1

    return {
      base_label: label,
      base_price: Math.round(base),
      extras: extraItems,
      extras_total: extras,
      rush_pct: Math.round(rushRate * 100),
      rush_amount: rushAmt,
      total_price,
      unit_price: Math.round(total_price / qty),
      quantity: qty,
      novat_note: 'НӨАТ ороогүй',
      valid_hours: 72,
    }
  }

  async calculateWide(params: any) {
    const type = params.type || 'banner'
    const w = Number(params.width) || 1
    const l = Number(params.length) || 2
    const rush = params.rush_hours || 0
    const mode = params.pricing_mode || 'retail'

    const keyMap: Record<string, string> = {
      banner: 'orgon_banner', sticker: 'orgon_sticker',
      flag: 'orgon_flag', canvas: 'orgon_fabric',
    }
    const rate = await this.pricingConfig.getValue(keyMap[type] || 'orgon_banner') ?? 8000
    const base = rate * w * l

    const rushRate = rush === 24 ? 0.30 : rush === 48 ? 0.15 : 0
    const rushAmt = Math.round(base * rushRate)

    const marginRate = mode === 'b2b'
      ? (await this.pricingConfig.getValue('b2b_margin') ?? 0.20)
      : (await this.pricingConfig.getValue('retail_margin') ?? 0.45)

    const total_price = Math.round((base + rushAmt) * (1 + marginRate))

    return {
      base_label: `${type} ${w}×${l}м`,
      base_price: Math.round(base),
      rush_pct: Math.round(rushRate * 100),
      rush_amount: rushAmt,
      total_price,
      unit_price: total_price,
      quantity: 1,
      novat_note: 'НӨАТ ороогүй',
      valid_hours: 72,
    }
  }

  async calculateWithBreakdown(params: any) {
    // Call the appropriate calculator
    const type = params.calc_type || 'offset'
    let publicResult: any
    if (type === 'offset') publicResult = await this.calculateOffset(params)
    else if (type === 'hadag') publicResult = await this.calculateHadag(params)
    else publicResult = await this.calculateWide(params)

    const mode = params.pricing_mode || 'retail'
    const marginRate = mode === 'b2b'
      ? (await this.pricingConfig.getValue('b2b_margin') ?? 0.20)
      : (await this.pricingConfig.getValue('retail_margin') ?? 0.45)

    // Reverse-engineer cost from total
    const totalBeforeMargin = Math.round(publicResult.total_price / (1 + marginRate))
    const marginAmount = publicResult.total_price - totalBeforeMargin

    return {
      ...publicResult,
      // Admin-only fields
      _admin: true,
      cost_before_margin: totalBeforeMargin,
      margin_rate: marginRate,
      margin_pct: Math.round(marginRate * 100),
      margin_amount: marginAmount,
      pricing_mode: mode,
    }
  }

  // ============================================
  // SMART PRICING HELPERS
  // ============================================

  /** Quantity-based discount tiers */
  private getQuantityDiscount(quantity: number): { percent: number; label: string } {
    if (quantity >= 5000) return { percent: 0.20, label: '5000+ ширхэг: -20% хөнгөлөлт' }
    if (quantity >= 2000) return { percent: 0.18, label: '2000+ ширхэг: -18% хөнгөлөлт' }
    if (quantity >= 1000) return { percent: 0.15, label: '1000+ ширхэг: -15% хөнгөлөлт' }
    if (quantity >= 500)  return { percent: 0.10, label: '500+ ширхэг: -10% хөнгөлөлт' }
    if (quantity >= 100)  return { percent: 0.05, label: '100+ ширхэг: -5% хөнгөлөлт' }
    return { percent: 0, label: 'Хөнгөлөлтгүй' }
  }

  /** Rush/urgency fee tiers */
  private getRushFee(urgency: string): { percent: number; label: string } {
    switch (urgency) {
      case 'rush_24h': return { percent: 0.30, label: '24 цагийн яаралтай: +30%' }
      case 'rush_48h': return { percent: 0.15, label: '48 цагийн яаралтай: +15%' }
      case 'rush_72h': return { percent: 0.05, label: '72 цагийн яаралтай: +5%' }
      default:         return { percent: 0,    label: 'Стандарт хугацаа' }
    }
  }

  /**
   * Category-based margin rates.
   * Now reads from pricing_config (admin-editable) with hardcoded fallbacks.
   * Key format: margin_{category_id} (e.g., margin_business_card = 0.35)
   *
   * MIGRATION: These fallback values should eventually live ONLY in
   * the pricing_rules table via PricingService.findMarginRate().
   * See CLAUDE.md: customer_price = vendor_cost × (1 + margin_rate)
   */
  private async getCategoryMargin(category_id: string | null): Promise<{ percent: number; label: string }> {
    const FALLBACK_MARGINS: Record<string, { percent: number; label: string }> = {
      'business_card':   { percent: 0.35, label: 'Нэрийн хуудас margin' },
      'brochure':        { percent: 0.25, label: 'Брошур margin' },
      'poster':          { percent: 0.22, label: 'Постер margin' },
      'banner':          { percent: 0.28, label: 'Баннер margin' },
      'book':            { percent: 0.18, label: 'Ном margin' },
      'packaging':       { percent: 0.30, label: 'Савлагаа margin' },
      'sticker':         { percent: 0.32, label: 'Стикер margin' },
      'envelope':        { percent: 0.20, label: 'Дугтуй margin' },
      'invitation':      { percent: 0.30, label: 'Урилга margin' },
      'certificate':     { percent: 0.25, label: 'Гэрчилгээ margin' },
    }

    // Try pricing_config first (admin-editable)
    if (category_id) {
      try {
        const configValue = await this.pricingConfig.getValue(`margin_${category_id}`)
        if (configValue != null) {
          return { percent: Number(configValue), label: `${category_id} margin (config)` }
        }
      } catch {}
    }

    // Fallback to hardcoded defaults
    if (category_id && FALLBACK_MARGINS[category_id]) return FALLBACK_MARGINS[category_id]
    return { percent: 0.25, label: 'Стандарт margin' }  // Changed from 0.20 to 0.25 per CLAUDE.md DEFAULT_MARGIN
  }

  // ============================================
  // EXISTING HELPERS
  // ============================================

  detectSize(w: number, h: number) {
    const W = Math.min(w, h), H = Math.max(w, h)
    if (W >= 195 && W <= 225 && H >= 280 && H <= 315) return 'A4'
    if (W >= 138 && W <= 158 && H >= 195 && H <= 225) return 'A5'
    if (W >= 280 && W <= 315 && H >= 400 && H <= 440) return 'A3'
    if (W >= 85  && W <= 95  && H >= 50  && H <= 60)  return 'BusinessCard'
    return 'Custom'
  }

  private computeSheetFit(machine: Machine, width: number, height: number) {
    const fitNormal =
      Math.floor(machine.sheet_width_mm / width) *
      Math.floor(machine.sheet_height_mm / height)
    const fitRotated =
      Math.floor(machine.sheet_width_mm / height) *
      Math.floor(machine.sheet_height_mm / width)
    if (fitRotated > fitNormal) {
      return { fit: Math.max(fitRotated, 1), rotated: true }
    }
    return { fit: Math.max(fitNormal, 1), rotated: false }
  }

  getPaperPrice(gsm: number) {
    if (gsm <= 90)  return 35
    if (gsm <= 115) return 45
    if (gsm <= 150) return 60
    if (gsm <= 200) return 85
    if (gsm <= 250) return 110
    if (gsm <= 300) return 145
    if (gsm <= 350) return 180
    return 220
  }

  getFinishingCost(finishing: string, quantity: number) {
    const rates: Record<string, number> = {
      'none': 0, 'laminate_matte': 80, 'laminate_gloss': 75,
      'soft_touch': 120, 'uv': 60, 'fold': 30,
    }
    return Math.round((rates[finishing] || 0) * quantity)
  }

  getBindingCost(binding: string, quantity: number) {
    const rates: Record<string, number> = {
      'none': 0, 'staple': 50, 'perfect': 800,
      'spiral': 1200, 'hardcover': 3500,
    }
    return Math.round((rates[binding] || 0) * quantity)
  }

  async selectBestMachine(params: {
    quantity: number
    width_mm: number
    height_mm: number
    color_mode: string
  }) {
    const machines = await this.machineRepo.find()
    if (!machines.length) {
      return { machine: null, bestFit: 1, rotated: false }
    }

    const { quantity, width_mm, height_mm, color_mode } = params
    const colorMultiplier = color_mode === 'color' ? 1.0 : 0.4

    let best: { machine: Machine; cost: number; fit: number; rotated: boolean } | null = null

    for (const machine of machines) {
      const fitResult = this.computeSheetFit(machine, width_mm, height_mm)
      const fit = fitResult.fit || 1
      if (fit <= 0) continue

      const total_sheets = Math.ceil(quantity / fit)
      const hours = total_sheets / machine.speed_per_hour
      const cost = hours * machine.hour_rate * colorMultiplier

      if (!best || cost < best.cost) {
        best = { machine, cost, fit, rotated: fitResult.rotated }
      }
    }

    if (!best) {
      return { machine: null, bestFit: 1, rotated: false }
    }

    return { machine: best.machine, bestFit: best.fit, rotated: best.rotated }
  }
}
