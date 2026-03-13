import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { ProductionQueue } from './entities/production-queue.entity';
import { ProductionQueueService } from './production-queue.service';
import { ProductionQueueController } from './production-queue.controller';

@Module({
  imports: [TypeOrmModule.forFeature([ProductionQueue])],
  providers: [ProductionQueueService],
  controllers: [ProductionQueueController],
})
export class ProductionQueueModule {}