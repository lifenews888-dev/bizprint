import { Module, forwardRef } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'
import { Delivery } from './delivery.entity'
import { DeliveryWebhook } from './delivery-webhook.entity'
import { DeliveryService } from './delivery.service'
import { DeliveryController } from './delivery.controller'
import { DeliveryGateway } from './delivery.gateway'
import { WebhookService } from './webhook.service'
import { Order } from '../orders/entities/order.entity'
import { User } from '../users/user.entity'
import { MailModule } from '../mail/mail.module'
import { WalletModule } from '../wallet/wallet.module'
import { SettingsModule } from '../settings/settings.module'
import { NotificationModule } from '../notifications/notification.module'

@Module({
  imports: [
    TypeOrmModule.forFeature([Delivery, DeliveryWebhook, Order, User]),
    MailModule,
    WalletModule,
    SettingsModule,
    NotificationModule,
  ],
  controllers: [DeliveryController],
  providers: [DeliveryService, DeliveryGateway, WebhookService],
  exports: [DeliveryService, DeliveryGateway, WebhookService],
})
export class DeliveryModule {}
