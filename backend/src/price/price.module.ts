import { Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'

import { PriceService } from './price.service'
import { PriceController } from './price.controller'
import { PaperTypeController } from './paper-type.controller'
import { PrintSizeController } from './print-size.controller'

import { PaperType } from './paper-type.entity'
import { PrintSize } from './print-size.entity'
import { FinishType } from './finish-type.entity'
import { Machine } from '../machines/machine.entity'

@Module({
  imports: [
    TypeOrmModule.forFeature([
      PaperType,
      PrintSize,
      FinishType,
      Machine
    ])
  ],
  controllers: [
    PriceController,
    PaperTypeController,
    PrintSizeController
  ],
  providers: [
    PriceService
  ]
})
export class PriceModule {}