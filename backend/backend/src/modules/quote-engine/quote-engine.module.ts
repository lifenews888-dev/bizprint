import { Module } from '@nestjs/common';
import { QuoteController } from './quote.controller';
import { QuoteService } from './quote.service';
import { ParserService } from './parser.service';
import { PricingService } from './pricing.service';
import { MachineService } from './machine.service';

@Module({
  controllers: [QuoteController],
  providers: [
    QuoteService,
    ParserService,
    PricingService,
    MachineService,
  ],
})
export class QuoteEngineModule {}
