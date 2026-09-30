import { Test } from '@nestjs/testing'
import { getDataSourceToken, getRepositoryToken } from '@nestjs/typeorm'
import { ColorCode } from './entities/color-code.entity'
import { PrintDevice } from './entities/print-device.entity'
import { DeviceColorProfile } from './entities/device-color-profile.entity'
import { PrintAgent } from './entities/print-agent.entity'
import { PrintTicket } from './entities/print-ticket.entity'
import { PrintProductType } from './entities/print-product-type.entity'
import { Order } from '../orders/entities/order.entity'
import { OrderItem } from '../orders/entities/order-item.entity'
import { PrintNetworkService, hashAgentToken } from './print-network.service'
import { PrintAgentGuard } from './print-agent.guard'
import { ColorCatalogController, PrintAgentController, PrintNetworkAdminController } from './print-network.controller'

describe('PrintNetwork wiring', () => {
  it('resolves controllers, guard and service; agent guard checks hashed token', async () => {
    const agentRepo = {
      findOne: jest.fn(async ({ where }) => (where.tokenHash === hashAgentToken('bpa_ok') ? { id: 'a1', name: 'Shop' } : null)),
    }
    const repo = () => ({})
    const mod = await Test.createTestingModule({
      controllers: [ColorCatalogController, PrintNetworkAdminController, PrintAgentController],
      providers: [
        PrintNetworkService, PrintAgentGuard,
        ...[ColorCode, PrintDevice, DeviceColorProfile, PrintTicket, PrintProductType, Order, OrderItem].map((e) => ({ provide: getRepositoryToken(e), useValue: repo() })),
        { provide: getRepositoryToken(PrintAgent), useValue: agentRepo },
        { provide: getDataSourceToken(), useValue: {} },
      ],
    }).compile()

    const guard = mod.get(PrintAgentGuard)
    const ctx = (token?: string) => {
      const req: any = { headers: token ? { 'x-agent-token': token } : {} }
      return { req, c: { switchToHttp: () => ({ getRequest: () => req }) } as any }
    }
    const ok = ctx('bpa_ok')
    await expect(guard.canActivate(ok.c)).resolves.toBe(true)
    expect(ok.req.printAgent.id).toBe('a1')
    await expect(guard.canActivate(ctx('bpa_bad').c)).rejects.toThrow('Агентын токен буруу')
    await expect(guard.canActivate(ctx().c)).rejects.toThrow()
  })
})
