import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PricingService } from './pricing.service';
import { PricingController } from './pricing.controller';
import { Product } from '../products/product.entity';
import { PricingRule } from '../pricing-rules/pricing-rule.entity';
import { PricingRulesService } from '../pricing-rules/pricing-rules.service';
import { PricingRulesController } from '../pricing-rules/pricing-rules.controller';

@Module({
  imports: [TypeOrmModule.forFeature([Product, PricingRule])],
  controllers: [PricingController, PricingRulesController],
  providers: [PricingService, PricingRulesService],
  exports: [PricingService, PricingRulesService],
})
export class PricingModule {}
