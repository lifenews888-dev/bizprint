import { Module } from '@nestjs/common';
import { ZoomController } from './zoom.controller';
import { ZoomService } from '../design-requests/zoom.service';
import { NotificationModule } from '../notifications/notification.module';

@Module({
  imports: [NotificationModule],
  controllers: [ZoomController],
  providers: [ZoomService],
})
export class ZoomModule {}
