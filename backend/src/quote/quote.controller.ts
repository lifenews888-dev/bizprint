import { Controller, Get, Post, Put, Patch, Delete, Body, Param, Query, UseGuards, Req, Res, HttpStatus } from '@nestjs/common';
import { Response } from 'express';
import { QuoteService } from './quote.service';
import { MailService } from '../mail/mail.service';
import { PdfQuoteService } from './pdf-quote.service';
import { QuoteEngineService } from '../quote-engine/quote-engine.service';
import { PricingRulesService } from '../pricing-rules/pricing-rules.service';
import { PricingConfigService } from '../pricing-config/pricing-config.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { OptionalJwtAuthGuard } from '../auth/guards/optional-jwt-auth.guard';

// ─── Instant quote hardcoded rates ───
const INSTANT_PAPER_RATES: Record<string, number> = {
  vizit_kart: 340, flyar: 180, broushur: 250, poster: 210,
  banner: 1200, sticker: 280, nom: 170, packaging: 420,
  'business-card': 340, flyer: 180, brochure: 250,
  book: 170, signage: 900,
};

// Material cost multipliers
const MATERIAL_MULT: Record<string, number> = {
  'glossy_130': 1.0, 'glossy_170': 1.15, 'matte_170': 1.1,
  'art_250': 1.3, 'art_300': 1.45, 'art_350': 1.6,
  'kraft': 0.9, 'vinyl_white': 1.9, 'vinyl_clear': 2.1,
  'vinyl_440': 1.4, 'canvas': 2.4, 'fabric': 2.0,
  default: 1.0,
};

function getMaterialKey(material?: string): string {
  if (!material) return 'default';
  const m = material.toLowerCase();
  if (m.includes('glossy') && m.includes('130')) return 'glossy_130';
  if (m.includes('glossy') && m.includes('170')) return 'glossy_170';
  if (m.includes('matte') || m.includes('матт')) return 'matte_170';
  if (m.includes('art') && m.includes('250')) return 'art_250';
  if (m.includes('art') && m.includes('300')) return 'art_300';
  if (m.includes('art') && m.includes('350')) return 'art_350';
  if (m.includes('kraft')) return 'kraft';
  if (m.includes('vinyl') && (m.includes('цагаан') || m.includes('white'))) return 'vinyl_white';
  if (m.includes('vinyl') && (m.includes('тунгалаг') || m.includes('clear'))) return 'vinyl_clear';
  if (m.includes('vinyl') && m.includes('440')) return 'vinyl_440';
  if (m.includes('canvas')) return 'canvas';
  if (m.includes('fabric') || m.includes('даавуу')) return 'fabric';
  return 'default';
}

@Controller('quote')
export class QuoteController {
  constructor(
    private svc: QuoteService,
    private mail: MailService,
    private pdfQuote: PdfQuoteService,
    private quoteEngine: QuoteEngineService,
    private pricingRules: PricingRulesService,
    private pricingConfig: PricingConfigService,
  ) {}

