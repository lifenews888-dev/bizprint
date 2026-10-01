import { Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'
import { ColorCode } from './entities/color-code.entity'
import { PrintDevice } from './entities/print-device.entity'
import { DeviceColorProfile } from './entities/device-color-profile.entity'
import { PrintAgent } from './entities/print-agent.entity'
import { PrintTicket } from './entities/print-ticket.entity'
import { PrintProductType } from './entities/print-product-type.entity'
import { PrintOrderAutomation } from './entities/print-order-automation.entity'
import { Order } from '../orders/entities/order.entity'
import { OrderItem } from '../orders/entities/order-item.entity'
import { OrdersModule } from '../orders/order.module'
import { NotificationModule } from '../notifications/notification.module'
import { PdfInspectorModule } from '../ai/pdf-inspector/pdf-inspector.module'
import { PrintNetworkService } from './print-network.service'
import { PrintAgentGuard } from './print-agent.guard'
import { PrintNetworkSeedService } from './print-network-seed.service'
import { PrintAutomationService } from './print-automation.service'
import { ColorCatalogController, PrintOrderingController, PrintAgentController, PrintNetworkAdminController, PrintNetworkVendorController } from './print-network.controller'

/**
 * Хэвлэлийн сүлжээ: өнгөний код → принтерийн чадвар (ΔE) → чиглүүлэлт →
 * JDF тасалбар → цехийн агент → RIP hotfolder. Төлбөр орсон захиалгыг
 * PrintAutomationService гар оролцоогүйгээр хэвлэлд хүргэнэ.
 */
@Module({
  imports: [
    TypeOrmModule.forFeature([ColorCode, PrintDevice, DeviceColorProfile, PrintAgent, PrintTicket, PrintProductType, PrintOrderAutomation, Order, OrderItem]),
    OrdersModule,
    NotificationModule,
    PdfInspectorModule,
  ],
  controllers: [ColorCatalogController, PrintOrderingController, PrintNetworkAdminController, PrintNetworkVendorController, PrintAgentController],
  providers: [PrintNetworkService, PrintAgentGuard, PrintNetworkSeedService, PrintAutomationService],
  exports: [PrintNetworkService],
})
export class PrintNetworkModule {}
