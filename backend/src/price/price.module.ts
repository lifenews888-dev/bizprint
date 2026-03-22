import { Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'

import { PriceService } from './price.service'
import { PriceController } from './price.controller'

import { PaperType } from '../paper-types/paper-type.entity'
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
  ],
  providers: [
    PriceService
  ]
})
export class PriceModule {}
