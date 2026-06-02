import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { SmartQuote, SmartQuoteOption } from './entities/smart-quote.entity';
import { PricingCatalogService } from './pricing-catalog.service';
// eslint-disable-next-line @typescript-eslint/no-var-requires
const pdfParse = require('pdf-parse');

export interface ParsedQuoteData {
  dimensions?: { width: number; height: number; unit: string };
  quantity?: number;
  material?: string;
  price?: { amount: number; currency: string };
  rawText?: string;
  confidence: number;
}

@Injectable()
export class SmartQuoteService {
  private readonly logger = new Logger(SmartQuoteService.name);
  private readonly VAT_RATE = 0.1;

  constructor(
    @InjectRepository(SmartQuote)
    private readonly quoteRepo: Repository<SmartQuote>,
    @InjectRepository(SmartQuoteOption)
    private readonly optionRepo: Repository<SmartQuoteOption>,
    private readonly catalog: PricingCatalogService,
  ) {}

  async calculatePrice(body: any) {
    const productType = this.normalizeProductType(body?.product_type ?? body?.productType ?? body?.type);
    if (productType === 'tovgor') return this.calculateLetterQuote(body, productType);
    return this.calculateAreaQuote(body, productType);
  }

  private async calculateLetterQuote(body: any, productType: string) {
    const quantity = this.positiveInt(body?.quantity, 1);
    const urgency = this.normalizeUrgency(body?.urgency ?? body?.rush_hours);
    const lines = this.normalizeTextLines(body);
    const logoPrice = this.money(body?.logo_price ?? body?.logoPrice);
    const hasLed = this.hasLed(body, productType);

    if (!lines.length) {
      return { error: 'Текст оруулна уу', subtotal: 0, vat: 0, total_price: 0, unit_price: 0 };
    }

    const lineItems: Array<{ label: string; quantity: number; unit_price: number; total: number }> = [];
    for (const line of lines) {
      const unitPrice = Number(await this.catalog.getLetterPrice(line.size_cm));
      const total = this.money(unitPrice * line.letter_count * quantity);
      lineItems.push({
        label: `${line.label}: ${line.letter_count} үсэг × ${line.size_cm}см`,
        quantity: line.letter_count * quantity,
        unit_price: unitPrice,
        total,
      });
    }

    const basePrice = lineItems.reduce((sum, item) => sum + item.total, 0);
    const ledPrice = hasLed ? this.money(basePrice * 0.2) : 0;
    const rushFee = this.money((basePrice + ledPrice + logoPrice) * urgency.rate);
    const extrasPrice = ledPrice + logoPrice + rushFee;
    const subtotal = basePrice + extrasPrice;
    const vat = this.money(subtotal * this.VAT_RATE);
    const totalPrice = subtotal + vat;
    const totalLetters = lines.reduce((sum, line) => sum + line.letter_count, 0) * quantity;

    if (ledPrice > 0) lineItems.push({ label: 'LED гэрэлтүүлэг', quantity: 1, unit_price: ledPrice, total: ledPrice });
    if (logoPrice > 0) lineItems.push({ label: 'Лого / нэмэлт элемент', quantity: 1, unit_price: logoPrice, total: logoPrice });
    if (rushFee > 0) lineItems.push({ label: urgency.label, quantity: 1, unit_price: rushFee, total: rushFee });

    return this.buildQuoteResult({
      productType,
      subtotal,
      vat,
      totalPrice,
      unitPrice: totalLetters > 0 ? this.money(basePrice / totalLetters) : 0,
      basePrice,
      extrasPrice,
      lineItems,
      machineType: hasLed ? 'led_assembly' : 'laser_cutter',
      productionDays: urgency.days,
      material: hasLed ? 'led' : 'acrylic',
      recommendation: 'Үсгийн хэмжээ бүрийн catalog үнэ, LED нэмэгдэл, logo болон яаралтай хугацааг тусад нь бодсон.',
      upsell: [
        'Логоны бодит хэмжээ болон гэрэлтүүлгийн төрлийг баталгаажуулбал үнэ илүү нарийвчилна.',
        'Олон мөртэй хаяг дээр том үсгийн хэмжээг тусад нь хадгалж бодож байна.',
      ],
    });
  }