  // ─── Instant Quote (10-second price) ───
  @Post('instant')
  async instantQuote(@Body() body: any) {
    const { productType, widthMm, heightMm, quantity, colorMode, finishing, material, sides, urgency } = body;
    const qty = Number(quantity) || 100;
    const w = Number(widthMm) || 210;
    const h = Number(heightMm) || 297;

    const areaM2 = (w / 1000) * (h / 1000);
    const paperRate = INSTANT_PAPER_RATES[productType] ?? 200;

    // Material multiplier
    const matMult = MATERIAL_MULT[getMaterialKey(material)] || 1.0;

    // Цаасны зардал
    const paperCost = Math.round(paperRate * qty * (areaM2 / 0.0623) * matMult);

    // Бэхний зардал
    const colorChannels = colorMode === 'CMYK' ? 4 : colorMode === '1C' ? 1 : colorMode === 'BW' ? 1 : 2;
    const sidesMultiplier = sides === 'double' ? 1.7 : 1;
    const inkCostPerUnit = Math.round(areaM2 * 2.5 * colorChannels * 45 * sidesMultiplier);
    const inkCost = inkCostPerUnit * qty;

    // Боловсруулалт
    const finIds = finishing?.length ? finishing : [];
    const finishingCostPerUnit = finIds.length * 80;
    const finishingSetup = finIds.length * 5000;
    const finishingCost = finishingSetup + finishingCostPerUnit * qty;

    // Overhead + Commission
    const subtotal = paperCost + inkCost + finishingCost;
    const overhead = Math.round(subtotal * 0.12);
    const productionCost = subtotal + overhead;
    const platform = Math.round(productionCost * 0.10);

    // Urgency multiplier
    const urgencyMult = urgency === 'urgent' ? 1.35 : urgency === 'express' ? 1.20 : 1;
    const total = Math.round((productionCost + platform) * urgencyMult);
    const vat = Math.round(total * 0.10);
    const totalWithVat = total + vat;
    const unitPrice = Math.round((total / qty) * 100) / 100;
    const unitPriceWithVat = Math.round((totalWithVat / qty) * 100) / 100;

    // Хүргэх хугацаа
    const leadDays = urgency === 'urgent' ? 1 : urgency === 'express' ? 2 : qty <= 100 ? 2 : qty <= 500 ? 3 : qty <= 2000 ? 5 : 7;

    // Volume discounts
    const volumeDiscounts = [100, 250, 500, 1000, 2000, 5000]
      .filter(q => q !== qty)
      .map(q => {
        const disc = q >= 1000 ? 0.25 : q >= 500 ? 0.15 : q >= 250 ? 0.10 : q >= 100 ? 0.05 : 0;
        const scaledSubtotal = Math.round(total * (q / qty) * (1 - disc));
        const scaledVat = Math.round(scaledSubtotal * 0.10);
        const scaledTotal = scaledSubtotal + scaledVat;
        return {
          qty: q,
          discount: Math.round(disc * 100),
          subtotal: scaledSubtotal,
          vat: scaledVat,
          total: scaledSubtotal,
          total_price: scaledTotal,
          unitPrice: Math.round(scaledSubtotal / q),
          unit_price: Math.round(scaledTotal / q),
        };
      });

    return {
      // Legacy fields: keep old no-VAT meaning for existing callers.
      total,
      unitPrice,
      // Canonical quote fields: VAT-aware customer-facing shape.
      subtotal: total,
      vat,
      total_price: totalWithVat,
      unit_price: unitPriceWithVat,
      breakdown: {
        paper: paperCost,
        ink: inkCost,
        finishing: finishingCost,
        overhead,
        platform,
      },
      line_items: [
        { label: 'Цаас', total: paperCost },
        { label: 'Бэх', total: inkCost },
        { label: 'Боловсруулалт', total: finishingCost },
        { label: 'Нэмэгдэл зардал', total: overhead },
        { label: 'Платформ', total: platform },
      ].filter((item) => item.total > 0),
      leadDays,
      lead_days: leadDays,
      quantity: qty,
      productType,
      product_type: productType,
      material: material || null,
      volumeDiscounts,
    };
  }

  // ─── Calculate (proxy to QuoteEngine) ───
  @Post('calculate')
  async calculate(@Body() body: any) {
    const calcType = body.calculation_type || 'calculate';
    const params = {
      quantity:       Number(body.quantity) || 100,
      pages:          Number(body.pages) || 1,
      width_mm:       Number(body.width_mm) || Number(body.width) || 210,
      height_mm:      Number(body.height_mm) || Number(body.height) || 297,
      color_mode:     body.color_mode || 'color',
      sides:          body.sides || 'single',
      paper_gsm:      Number(body.paper_gsm) || 150,
      finishing:      body.finishing || 'none',
      binding:        body.binding || 'none',
      urgency:        body.urgency || 'standard',
      express_hours:  Number(body.express_hours) || Number(body.rush_hours) || 0,
      gang_run:       body.gang_run === true || body.gang_run === 'true',
      category_id:    body.category_id || null,
      product_id:     body.product_id || null,
    };

    try {
      if (calcType === 'calculate-offset') {
        return await this.quoteEngine.calculateOffset(body);
      } else if (calcType === 'calculate-hadag') {
        return await this.quoteEngine.calculateHadag(body);
      } else if (calcType === 'calculate-wide') {
        return await this.quoteEngine.calculateWide(body);
      } else {
        return await this.quoteEngine.calculate(params);
      }
    } catch (e) {
      return { error: e.message, total_price: 0, unit_price: 0 };
    }
  }

