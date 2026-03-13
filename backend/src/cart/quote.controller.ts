import { Controller, Post, Body } from '@nestjs/common'
import { QuoteService } from './quote.service'

@Controller('quote')
export class QuoteController {

  constructor(private quoteService: QuoteService) {}

  @Post()
  createQuote(@Body() body: any) {
    return this.quoteService.calculatePrice(body)
  }
}