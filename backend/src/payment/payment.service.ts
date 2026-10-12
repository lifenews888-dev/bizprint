import { BadRequestException, Injectable, Logger, NotFoundException, OnModuleInit, ServiceUnavailableException } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository } from 'typeorm'
import axios from 'axios'
import { Payment } from './entities/payment.entity'
import { Invoice, InvoiceStatus, InvoiceType } from './entities/invoice.entity'
import { Order, OrderStatus } from '../orders/entities/order.entity'
import { MailService } from '../mail/mail.service'
import { ProductionJobsService } from '../production-jobs/production-jobs.service'
import { NotificationService } from '../notifications/notification.service'
import { EventBusService } from '../events/event-bus.service'
import { BizEvent } from '../events/event-types'
import { WalletService } from '../wallet/wallet.service'

import { loadTdbConfig, missingTdbOAuthEnv, missingTdbQrEnv, TdbConfig } from './tdb-config'

@Injectable()
export class PaymentService implements OnModuleInit {
  private readonly logger = new Logger(PaymentService.name)
  private cachedToken: { access_token: string; expires_at: number } | null = null
  // SECURITY: no hard-coded credential defaults — see tdb-config.ts.
  private readonly tdb: TdbConfig = loadTdbConfig()

  constructor(
    @InjectRepository(Payment)
    private paymentRepo: Repository<Payment>,
    @InjectRepository(Invoice)
    private invoiceRepo: Repository<Invoice>,
    @InjectRepository(Order)
    private orderRepo: Repository<Order>,
    private mailService: MailService,
    private productionJobsService: ProductionJobsService,
    private notificationService: NotificationService,
    private readonly eventBus: EventBusService,
    private readonly walletService: WalletService,
  ) {}

  onModuleInit() {
    // Fail closed: report missing TDB settings by NAME only (never values).
    const missing = missingTdbQrEnv(this.tdb)
    if (missing.length) {
      const msg = `TDB QR payment is NOT configured — missing env: ${missing.join(', ')}. ` +
        'QR invoices are disabled (bank-transfer fallback only) and status checks will be refused.'
      if (process.env.NODE_ENV === 'production') this.logger.error(msg)
      else this.logger.warn(msg + ' For local dev set TDB_SANDBOX=true plus sandbox credentials.')
    } else if (this.tdb.sandbox) {
      this.logger.warn('TDB QR is running against the SANDBOX gateway (TDB_SANDBOX=true).')
    }

    // Auto-refund when an order is cancelled, applying the policy below.
    // We pass previousStatus so the refund percentage reflects the state
    // *before* CANCELLED was set, not the cancelled state itself (which
    // would always score 0%).
    this.eventBus.on(BizEvent.ORDER_CANCELLED, (payload: any) => {
      if (!payload?.wasPaid || !payload?.orderId) return
      this.refundOrder(payload.orderId, payload.reason || 'cancelled', payload.previousStatus).catch(e =>
        this.logger.error(`Auto-refund failed for ${payload.orderId}: ${e.message}`),
      )
    })
  }

  /**
   * Compute refund percentage for a given order status, per CLAUDE.md policy:
   *   Before production (DRAFT/QUOTATION_SENT/CONFIRMED/PENDING_FILE/FILE_REVIEW
   *   /FILE_REJECTED/ON_HOLD): 100%
   *   In production (IN_PRODUCTION/FINISHING): 50% (paper + setup costs already incurred)
   *   After dispatch (PARTIALLY_DISPATCHED/DISPATCHED/DELIVERED/COMPLETED): 0%
   *   Already CANCELLED: 0%
   */
  static refundPercentForStatus(status: OrderStatus): number {
    switch (status) {
      case OrderStatus.DRAFT:
      case OrderStatus.QUOTATION_SENT:
      case OrderStatus.CONFIRMED:
      case OrderStatus.PENDING_FILE:
      case OrderStatus.FILE_REVIEW:
      case OrderStatus.FILE_REJECTED:
      case OrderStatus.ON_HOLD:
        return 100
      case OrderStatus.IN_PRODUCTION:
      case OrderStatus.FINISHING:
        return 50
      default:
        return 0
    }
  }

