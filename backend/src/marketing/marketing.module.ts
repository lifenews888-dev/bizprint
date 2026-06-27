import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MarketingCampaign } from './marketing-campaign.entity';
import { MarketingEmailCampaign } from './email-campaign.entity';
import { MarketingEmailContact } from './email-contact.entity';
import { MarketingEmailSendLog } from './email-send-log.entity';
import { MarketingService } from './marketing.service';
import { MarketingController } from './marketing.controller';
import { User } from '../users/user.entity';
import { MailModule } from '../mail/mail.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([MarketingCampaign, MarketingEmailContact, MarketingEmailCampaign, MarketingEmailSendLog, User]),
    MailModule,
  ],
  controllers: [MarketingController],
  providers: [MarketingService],
  exports: [MarketingService],
})
export class MarketingModule {}
