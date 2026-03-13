import { Module } from '@nestjs/common'
import { ImpositionController } from './imposition.controller'
import { ImpositionService } from './imposition.service'

@Module({
  controllers: [ImpositionController],
  providers: [ImpositionService],
  exports: [ImpositionService]
})
export class ImpositionModule {}