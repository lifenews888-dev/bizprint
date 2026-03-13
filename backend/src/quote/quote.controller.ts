import { Body, Controller, Post } from '@nestjs/common'
import { QuoteService } from './quote.service'
import { CreateQuoteDto } from './dto/create-quote.dto'

@Controller('quote')
export class QuoteController {

  constructor(private readonly quoteService: QuoteService) {}

  @Post('calculate')
  calculate(@Body() data: CreateQuoteDto) {
    return this.quoteService.calculateQuote(data)
  }

}