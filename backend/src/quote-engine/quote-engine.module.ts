import { Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'
import { QuoteEngineController } from './quote-engine.controller'
import { QuoteEngineService } from './quote-engine.service'
import { Machine } from '../machines/machine.entity'

@Module({
  imports: [TypeOrmModule.forFeature([Machine])],
  controllers: [QuoteEngineController],
  providers: [QuoteEngineService],
  exports: [QuoteEngineService],
})
export class QuoteEngineModule {}