  // ─── Market Analysis ───
  @Get('market-analysis')
  async marketAnalysis(@Query() query: any) {
    const productType = query.product_type || 'general';
    const productSubtype = query.product_subtype || '';

    // Get pricing config data for market context
    const allConfig = await this.pricingConfig.getPublic();

    // Build basic market analysis from available pricing data
    const analysis: any = {
      product_type: productType,
      product_subtype: productSubtype,
      market_average: null,
      price_range: { min: null, max: null },
      competitors: [],
      recommendation: 'Зах зээлийн дундаж үнээс бага зэрэг доогуур үнэ санал болгож байна.',
    };

    // Pull relevant pricing data based on product type
    const prefix = `${productType}_${productSubtype}`.replace(/[^a-zA-Z0-9_]/g, '_');
    const relatedKeys = Object.entries(allConfig)
      .filter(([k]) => k.toLowerCase().includes(productType.toLowerCase()) ||
                       (productSubtype && k.toLowerCase().includes(productSubtype.toLowerCase())));

    if (relatedKeys.length > 0) {
      const values = relatedKeys.map(([, v]) => Number(v)).filter(v => v > 0);
      if (values.length > 0) {
        analysis.market_average = Math.round(values.reduce((a, b) => a + b, 0) / values.length);
        analysis.price_range = { min: Math.min(...values), max: Math.max(...values) };
      }
    }

    return analysis;
  }

  // ─── Pricing Rules (proxy to PricingRules module) ───
  @Get('pricing/rules')
  @UseGuards(JwtAuthGuard)
  getPricingRules() {
    return this.pricingRules.findAll();
  }

  @Get('pricing/rules/:id')
  @UseGuards(JwtAuthGuard)
  getPricingRule(@Param('id') id: string) {
    return this.pricingRules.findOne(id);
  }

  @Post('pricing/rules')
  @UseGuards(JwtAuthGuard)
  createPricingRule(@Body() body: any) {
    return this.pricingRules.create(body);
  }

  @Patch('pricing/rules/:id')
  @UseGuards(JwtAuthGuard)
  updatePricingRule(@Param('id') id: string, @Body() body: any) {
    return this.pricingRules.update(id, body);
  }

  @Delete('pricing/rules/:id')
  @UseGuards(JwtAuthGuard)
  deletePricingRule(@Param('id') id: string) {
    return this.pricingRules.remove(id);
  }

  // ─── Pricing Tiers (placeholder) ───
  @Get('pricing/tiers')
  @UseGuards(JwtAuthGuard)
  async getPricingTiers() {
    // Return pricing config grouped as tiers
    const all = await this.pricingConfig.getAll();
    return all.map(item => ({
      id: item.id,
      key: item.key,
      value: item.value,
      category: item.category,
      label: item.label || item.key,
    }));
  }

  @Patch('pricing/tiers/:id')
  @UseGuards(JwtAuthGuard)
  async updatePricingTier(@Param('id') id: string, @Body() body: any) {
    await this.pricingConfig.set(body.key, body.value);
    return { success: true };
  }

  // ─── Pricing Simulate ───
  @Post('pricing/simulate')
  @UseGuards(JwtAuthGuard)
  async simulatePricing(@Body() body: any) {
    const scenarios = body.scenarios || [body];
    const simulations = [];
    for (const scenario of scenarios) {
      try {
        const result = await this.quoteEngine.calculate({
          quantity:       Number(scenario.quantity) || 100,
          pages:          Number(scenario.pages) || 1,
          width_mm:       Number(scenario.width_mm) || 210,
          height_mm:      Number(scenario.height_mm) || 297,
          color_mode:     scenario.color_mode || 'color',
          sides:          scenario.sides || 'single',
          paper_gsm:      Number(scenario.paper_gsm) || 150,
          finishing:      scenario.finishing || 'none',
          binding:        scenario.binding || 'none',
          urgency:        scenario.urgency || 'standard',
          express_hours:  0,
          gang_run:       false,
          category_id:    null,
          product_id:     null,
        });
        simulations.push({ ...scenario, result });
      } catch (e) {
        simulations.push({ ...scenario, error: e.message });
      }
    }
    return { simulations };
  }

