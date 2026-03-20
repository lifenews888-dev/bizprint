import { Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'
import { Notification } from './notification.entity'
import { PushToken } from './push-token.entity'
import { NotificationService } from './notification.service'
import { NotificationController } from './notification.controller'
import { NotificationsGateway } from './notifications.gateway'

@Module({
  imports: [TypeOrmModule.forFeature([Notification, PushToken])],
  providers: [NotificationService, NotificationsGateway],
  controllers: [NotificationController],
  exports: [NotificationService, NotificationsGateway],
})
export class NotificationModule {}
