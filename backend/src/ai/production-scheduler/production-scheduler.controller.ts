import { Controller, Post, Body } from '@nestjs/common'
import { ProductionSchedulerService } from './production-scheduler.service'

@Controller('production-scheduler')
export class ProductionSchedulerController {

  constructor(private readonly service: ProductionSchedulerService) {}

  @Post('schedule')
  schedule(@Body() body: any) {

    const orders = body.orders.map((o: any) => ({
      id: Number(o.id),
      quantity: Number(o.quantity),
      machine_speed: Number(o.machine_speed)
    }))

    return this.service.scheduleOrders(orders)
  }

}