import { Module } from '@nestjs/common'
import { PrintSizeController } from './print-size.controller'
import { PrintSizeService } from './print-size.service'

@Module({
  controllers: [PrintSizeController],
  providers: [PrintSizeService],
  exports: [PrintSizeService]
})
export class PrintSizeModule {}