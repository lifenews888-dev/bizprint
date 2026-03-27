import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from '../users/user.entity';
import { CreatorApplication } from './entities/creator-application.entity';
import { UgcRequest } from './entities/ugc-request.entity';
import { UgcPackage } from './entities/ugc-package.entity';
import { LiveBooking } from './entities/live-booking.entity';
import { CreatorRating } from './entities/creator-rating.entity';
import { ServicePricing } from './entities/service-pricing.entity';
import { CreatorPortfolio } from './entities/creator-portfolio.entity';
import { CreatorContract } from './entities/creator-contract.entity';
import { CreatorPenalty } from './entities/creator-penalty.entity';
import { CreatorPermission } from './entities/creator-permission.entity';
import { OrderComment } from './entities/order-comment.entity';
import { CreatorService } from './creator.service';
import { CreatorController } from './creator.controller';
import { UploadModule } from '../upload/upload.module';

@Module({
  imports: [
    UploadModule,
    TypeOrmModule.forFeature([
      User, CreatorApplication, UgcRequest, UgcPackage,
      LiveBooking, CreatorRating, ServicePricing, CreatorPortfolio,
      CreatorContract, CreatorPenalty, CreatorPermission, OrderComment,
    ]),
  ],
  controllers: [CreatorController],
  providers: [CreatorService],
  exports: [CreatorService],
})
export class CreatorModule {}
