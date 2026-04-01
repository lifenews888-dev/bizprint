import { Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'
import { DesignRequest } from './design-request.entity'
import { DesignVersion } from './entities/design-version.entity'
import { DesignComment } from './entities/design-comment.entity'
import { DesignZoomSession } from './entities/design-zoom-session.entity'
import { DesignRequestsService } from './design-requests.service'
import { DesignRequestsController } from './design-requests.controller'
import { ZoomWebhookController } from './zoom-webhook.controller'
import { MailModule } from '../mail/mail.module'
import { WalletModule } from '../wallet/wallet.module'
import { SettingsModule } from '../settings/settings.module'
import { ZoomService } from './zoom.service'
import { GoogleCalendarService } from './google-calendar.service'
import { Order } from '../orders/entities/order.entity'
import { User } from '../users/user.entity'
import { DeliveryModule } from '../delivery/delivery.module'
import { NotificationModule } from '../notifications/notification.module'

@Module({
  imports: [
    TypeOrmModule.forFeature([DesignRequest, DesignVersion, DesignComment, DesignZoomSession, Order, User]),
    MailModule,
    WalletModule,
    SettingsModule,
    DeliveryModule,
    NotificationModule,
  ],
  controllers: [DesignRequestsController, ZoomWebhookController],
  providers: [DesignRequestsService, ZoomService, GoogleCalendarService],
  exports: [DesignRequestsService, GoogleCalendarService, ZoomService],
})
export class DesignRequestsModule {}
