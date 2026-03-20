import { Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'
import { PricingRule } from './entities/pricing-rule.entity'
import { PricingTier } from './entities/pricing-tier.entity'
import { CompetitorPrice } from './entities/competitor-price.entity'
import { PricingEngineService } from './pricing-engine.service'
import { PricingEngineController } from './pricing-engine.controller'

@Module({
  imports: [TypeOrmModule.forFeature([PricingRule, PricingTier, CompetitorPrice])],
  controllers: [PricingEngineController],
  providers: [PricingEngineService],
  exports: [PricingEngineService],
})
export class PricingEngineModule {}