  // ─── Pricing Competitors (placeholder) ───
  @Get('pricing/competitors')
  @UseGuards(JwtAuthGuard)
  async getCompetitors() {
    return [];
  }

  @Post('pricing/competitors')
  @UseGuards(JwtAuthGuard)
  async addCompetitor(@Body() body: any) {
    return { message: 'Competitor tracking coming soon', ...body };
  }

  @Delete('pricing/competitors/:id')
  @UseGuards(JwtAuthGuard)
  async deleteCompetitor(@Param('id') id: string) {
    return { deleted: id };
  }

  // ─── Batch Submit (олон quote нэг дор → нэг имэйл) ───
  @Post('batch')
  async batchCreate(@Body() body: { quotes: any[]; contact: { name: string; email: string; phone?: string; company?: string } }) {
    const { quotes, contact } = body;
    if (!quotes?.length || !contact?.email) {
      return { error: 'quotes array and contact.email required' };
    }

    const safeNum = (v: any, fallback = 0) => { const n = Number(v); return isNaN(n) ? fallback : n; };
    const created: any[] = [];

    for (const q of quotes) {
      try {
        const quote = await this.svc.create({
          customer_name:   contact.name,
          customer_email:  contact.email,
          customer_phone:  contact.phone || '',
          guest_name:      contact.name,
          guest_email:     contact.email,
          guest_phone:     contact.phone || '',
          company_name:    contact.company || '',
          product_name:    q.product_name || '',
          product_type:    q.product_type || '',
          product_subtype: q.product_subtype || '',
          dimensions:      q.dimensions || '',
          quantity:        safeNum(q.quantity, 1),
          total_price:     safeNum(q.total_price),
          unit_price:      safeNum(q.unit_price),
          base_price:      safeNum(q.base_price),
          margin_rate:     q.margin_rate != null ? safeNum(q.margin_rate) : null,
          rush_type:       q.rush_type || null,
          rush_fee:        safeNum(q.rush_fee),
          discount_amount: safeNum(q.discount_amount),
          savings_amount:  safeNum(q.savings_amount),
          breakdown:       q.breakdown || null,
          extras:          q.extras || null,
          notes:           q.notes || '',
          pricing_mode:    q.pricing_mode || null,
          size:            q.size || null,
          pages:           q.pages != null ? safeNum(q.pages) : null,
          paper_gsm:       q.paper_gsm != null ? safeNum(q.paper_gsm) : null,
          paper_type:      q.paper_type || null,
          color_mode:      q.color_mode || null,
          sides:           q.sides || null,
          finishing:       q.finishing || null,
          binding:         q.binding || null,
          width_mm:        q.width_mm != null ? safeNum(q.width_mm) : null,
          height_mm:       q.height_mm != null ? safeNum(q.height_mm) : null,
          product_description: null,
          urgency:         q.urgency || null,
          smart_adjustments: null,
          user_id:         null,
          expires_at:      new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
        });
        created.push(quote);
      } catch (e) {
        console.error('Batch quote create error:', e.message);
      }
    }

    // Send single summary email with all quotes
    if (created.length > 0) {
      try {
        await this.mail.sendBatchQuoteEmail(contact.email, contact.name, created);
      } catch (e) {
        console.error('Batch email error:', e.message);
        // Fallback: send individual emails
        for (const quote of created) {
          try {
            await this.mail.sendQuoteToCustomer(this.buildMailParams(quote));
          } catch {}
        }
      }
    }

    return { success: true, count: created.length, quotes: created };
  }

