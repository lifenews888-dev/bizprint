import { Controller, Get, Post, Put, Patch, Body, Param, Query, UseGuards, Req, Request } from '@nestjs/common';
import { QuotesV2Service } from './quotes-v2.service';
import { MailService } from '../mail/mail.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('quotes-v2')
export class QuotesV2Controller {
  constructor(
    private svc: QuotesV2Service,
    private mail: MailService,
  ) {}

  @Post()
  async create(@Body() body: any) {
    const quote = await this.svc.create({
      customer_name:        body.customer_name,
      customer_phone:       body.customer_phone,
      customer_email:       body.customer_email,
      product_name:         body.product_name,
      product_description:  body.product_description,
      quantity:             Number(body.quantity),
      pages:                Number(body.pages),
      size:                 body.size,
      width_mm:             Number(body.width_mm),
      height_mm:            Number(body.height_mm),
      paper_type:           body.paper_type,
      paper_gsm:            Number(body.paper_gsm),
      color_mode:           body.color_mode,
      sides:                body.sides,
      finishing:            body.finishing,
      binding:              body.binding,
      unit_price:           Number(body.unit_price),
      total_price:          Number(body.total_price),
      discount_amount:      Number(body.discount_amount) || 0,
      rush_fee:             Number(body.rush_fee) || 0,
      savings_amount:       Number(body.savings_amount) || 0,
      urgency:              body.urgency,
      smart_adjustments:    body.smart_adjustments,
      breakdown:            body.breakdown,
      notes:                body.notes,
      product_type:         body.product_type,
      product_subtype:      body.product_subtype,
      dimensions:           body.dimensions,
      base_price:           Number(body.base_price) || 0,
      margin_rate:          body.margin_rate != null ? Number(body.margin_rate) : null,
      extras:               body.extras,
      pricing_mode:         body.pricing_mode,
      expires_at:           body.expires_at ? new Date(body.expires_at) : null,
      guest_email:          body.guest_email,
      user_id:              body.user_id,
    });
    try {
      await this.mail.sendQuoteToCustomer({
        to:           quote.customer_email,
        name:         quote.customer_name,
        phone:        quote.customer_phone,
        quote_number: quote.quote_number,
        product_name: quote.product_name || '',
        quantity:     quote.quantity,
        pages:        quote.pages,
        size:         quote.size || '',
        width_mm:     quote.width_mm,
        height_mm:    quote.height_mm,
        paper_type:   quote.paper_type || '',
        paper_gsm:    quote.paper_gsm,
        color_mode:   quote.color_mode || 'color',
        sides:        quote.sides || 'single',
        finishing:    quote.finishing || 'none',
        binding:      quote.binding || 'none',
        unit_price:   Number(quote.unit_price),
        total_price:  Number(quote.total_price),
        valid_until:  quote.valid_until,
        breakdown:    quote.breakdown,
        discount_amount: Number(quote.discount_amount),
        rush_fee:        Number(quote.rush_fee),
        savings_amount:  Number(quote.savings_amount),
        urgency:         quote.urgency,
        smart_adjustments: quote.smart_adjustments,
      });
      await this.svc.update(quote.id, { email_sent: true });
    } catch(e) {
      console.error('Email илгээхэд алдаа:', e.message);
    }
    return quote;
  }

  @Get('by-email')
  findByEmail(@Query('email') email: string) {
    return this.svc.findByEmail(email);
  }

  @Get('my')
  @UseGuards(JwtAuthGuard)
  findMy(@Req() req: any) {
    return this.svc.findByUserId(req.user.id);
  }

  @Get()
  @UseGuards(JwtAuthGuard)
  findAll(@Query('date') date?: string) {
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

  @Post(':id/send-email')
  @UseGuards(JwtAuthGuard)
  async resendEmail(@Param('id') id: string) {
    const quote = await this.svc.findOne(id);
    if (!quote) return { error: 'Quote not found' };
    try {
      await this.mail.sendQuoteToCustomer({
        to:           quote.customer_email,
        name:         quote.customer_name,
        phone:        quote.customer_phone,
        quote_number: quote.quote_number,
        product_name: quote.product_name || '',
        quantity:     quote.quantity,
        pages:        quote.pages,
        size:         quote.size || '',
        width_mm:     quote.width_mm,
        height_mm:    quote.height_mm,
        paper_type:   quote.paper_type || '',
        paper_gsm:    quote.paper_gsm,
        color_mode:   quote.color_mode || 'color',
        sides:        quote.sides || 'single',
        finishing:    quote.finishing || 'none',
        binding:      quote.binding || 'none',
        unit_price:   Number(quote.unit_price),
        total_price:  Number(quote.total_price),
        valid_until:  quote.valid_until,
        breakdown:    quote.breakdown,
        discount_amount: Number(quote.discount_amount),
        rush_fee:        Number(quote.rush_fee),
        savings_amount:  Number(quote.savings_amount),
        urgency:         quote.urgency,
        smart_adjustments: quote.smart_adjustments,
      });
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
