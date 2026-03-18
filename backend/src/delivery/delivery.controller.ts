import { Controller, Get, Post, Patch, Param, Body, ParseIntPipe } from '@nestjs/common'
import { DeliveryService } from './delivery.service'
import { DeliveryStatus } from './delivery.entity'

@Controller('delivery')
export class DeliveryController {
  constructor(private readonly service: DeliveryService) {}

  @Get()
  findAll() {
    return this.service.findAll()
  }

  @Get('order/:orderId')
  findByOrder(@Param('orderId', ParseIntPipe) orderId: number) {
    return this.service.findByOrder(orderId)
  }

  @Post()
  create(@Body() body: any) {
    return this.service.create(body)
  }

  @Patch(':id/status')
  updateStatus(
    @Param('id', ParseIntPipe) id: number,
    @Body('status') status: DeliveryStatus,
  ) {
    return this.service.updateStatus(id, status)
  }
}