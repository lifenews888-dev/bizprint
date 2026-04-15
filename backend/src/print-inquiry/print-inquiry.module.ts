import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PrintInquiry } from './entities/print-inquiry.entity';
import { ChatMessage } from './entities/chat-message.entity';
import { PrintInquiryController } from './print-inquiry.controller';
import { PrintInquiryService } from './print-inquiry.service';
import { InquiryChatGateway } from './chat.gateway';
import { CommissionModule } from '../commission/commission.module';
import { Vendor } from '../vendors/vendor.entity';
import { MailModule } from '../mail/mail.module';
import { NotificationModule } from '../notifications/notification.module';

@Module({
  imports: [TypeOrmModule.forFeature([PrintInquiry, ChatMessage, Vendor]), CommissionModule, MailModule, NotificationModule],
  controllers: [PrintInquiryController],
  providers: [PrintInquiryService, InquiryChatGateway],
  exports: [PrintInquiryService, InquiryChatGateway],
})
export class PrintInquiryModule {}
