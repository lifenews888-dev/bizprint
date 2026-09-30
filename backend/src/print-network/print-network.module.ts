import { Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'
import { ColorCode } from './entities/color-code.entity'
import { PrintDevice } from './entities/print-device.entity'
import { DeviceColorProfile } from './entities/device-color-profile.entity'
import { PrintAgent } from './entities/print-agent.entity'
import { PrintTicket } from './entities/print-ticket.entity'
import { PrintProductType } from './entities/print-product-type.entity'
import { Order } from '../orders/entities/order.entity'
import { OrderItem } from '../orders/entities/order-item.entity'
import { PrintNetworkService } from './print-network.service'
import { PrintAgentGuard } from './print-agent.guard'
import { ColorCatalogController, PrintOrderingController, PrintAgentController, PrintNetworkAdminController } from './print-network.controller'

/**
 * Хэвлэлийн сүлжээ: өнгөний код → принтерийн чадвар (ΔE) → чиглүүлэлт →
 * JDF тасалбар → цехийн агент → RIP hotfolder.
 */
@Module({
  imports: [TypeOrmModule.forFeature([ColorCode, PrintDevice, DeviceColorProfile, PrintAgent, PrintTicket, PrintProductType, Order, OrderItem])],
  controllers: [ColorCatalogController, PrintOrderingController, PrintNetworkAdminController, PrintAgentController],
  providers: [PrintNetworkService, PrintAgentGuard],
  exports: [PrintNetworkService],
})
export class PrintNetworkModule {}
