import { Body, Controller, Get, Param, Post, Req, UseGuards, Logger } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository } from 'typeorm'
import { PaymentService } from './payment.service'
import { QPayService } from './qpay.service'
import { BonumService } from './bonum.service'
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard'
import { Order } from '../orders/entities/order.entity'

@Controller('payment')
export class PaymentController {
  private readonly logger = new Logger(PaymentController.name)

  constructor(
    private readonly paymentService: PaymentService,
    private readonly qpayService: QPayService,
    private readonly bonum: BonumService,
    @InjectRepository(Order) private readonly orderRepo: Repository<Order>,
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

  // ═══════════════════════════════════════════
  //  BONUM PAYMENT GATEWAY
  // ═══════════════════════════════════════════

  @Post('bonum/create')
  async bonumCreate(@Body() body: { orderId: string; amount: number; description?: string; providers?: string[] }) {
    if (!body.orderId || !body.amount) {
      return { error: 'orderId болон amount шаардлагатай' }
    }
    try {
      const invoice = await this.bonum.createInvoice({
        orderId: body.orderId,
        amount: body.amount,
        description: body.description,
        providers: body.providers,
      })
      await this.orderRepo.update(body.orderId, {
        payment_status: 'pending',
        payment_method: 'bonum',
        invoice_no: invoice.invoiceId,
      }).catch(() => {})
      return invoice
    } catch (e: any) {
      this.logger.error(`Bonum create error: ${e.message}`)
      return { error: e.message || 'Төлбөрийн систем алдаа гарлаа' }
    }
  }

  @Post('bonum/webhook')
  async bonumWebhook(@Body() body: any) {
    this.logger.log(`Bonum webhook: ${JSON.stringify(body)}`)
    const invoiceId = body?.body?.invoiceId || body?.invoiceId
    const status = body?.body?.status || body?.status
    if (invoiceId && (status === 'SUCCESS' || status === 'PAID')) {
      const order = await this.orderRepo.findOne({ where: { invoice_no: invoiceId } })
      if (order) {
        await this.orderRepo.update(order.id, {
          payment_status: 'paid',
        })
        this.logger.log(`Order ${order.id} paid via Bonum`)
      }
    }
    return { ok: true }
  }

  @Get('bonum/status/:invoiceId')
  async bonumStatus(@Param('invoiceId') invoiceId: string) {
    const order = await this.orderRepo.findOne({ where: { invoice_no: invoiceId } })
    return {
      invoiceId,
      paid: order?.payment_status === 'paid',
      status: order?.payment_status || 'unknown',
      orderId: order?.id,
    }
  }

  @Get('bonum/providers')
  async bonumProviders() {
    return this.bonum.getProviders()
  }

  @Get('bonum/test-token')
  async bonumTestToken() {
    if (process.env.NODE_ENV === 'production') {
      return { error: 'Not available in production' }
    }
    try {
      const token = await this.bonum.getToken()
      return { ok: true, token: token.slice(0, 20) + '...' }
    } catch (e: any) {
      return { error: e.message }
    }
  }
}
