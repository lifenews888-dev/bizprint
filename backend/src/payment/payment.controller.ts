import { Body, Controller, Get, Param, Post, Req, UseGuards } from '@nestjs/common'
import { PaymentService } from './payment.service'
import { QPayService } from './qpay.service'
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard'

@Controller('payment')
export class PaymentController {
  constructor(
    private readonly paymentService: PaymentService,
    private readonly qpayService: QPayService,
  ) {}

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

  @Post('confirm/:invoiceCode')
  async confirm(@Param('invoiceCode') invoiceCode: string) {
    return this.paymentService.confirmPayment(invoiceCode)
  }

  // ── Invoice endpoints ──
  @UseGuards(JwtAuthGuard)
  @Get('invoices/my')
  async myInvoices(@Req() req: any) {
    return this.paymentService.getInvoicesByCustomer(req.user.id)
  }

  @UseGuards(JwtAuthGuard)
  @Get('invoices/:id')
  async getInvoice(@Param('id') id: string) {
    return this.paymentService.getInvoiceById(id)
  }

  @Get('invoices/number/:number')
  async getInvoiceByNumber(@Param('number') number: string) {
    return this.paymentService.getInvoiceByNumber(number)
  }

  // ── QPay endpoints ──
  @Post('qpay/create')
  async qpayCreate(@Body() body: { orderId: string; amount: number; description?: string }) {
    const callbackUrl = `${process.env.BACKEND_URL || 'https://bizprint-production.up.railway.app'}/api/payment/qpay/callback`
    return this.qpayService.createInvoice({
      orderId: body.orderId,
      amount: body.amount,
      description: body.description || `BizPrint захиалга #${body.orderId}`,
      callbackUrl,
    })
  }

  @Post('qpay/callback')
  async qpayCallback(@Body() body: any) {
    console.log('[QPay Callback]', JSON.stringify(body))
    return { status: 'ok' }
  }

  @Get('qpay/check/:invoiceId')
  async qpayCheck(@Param('invoiceId') invoiceId: string) {
    return this.qpayService.checkPayment(invoiceId)
  }
}
