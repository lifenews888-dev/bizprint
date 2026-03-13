import { Controller, Post, Patch, Body, Param } from '@nestjs/common'
import { OrdersService } from './orders.service'

@Controller('orders')
export class OrdersController {

  constructor(private ordersService: OrdersService) {}

  @Post()
  createOrder(@Body() body: any) {
    return this.ordersService.createOrder(body)
  }

  @Patch(':id/status')
  updateStatus(
    @Param('id') id: string,
    @Body('status') status: string,
  ) {
    return this.ordersService.updateStatus(id, status)
  }
}