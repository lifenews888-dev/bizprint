import { Module } from '@nestjs/common'
import { PrintQuoteController } from './print-quote.controller'
import { PrintQuoteService } from './print-quote.service'

@Module({
  controllers: [PrintQuoteController],
  providers: [PrintQuoteService],
})
export class PrintQuoteModule {}