  private async calculateAreaQuote(body: any, productType: string) {
    const quantity = this.positiveInt(body?.quantity, 1);
    const urgency = this.normalizeUrgency(body?.urgency ?? body?.rush_hours);
    const dimensions = this.normalizeDimensions(body);
    const logoPrice = this.money(body?.logo_price ?? body?.logoPrice);
    const materialKey = await this.resolveMaterialKey(productType, body?.material, body?.paper_gsm);
    const hasLed = this.hasLed(body, productType);
    const postProcesses = this.normalizePostProcesses(body?.finishing);

    if (!dimensions.width_mm || !dimensions.height_mm) {
      return { error: 'Хэмжээ оруулна уу', subtotal: 0, vat: 0, total_price: 0, unit_price: 0 };
    }

    const material = await this.catalog.calculateMaterial(
      materialKey,
      dimensions.width_mm,
      dimensions.height_mm,
      quantity,
    );
    if (!material) {
      return { error: `Материал олдсонгүй: ${materialKey}`, subtotal: 0, vat: 0, total_price: 0, unit_price: 0 };
    }

    const machine = await this.catalog.selectMachine(materialKey, quantity);
    if (!machine) {
      return { error: `Машин олдсонгүй: ${materialKey}`, subtotal: 0, vat: 0, total_price: 0, unit_price: 0 };
    }

    const production = await this.catalog.simulateProduction(material, machine, {
      quantity,
      urgency: urgency.key,
      has_led: hasLed,
      post_processes: postProcesses,
    });
    const vendorCost = this.money(Number(material.total_cost) + Number(production.total_production_cost));
    const marginKey = body?.pricing_mode || (urgency.rate > 0 ? 'rush' : 'retail');
    const marginRate = Number(await this.catalog.getMarginRate(String(marginKey)));
    const baseCustomerPrice = this.money(vendorCost * (1 + marginRate));
    const rushFee = this.money(baseCustomerPrice * urgency.rate);
    const subtotal = baseCustomerPrice + logoPrice + rushFee;
    const vat = this.money(subtotal * this.VAT_RATE);
    const totalPrice = subtotal + vat;
    const lineItems = [
      {
        label: `${material.material_name} + ${machine.name} (${material.area_m2}м²)`,
        quantity,
        unit_price: this.money(baseCustomerPrice / quantity),
        total: baseCustomerPrice,
      },
    ];
    if (logoPrice > 0) lineItems.push({ label: 'Лого / нэмэлт элемент', quantity: 1, unit_price: logoPrice, total: logoPrice });
    if (rushFee > 0) lineItems.push({ label: urgency.label, quantity: 1, unit_price: rushFee, total: rushFee });

    return this.buildQuoteResult({
      productType,
      subtotal,
      vat,
      totalPrice,
      unitPrice: this.money(totalPrice / quantity),
      basePrice: baseCustomerPrice,
      extrasPrice: logoPrice + rushFee,
      lineItems,
      machineType: machine.machine_type,
      productionDays: production.estimated_days,
      material: material.material_key,
      recommendation: `${material.material_name} материалыг ${machine.name} дээр ${production.estimated_days} өдөрт хийхээр бодсон.`,
      upsell: [
        'Хэмжээ, материал, гэрэлтүүлэг, яаралтай хугацаа өөрчлөгдөхөд үнэ автоматаар шинэчлэгдэнэ.',
        'Эцсийн баталгаажуулалтад файл болон угсралтын нөхцөлийг шалгах хэрэгтэй.',
      ],
      breakdown: {
        area_m2: material.area_m2,
        material_cost: material.total_cost,
        production_cost: production.total_production_cost,
        margin_rate: marginRate,
        rush_fee: rushFee,
        vat_rate: this.VAT_RATE,
        steps: production.steps,
      },
    });
  }

  private buildQuoteResult(input: {
    productType: string;
    subtotal: number;
    vat: number;
    totalPrice: number;
    unitPrice: number;
    basePrice: number;
    extrasPrice: number;
    lineItems: Array<{ label: string; quantity: number; unit_price: number; total: number }>;
    machineType: string;
    productionDays: number;
    material: string;
    recommendation: string;
    upsell: string[];
    breakdown?: Record<string, any>;
  }) {
    const deliveryDays = Math.max(1, input.productionDays || 5);
    return {
      subtotal: input.subtotal,
      vat: input.vat,
      total_price: input.totalPrice,
      unit_price: input.unitPrice,
      base_price: input.basePrice,
      extras_price: input.extrasPrice,
      currency: 'MNT',
      product_type: input.productType,
      line_items: input.lineItems,
      breakdown: input.breakdown || {},
      machine_type: input.machineType,
      production_speed: String(deliveryDays),
      ai: {
        recommendation: input.recommendation,
        upsell: input.upsell,
      },
      options: [
        {
          tier: 'economy',
          material: input.material,
          finishing: 'standard',
          description: 'Урт хугацаа, бага үнэ',
          price: this.money(input.totalPrice * 0.92),
          delivery_days: deliveryDays + 2,
        },
        {
          tier: 'standard',
          material: input.material,
          finishing: 'standard',
          description: 'Санал болгох хувилбар',
          price: input.totalPrice,
          delivery_days: deliveryDays,
        },
        {
          tier: 'premium',
          material: input.material,
          finishing: 'premium',
          description: 'Түргэвчилсэн, нэмэлт чанарын хяналт',
          price: this.money(input.totalPrice * 1.25),
          delivery_days: Math.max(1, deliveryDays - 1),
        },
      ],
    };
  }

