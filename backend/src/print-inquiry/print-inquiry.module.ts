import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PrintInquiry } from './entities/print-inquiry.entity';
import { ChatMessage } from './entities/chat-message.entity';
import { PrintInquiryController } from './print-inquiry.controller';
import { PrintInquiryService } from './print-inquiry.service';
import { InquiryChatGateway } from './chat.gateway';
import { CommissionModule } from '../commission/commission.module';

@Module({
  imports: [TypeOrmModule.forFeature([PrintInquiry, ChatMessage]), CommissionModule],
  controllers: [PrintInquiryController],
  providers: [PrintInquiryService, InquiryChatGateway],
  exports: [PrintInquiryService, InquiryChatGateway],
})
export class PrintInquiryModule {}
