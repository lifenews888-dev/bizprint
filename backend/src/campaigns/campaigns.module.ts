import { Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'
import { Campaign } from './campaign.entity'
import { CampaignOrder } from './campaign-order.entity'
import { CampaignRecipient } from './campaign-recipient.entity'
import { CampaignMilestone } from './campaign-milestone.entity'
import { CampaignsService } from './campaigns.service'
import { CampaignsController } from './campaigns.controller'
import { User } from '../users/user.entity'
import { NotificationModule } from '../notifications/notification.module'

@Module({
  imports: [
    TypeOrmModule.forFeature([Campaign, CampaignOrder, CampaignRecipient, CampaignMilestone, User]),
    NotificationModule,
  ],
  controllers: [CampaignsController],
  providers: [CampaignsService],
  exports: [CampaignsService],
})
export class CampaignsModule {}
