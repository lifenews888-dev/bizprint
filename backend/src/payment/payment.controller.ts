import { Body, Controller, Get, Headers, Param, Post, Req, UseGuards, UnauthorizedException, ForbiddenException, Logger, NotFoundException, BadRequestException } from '@nestjs/common'
import { Throttle } from '@nestjs/throttler'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository, LessThan } from 'typeorm'
import { Cron } from '@nestjs/schedule'
import { createHmac, timingSafeEqual } from 'crypto'
import { PaymentService } from './payment.service'
import { QPayService } from './qpay.service'
import { BonumService } from './bonum.service'
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard'
import { AdminGuard } from '../admin/admin.guard'
import { Order } from '../orders/entities/order.entity'
import { PaymentLog } from './payment-log.entity'

/** Constant-time comparison of two hex digests (avoids timing side channels). */
function safeEqualHex(a: string, b: string): boolean {
  const ab = Buffer.from(a, 'utf8')
  const bb = Buffer.from(b, 'utf8')
  return ab.length === bb.length && timingSafeEqual(ab, bb)
}

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

  // IDOR guard for payment initiation/lookup: only the order's customer or an
  // admin may act on it. Orders without a customer_id are admin-only.
  private assertOrderAccess(order: Order, user: any) {
    if (['admin', 'superadmin'].includes(user?.role)) return
    if (order?.customer_id && user?.id && order.customer_id === user.id) return
    throw new ForbiddenException('Энэ захиалгад хандах эрхгүй')
  }

  // SECURITY: auth + ownership required (previously anyone could create
  // payments/invoices for any order id). All first-party callers (bizprint.mn
  // checkout/dashboard via apiFetch, BizPrint desktop, Prinity) send a token.
  @Post('create')
  @UseGuards(JwtAuthGuard)
  async create(@Body() body: { amount: number; orderId: string; method?: 'qr' | 'bank' | 'cash' }, @Req() req: any) {
    // SECURITY: дүнг клиентээс биш захиалгаас авна (өмнө нь 1₮-ийн нэхэмжлэл
    // үүсгээд төлж захиалгыг "paid" болгох боломжтой байсан).
    const order = body?.orderId ? await this.orderRepo.findOne({ where: { id: body.orderId } }).catch(() => null) : null
    if (!order) throw new NotFoundException('Захиалга олдсонгүй')
    this.assertOrderAccess(order, req.user)
    if (order.payment_status === 'paid') throw new BadRequestException('Захиалгын төлбөр аль хэдийн төлөгдсөн')
    const total = Number(order.total_price)
    if (!(total > 0)) throw new BadRequestException('Захиалгын дүн тодорхойгүй')
    if (Number(body.amount) && Math.round(Number(body.amount)) !== Math.round(total)) {
      this.logger.warn(`payment/create amount mismatch for ${order.id}: client=${body.amount} order=${total}`)
    }
    return this.paymentService.createTdbInvoice(order.id, total, body.method || 'qr')
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
  // SECURITY: auth + ownership (no first-party caller found in site/desktop/driver).
  @Post('qpay/create')
  @UseGuards(JwtAuthGuard)
  async qpayCreate(@Body() body: { orderId: string; amount: number; description?: string }, @Req() req: any) {
    // SECURITY: amount comes from the order in the DB, never from the client.
    const order = body?.orderId ? await this.orderRepo.findOne({ where: { id: body.orderId } }).catch(() => null) : null
    if (!order) throw new NotFoundException('Захиалга олдсонгүй')
    this.assertOrderAccess(order, req.user)
    if (order.payment_status === 'paid') throw new BadRequestException('Захиалгын төлбөр аль хэдийн төлөгдсөн')
    const total = Math.round(Number(order.total_price))
    if (!(total > 0)) throw new BadRequestException('Захиалгын дүн тодорхойгүй')
    const callbackUrl = `${process.env.BACKEND_URL || 'https://api.bizprint.mn'}/api/payment/qpay/callback`
    return this.qpayService.createInvoice({
      orderId: order.id,
      amount: total,
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

  // SECURITY: auth + ownership (no first-party caller found). The invoice is
  // mapped to its order via invoice_no; unmapped invoices are admin-only.
  @Get('qpay/check/:invoiceId')
  @UseGuards(JwtAuthGuard)
  async qpayCheck(@Param('invoiceId') invoiceId: string, @Req() req: any) {
    const order = await this.orderRepo.findOne({ where: { invoice_no: invoiceId } }).catch(() => null)
    if (order) this.assertOrderAccess(order, req.user)
    else if (!['admin', 'superadmin'].includes(req.user?.role)) throw new ForbiddenException('Энэ нэхэмжлэхэд хандах эрхгүй')
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

    // SECURITY: Validate amount against DB order. The order must exist and
    // have a positive total; the invoice is always issued for the DB amount.
    const order = await this.orderRepo.findOne({ where: { id: body.orderId } }).catch(() => null)
    if (!order) return { error: 'Захиалга олдсонгүй' }
    if (order.payment_status === 'paid') return { error: 'Захиалгын төлбөр аль хэдийн төлөгдсөн' }
    const dbAmount = Math.round(Number(order.total_price))
    if (!(dbAmount > 0)) return { error: 'Захиалгын дүн тодорхойгүй' }
    const requestedAmount = Math.round(body.amount)
    if (Math.abs(dbAmount - requestedAmount) > 1) {
      this.logger.warn(`Amount mismatch for order ${body.orderId}: DB=${dbAmount}, Requested=${requestedAmount}`)
      return { error: 'Төлбөрийн дүн буруу байна' }
    }

    try {
      const invoice = await this.bonum.createInvoice({
        orderId: order.id,
        amount: dbAmount,
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
    if (!safeEqualHex(expected, String(checksum).trim().toLowerCase())) {
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

  // SECURITY: the former `bonum/test-e2e` (created real orders + live
  // invoices) and `bonum/test-token` (leaked a token prefix) debug endpoints
  // were removed from production code. Use a sandbox environment and the
  // normal `bonum/create` flow for smoke tests.

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