  private normalizeProductType(value: any): string {
    const raw = String(value || 'tovgor').trim().toLowerCase().replace(/_/g, '-');
    const map: Record<string, string> = {
      '3d': 'd3',
      '3d-letter': 'd3',
      banner: 'wide',
      sticker: 'wide',
      signage: 'sambar',
      lightbox: 'sambar',
    };
    return map[raw] || raw;
  }

  private normalizeTextLines(body: any): Array<{ label: string; text: string; size_cm: number; letter_count: number }> {
    const rawLines = Array.isArray(body?.text_lines) ? body.text_lines : [];
    const lines = rawLines.map((line: any, index: number) => {
      const text = String(line?.text || '');
      const letterCount = this.clampInt(line?.letter_count ?? text.replace(/\s/g, '').length, 0);
      return {
        label: String(line?.label || ['Том', 'Дунд', 'Жижиг'][index] || `Мөр ${index + 1}`),
        text,
        size_cm: this.clampInt(line?.size ?? line?.size_cm ?? body?.letter_size_cm, 30),
        letter_count: letterCount,
      };
    }).filter((line) => line.letter_count > 0 && line.size_cm > 0);

    if (lines.length) return lines;

    const text = String(body?.sign_text || body?.text || '');
    const letterCount = this.clampInt(body?.letter_count ?? text.replace(/\s/g, '').length, 0);
    if (!letterCount) return [];
    return [{
      label: 'Текст',
      text,
      size_cm: this.clampInt(body?.letter_size_cm, 30),
      letter_count: letterCount,
    }];
  }

  private normalizeDimensions(body: any) {
    const rawWidth = Number(body?.width_mm ?? body?.widthMm ?? body?.width ?? 0) || 0;
    const rawHeight = Number(body?.height_mm ?? body?.heightMm ?? body?.height ?? body?.length ?? 0) || 0;
    const unit = String(body?.dimension_unit ?? body?.unit ?? '').toLowerCase();
    let widthMm = rawWidth;
    let heightMm = rawHeight;

    if (unit === 'm' || unit === 'м' || (!unit && rawWidth > 0 && rawHeight > 0 && rawWidth <= 20 && rawHeight <= 20)) {
      widthMm = rawWidth * 1000;
      heightMm = rawHeight * 1000;
    } else if (unit === 'cm' || unit === 'см') {
      widthMm = rawWidth * 10;
      heightMm = rawHeight * 10;
    } else if (unit === 'in' || unit === 'inch' || unit === 'inches') {
      widthMm = rawWidth * 25.4;
      heightMm = rawHeight * 25.4;
    }

    return {
      width_mm: this.money(widthMm),
      height_mm: this.money(heightMm),
      area_m2: widthMm > 0 && heightMm > 0 ? Math.round((widthMm * heightMm / 1_000_000) * 1000) / 1000 : 0,
    };
  }

