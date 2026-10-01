import 'reflect-metadata'
import { MODULE_METADATA } from '@nestjs/common/constants'
import { PrintNetworkModule } from './print-network.module'
import { PrintAgentController, PrintNetworkAdminController } from './print-network.controller'
import { PrintAutomationService } from './print-automation.service'
import { PrintNetworkService } from './print-network.service'
import { OrdersModule } from '../orders/order.module'
import { OrdersService } from '../orders/order.service'
import { NotificationModule } from '../notifications/notification.module'
import { NotificationService } from '../notifications/notification.service'
import { PdfInspectorModule } from '../ai/pdf-inspector/pdf-inspector.module'
import { PdfInspectorService } from '../ai/pdf-inspector/pdf-inspector.service'

const meta = (m: any, key: string) => Reflect.getMetadata(key, m) ?? []

describe('PrintNetwork DI graph', () => {
  it('every constructor dependency is provided or imported', () => {
    const exported = new Map<any, any[]>([
      [OrdersModule, meta(OrdersModule, MODULE_METADATA.EXPORTS)],
      [NotificationModule, meta(NotificationModule, MODULE_METADATA.EXPORTS)],
      [PdfInspectorModule, meta(PdfInspectorModule, MODULE_METADATA.EXPORTS)],
    ])
    expect(exported.get(OrdersModule)).toContain(OrdersService)
    expect(exported.get(NotificationModule)).toContain(NotificationService)
    expect(exported.get(PdfInspectorModule)).toContain(PdfInspectorService)

    const imports = meta(PrintNetworkModule, MODULE_METADATA.IMPORTS)
    for (const m of exported.keys()) expect(imports).toContain(m)
    const providers = meta(PrintNetworkModule, MODULE_METADATA.PROVIDERS)
    expect(providers).toContain(PrintAutomationService)

    expect(meta(PrintAgentController, 'design:paramtypes')).toEqual([PrintNetworkService, PrintAutomationService])
    expect(meta(PrintNetworkAdminController, 'design:paramtypes')).toEqual([PrintNetworkService, PrintAutomationService])
    const autoDeps = meta(PrintAutomationService, 'design:paramtypes')
    expect(autoDeps.slice(0, 4)).toEqual([PrintNetworkService, OrdersService, NotificationService, PdfInspectorService])
  })
})
