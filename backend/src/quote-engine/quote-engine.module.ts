import { Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'
import { QuoteEngineController } from './quote-engine.controller'
import { QuoteEngineService } from './quote-engine.service'
import { Machine } from '../machines/machine.entity'
import { PricingRulesModule } from '../pricing-rules/pricing-rules.module'
import { PricingConfigModule } from '../pricing-config/pricing-config.module'

@Module({
  imports: [TypeOrmModule.forFeature([Machine]), PricingRulesModule, PricingConfigModule],
  controllers: [QuoteEngineController],
  providers: [QuoteEngineService],
  exports: [QuoteEngineService],
})
export class QuoteEngineModule {}