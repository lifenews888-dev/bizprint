import { Controller, Post, Body } from '@nestjs/common'
import { PrintQuoteService } from './print-quote.service'
import { CreatePrintQuoteDto } from './dto/create-print-quote.dto'

@Controller('print-quote')
export class PrintQuoteController {

  constructor(private readonly service: PrintQuoteService) {}

  @Post('calculate')
  calculate(@Body() data: CreatePrintQuoteDto) {
    return this.service.calculate(data)
  }

}