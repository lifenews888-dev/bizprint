import {
  Controller,
  Post,
  Body,
  Get,
  Param,
  Patch,
  UseGuards,
  Request,
} from '@nestjs/common';
import { OrdersService } from './order.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('orders')
export class OrdersController {
  constructor(private ordersService: OrdersService) {}

  @Post()
  create(@Body() body: any) {
    return this.ordersService.createOrder(body);
  }

  @Post('from-quote')
  @UseGuards(JwtAuthGuard)
  createFromQuote(
    @Body() body: { quote_id: string; payment_method?: string },
    @Request() req: any,
  ) {
    return this.ordersService.createFromQuote(
      body.quote_id,
      req.user.id,
      body.payment_method,
    );
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

  @Patch(':id/status')
  @UseGuards(JwtAuthGuard)
  updateStatus(@Param('id') id: string, @Body() body: any) {
    return this.ordersService.updateOrder(id, body);
  }

  @Patch(':id/revert')
  @UseGuards(JwtAuthGuard)
  revertStatus(
    @Param('id') id: string,
    @Body() body: { reason: string; target_stage?: string },
    @Request() req: any,
  ) {
    const user =
      req.user?.name || req.user?.email || 'Admin';
    return this.ordersService.revertStatus(
      id,
      body.reason,
      user,
      body.target_stage,
    );
  }

  @Patch(':id/cancel')
  cancel(@Param('id') id: string) {
    return this.ordersService.cancelOrder(id);
  }
}
