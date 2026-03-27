import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Quotation } from './entities/quotation.entity';
import { QuotationItem } from './entities/quotation-item.entity';
import { SmartQuote, SmartQuoteOption } from './entities/smart-quote.entity';
import {
  CatalogMaterial, CatalogMachine, CatalogFinishing,
  CatalogMarginRule, CatalogMaterialMachineMap, CatalogLetterPrice,
} from './entities/pricing-catalog.entity';
import { PricingRule } from '../pricing-rules/pricing-rule.entity';
import { QuoteService } from './quote.service';
import { PricingService } from './pricing.service';
import { PdfQuoteService } from './pdf-quote.service';
import { SmartQuoteService } from './smart-quote.service';
import { PricingCatalogService } from './pricing-catalog.service';
import { QuoteController } from './quote.controller';
import { SmartQuoteController } from './smart-quote.controller';
import { PricingCatalogController } from './pricing-catalog.controller';
import { MailModule } from '../mail/mail.module';
import { QuoteEngineModule } from '../quote-engine/quote-engine.module';
import { PricingRulesModule } from '../pricing-rules/pricing-rules.module';
import { PricingConfigModule } from '../pricing-config/pricing-config.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Quotation, QuotationItem, PricingRule, SmartQuote, SmartQuoteOption,
      CatalogMaterial, CatalogMachine, CatalogFinishing,
      CatalogMarginRule, CatalogMaterialMachineMap, CatalogLetterPrice,
    ]),
    MailModule,
    QuoteEngineModule,
    PricingRulesModule,
    PricingConfigModule,
  ],
  controllers: [QuoteController, SmartQuoteController, PricingCatalogController],
  providers: [QuoteService, PricingService, PdfQuoteService, SmartQuoteService, PricingCatalogService],
  exports: [QuoteService, PricingService, PdfQuoteService, SmartQuoteService, PricingCatalogService],
})
export class QuoteModule {}