  /**
   * Refund a paid order according to the policy above. Credits the customer's
   * wallet (BizPrint internal balance — actual bank reversal happens via the
   * customer's withdrawal request from the wallet).
   *
   * Idempotent: returns existing refund if already processed.
   */
  async refundOrder(orderId: string, reason: string, statusOverride?: OrderStatus) {
    const order = await this.orderRepo.findOne({ where: { id: orderId } })
    if (!order) throw new NotFoundException('Захиалга олдсонгүй')
    if (order.payment_status !== 'paid') {
      throw new BadRequestException('Зөвхөн төлбөр төлөгдсөн захиалгыг буцаах боломжтой')
    }
    if (order.payment_status === 'refunded' as any) {
      return { ok: true, alreadyRefunded: true }
    }

    // Use the snapshot status from the cancellation event when available;
    // falls back to the live status (e.g. when admin triggers refund directly).
    const policyStatus = (statusOverride ?? (order.status as OrderStatus))
    const percent = PaymentService.refundPercentForStatus(policyStatus)
    const total = Number(order.total_price) || 0
    const refundAmount = Math.round((total * percent) / 100)

    if (refundAmount > 0 && order.customer_id) {
      await this.walletService.credit(
        order.customer_id,
        refundAmount,
        'order_refund',
        order.id,
        `Refund (${percent}%): ${reason || 'Customer cancellation'}`,
      )
    }

    await this.orderRepo.update(order.id, { payment_status: 'refunded' as any })

    this.logger.log(`Refunded order ${order.id}: ${refundAmount}₮ (${percent}%) — ${reason}`)

    if (order.customer_id) {
      await this.notificationService.create({
        user_id: order.customer_id,
        type: 'payment',
        title: '💰 Төлбөр буцаагдлаа',
        message: `Захиалга #${order.id.slice(-8).toUpperCase()} — ${refundAmount.toLocaleString()}₮ хэтэвчинд орлоо (${percent}%).`,
        data: { order_id: order.id, refund_amount: refundAmount, refund_percent: percent },
      }).catch(e => this.logger.warn(`Refund notification failed for ${order.id}: ${e.message}`))
    }

    return { ok: true, orderId: order.id, refundAmount, refundPercent: percent }
  }

  // ─── Helpers ───────────────────────────────────────────
  // Currently unused by the QR flow; kept for the TDB OAuth API.
  private async fetchOAuthToken(): Promise<string> {
    const now = Date.now()
    if (this.cachedToken && this.cachedToken.expires_at > now + 60_000) return this.cachedToken.access_token
    const missing = missingTdbOAuthEnv(this.tdb)
    if (missing.length) {
      throw new ServiceUnavailableException(`TDB OAuth тохируулаагүй (${missing.join(', ')})`)
    }
    const body = new URLSearchParams({
      grant_type: 'client_credentials',
      client_id: this.tdb.clientId,
      client_secret: this.tdb.clientSecret,
    })
    const res = await axios.post(this.tdb.oauthUrl, body.toString(), {
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    })
    const token = res.data?.access_token
    const expires_in = res.data?.expires_in || 3600
    this.cachedToken = { access_token: token, expires_at: now + expires_in * 1000 }
    return token
  }

  private assertTdbQrConfigured() {
    const missing = missingTdbQrEnv(this.tdb)
    if (missing.length) {
      throw new ServiceUnavailableException(`TDB QR төлбөр тохируулаагүй (${missing.join(', ')})`)
    }
  }

  private async fetchQrToken(): Promise<string> {
    this.assertTdbQrConfigured()
    const res = await axios.post(`${this.tdb.qrBase}/api/v1/login`, {
      username: this.tdb.qrUser,
      password: this.tdb.qrPass,
    })
    return res.data?.data?.token || ''
  }