  // ─── Core Quote CRUD ───
  @Post()
  @UseGuards(OptionalJwtAuthGuard)
  async create(@Body() body: any, @Req() req: any) {
    const userId = req.user?.id || body.user_id || null
    const safeNum = (v: any, fallback = 0) => { const n = Number(v); return isNaN(n) ? fallback : n; }
    const quote = await this.svc.create({
      customer_name:        body.customer_name || body.guest_name || body.contact?.name || '',
      customer_phone:       body.customer_phone || body.guest_phone || body.contact?.phone || '',
      customer_email:       body.customer_email || body.guest_email || body.contact?.email || '',
      product_name:         body.product_name || null,
      product_description:  body.product_description || null,
      quantity:             safeNum(body.quantity, 1),
      pages:                body.pages != null ? safeNum(body.pages) : null,
      size:                 body.size || null,
      width_mm:             body.width_mm != null ? safeNum(body.width_mm) : null,
      height_mm:            body.height_mm != null ? safeNum(body.height_mm) : null,
      paper_type:           body.paper_type || null,
      paper_gsm:            body.paper_gsm != null ? safeNum(body.paper_gsm) : null,
      color_mode:           body.color_mode || null,
      sides:                body.sides || null,
      finishing:            body.finishing || null,
      binding:              body.binding || null,
      unit_price:           safeNum(body.unit_price),
      total_price:          safeNum(body.total_price || body.total_amount),
      discount_amount:      safeNum(body.discount_amount),
      rush_fee:             safeNum(body.rush_fee),
      savings_amount:       safeNum(body.savings_amount),
      urgency:              body.urgency || null,
      smart_adjustments:    body.smart_adjustments || null,
      breakdown:            body.breakdown || null,
      notes:                body.notes || null,
      product_type:         body.product_type || body.category || null,
      product_subtype:      body.product_subtype || null,
      dimensions:           body.dimensions || null,
      base_price:           safeNum(body.base_price),
      margin_rate:          body.margin_rate != null ? safeNum(body.margin_rate) : null,
      extras:               body.extras || null,
      pricing_mode:         body.pricing_mode || null,
      guest_email:          body.guest_email || null,
      user_id:              userId,
      rush_type:            body.rush_type || null,
      guest_name:           body.guest_name || null,
      guest_phone:          body.guest_phone || null,
      company_name:         body.company_name || null,
      expires_at:           body.expires_at ? new Date(body.expires_at) : new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
    });
    try {
      const emailTo = quote.customer_email || quote.guest_email || '';
      if (!emailTo) throw new Error('No email address');
      // Generate PDF and attach to email
      let pdfBuffer: Buffer | undefined;
      try {
        pdfBuffer = await this.pdfQuote.generateQuotePdf(quote);
      } catch (pdfErr) {
        console.error('PDF generate for email failed:', pdfErr.message);
      }
      await this.mail.sendQuoteToCustomer({ ...this.buildMailParams(quote), pdfBuffer });
      await this.svc.update(quote.id, { email_sent: true });
    } catch(e) {
      console.error('Email илгээхэд алдаа:', e.message);
      await this.svc.update(quote.id, { email_sent: false }).catch(() => {});
    }
    return quote;
  }

  @Get('guest')
  findByEmail(@Query('email') email: string) {
    return this.svc.findByEmail(email);
  }

  @Get('my')
  @UseGuards(JwtAuthGuard)
  findMy(@Req() req: any) {
    return this.svc.findByUserIdOrEmail(req.user.id, req.user.email);
  }

  @Get()
  @UseGuards(JwtAuthGuard)
  findAll() {
    return this.svc.findAll();
  }

  @Get('today')
  @UseGuards(JwtAuthGuard)
  findToday() {
    return this.svc.findToday();
  }

