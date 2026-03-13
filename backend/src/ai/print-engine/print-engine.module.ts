import { Module } from '@nestjs/common'
import { PrintEngineController } from './print-engine.controller'
import { PrintEngineService } from './print-engine.service'

@Module({
  controllers: [PrintEngineController],
  providers: [PrintEngineService],
})
export class PrintEngineModule {}