  // ─── CREATE ────────────────────────────────────────────
  async createTdbInvoice(order_id: string, amount: number, method: 'qr' | 'bank' | 'cash' = 'qr') {
    if (method === 'bank') {
      const refCode = `BP-${Date.now().toString(36).toUpperCase()}`
      const payment = await this.paymentRepo.save(this.paymentRepo.create({
        order_id,
        customer_id: '',
        amount,
        provider: 'bank',
        status: 'pending',
        invoice_code: refCode,
      }))
      await this.autoCreateInvoice(order_id, amount, 'bank', refCode);
      return {
        method,
        payment_id: payment.id,
        invoice_code: refCode,
        accountName: this.tdb.accountName,
        iban: this.tdb.iban,
        accountNumber: this.tdb.account,
        bank: 'Худалдаа Хөгжлийн Банк (TDB)',
        bankCode: 4,
        description: `BizPrint ${refCode}`,
        amount,
        currency: 'MNT',
        status: 'pending',
      }
    }

    if (method === 'cash') {
      const cashCode = `CASH-${Date.now()}`
      const payment = await this.paymentRepo.save(this.paymentRepo.create({
        order_id,
        customer_id: '',
        amount,
        provider: 'cash',
        status: 'pending',
        invoice_code: cashCode,
      }))
      await this.autoCreateInvoice(order_id, amount, 'cash', cashCode);
      return { method, payment_id: payment.id, invoice_code: cashCode, status: 'pending' }
    }

    // Try TDB QR service
    try {
      const qrToken = await this.fetchQrToken()
      const callbackUrl = this.tdb.callbackUrl
      const res = await axios.post(`${this.tdb.qrBase}/api/v1/invoice`, {
        qrType: 'dynamic',
        transactionType: 1,
        qrGenerator: 'TDBM',
        accountNumber: this.tdb.account,
        amount,
        bankCode: 'TDBMNUB',
        curCode: 'MNT',
        terminalId: this.tdb.qrTerminal,
        additional: {
          purposeTransaction: 'BizPrint ' + order_id,
          callbackUrl,
        },
      }, { headers: { Authorization: 'Bearer ' + qrToken } })

      const data = res.data?.data || {}
      if (data.qrImage || data.invoiceNo) {
        const invoice = await this.paymentRepo.save(this.paymentRepo.create({
          order_id,
          customer_id: '',
          amount,
          provider: 'tdb_qr',
          status: 'pending',
          invoice_code: data.invoiceNo,
          qr_image: data.qrImage,
        }))
        await this.autoCreateInvoice(order_id, amount, 'qr', data.invoiceNo);

        return {
          method: 'qr',
          payment_id: (invoice as Payment).id,
          invoice_code: data.invoiceNo,
          invoiceNo: data.invoiceNo,
          qrImage: data.qrImage,
          expiresAt: data.expireTime,
          amount,
          status: 'pending',
        }
      }
    } catch (e) {
      this.logger.warn(`TDB QR unavailable, falling back to bank transfer: ${(e as any).message}`)
    }

    // Fallback: QR service байхгүй бол банк шилжүүлгийн мэдээлэл буцаана
    const refCode = `BP-${Date.now().toString(36).toUpperCase()}`
    const fallbackPayment = await this.paymentRepo.save(this.paymentRepo.create({
      order_id,
      customer_id: '',
      amount,
      provider: 'bank',
      status: 'pending',
      invoice_code: refCode,
    }))
    await this.autoCreateInvoice(order_id, amount, 'bank', refCode);
    return {
      method: 'bank_fallback',
      payment_id: fallbackPayment.id,
      invoice_code: refCode,
      accountName: this.tdb.accountName,
      iban: this.tdb.iban,
      accountNumber: this.tdb.account,
      bank: 'Худалдаа Хөгжлийн Банк (TDB)',
      description: `BizPrint ${refCode}`,
      amount,
    }
  }

  // ─── Auto-create ISSUED invoice when payment is created ─
  private async autoCreateInvoice(order_id: string, amount: number, paymentMethod: string, invoiceCode: string) {
    try {
      const order = await this.orderRepo.findOne({ where: { id: order_id } });
      if (!order) return;
      // Check if invoice already exists
      const existing = await this.invoiceRepo.findOne({
        where: { order_id, type: InvoiceType.CUSTOMER_INVOICE },
      });
      if (existing) return;

      const invoiceNumber = `INV-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}-${Math.random().toString(36).slice(2, 8).toUpperCase()}`;
      const totalAmount = Number(amount) || Number(order.total_price) || 0;
      const taxAmount = Math.round(totalAmount / 11);
      const subtotal = totalAmount - taxAmount;

      await this.invoiceRepo.save(this.invoiceRepo.create({
        order_id,
        invoice_number: invoiceNumber,
        customer_id: order.customer_id || '',
        type: InvoiceType.CUSTOMER_INVOICE,
        subtotal,
        tax_amount: taxAmount,
        total_amount: totalAmount,
        status: InvoiceStatus.ISSUED,
        issued_at: new Date(),
        due_date: new Date(Date.now() + 3 * 24 * 3600000),
        metadata: {
          payment_method: paymentMethod,
          invoice_code: invoiceCode,
          product_name: order.product_name,
          quantity: order.quantity,
        },
      }));
    } catch (e) {
      console.log('Auto-create invoice note:', (e as any).message);
    }
  }

