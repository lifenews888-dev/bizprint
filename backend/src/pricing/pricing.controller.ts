import { Controller, Post, Body } from '@nestjs/common';
import { PricingService } from './pricing.service';
import type { QuoteInput } from './pricing.service';

@Controller('pricing')
export class PricingController {
  constructor(private readonly pricingService: PricingService) {}

  @Post('quote')
  calculateQuote(@Body() input: QuoteInput) {
    return this.pricingService.calculateQuote(input);
  }
}