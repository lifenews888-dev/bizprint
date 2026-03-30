import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { InvitationController } from './invitation.controller';
import { InvitationService } from './invitation.service';
import { Invitation } from './entities/invitation.entity';
import { InvitationGuest } from './entities/invitation-guest.entity';
import { InvitationTemplate } from './entities/invitation-template.entity';
import { SubscriptionModule } from '../subscription/subscription.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Invitation, InvitationGuest, InvitationTemplate]),
    SubscriptionModule,
  ],
  controllers: [InvitationController],
  providers: [InvitationService],
  exports: [InvitationService],
})
export class InvitationModule {}
