import { Injectable, BadRequestException } from '@nestjs/common';

/**
 * Smart Print Estimator — Universal Price Calculator
 *
 * Нийт_үнэ = Тогтмол_зардал + Материалын_зардал + Нэмэлт_зардал − Хөнгөлөлт
 *
 * 4 стратеги:
 * 1. FIXED:       base_price × qty
 * 2. AREA_BASED:  (W×H÷1M) × m²_үнэ + options
 * 3. TIER_BASED:  tier_unit_price(qty) × qty + setup
 * 4. QUOTE:       урьдчилсан тооцоо
 */

export interface PriceInput {
  quantity: number;
  width_mm?: number;
  height_mm?: number;
  material_key?: string;
  size_key?: string;
  finishing_keys?: string[];
  addon_keys?: string[];
  options?: Record<string, boolean>;
}

export interface PriceBreakdown {
  base_setup: number;
  material_cost: number;
  area_m2?: number;
  addons_cost: number;
  addons_detail: { name: string; cost: number; type: string }[];
  subtotal: number;
  subtotal_excl_vat: number;
  vat: number;
  vat_rate: number;
  vat_included: boolean;
  volume_discount: number;
  discount_rate: number;
  total: number;
  total_price: number;
  unit_price: number;
  unit_price_excl_vat: number;
  quantity: number;
  currency: string;
  formula_used: string;
  notes: string[];
  is_estimate: boolean;
}

@Injectable()
export class ProductPriceCalculatorService {
  private readonly VAT_RATE = 0.1;

  calculate(product: any, input: PriceInput): PriceBreakdown {
    // ── Validate input ──
    this.validateInput(input);

    let mode = product.pricing_mode || 'fixed';
    let formula = product.price_formula || {};

    // ── Auto-detect area_based ──
    // 1) pricing_mode=formula but no formula.type set
    // 2) requires_dimensions=true (flags, banners, signs, anything with m² UI)
    // 3) category/unit keywords match known area-based products
    const unit = (product.compare_specs?.unit || '').toLowerCase();
    const category = (product.category || '').toLowerCase();
    const name = ((product.name_mn || product.name) || '').toLowerCase();
    const keywordMatch =
      unit === 'мкв' || unit === 'м2' || unit === 'm2' ||
      category.includes('хэвлэл') || category.includes('баннер') ||
      category.includes('самбар') || category.includes('туг') ||
      category.includes('далбаа') || category.includes('флаг') ||
      name.includes('туг') || name.includes('далбаа') || name.includes('баннер');

    const shouldUseArea =
      (mode === 'formula' && !formula.type && keywordMatch) ||
      (product.requires_dimensions === true && !formula.type);

    if (shouldUseArea) {
      formula = {
        type: 'area_based',
        price_per_m2: Number(product.base_price) || 0,
        min_area_m2: formula.min_area_m2 || 0.25,
      };
      if (mode !== 'formula') mode = 'formula';
    }

    switch (mode) {
      case 'formula':
        if (formula.type === 'area_based') return this.calcArea(product, input, formula);
        return this.calcFixed(product, input);
      case 'tier':
        return this.calcTier(product, input, formula);
      case 'quote_required':
        return this.calcEstimate(product, input, formula);
      default:
        return this.calcFixed(product, input);
    }
  }

  // ═══════════════════════════════════════
  //  INPUT VALIDATION
  // ═══════════════════════════════════════

  private validateInput(input: PriceInput): void {
    if (!input.quantity || input.quantity < 1) {
      throw new BadRequestException('Тоо ширхэг 1-ээс бага байж болохгүй');
    }
    if (input.quantity > 100000) {
      throw new BadRequestException('Тоо ширхэг 100,000-аас хэтрэхгүй');
    }
    if (input.width_mm !== undefined && input.width_mm < 0) {
      throw new BadRequestException('Өргөн сөрөг байж болохгүй');
    }
    if (input.height_mm !== undefined && input.height_mm < 0) {
      throw new BadRequestException('Өндөр сөрөг байж болохгүй');
    }
    if (input.width_mm && input.width_mm > 50000) {
      throw new BadRequestException('Өргөн 50,000мм-ээс хэтрэхгүй');
    }
    if (input.height_mm && input.height_mm > 50000) {
      throw new BadRequestException('Өндөр 50,000мм-ээс хэтрэхгүй');
    }
  }

  // ═══════════════════════════════════════
  //  1. FIXED — Дэлгүүрийн бараа
  // ═══════════════════════════════════════

