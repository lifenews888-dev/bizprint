import { Body, Controller, Get, Headers, Param, Post, Req, UseGuards, UnauthorizedException, Logger } from '@nestjs/common'
import { Throttle } from '@nestjs/throttler'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository, LessThan } from 'typeorm'
import { Cron } from '@nestjs/schedule'
import { createHmac } from 'crypto'
import { PaymentService } from './payment.service'
import { QPayService } from './qpay.service'
import { BonumService } from './bonum.service'
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard'
import { Order } from '../orders/entities/order.entity'
import { PaymentLog } from './payment-log.entity'

@Controller('payment')
export class PaymentController {
  private readonly logger = new Logger(PaymentController.name)

  constructor(
    private readonly paymentService: PaymentService,
    private readonly qpayService: QPayService,
    private readonly bonum: BonumService,
    @InjectRepository(Order) private readonly orderRepo: Repository<Order>,
    @InjectRepository(PaymentLog) private readonly logRepo: Repository<PaymentLog>,
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
  @Throttle({ default: { limit: 5, ttl: 60000 } })
  async bonumCreate(@Body() body: { orderId: string; amount: number; description?: string; providers?: string[] }) {
    if (!body.orderId || !body.amount) {
      return { error: 'orderId болон amount шаардлагатай' }
    }

    // SECURITY: Require orderId to exist in DB (prevents abuse hitting Bonum with fake orderIds)
    const order = await this.orderRepo.findOne({ where: { id: body.orderId } }).catch(() => null)
    if (!order) {
      this.logger.warn(`Invoice create rejected: order ${body.orderId} not found in DB`)
      return { error: 'Захиалга олдсонгүй' }
    }
    // Validate amount against DB order
    if (order.total_price) {
      const dbAmount = Math.round(Number(order.total_price))
      const requestedAmount = Math.round(body.amount)
      if (Math.abs(dbAmount - requestedAmount) > 1) {
        this.logger.warn(`Amount mismatch for order ${body.orderId}: DB=${dbAmount}, Requested=${requestedAmount}`)
        return { error: 'Төлбөрийн дүн буруу байна' }
      }
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
      }).catch(err => this.logger.error(`Failed to update order: ${err.message}`))

      // Log create event
      this.logRepo.save(this.logRepo.create({
        order_id: body.orderId,
        invoice_id: invoice.invoiceId,
        provider: 'bonum',
        event_type: 'create',
        status: 'PENDING',
        amount: body.amount,
        raw_payload: { request: body, response: invoice },
        checksum_valid: true,
      })).catch(() => {})

      return invoice
    } catch (e: any) {
      this.logger.error(`Bonum create error: ${e.message}`)
      return { error: e.message || 'Төлбөрийн систем алдаа гарлаа' }
    }
  }

  @Post('bonum/webhook')
  async bonumWebhook(
    @Body() body: any,
    @Headers('x-checksum-v2') checksum: string,
    @Req() req: any,
  ) {
    this.logger.log(`Bonum webhook received: ${JSON.stringify(body)}`)

    // SECURITY FIX 1: Verify webhook signature
    const CHECKSUM_KEY = process.env.BONUM_CHECKSUM_KEY || ''
    let checksumValid = false
    if (CHECKSUM_KEY && checksum) {
      const expected = createHmac('sha256', CHECKSUM_KEY)
        .update(JSON.stringify(body))
        .digest('hex')
      if (expected !== checksum) {
        this.logger.warn(`Invalid webhook checksum for invoice ${body?.body?.invoiceId}`)
        // Log failed attempt
        this.logRepo.save(this.logRepo.create({
          invoice_id: body?.body?.invoiceId,
          provider: 'bonum',
          event_type: 'webhook',
          status: body?.status || body?.body?.status,
          raw_payload: body,
          checksum_valid: false,
          ip_address: req?.ip || req?.headers?.['x-forwarded-for'],
        })).catch(() => {})
        throw new UnauthorizedException('Invalid webhook signature')
      }
      checksumValid = true
    }

    const invoiceId = body?.body?.invoiceId || body?.invoiceId
    const status = body?.body?.status || body?.status

    // Always log the webhook attempt
    this.logRepo.save(this.logRepo.create({
      invoice_id: invoiceId,
      transaction_id: body?.body?.transactionId,
      provider: 'bonum',
      event_type: 'webhook',
      status,
      amount: body?.body?.amount,
      raw_payload: body,
      checksum_valid: checksumValid,
      ip_address: req?.ip || req?.headers?.['x-forwarded-for'],
    })).catch(() => {})

    if (!invoiceId) return { ok: false, error: 'No invoiceId' }

    // SECURITY FIX 2: Idempotency check — prevent double processing
    const alreadyPaid = await this.orderRepo.findOne({
      where: { invoice_no: invoiceId, payment_status: 'paid' },
    })
    if (alreadyPaid) {
      this.logger.log(`Invoice ${invoiceId} already processed, skipping`)
      return { ok: true, skipped: true }
    }

    if (status === 'SUCCESS' || status === 'PAID') {
      const order = await this.orderRepo.findOne({ where: { invoice_no: invoiceId } })
      if (order) {
        // NOTE: Only updating payment_status — order status transitions go through
        // the FROZEN state machine via OrdersService.updateOrder() elsewhere.
        await this.orderRepo.update(order.id, { payment_status: 'paid' })
        this.logger.log(`Order ${order.id} PAID via Bonum. Invoice: ${invoiceId}, Amount: ${body?.body?.amount}`)
      } else {
        this.logger.warn(`Order not found for invoiceId: ${invoiceId}`)
      }
    } else if (status === 'FAILED') {
      const order = await this.orderRepo.findOne({ where: { invoice_no: invoiceId } })
      if (order) {
        await this.orderRepo.update(order.id, { payment_status: 'failed' })
        this.logger.log(`Order ${order.id} payment FAILED`)
      }
    }

    return { ok: true }
  }

  // ─── Cron: expire pending invoices older than 1h ───
  @Cron('0 * * * *')
  async expirePendingInvoices() {
    const oneHourAgo = new Date(Date.now() - 3600 * 1000)
    const expired = await this.orderRepo.find({
      where: {
        payment_status: 'pending',
        payment_method: 'bonum',
        created_at: LessThan(oneHourAgo),
      },
    })
    for (const order of expired) {
      await this.orderRepo.update(order.id, { payment_status: 'expired' })
      this.logger.log(`Expired pending payment for order ${order.id}`)
    }
    if (expired.length) {
      this.logger.log(`Expired ${expired.length} pending Bonum invoices`)
    }
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

  @Get('bonum/debug-env')
  async bonumDebugEnv() {
    const secret = process.env.BONUM_APP_SECRET || ''
    const checksum = process.env.BONUM_CHECKSUM_KEY || ''
    return {
      BONUM_API_BASE: process.env.BONUM_API_BASE || '(not set)',
      BONUM_TERMINAL_ID: process.env.BONUM_TERMINAL_ID || '(not set)',
      BONUM_APP_SECRET_length: secret.length,
      BONUM_APP_SECRET_preview: secret ? secret.slice(0, 8) + '...' + secret.slice(-4) : '(not set)',
      BONUM_CHECKSUM_KEY_length: checksum.length,
      BONUM_CHECKSUM_KEY_preview: checksum ? checksum.slice(0, 8) + '...' + checksum.slice(-4) : '(not set)',
    }
  }
}