  // ─── STATUS ────────────────────────────────────────────
  async checkTdbStatus(invoiceNo: string) {
    const qrToken = await this.fetchQrToken()
    const res = await axios.get(`${this.tdb.qrBase}/api/v1/invoice/${encodeURIComponent(invoiceNo)}`, {
      headers: { Authorization: 'Bearer ' + qrToken },
    })
    const status = res.data?.data?.status
    if (status === 1 || status === 'PAID') {
      await this.confirmPayment(invoiceNo)
    }
    return { invoiceNo, status }
  }

  // ─── CALLBACK ──────────────────────────────────────────
  // SECURITY: TDB callback bodies are unsigned and untrusted. Never confirm
  // a payment from the callback body alone — re-query TDB's own invoice
  // status endpoint (checkTdbStatus), which only confirms when the gateway
  // itself reports PAID. Mirrors the QPay callback hardening.
  async handleTdbCallback(body: any) {
    const invoiceNo = body?.invoiceNo || body?.invoice_code || body?.invoiceCode
    if (!invoiceNo) {
      return { success: false, msg: 'invoice_code missing' }
    }
    try {
      const result = await this.checkTdbStatus(invoiceNo)
      return { success: true, ...result }
    } catch (e: any) {
      this.logger.warn(`TDB callback status re-check failed for ${invoiceNo}: ${e?.message}`)
      return { success: false, msg: 'status_check_failed' }
    }
  }

  // ─── CONFIRM ───────────────────────────────────────────
  async confirmPayment(invoice_code: string) {
    const payment = await this.paymentRepo.findOne({ where: { invoice_code } })
    if (!payment) throw new NotFoundException('Payment not found')
    // Idempotent: repeated status polls / callbacks must not re-run side
    // effects (notifications, emails, ORDER_PAID events).
    if (payment.status === 'paid') {
      return { success: true, invoice_code, status: 'paid', alreadyPaid: true }
    }

    payment.status = 'paid'
    payment.paid_at = new Date()
    await this.paymentRepo.save(payment)

    const order = await this.orderRepo.findOne({ where: { id: payment.order_id } })
    if (order) {
      // Төлбөр баталгаажсан → PENDING_FILE (файл/дизайн хүлээх)
      order.status = OrderStatus.PENDING_FILE
      order.payment_status = 'paid'
      await this.orderRepo.save(order)

      // Хэрэглэгчид файл илгээх сануулга
      if (order.customer_id) {
        await this.notificationService.create({
          user_id: order.customer_id,
          type: 'order',
          title: '📤 Файл илгээх эсвэл загвар захиалах',
          message: `Захиалга #${order.id.slice(-8).toUpperCase()} — төлбөр баталгаажлаа. Файлаа илгээнэ үү эсвэл загвар хийлгэх хүсэлт илгээнэ үү.`,
          data: { order_id: order.id, action: 'pending_file' },
        }).catch(e => this.logger.warn(`Pending-file notification failed for ${order.id}: ${e.message}`))
      }

      if (order.customer_email) {
        this.mailService.sendOrderConfirmation({
          to: order.customer_email,
          name: order.customer_name || 'Хэрэглэгч',
          orderId: order.id,
          productName: order.product_name || 'Захиалга',
          quantity: order.quantity,
          total: Number(order.total_price),
          invoiceCode: invoice_code,
        }).catch(e => this.logger.warn(`Order confirmation email failed for ${order.id}: ${e.message}`))
      }

      // notify admin
      await this.notificationService.create({
        user_id: 'admin',
        type: 'payment',
        title: `Төлбөр батлагдлаа: ${order.id}`,
        message: `${payment.amount}₮`,
        data: { order_id: order.id, payment_id: payment.id },
      })

      // Emit ORDER_PAID for real-time broadcast
      this.eventBus.emit(BizEvent.ORDER_PAID, {
        orderId: order.id,
        userId: (order as any).customer_id || (order as any).user_id,
        amount: payment.amount,
        status: 'paid',
      })
    }

    // ── Generate Invoice ──
    if (order) {
      await this.generateInvoice(order, payment);
    }

    return { success: true, invoice_code, status: 'paid' }
  }

