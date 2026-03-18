import { Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'
import { Delivery } from './delivery.entity'
import { DeliveryService } from './delivery.service'
import { DeliveryController } from './delivery.controller'
import { MailModule } from '../mail/mail.module'
import { WalletModule } from '../wallet/wallet.module'
import { SettingsModule } from '../settings/settings.module'

@Module({
  imports: [
    TypeOrmModule.forFeature([Delivery]),
    MailModule,
    WalletModule,
    SettingsModule,
  ],
  controllers: [DeliveryController],
  providers: [DeliveryService],
  exports: [DeliveryService],
})
export class DeliveryModule {}
