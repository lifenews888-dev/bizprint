import {
  Controller, Get, Post, Patch, Body, Param, Query,
  UseGuards, Request,
} from '@nestjs/common';
import { SmartQuoteService } from './smart-quote.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('smart-quote')
export class SmartQuoteController {
  constructor(private readonly service: SmartQuoteService) {}

  /** Real-time price calculation with full production simulation */
  @Post('calculate')
  calculate(@Body() body: any) {
    return this.service.calculatePrice(body);
  }

  /** Available materials (DB-backed) */
  @Get('materials')
  getMaterials() {
    return this.service.getMaterials();
  }

  /** Available machines (DB-backed) */
  @Get('machines')
  getMachines() {
    return this.service.getMachines();
  }

  /** AI recommendation */
  @Post('recommend')
  recommend(@Body() body: any) {
    return this.service.generateRecommendation(body);
  }

  /** Create and save quote */
  @Post()
  async createQuote(@Body() body: any) {
    const result: any = await this.service.calculatePrice(body);
    if (result.error) return result;
    const ai = result.ai;
    const quote = await this.service.create({
      ...body,
      subtotal: result.subtotal,
      vat: result.vat,
      total_price: result.total_price,
      unit_price: result.unit_price,
      ai_recommendation: ai?.recommendation,
      ai_upsell_suggestions: ai?.upsell,
      machine_type: result.machine_type,
      estimated_production_days: parseInt(result.production_speed) || 5,
    });
    if (result.options) await this.service.saveOptions(quote.id, result.options);
    return { quote, ...result };
  }

  /** Get quote by ID */
  @Get(':id')
  async getQuote(@Param('id') id: string) {
    const quote = await this.service.findOne(id);
    const options = quote ? await this.service.getOptions(id) : [];
    return { quote, options };
  }

  /** List my quotes */
  @UseGuards(JwtAuthGuard)
  @Get()
  async listQuotes(@Request() req: any) {
    return this.service.findAll(req.user.id);
  }

  /** Update quote status */
  @Patch(':id')
  async updateQuote(@Param('id') id: string, @Body() body: any) {
    return this.service.update(id, body);
  }
}
