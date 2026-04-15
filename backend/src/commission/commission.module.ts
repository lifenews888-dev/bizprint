import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CommissionLog } from './commission.entity';
import { CommissionService } from './commission.service';
import { CommissionController } from './commission.controller';
import { Vendor } from '../vendors/vendor.entity';
import { MailModule } from '../mail/mail.module';

@Module({
  imports: [TypeOrmModule.forFeature([CommissionLog, Vendor]), MailModule],
  controllers: [CommissionController],
  providers: [CommissionService],
  exports: [CommissionService],
})
export class CommissionModule {}
