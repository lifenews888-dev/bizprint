import { Module } from '@nestjs/common'
import { QuoteEngineController } from './quote-engine.controller'
import { QuoteEngineService } from './quote-engine.service'

@Module({
  controllers: [QuoteEngineController],
  providers: [QuoteEngineService],
})
export class QuoteEngineModule {}