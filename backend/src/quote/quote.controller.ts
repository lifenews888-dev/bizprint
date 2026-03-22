import { Controller, Get, Post, Put, Patch, Body, Param, Query, UseGuards, Req } from '@nestjs/common';
import { QuoteService } from './quote.service';
import { MailService } from '../mail/mail.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { OptionalJwtAuthGuard } from '../auth/guards/optional-jwt-auth.guard';

@Controller('quotes-v2')
export class QuoteController {
  constructor(
    private svc: QuoteService,
    private mail: MailService,
  ) {}

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
      await this.mail.sendQuoteToCustomer(this.buildMailParams(quote));
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
      await this.mail.sendQuoteToCustomer(this.buildMailParams(quote));
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
      await this.mail.sendQuoteToCustomer(this.buildMailParams(quote));
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
