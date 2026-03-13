import { Controller, Post, Body } from '@nestjs/common'
import { AutoQuoteService } from './auto-quote.service'

@Controller('ai/auto-quote')
export class AutoQuoteController {

 constructor(private readonly service: AutoQuoteService) {}

 @Post('calculate')
 calculate(@Body() body: any) {
   return this.service.calculate(body)
 }

}