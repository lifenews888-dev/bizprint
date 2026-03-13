import { Module } from '@nestjs/common'
import { MachineSelectorController } from './machine-selector.controller'
import { MachineSelectorService } from './machine-selector.service'

@Module({
  controllers: [MachineSelectorController],
  providers: [MachineSelectorService],
  exports: [MachineSelectorService]
})
export class MachineSelectorModule {}