  // ─── INVOICE GENERATION ──────────────────────────────────
  private async generateInvoice(order: Order, payment: Payment) {
    // Check if invoice already exists (created at payment initiation as ISSUED)
    const existing = await this.invoiceRepo.findOne({
      where: { order_id: order.id, type: InvoiceType.CUSTOMER_INVOICE },
    });
    if (existing) {
      existing.status = InvoiceStatus.PAID;
      existing.paid_at = new Date();
      existing.metadata = { ...existing.metadata, payment_id: payment.id, payment_method: payment.provider };
      return this.invoiceRepo.save(existing);
    }

    const invoiceNumber = `INV-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}-${Math.random().toString(36).slice(2, 8).toUpperCase()}`;
    const totalAmount = Number(payment.amount) || Number(order.total_price) || 0;
    const taxAmount = Math.round(totalAmount / 11); // 10% VAT already included
    const subtotal = totalAmount - taxAmount;

    const invoice = this.invoiceRepo.create({
      order_id: order.id,
      invoice_number: invoiceNumber,
      customer_id: order.customer_id || '',
      type: InvoiceType.CUSTOMER_INVOICE,
      subtotal,
      tax_amount: taxAmount,
      total_amount: totalAmount,
      status: InvoiceStatus.PAID,
      issued_at: new Date(),
      paid_at: new Date(),
      due_date: new Date(),
      metadata: {
        payment_id: payment.id,
        payment_method: payment.provider,
        invoice_code: payment.invoice_code,
        product_name: order.product_name,
        quantity: order.quantity,
      },
    });
    return this.invoiceRepo.save(invoice);
  }

  // ─── INVOICE QUERIES ─────────────────────────────────────
  async getInvoicesByCustomer(customerId: string) {
    return this.invoiceRepo.find({
      where: { customer_id: customerId, type: InvoiceType.CUSTOMER_INVOICE },
      relations: ['order'],
      order: { created_at: 'DESC' },
    });
  }

  async getInvoiceById(id: string) {
    const invoice = await this.invoiceRepo.findOne({
      where: { id },
      relations: ['order'],
    });
    if (!invoice) throw new NotFoundException('Нэхэмжлэх олдсонгүй');
    return invoice;
  }

  async getInvoiceByNumber(invoiceNumber: string) {
    const invoice = await this.invoiceRepo.findOne({
      where: { invoice_number: invoiceNumber },
      relations: ['order'],
    });
    if (!invoice) throw new NotFoundException('Нэхэмжлэх олдсонгүй');
    return invoice;
  }

  // ─── Helpers for legacy checkPayment ───────────────────
  async checkPayment(payment_id: string) {
    const payment = await this.paymentRepo.findOne({ where: { id: payment_id } })
    if (!payment) throw new NotFoundException('Payment not found')
    return {
      payment_id: payment.id,
      invoice_code: payment.invoice_code,
      amount: payment.amount,
      status: payment.status,
      provider: payment.provider,
    }
  }

  async getHistory(userId: string) {
    const payments = await this.paymentRepo.find({
      where: { customer_id: userId },
      order: { created_at: 'DESC' },
      take: 50,
    });
    return payments.map(p => ({
      id: p.id,
      orderId: p.order_id,
      orderNumber: p.order_id,
      amount: p.amount,
      currency: 'MNT',
      status: p.status,
      escrowStatus: p.status,
      paidAt: p.paid_at ?? p.created_at,
      heldAt: null,
      releasedAt: p.updated_at,
      createdAt: p.created_at,
    }));
  }
}
