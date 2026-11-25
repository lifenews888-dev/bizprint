import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BusinessCardsModule } from '../business-cards/business-cards.module';
import { FlowOrder } from './entities/flow-order.entity';
import { Product } from '../products/product.entity';
import { FlowCatalogService } from './flow-catalog.service';
import { FlowOrdersService } from './flow-orders.service';
import {
  FlowCatalogController,
  FlowOrdersController,
} from './flow-orders.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([FlowOrder, Product]),
    BusinessCardsModule,
  ],
  controllers: [FlowOrdersController, FlowCatalogController],
  providers: [FlowOrdersService, FlowCatalogService],
  exports: [FlowOrdersService],
})
export class FlowOrdersModule {}
