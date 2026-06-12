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
import { AdminGuard } from '../admin/admin.guard'
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

  // SECURITY: Manual confirmation marks an order PAID without contacting the
  // gateway, so it is admin-only (reconciliation/recovery). The normal client
  // flow verifies via GET /payment/status/:invoiceNo, which re-queries TDB.
  @Post('confirm/:invoiceCode')
  @UseGuards(JwtAuthGuard, AdminGuard)
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
  async getInvoice(@Param('id') id: string, @Req() req: any) {
    const invoice = await this.paymentService.getInvoiceById(id)
    this.assertInvoiceOwner(invoice, req.user)
    return invoice
  }

  @UseGuards(JwtAuthGuard)
  @Get('invoices/number/:number')
  async getInvoiceByNumber(@Param('number') number: string, @Req() req: any) {
    const invoice = await this.paymentService.getInvoiceByNumber(number)
    this.assertInvoiceOwner(invoice, req.user)
    return invoice
  }

  // IDOR guard: an invoice exposes a customer's financial record, so only the
  // owning customer or an admin may read it.
  private assertInvoiceOwner(invoice: any, user: any) {
    const isAdmin = ['admin', 'superadmin'].includes(user?.role)
    if (!isAdmin && invoice?.customer_id && invoice.customer_id !== user?.id) {
      throw new UnauthorizedException('Энэ нэхэмжлэхийг үзэх эрхгүй')
    }
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

  /**
   * QPay callback — payment notification from QPay merchant gateway.
   * QPay does not sign callback bodies, so the body itself is untrusted.
   * We pull the object_id (invoice id) and re-query QPay's own status
   * endpoint to verify the payment is real before confirming the order.
   * This mirrors the Bonum webhook signature check: never trust a
   * payment confirmation that didn't come from the gateway directly.
   */
  @Post('qpay/callback')
  async qpayCallback(@Body() body: any) {
    const invoiceId = body?.object_id || body?.payment_id || body?.invoice_id
    if (!invoiceId) {
      this.logger.warn('QPay callback missing invoice id — rejected')
      return { status: 'ignored', reason: 'no_invoice_id' }
    }

    const status = await this.qpayService.checkPayment(invoiceId)
    if (status?.error) {
      this.logger.warn(`QPay status check failed for ${invoiceId}: ${status.error}`)
      return { status: 'ignored', reason: 'check_failed' }
    }

    const isPaid = status?.count > 0 ||
                   status?.payment_status === 'PAID' ||
                   (Array.isArray(status?.rows) && status.rows.length > 0)

    if (!isPaid) {
      this.logger.warn(`QPay callback for ${invoiceId} but status is not PAID — ignored`)
      return { status: 'pending' }
    }

    // Map invoice id back to our payment record. invoice_no on Order or
    // invoice_code on Payment depending on flow.
    const order = await this.orderRepo.findOne({ where: { invoice_no: invoiceId } })
    if (!order) {
      this.logger.warn(`QPay PAID for unknown invoice ${invoiceId}`)
      return { status: 'ignored', reason: 'order_not_found' }
    }
    if (order.payment_status === 'paid') {
      return { status: 'ok', already_paid: true }
    }

    await this.paymentService.confirmPayment(invoiceId).catch(e =>
      this.logger.error(`QPay confirmPayment failed for ${invoiceId}: ${e.message}`),
    )
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

    // SECURITY: Validate amount against DB order
    const order = await this.orderRepo.findOne({ where: { id: body.orderId } }).catch(() => null)
    if (order && order.total_price) {
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

    // SECURITY: Webhook signature is mandatory. Without CHECKSUM_KEY configured
    // we have no way to distinguish a real Bonum callback from a spoofed one,
    // so reject everything until the operator wires the secret.
    const CHECKSUM_KEY = process.env.BONUM_CHECKSUM_KEY || ''
    if (!CHECKSUM_KEY) {
      this.logger.error('Bonum webhook rejected: BONUM_CHECKSUM_KEY not configured')
      throw new UnauthorizedException('Webhook verification not configured')
    }
    if (!checksum) {
      this.logRepo.save(this.logRepo.create({
        invoice_id: body?.body?.invoiceId,
        provider: 'bonum',
        event_type: 'webhook',
        status: body?.status || body?.body?.status,
        raw_payload: body,
        checksum_valid: false,
        ip_address: req?.ip || req?.headers?.['x-forwarded-for'],
      })).catch(() => {})
      throw new UnauthorizedException('Missing webhook signature')
    }
    const expected = createHmac('sha256', CHECKSUM_KEY)
      .update(JSON.stringify(body))
      .digest('hex')
    if (expected !== checksum) {
      this.logger.warn(`Invalid webhook checksum for invoice ${body?.body?.invoiceId}`)
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
    const checksumValid = true

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

  // ─── Refund endpoint (admin only triggers, customer-side via cancel flow) ──
  @Post('refund/:orderId')
  @UseGuards(JwtAuthGuard)
  async refund(
    @Param('orderId') orderId: string,
    @Body() body: { reason?: string },
    @Req() req: any,
  ) {
    // Only admin/superadmin can trigger refund directly. Customer cancel flow
    // calls this server-side via OrdersService.cancelOrder().
    const role = req?.user?.role
    if (!['admin', 'superadmin'].includes(role)) {
      throw new UnauthorizedException('Refund-ийг зөвхөн админ хийнэ')
    }
    return this.paymentService.refundOrder(orderId, body?.reason || 'admin_refund')
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

  // One-off: creates a real 1₮ DB order + Bonum invoice end-to-end
  // to verify the full flow works. Secret-protected to prevent abuse.
  @Post('bonum/test-e2e')
  async bonumTestE2E(@Body() body: { secret: string; amount?: number }) {
    // SECURITY: creates real DB orders + live invoices, so it is a dev-only
    // smoke test. Disabled in production and requires an explicitly-set secret
    // (no hardcoded fallback).
    if (process.env.NODE_ENV === 'production') {
      return { error: 'Not available in production' };
    }
    const expected = process.env.BOOTSTRAP_SECRET;
    if (!expected || body.secret !== expected) return { error: 'Invalid secret' };
    const amount = Math.max(1, Math.min(10, Math.round(body.amount || 1)));

    // Create minimal test order
    const order = this.orderRepo.create({
      quantity: 1,
      total_price: amount,
      unit_price: amount,
      customer_name: 'E2E test',
      product_name: 'Bonum E2E smoke test',
      status: 'draft',
      payment_status: 'pending',
    } as any);
    const saved = (await this.orderRepo.save(order)) as any;
    const orderId: string = Array.isArray(saved) ? saved[0].id : saved.id;

    try {
      const invoice = await this.bonum.createInvoice({
        orderId,
        amount,
        description: 'BizPrint E2E test',
        providers: ['QPAY'],
      });
      await this.orderRepo.update(orderId, {
        payment_method: 'bonum',
        invoice_no: invoice.invoiceId,
      });
      return {
        ok: true,
        orderId,
        amount,
        invoiceId: invoice.invoiceId,
        followUpLink: invoice.followUpLink,
        instructions: 'Open followUpLink, pay 1₮ via bank app QR, then check order.payment_status',
      };
    } catch (e: any) {
      return { ok: false, orderId, error: e.message };
    }
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

  // —— Escrow payment history: status log per invoice ——————————————
  @UseGuards(JwtAuthGuard)
  @Get('history')
  async paymentHistory(@Req() req: any) {
    const customerId: string = req.user.id
    const invoices: any[] = await this.paymentService.getInvoicesByCustomer(customerId)
    const list = Array.isArray(invoices) ? invoices : []
    const result = await Promise.all(
      list.map(async (inv: any) => {
        const logs = await this.logRepo.find({
          where: { invoice_id: inv.id },
          order: { created_at: 'ASC' } as any,
        })
        // Derive escrow timeline: paid -> held (in_production) -> released
        const statusSteps = [
          { step: 'paid',     label: 'Төлөгдсөн',  at: inv.paid_at },
          { step: 'held',     label: 'Escrow',      at: logs.find((l: any) => l.event_type === 'escrow_hold')?.created_at ?? null },
          { step: 'released', label: 'Суллагдсан', at: logs.find((l: any) => l.event_type === 'escrow_release')?.created_at ?? null },
        ]
        return {
          invoice_id: inv.id,
          invoice_number: inv.invoice_number,
          order_id: inv.order_id,
          total_amount: inv.total_amount,
          status: inv.status,
          paid_at: inv.paid_at,
          status_steps: statusSteps,
          status_log: logs.map((l: any) => ({
            status: l.status,
            event_type: l.event_type,
            amount: l.amount,
            created_at: l.created_at,
          })),
        }
      }),
    )
    return result
  }

}