import { Body, Controller, Get, Param, Post } from '@nestjs/common'
import { PaymentService } from './payment.service'

@Controller('payment')
export class PaymentController {
  constructor(private readonly paymentService: PaymentService) {}

  @Post('create')
  async create(@Body() body: { amount: number; orderId: string; method?: 'qr' | 'bank' | 'cash' }) {
    return this.paymentService.createTdbInvoice(body.orderId, body.amount, body.method || 'qr')
  }

  @Get('status/:invoiceNo')
  async status(@Param('invoiceNo') invoiceNo: string) {
    return this.paymentService.checkTdbStatus(invoiceNo)
  }

  @Post('callback')
  async callback(@Body() body: any) {
    return this.paymentService.handleTdbCallback(body)
  }
}
