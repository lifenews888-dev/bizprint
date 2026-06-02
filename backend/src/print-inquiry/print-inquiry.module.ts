import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PrintInquiry } from './entities/print-inquiry.entity';
import { ChatMessage } from './entities/chat-message.entity';
import { PrintInquiryController } from './print-inquiry.controller';
import { InquiryUploadController } from './inquiry-upload.controller';
import { PrintInquiryService } from './print-inquiry.service';
import { InquiryChatGateway } from './chat.gateway';
import { CommissionModule } from '../commission/commission.module';
import { Vendor } from '../vendors/vendor.entity';
import { MailModule } from '../mail/mail.module';
import { NotificationModule } from '../notifications/notification.module';
import { QuoteEngineModule } from '../quote-engine/quote-engine.module';

@Module({
  imports: [TypeOrmModule.forFeature([PrintInquiry, ChatMessage, Vendor]), CommissionModule, MailModule, NotificationModule, QuoteEngineModule],
  controllers: [PrintInquiryController, InquiryUploadController],
  providers: [PrintInquiryService, InquiryChatGateway],
  exports: [PrintInquiryService, InquiryChatGateway],
})
export class PrintInquiryModule {}
