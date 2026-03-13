import { Controller, Post, Body, Get, Param, Patch } from '@nestjs/common';
import { OrdersService } from './order.service';

@Controller('orders')
export class OrdersController {
  constructor(private ordersService: OrdersService) {}

  @Post()
  create(@Body() body: any) {
    return this.ordersService.createOrder(body);
  }

  @Get()
  getAll() {
    return this.ordersService.getOrders();
  }

  @Get('customer/:customer_id')
  getByCustomer(@Param('customer_id') customer_id: string) {
    return this.ordersService.getOrdersByCustomer(customer_id);
  }

  @Get(':id')
  getOne(@Param('id') id: string) {
    return this.ordersService.getOrderById(id);
  }

  @Patch(':id/cancel')
  cancel(@Param('id') id: string) {
    return this.ordersService.cancelOrder(id);
  }
}