  private calcFixed(product: any, input: PriceInput): PriceBreakdown {
    const price = this.round(Number(product.sale_price || product.base_price || 0));
    const qty = input.quantity;
    const total = this.round(price * qty);

    return this.buildResult({
      material_cost: total,
      total,
      unit_price: price,
      quantity: qty,
      formula_used: 'fixed',
      notes: ['Тогтмол үнэ'],
    });
  }

  // ═══════════════════════════════════════
  //  2. AREA_BASED — Хаяг самбар
  //  Price = (W_mm × H_mm ÷ 1,000,000) × m²_үнэ + options
  // ═══════════════════════════════════════

  private calcArea(product: any, input: PriceInput, formula: any): PriceBreakdown {
    const w = input.width_mm || 1000;
    const h = input.height_mm || 1000;
    const qty = input.quantity;
    const minArea = Number(formula.min_area_m2 || 0.25);
    const pricePerM2 = Number(formula.price_per_m2 || 0);

    // мм → м² хөрвүүлэлт, минимал талбай шалгах
    const rawArea = (w * h) / 1_000_000;
    const area = Math.max(rawArea, minArea);
    const wasMinApplied = rawArea < minArea;

    const materialCost = this.round(area * pricePerM2);
    const notes: string[] = [
      `${w.toLocaleString()}×${h.toLocaleString()}мм = ${rawArea.toFixed(3)} м²`,
    ];

    if (wasMinApplied) {
      notes.push(`⚠️ Минимал талбай ${minArea} м² хэрэглэгдэв (бодит: ${rawArea.toFixed(3)} м²)`);
    }

    notes.push(`${area.toFixed(2)} м² × ₮${pricePerM2.toLocaleString()} = ₮${materialCost.toLocaleString()}`);

    // ── Нэмэлт сонголтуудыг тооцоолох ──
    let addonsCost = 0;
    const addonsDetail: { name: string; cost: number; type: string }[] = [];
    const options = formula.options || {};

    if (input.options) {
      for (const [key, enabled] of Object.entries(input.options)) {
        if (!enabled || !options[key]) continue;
        const opt = options[key];
        let cost: number;

        if (opt.type === 'PER_M2' || opt.type === 'per_m2') {
          cost = this.round(area * Number(opt.price || opt.value || 0));
          notes.push(`${key}: ${area.toFixed(2)}м² × ₮${Number(opt.price || opt.value).toLocaleString()} = ₮${cost.toLocaleString()}`);
        } else {
          cost = this.round(Number(opt.price || opt.value || 0));
          notes.push(`${key}: ₮${cost.toLocaleString()} (тогтмол)`);
        }

        addonsCost += cost;
        addonsDetail.push({ name: key, cost, type: opt.type || 'fixed' });
      }
    }

    // ── Тоо ширхгийн хөнгөлөлт ──
    const discountRate = this.getVolumeDiscount(qty, formula.quantity_tiers);
    const perUnit = materialCost + addonsCost;
    const subtotal = this.round(perUnit * qty);
    const discount = this.round(subtotal * discountRate);
    const total = subtotal - discount;

    if (discountRate > 0) {
      notes.push(`📦 ${qty} ширхэг: ${(discountRate * 100).toFixed(0)}% хөнгөлөлт (-₮${discount.toLocaleString()})`);
    }

    return this.buildResult({
      material_cost: this.round(materialCost * qty),
      area_m2: area,
      addons_cost: this.round(addonsCost * qty),
      addons_detail: addonsDetail,
      subtotal,
      volume_discount: discount,
      discount_rate: discountRate,
      total: this.round(total),
      unit_price: this.round(perUnit),
      quantity: qty,
      formula_used: 'area_based',
      notes,
    });
  }

  // ═══════════════════════════════════════
  //  3. TIER_BASED — Хэвлэмэл бүтээгдэхүүн
  //  UnitPrice = tier_lookup(qty), Total = UnitPrice × qty + setup
  // ═══════════════════════════════════════