  private async resolveMaterialKey(productType: string, material?: string, paperGsm?: any): Promise<string> {
    const raw = String(material || '').toLowerCase();
    if (this.matchesAnyText(raw, ['backlit', 'гэрэлт', 'гэрэлтэй'])) return 'backlit';
    if (this.matchesAnyText(raw, ['mesh', 'мэш', 'торон'])) return 'mesh';
    if (this.matchesAnyText(raw, ['canvas', 'канвас', 'даавуу'])) return 'canvas';
    if (this.matchesAnyText(raw, ['sticker', 'стикер', 'наалт'])) return 'sticker';
    if (this.matchesAnyText(raw, ['vinyl', 'винил', 'хулдаас'])) return 'vinyl';
    if (this.matchesAnyText(raw, ['pvc', 'пвц'])) return 'pvc_5mm';
    if (this.matchesAnyText(raw, ['nerj', 'stainless', 'нерж', 'ган'])) return 'stainless';
    if (this.matchesAnyText(raw, ['acrylic', 'акрил'])) return 'acrylic_5mm';

    if (productType === 'nerj') return 'stainless';
    if (productType === 'd3') return 'acrylic_5mm';
    if (productType === 'pvc') return 'pvc_5mm';
    if (productType === 'sambar') return 'lightbox_out';
    if (productType === 'wide') return 'vinyl';
    if (productType === 'offset') return this.paperKey(paperGsm);
    return this.catalog.autoSelectMaterial(productType);
  }

  private paperKey(value: any) {
    const gsm = Number(value) || 150;
    if (gsm <= 90) return 'paper_80';
    if (gsm <= 125) return 'paper_100';
    if (gsm <= 175) return 'paper_150';
    if (gsm <= 250) return 'paper_200';
    return 'paper_300';
  }

  private normalizeUrgency(value: any) {
    const raw = String(value ?? '').toLowerCase();
    if (raw === '24' || raw === '24h' || raw === 'rush_24h' || raw === 'urgent') {
      return { key: '24h', rate: 0.3, days: 1, label: '24 цагийн яаралтай нэмэгдэл' };
    }
    if (raw === '48' || raw === '48h' || raw === 'rush_48h' || raw === 'express') {
      return { key: '48h', rate: 0.15, days: 2, label: '48 цагийн яаралтай нэмэгдэл' };
    }
    if (raw === '72' || raw === '72h' || raw === 'rush_72h') {
      return { key: '72h', rate: 0.05, days: 3, label: '72 цагийн яаралтай нэмэгдэл' };
    }
    return { key: 'normal', rate: 0, days: 5, label: 'Стандарт хугацаа' };
  }

  private normalizePostProcesses(value: any): string[] {
    const raw = Array.isArray(value) ? value : String(value || '').split(',');
    const map: Record<string, string> = {
      laminate: 'lamination_matt',
      lamination: 'lamination_matt',
      matte: 'lamination_matt',
      gloss: 'lamination_gloss',
      uv: 'uv_coating',
      paint: 'painting',
      painting: 'painting',
      mount: 'mounting',
      mounting: 'mounting',
      cut: 'cutting',
      cutting: 'cutting',
      fold: 'folding',
      folding: 'folding',
    };
    return raw
      .map((item) => String(item || '').trim().toLowerCase())
      .map((item) => map[item] || item)
      .filter((item) => item && item !== 'none');
  }

  private hasLed(body: any, productType: string) {
    const material = String(body?.material || '').toLowerCase();
    return Boolean(
      body?.has_led === true ||
      body?.lit === true ||
      productType === 'sambar' ||
      material.includes('_on') ||
      material.includes('led') ||
      material.includes('light') ||
      this.matchesAnyText(material, ['гэрэлт', 'гэрэлтэй']),
    );
  }

  private matchesAnyText(value: string, aliases: string[]) {
    const compactValue = value.replace(/[\s_-]+/g, '');
    return aliases.some((alias) => {
      const normalizedAlias = alias.toLowerCase();
      return value.includes(normalizedAlias) || compactValue.includes(normalizedAlias.replace(/[\s_-]+/g, ''));
    });
  }

  private clampInt(value: any, fallback: number) {
    const n = Math.floor(Number(value));
    if (!Number.isFinite(n) || n < 0) return fallback;
    return n;
  }

  private positiveInt(value: any, fallback: number) {
    const n = this.clampInt(value, fallback);
    return n > 0 ? n : fallback;
  }

  private money(value: any) {
    const n = Number(value);
    if (!Number.isFinite(n)) return 0;
    return Math.max(0, Math.round(n));
  }

  getMaterials() {
    return this.catalog.getMaterials(true);
  }

  getMachines() {
    return this.catalog.getMachines(true);
  }

  async generateRecommendation(body: any) {
    const price: any = await this.calculatePrice(body);
    if (price.error) return price;
    return {
      recommendation: price.ai?.recommendation,
      options: price.options || [],
      estimated_total: price.total_price,
    };
  }

  async create(data: Partial<SmartQuote>) {
    const validUntil = new Date();
    validUntil.setDate(validUntil.getDate() + 7);
    const quote = this.quoteRepo.create({
      ...data,
      quote_number: data.quote_number || `SQ-${Date.now()}`,
      valid_until: data.valid_until || validUntil,
    });
    return this.quoteRepo.save(quote);
  }

