import { Module } from '@nestjs/common';
import { AiQuoteService } from './ai-quote.service';
import { AiQuoteController } from './ai-quote.controller';

@Module({
  controllers: [AiQuoteController],
  providers: [AiQuoteService],
  exports: [AiQuoteService],
})
export class AiQuoteModule {}