  // ─── PDF Download ───
  @Get(':id/pdf')
  async downloadPdf(@Param('id') id: string, @Res() res: Response) {
    const quote = await this.svc.findOne(id);
    if (!quote) {
      return res.status(HttpStatus.NOT_FOUND).json({ error: 'Quote not found' });
    }
    try {
      const pdfBuffer = await this.pdfQuote.generateQuotePdf(quote);
      const filename = `BizPrint-Quote-${quote.quote_number || id}.pdf`;
      res.set({
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Content-Length': pdfBuffer.length,
      });
      return res.send(pdfBuffer);
    } catch (e) {
      console.error('PDF generate error:', e.message);
      return res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({ error: 'PDF үүсгэхэд алдаа гарлаа' });
    }
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.svc.findOne(id);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard)
  update(@Param('id') id: string, @Body() body: any) {
    return this.svc.update(id, body);
  }

  @Put(':id/status')
  @UseGuards(JwtAuthGuard)
  updateStatus(@Param('id') id: string, @Body() body: { status: string }) {
    return this.svc.updateStatus(id, body.status);
  }

  private buildMailParams(quote: any) {
    const emailTo = quote.customer_email || quote.guest_email || '';
    if (!emailTo) throw new Error('No email address for quote ' + quote.id);
    return {
      to:           emailTo,
      name:         quote.customer_name || quote.guest_name || 'Хэрэглэгч',
      phone:        quote.customer_phone || quote.guest_phone,
      quote_number: quote.quote_number,
      product_name: quote.product_name || '',
      quantity:     quote.quantity,
      unit_price:   Number(quote.unit_price) || 0,
      total_price:  Number(quote.total_price) || 0,
      valid_until:  quote.valid_until,
      breakdown:    quote.breakdown,
      discount_amount: Number(quote.discount_amount) || 0,
      rush_fee:        Number(quote.rush_fee) || 0,
      savings_amount:  Number(quote.savings_amount) || 0,
      urgency:         quote.urgency,
      extras:          quote.extras,
      company_name:    quote.company_name,
      notes:           quote.notes,
      size:       quote.size,
      pages:      quote.pages,
      paper_gsm:  quote.paper_gsm ? Number(quote.paper_gsm) : undefined,
      paper_type: quote.paper_type,
      color_mode: quote.color_mode,
      sides:      quote.sides,
      finishing:  quote.finishing,
      binding:    quote.binding,
      width_mm:   quote.width_mm ? Number(quote.width_mm) : undefined,
      height_mm:  quote.height_mm ? Number(quote.height_mm) : undefined,
    };
  }

  @Post(':id/send-email')
  @UseGuards(JwtAuthGuard)
  async sendEmail(@Param('id') id: string) {
    const quote = await this.svc.findOne(id);
    if (!quote) return { error: 'Quote not found' };
    try {
      let pdfBuffer: Buffer | undefined;
      try { pdfBuffer = await this.pdfQuote.generateQuotePdf(quote); } catch {}
      await this.mail.sendQuoteToCustomer({ ...this.buildMailParams(quote), pdfBuffer });
      await this.svc.update(quote.id, { email_sent: true });
      return { success: true };
    } catch(e) {
      console.error('Email илгээхэд алдаа:', e.message);
      return { error: e.message };
    }
  }

  @Post(':id/resend-email')
  @UseGuards(JwtAuthGuard)
  async resendEmail(@Param('id') id: string) {
    const quote = await this.svc.findOne(id);
    if (!quote) return { error: 'Quote not found' };
    try {
      let pdfBuffer: Buffer | undefined;
      try { pdfBuffer = await this.pdfQuote.generateQuotePdf(quote); } catch {}
      await this.mail.sendQuoteToCustomer({ ...this.buildMailParams(quote), pdfBuffer });
      await this.svc.update(quote.id, { email_sent: true });
      return { success: true };
    } catch(e) {
      console.error('Email илгээхэд алдаа:', e.message);
      return { error: e.message };
    }
  }

  @Post('daily-report')
  @UseGuards(JwtAuthGuard)
  async sendDailyReport(@Body() body: { admin_email: string }) {
    const quotes = await this.svc.findToday();
    const date = new Date().toLocaleDateString('mn-MN');
    await this.mail.sendDailyReport(body.admin_email, quotes, date);
    await Promise.all(quotes.map(q => this.svc.update(q.id, { daily_report_sent: true })));
    return { sent: quotes.length };
  }
}