  async saveOptions(quoteId: string, options: any[] = []) {
    if (!options.length) return [];
    const rows = options.map((option) => this.optionRepo.create({
      quote_id: quoteId,
      tier: option.tier || 'standard',
      material: option.material,
      finishing: option.finishing,
      description: option.description,
      price: Number(option.price || 0),
      delivery_days: option.delivery_days,
    }));
    return this.optionRepo.save(rows);
  }

  findOne(id: string) {
    return this.quoteRepo.findOne({ where: { id } });
  }

  getOptions(id: string) {
    return this.optionRepo.find({ where: { quote_id: id }, order: { price: 'ASC' } });
  }

  findAll(customerId?: string) {
    return this.quoteRepo.find({
      where: customerId ? { customer_id: customerId } : {},
      order: { created_at: 'DESC' },
      take: 100,
    });
  }

  async update(id: string, body: Partial<SmartQuote>) {
    await this.quoteRepo.update(id, body);
    return this.findOne(id);
  }

  async parsePdf(buffer: Buffer): Promise<ParsedQuoteData> {
    try {
      const data = await pdfParse(buffer);
      const text = data.text || '';
      this.logger.log(`PDF parsed, text length: ${text.length}`);
      return this.extractQuoteData(text);
    } catch (err) {
      this.logger.error('PDF parse error', err);
      return { confidence: 0, rawText: '' };
    }
  }

  extractQuoteData(text: string): ParsedQuoteData {
    const result: ParsedQuoteData = { confidence: 0, rawText: text };

    // Dimensions: e.g. "100x200mm", "50 x 70 cm", "24x36 inch"
    const dimMatch = text.match(/(\d+(?:\.\d+)?)\s*[xX×]\s*(\d+(?:\.\d+)?)\s*(mm|cm|inch|in)\b/);
    if (dimMatch) {
      result.dimensions = {
        width: parseFloat(dimMatch[1]),
        height: parseFloat(dimMatch[2]),
        unit: dimMatch[3],
      };
      result.confidence += 30;
    }

    // Quantity: e.g. "qty: 500", "1000 pcs", "500 copies"
    const qtyMatch = text.match(/(?:qty[:\s]+|quantity[:\s]+|(\d+)\s*(?:pcs|copies|sheets|units))/i);
    if (qtyMatch) {
      const num = text.match(/(?:qty[:\s]+|quantity[:\s]+)(\d+)|(\d+)\s*(?:pcs|copies|sheets|units)/i);
      if (num) {
        result.quantity = parseInt(num[1] || num[2], 10);
        result.confidence += 25;
      }
    }

    // Material keywords
    const materials = [
      'vinyl', 'canvas', 'acrylic', 'banner', 'flex', 'mesh', 'fabric',
      'paper', 'cardstock', 'glossy', 'matte', 'satin', 'foil', 'pvc',
    ];
    for (const mat of materials) {
      if (text.toLowerCase().includes(mat)) {
        result.material = mat;
        result.confidence += 20;
        break;
      }
    }

    // Price: e.g. "$250", "USD 1,500", "₮ 50,000"
    const priceMatch = text.match(/(?:USD|EUR|GBP|MNT|[$€£₮])\s*([\d,]+(?:\.\d+)?)|(\d[\d,]*(?:\.\d+)?)\s*(?:USD|EUR|GBP|MNT)/i);
    if (priceMatch) {
      const amount = parseFloat((priceMatch[1] || priceMatch[2]).replace(/,/g, ''));
      const currMatch = text.match(/USD|EUR|GBP|MNT|\$|€|£|₮/);
      result.price = { amount, currency: currMatch ? currMatch[0] : 'USD' };
      result.confidence += 25;
    }

    return result;
  }

  parsePdfSummary(data: ParsedQuoteData): string {
    const parts: string[] = [];
    if (data.dimensions) parts.push(`Хэмжээ: ${data.dimensions.width}×${data.dimensions.height}${data.dimensions.unit}`);
    if (data.quantity) parts.push(`Тоо: ${data.quantity}`);
    if (data.material) parts.push(`Материал: ${data.material}`);
    if (data.price) parts.push(`Үнэ: ${data.price.currency}${data.price.amount}`);
    return parts.length ? parts.join(', ') : 'Мэдээлэл олдсонгүй';
  }
}