  private calcTier(product: any, input: PriceInput, formula: any): PriceBreakdown {
    const qty = input.quantity;
    const baseCost = Number(product.base_price || 0);
    const setupCost = Number(formula.setup_cost || 0);
    const notes: string[] = [];

    // ── Tier шатлалаас нэгж үнэ олох ──
    const tiers = formula.quantity_tiers || [
      { min: 1,    max: 49,   multiplier: 1.0,  label: 'Стандарт' },
      { min: 50,   max: 99,   multiplier: 0.90, label: '10% хөнгөлөлт' },
      { min: 100,  max: 499,  multiplier: 0.80, label: '20% хөнгөлөлт' },
      { min: 500,  max: 999,  multiplier: 0.65, label: '35% хөнгөлөлт' },
      { min: 1000, max: null, multiplier: 0.50, label: '50% хөнгөлөлт' },
    ];

    let multiplier = 1.0;
    let tierLabel = 'Стандарт';
    for (const tier of tiers) {
      if (qty >= tier.min && (tier.max === null || qty <= tier.max)) {
        multiplier = Number(tier.multiplier || tier.price_multiplier || 1);
        tierLabel = tier.label || `${((1 - multiplier) * 100).toFixed(0)}% хөнгөлөлт`;
        break;
      }
    }

    const unitPrice = this.round(baseCost * multiplier);
    const materialCost = this.round(unitPrice * qty);
    const discount = this.round(baseCost * qty * (1 - multiplier));
    const total = materialCost + setupCost;

    notes.push(`Суурь үнэ: ₮${baseCost.toLocaleString()} × ${qty} ширхэг`);
    if (multiplier < 1) {
      notes.push(`📦 Шатлал: ${tierLabel} (${qty} ш → нэгж ₮${unitPrice.toLocaleString()})`);
    }
    if (setupCost > 0) {
      notes.push(`⚙️ Тохиргоо: ₮${setupCost.toLocaleString()}`);
    }

    return this.buildResult({
      base_setup: setupCost,
      material_cost: materialCost,
      subtotal: total,
      volume_discount: discount,
      discount_rate: 1 - multiplier,
      total: this.round(total),
      unit_price: unitPrice,
      quantity: qty,
      formula_used: 'tier_based',
      notes,
    });
  }

  // ═══════════════════════════════════════
  //  4. QUOTE REQUIRED — Урьдчилсан тооцоо
  // ═══════════════════════════════════════

  private calcEstimate(product: any, input: PriceInput, formula: any): PriceBreakdown {
    if (input.width_mm && input.height_mm && formula.price_per_m2) {
      const result = this.calcArea(product, input, formula);
      result.formula_used = 'estimate';
      result.is_estimate = true;
      result.notes.push('⚠️ Урьдчилсан тооцоо. Эцсийн үнэ өөрчлөгдөж болно.');
      return result;
    }

    return this.buildResult({
      formula_used: 'quote_required',
      is_estimate: true,
      notes: ['📋 Үнийн санал хүсэх шаардлагатай', '📞 Холбоо барих: 7711-8899'],
    });
  }

  // ═══════════════════════════════════════
  //  HELPERS
  // ═══════════════════════════════════════

  private getVolumeDiscount(qty: number, tiers?: any[]): number {
    if (!tiers?.length) {
      if (qty >= 10) return 0.05;
      if (qty >= 5) return 0.03;
      return 0;
    }
    for (const tier of tiers) {
      if (qty >= tier.min && (tier.max === null || qty <= tier.max)) {
        return Math.max(0, 1 - (tier.multiplier || 1));
      }
    }
    return 0;
  }

  /** Round to nearest integer (MNT has no decimal) */
  private round(n: number): number {
    return Math.round(n);
  }

  private splitIncludedVat(totalWithVat: number) {
    const subtotalExclVat = this.round(totalWithVat / (1 + this.VAT_RATE));
    const vat = totalWithVat - subtotalExclVat;
    return { subtotalExclVat, vat };
  }

  /** Build a complete PriceBreakdown with defaults */
  private buildResult(partial: Partial<PriceBreakdown>): PriceBreakdown {
    const result = {
      base_setup: 0,
      material_cost: 0,
      addons_cost: 0,
      addons_detail: [],
      subtotal: 0,
      subtotal_excl_vat: 0,
      vat: 0,
      vat_rate: this.VAT_RATE,
      vat_included: true,
      volume_discount: 0,
      discount_rate: 0,
      total: 0,
      total_price: 0,
      unit_price: 0,
      unit_price_excl_vat: 0,
      quantity: 1,
      currency: 'MNT',
      formula_used: 'fixed',
      notes: [],
      is_estimate: false,
      ...partial,
    };

    const totalPrice = this.round(Number(result.total_price || result.total || 0));
    const { subtotalExclVat, vat } = this.splitIncludedVat(totalPrice);
    const quantity = Math.max(1, Number(result.quantity) || 1);

    return {
      ...result,
      subtotal: result.subtotal || totalPrice,
      subtotal_excl_vat: subtotalExclVat,
      vat,
      vat_rate: this.VAT_RATE,
      vat_included: true,
      total: totalPrice,
      total_price: totalPrice,
      unit_price: result.unit_price || this.round(totalPrice / quantity),
      unit_price_excl_vat: this.round(subtotalExclVat / quantity),
    };
  }
}
