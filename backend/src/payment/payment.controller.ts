import { Controller, Post, Get, Body, Param } from '@nestjs/common';
import { PaymentService } from './payment.service';

@Controller('payment')
export class PaymentController {
  constructor(private readonly paymentService: PaymentService) {}

  @Post('create')
  createPayment(@Body() body: { order_id: string; amount: number; customer_id: string }) {
    return this.paymentService.createPayment(body.order_id, body.amount, body.customer_id);
  }

  @Get(':id')
  checkPayment(@Param('id') id: string) {
    return this.paymentService.checkPayment(id);
  }

  @Post('confirm')
  confirmPayment(@Body() body: { invoice_code: string }) {
    return this.paymentService.confirmPayment(body.invoice_code);
  }

  @Get('customer/:customer_id')
  getByCustomer(@Param('customer_id') customer_id: string) {
    return this.paymentService.getPaymentsByCustomer(customer_id);
  }
}