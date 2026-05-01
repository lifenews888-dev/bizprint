import { Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'
import { QuoteDelivery } from './quote-delivery.entity'
import { QuoteDeliveryService } from './quote-delivery.service'
import { QuoteDeliveryController } from './quote-delivery.controller'

@Module({
  imports: [TypeOrmModule.forFeature([QuoteDelivery])],
  providers: [QuoteDeliveryService],
  controllers: [QuoteDeliveryController],
  exports: [QuoteDeliveryService],
})
export class QuoteDeliveryModule {}
