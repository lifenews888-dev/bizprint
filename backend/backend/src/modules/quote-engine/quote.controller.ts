import { Controller, Post, Body } from '@nestjs/common';
import { QuoteService } from './quote.service';

@Controller('quote')
export class QuoteController {
  constructor(private readonly quoteService: QuoteService) {}

  @Post('analyze')
  async analyze(@Body() body: { fileUrl: string; quantity: number }) {
    return this.quoteService.analyze(body.fileUrl, body.quantity);
  }
}
