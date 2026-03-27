import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { SmartQuote, SmartQuoteOption, QuoteStatus } from './entities/smart-quote.entity';
import { PricingCatalogService } from './pricing-catalog.service';

/* ═══════════════════════════════════════
 *  Smart Quote Service — Print Operating System
 *  DB-backed: Material → Machine → Production → Cost → Quote
 *  All pricing data from catalog_* tables (admin-managed)
 * ═══════════════════════════════════════ */

@Injectable()
export class SmartQuoteService {
  constructor(
    @InjectRepository(SmartQuote) private quoteRepo: Repository<SmartQuote>,
    @InjectRepository(SmartQuoteOption) private optionRepo: Repository<SmartQuoteOption>,
    private readonly catalog: PricingCatalogService,
  ) {}

  /* ═══════════════════════════════════════
   *  FULL PRODUCTION SIMULATION + PRICING
   *  All data from DB (admin-editable)
   * ═══════════════════════════════════════ */

  async calculatePrice(input: {
    product_type: string;
    material?: string;
    width_mm?: number;
    height_mm?: number;
    quantity?: number;
    text_lines?: { text: string; size: number; letter_count: number }[];
    letter_size_cm?: number;
    letter_count?: number;
    sign_text?: string;
    urgency?: string;
    has_led?: boolean;
    post_processes?: string[];
    margin_type?: string;
  }) {
    const qty = input.quantity || 1;
    const urgency = input.urgency || 'normal';

    // === ТОВГОР ҮСЭГ (letter-based pricing) ===
    if (input.product_type === 'tovgor' && input.text_lines?.length) {
      return this.calculateTovgorMultiLine(input);
    }
    if (input.product_type === 'tovgor') {
      return this.calculateTovgorSimple(input);
    }

    // === MATERIAL-BASED PRODUCTS ===
    const materialKey = input.material || await this.catalog.autoSelectMaterial(input.product_type);
    const widthMm = input.width_mm || 1000;
    const heightMm = input.height_mm || 1000;

    // 1. Material calculation (DB)
    const material = await this.catalog.calculateMaterial(materialKey, widthMm, heightMm, qty);
    if (!material) {
      return { error: `Материал олдсонгүй: ${materialKey}` };
    }

    // 2. Machine selection (DB mapping)
    const machine = await this.catalog.selectMachine(materialKey, qty);
    if (!machine) {
      return { error: 'Тохирох машин олдсонгүй' };
    }

    // 3. Production simulation (DB finishing costs)
    const production = await this.catalog.simulateProduction(material, machine, {
      quantity: qty, urgency,
      has_led: input.has_led,
      post_processes: input.post_processes,
    });

    // 4. Cost calculation (DB margin rates)
    const marginType = input.margin_type || 'retail';
    const marginRate = await this.catalog.getMarginRate(marginType);
    const productionCost = material.total_cost + production.total_production_cost;
    const margin = Math.round(productionCost * marginRate);
    const subtotal = productionCost + margin;
    const vat = Math.round(subtotal * 0.10);
    const total = subtotal + vat;

    // Urgency surcharge
    const urgencyMult = urgency === '24h' ? 1.30 : urgency === '48h' ? 1.15 : 1.0;
    const finalTotal = Math.round(total * urgencyMult);

    return {
      // Price summary (customer-facing)
      subtotal: Math.round(subtotal * urgencyMult / 1.1),
      vat: Math.round(subtotal * urgencyMult * 0.1 / 1.1),
      total_price: finalTotal,
      unit_price: Math.round(finalTotal / qty),

      // Production details (admin/internal)
      production: {
        material: { ...material },
        machine: { name: machine.name, type: machine.machine_type, key: machine.key },
        steps: production.steps,
        total_time_hours: production.total_time_hours,
        estimated_days: production.estimated_days,
        cost_breakdown: {
          material: material.total_cost,
          machine: production.machine_cost,
          labor: production.labor_cost,
          setup: production.setup_cost,
          post_process: production.post_process_cost,
          margin,
          margin_rate: marginRate,
        },
      },

      // Meta
      machine_type: machine.name,
      production_speed: `${production.estimated_days} өдөр`,
      urgency_multiplier: urgencyMult,

      // AI
      ai: this.generateRecommendation(input),
      options: await this.generateOptions(input, subtotal, production.estimated_days),
    };
  }

  /* ═══════════════════════════════════════
   *  ТОВГОР ҮСЭГ — Multi-line (DB letter prices)
   * ═══════════════════════════════════════ */

