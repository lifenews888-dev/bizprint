import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Quotation } from './entities/quotation.entity';
import { QuotationItem } from './entities/quotation-item.entity';
import { PricingRule } from '../pricing-rules/pricing-rule.entity';
import { QuoteService } from './quote.service';
import { PricingService } from './pricing.service';
import { QuoteController } from './quote.controller';
import { MailModule } from '../mail/mail.module';

@Module({
  imports: [TypeOrmModule.forFeature([Quotation, QuotationItem, PricingRule]), MailModule],
  controllers: [QuoteController],
  providers: [QuoteService, PricingService],
  exports: [QuoteService, PricingService],
})
export class QuoteModule {}
