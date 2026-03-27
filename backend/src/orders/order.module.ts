import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { OrdersController } from './order.controller';
import { OrdersService } from './order.service';
import { OrdersGateway } from './orders.gateway';
import { OrderOpsService } from './services/order-ops.service';
import { Order } from './entities/order.entity';
import { OrderItem } from './entities/order-item.entity';
import { OrderVendorGroup } from './entities/order-vendor-group.entity';
import { OrderProfit } from './entities/order-profit.entity';
import { OrderStatusLog } from './entities/order-status-log.entity';
import { AuditTrail } from '../audit-trail/audit-trail.entity';
import { MailModule } from '../mail/mail.module';
import { NotificationModule } from '../notifications/notification.module';
import { ProfitEngineService } from './services/profit-engine.service';
import { FilesModule } from '../files/files.module';
import { PdfInspectorModule } from '../ai/pdf-inspector/pdf-inspector.module';
import { UploadModule } from '../upload/upload.module';
import { VendorsModule } from '../vendors/vendors.module';
// ProductionGateService is exported from FilesModule

@Module({
  imports: [
    TypeOrmModule.forFeature([Order, OrderItem, OrderVendorGroup, OrderProfit, OrderStatusLog, AuditTrail]),
    MailModule,
    NotificationModule,
    FilesModule,
    PdfInspectorModule,
    UploadModule,
    VendorsModule,
  ],
  controllers: [OrdersController],
  providers: [OrdersService, OrdersGateway, ProfitEngineService, OrderOpsService],
  exports: [OrdersService, ProfitEngineService, OrderOpsService],
})
export class OrdersModule {}
