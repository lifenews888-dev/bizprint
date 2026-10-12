import { Controller, Get, Param, Post, Body, Patch, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { AdminGuard } from '../admin/admin.guard';
import { ShippingService } from './shipping.service';

@Controller('shipments')
export class ShippingController {
  constructor(private readonly service: ShippingService) {}

  @Get('order/:order_id')
  findByOrder(@Param('order_id') order_id: string) {
    return this.service.findByOrder(order_id);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.service.findOne(id);
  }

  // SECURITY: shipment mutations were unauthenticated — admin-only now.
  @Post()
  @UseGuards(JwtAuthGuard, AdminGuard)
  create(@Body() body: any) {
    return this.service.create(body);
  }

  @Patch(':id/status')
  @UseGuards(JwtAuthGuard, AdminGuard)
  updateStatus(@Param('id') id: string, @Body() body: { status: string }) {
    return this.service.updateStatus(id, body.status);
  }

  @Post(':id/items')
  @UseGuards(JwtAuthGuard, AdminGuard)
  addItem(@Param('id') id: string, @Body() body: any) {
    return this.service.addItem({ ...body, shipment_id: id });
  }
}