  private async calculateTovgorMultiLine(input: any) {
    const lines = input.text_lines || [];
    const urgency = input.urgency || 'normal';
    const urgencyMult = urgency === '24h' ? 1.30 : urgency === '48h' ? 1.15 : 1.0;

    let totalLetterCost = 0;
    const lineBreakdown: any[] = [];

    for (const line of lines) {
      if (!line.text || line.letter_count === 0) continue;
      const perLetter = await this.catalog.getLetterPrice(line.size);
      const lineCost = perLetter * line.letter_count;
      totalLetterCost += lineCost;
      lineBreakdown.push({
        label: line.text,
        size: line.size,
        count: line.letter_count,
        per_letter: perLetter,
        total: lineCost,
      });
    }

    const marginType = input.margin_type || 'retail';
    const marginRate = await this.catalog.getMarginRate(marginType);
    const margin = Math.round(totalLetterCost * marginRate);
    const subtotal = Math.round((totalLetterCost + margin) * urgencyMult);
    const vat = Math.round(subtotal * 0.10);
    const total = subtotal + vat;
    const totalLetters = lines.reduce((s: number, l: any) => s + (l.letter_count || 0), 0);

    return {
      subtotal,
      vat,
      total_price: total,
      unit_price: totalLetters > 0 ? Math.round(subtotal / totalLetters) : 0,

      production: {
        material: { material_name: 'Акрил / PVC', area_m2: 0, total_cost: totalLetterCost },
        machine: { name: 'CNC Router + LED', type: 'cnc' },
        steps: [
          { step: 'cutting', description: 'CNC зүсэлт', time_hours: totalLetters * 0.15, cost: totalLetterCost * 0.4 },
          { step: 'assembly', description: 'Угсралт + будаг', time_hours: totalLetters * 0.1, cost: totalLetterCost * 0.2 },
        ],
        line_breakdown: lineBreakdown,
        estimated_days: totalLetters > 20 ? 7 : totalLetters > 10 ? 5 : 3,
        cost_breakdown: {
          material: totalLetterCost,
          margin,
          margin_rate: marginRate,
        },
      },

      machine_type: 'CNC Router',
      production_speed: `${totalLetters > 20 ? 7 : totalLetters > 10 ? 5 : 3} өдөр`,
      urgency_multiplier: urgencyMult,

      ai: this.generateRecommendation(input),
      options: await this.generateOptions(input, subtotal, 5),
    };
  }

  private async calculateTovgorSimple(input: any) {
    const size = input.letter_size_cm || 30;
    const count = input.letter_count || (input.sign_text?.replace(/\s/g, '').length || 1);
    return this.calculateTovgorMultiLine({
      ...input,
      text_lines: [{ text: input.sign_text || '', size, letter_count: count }],
    });
  }

  /* ═══════════════════════════════════════
   *  3-TIER OPTIONS (DB-backed)
   * ═══════════════════════════════════════ */

  async generateOptions(input: any, baseSubtotal: number, baseDays: number) {
    return [
      {
        tier: 'economy', material: 'Стандарт материал', finishing: 'Энгийн',
        description: 'Хамгийн хямд. Стандарт материал.',
        price: Math.round(baseSubtotal * 1.1),
        delivery_days: baseDays + 2,
      },
      {
        tier: 'standard', material: 'Чанартай материал', finishing: 'Ламинаци',
        description: 'Санал болгох. Чанартай материал + ламинаци.',
        price: Math.round(baseSubtotal * 1.25 * 1.1),
        delivery_days: baseDays,
      },
      {
        tier: 'premium', material: 'Премиум', finishing: 'LED + UV',
        description: 'Хамгийн дээд. Премиум материал + LED.',
        price: Math.round(baseSubtotal * 1.6 * 1.1),
        delivery_days: Math.max(baseDays - 1, 2),
      },
    ];
  }

  /* ═══════════════════════════════════════
   *  AI RECOMMENDATION
   * ═══════════════════════════════════════ */

  generateRecommendation(input: any) {
    const { product_type, sign_text } = input;
    const upsell: string[] = [];
    let recommendation = '';

    if (product_type === 'tovgor') {
      recommendation = `"${sign_text || ''}" товгор үсэгний хаяг нь танай бизнесийн нүүр царай. LED гэрэлтүүлэг нэмвэл шөнийн харагдац 3 дахин сайжирна.`;
      upsell.push('LED гэрэлтүүлэг нэмэх (+30%)', 'Нэрийн хуудас хамт захиалах');
    } else if (['nerj', 'd3'].includes(product_type)) {
      recommendation = `Нерж/3D үсэг 10+ жил тэсвэртэй. Гадна орчинд тохиромжтой.`;
      upsell.push('Гэрэлтүүлэг нэмэх', 'Бөөрөнхий лого хаяг');
    } else {
      recommendation = `Мэргэжлийн хэвлэл, чанарын баталгаатай.`;
      upsell.push('Ламинаци нэмэх', 'Их тоо захиалбал хямдрал');
    }

    return { recommendation, upsell };
  }

  /* ═══════════════════════════════════════
   *  MATERIALS + MACHINES LIST (DB-backed for frontend)
   * ═══════════════════════════════════════ */

  getMaterials() { return this.catalog.getMaterials(true); }
  getMachines() { return this.catalog.getMachines(true); }

  /* ═══════════════════════════════════════
   *  CRUD
   * ═══════════════════════════════════════ */

  async create(data: Partial<SmartQuote>) {
    const qn = 'QT-' + String(Date.now()).slice(-6);
    const vu = new Date(); vu.setDate(vu.getDate() + 7);
    return this.quoteRepo.save(this.quoteRepo.create({ ...data, quote_number: qn, valid_until: vu, status: QuoteStatus.DRAFT }));
  }

  async findAll(customerId?: string) {
    return this.quoteRepo.find({ where: customerId ? { customer_id: customerId } : {}, order: { created_at: 'DESC' } });
  }

  async findOne(id: string) { return this.quoteRepo.findOne({ where: { id } }); }

  async update(id: string, data: Partial<SmartQuote>) {
    await this.quoteRepo.update(id, data);
    return this.findOne(id);
  }

  async saveOptions(quoteId: string, options: any[]) {
    await this.optionRepo.delete({ quote_id: quoteId });
    for (const opt of options) await this.optionRepo.save(this.optionRepo.create({ ...opt, quote_id: quoteId }));
    return this.optionRepo.find({ where: { quote_id: quoteId } });
  }

  async getOptions(quoteId: string) { return this.optionRepo.find({ where: { quote_id: quoteId } }); }
}
