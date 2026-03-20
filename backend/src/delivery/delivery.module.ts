import { Module, forwardRef } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'
import { Delivery } from './delivery.entity'
import { DeliveryWebhook } from './delivery-webhook.entity'
import { DeliveryService } from './delivery.service'
import { DeliveryController } from './delivery.controller'
import { DeliveryGateway } from './delivery.gateway'
import { WebhookService } from './webhook.service'
import { MailModule } from '../mail/mail.module'
import { WalletModule } from '../wallet/wallet.module'
import { SettingsModule } from '../settings/settings.module'

@Module({
  imports: [
    TypeOrmModule.forFeature([Delivery, DeliveryWebhook]),
    MailModule,
    WalletModule,
    SettingsModule,
  ],
  controllers: [DeliveryController],
  providers: [DeliveryService, DeliveryGateway, WebhookService],
  exports: [DeliveryService, DeliveryGateway, WebhookService],
})
export class DeliveryModule {}
