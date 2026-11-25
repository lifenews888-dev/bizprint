import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BusinessCardsModule } from '../business-cards/business-cards.module';
import { FlowOrder } from './entities/flow-order.entity';
import { FlowOrdersService } from './flow-orders.service';
import { FlowOrdersController } from './flow-orders.controller';

@Module({
  imports: [TypeOrmModule.forFeature([FlowOrder]), BusinessCardsModule],
  controllers: [FlowOrdersController],
  providers: [FlowOrdersService],
  exports: [FlowOrdersService],
})
export class FlowOrdersModule {}
