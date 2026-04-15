import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CommissionLog } from './commission.entity';
import { CommissionService } from './commission.service';
import { CommissionController } from './commission.controller';

@Module({
  imports: [TypeOrmModule.forFeature([CommissionLog])],
  controllers: [CommissionController],
  providers: [CommissionService],
  exports: [CommissionService],
})
export class CommissionModule {}
