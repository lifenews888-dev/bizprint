import { Controller, Post, Body } from '@nestjs/common';
import { AiQuoteService } from './ai-quote.service';

@Controller('ai')
export class AiQuoteController {
  constructor(private svc: AiQuoteService) {}

  @Post('quote')
  parseQuote(@Body('message') message: string) {
    if (!message) return { error: 'Мессеж оруулна уу' };
    return this.svc.parseQuoteRequest(message);
  }

  @Post('description')
  generateDescription(@Body() body: any) {
    return this.svc.generateDescription(body);
  }

  @Post('design-suggestions')
  getDesignSuggestions(@Body() body: { industry: string; productType: string }) {
    return this.svc.getDesignSuggestions(body.industry, body.productType);
  }
}
