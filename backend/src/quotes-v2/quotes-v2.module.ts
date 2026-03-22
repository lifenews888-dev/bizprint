import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { QuoteV2 } from './quote-v2.entity';
import { QuotationItem } from '../quote/entities/quotation-item.entity';
import { QuotesV2Service } from './quotes-v2.service';
import { QuotesV2Controller } from './quotes-v2.controller';
import { MailModule } from '../mail/mail.module';

@Module({
  imports: [TypeOrmModule.forFeature([QuoteV2, QuotationItem]), MailModule],
  controllers: [QuotesV2Controller],
  providers: [QuotesV2Service],
  exports: [QuotesV2Service],
})
export class QuotesV2Module {}