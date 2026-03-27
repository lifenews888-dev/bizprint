import { Injectable, NotFoundException } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository } from 'typeorm'
import axios from 'axios'
import { Payment } from './entities/payment.entity'
import { Order, OrderStatus } from '../orders/entities/order.entity'
import { MailService } from '../mail/mail.service'
import { ProductionJobsService } from '../production-jobs/production-jobs.service'
import { NotificationService } from '../notifications/notification.service'
import { EventBusService } from '../events/event-bus.service'
import { BizEvent } from '../events/event-types'

const TDB_QR_BASE = process.env.TDB_QR_BASE || 'https://qrservice.tdbmlabs.mn'
const TDB_QR_USER = process.env.TDB_QR_USER || 'tdbm'
const TDB_QR_PASS = process.env.TDB_QR_PASS || 'tdbm'
const TDB_QR_TERMINAL = process.env.TDB_QR_TERMINAL || '91200026'
const TDB_OAUTH_URL = process.env.TDB_OAUTH_URL || 'https://api-sandbox.tdbmlabs.mn:8443/oauth2/token'
const TDB_CLIENT_ID = process.env.TDB_CLIENT_ID || ''
const TDB_CLIENT_SECRET = process.env.TDB_CLIENT_SECRET || ''
const TDB_BIZPRINT_IBAN = process.env.TDB_BIZPRINT_IBAN || ''
const TDB_BIZPRINT_ACCOUNT = process.env.TDB_BIZPRINT_ACCOUNT || ''
const TDB_BIZPRINT_ACCOUNT_NAME = process.env.TDB_BIZPRINT_ACCOUNT_NAME || 'ЮүЭмБи Верто ХХК'

@Injectable()
export class PaymentService {
  private cachedToken: { access_token: string; expires_at: number } | null = null

  constructor(
    @InjectRepository(Payment)
    private paymentRepo: Repository<Payment>,
    @InjectRepository(Order)
    private orderRepo: Repository<Order>,
    private mailService: MailService,
    private productionJobsService: ProductionJobsService,
    private notificationService: NotificationService,
    private readonly eventBus: EventBusService,
  ) {}

  // ─── Helpers ───────────────────────────────────────────
  private async fetchOAuthToken(): Promise<string> {
    const now = Date.now()
    if (this.cachedToken && this.cachedToken.expires_at > now + 60_000) return this.cachedToken.access_token
    const body = new URLSearchParams({
      grant_type: 'client_credentials',
      client_id: TDB_CLIENT_ID,
      client_secret: TDB_CLIENT_SECRET,
    })
    const res = await axios.post(TDB_OAUTH_URL, body.toString(), {
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    })
    const token = res.data?.access_token
    const expires_in = res.data?.expires_in || 3600
    this.cachedToken = { access_token: token, expires_at: now + expires_in * 1000 }
    return token
  }

  private async fetchQrToken(): Promise<string> {
    const res = await axios.post(`${TDB_QR_BASE}/api/v1/login`, {
      username: TDB_QR_USER,
      password: TDB_QR_PASS,
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
      return {
        method,
        payment_id: payment.id,
        invoice_code: refCode,
        accountName: TDB_BIZPRINT_ACCOUNT_NAME,
        iban: TDB_BIZPRINT_IBAN,
        accountNumber: TDB_BIZPRINT_ACCOUNT,
        bank: 'Худалдаа Хөгжлийн Банк (TDB)',
        bankCode: 4,
        description: `BizPrint ${refCode}`,
        amount,
        currency: 'MNT',
        status: 'pending',
      }
    }

    if (method === 'cash') {
      const payment = await this.paymentRepo.save(this.paymentRepo.create({
        order_id,
        customer_id: '',
        amount,
        provider: 'cash',
        status: 'pending',
        invoice_code: `CASH-${Date.now()}`,
      }))
      return { method, payment_id: payment.id, status: 'pending' }
    }

    // Try TDB QR service
    try {
      const qrToken = await this.fetchQrToken()
      const callbackUrl = process.env.PAYMENT_CALLBACK_URL || 'http://localhost:4000/payment/callback'
      const res = await axios.post(`${TDB_QR_BASE}/api/v1/invoice`, {
        qrType: 'dynamic',
        transactionType: 1,
        qrGenerator: 'TDBM',
        accountNumber: TDB_BIZPRINT_ACCOUNT,
        amount,
        bankCode: 'TDBMNUB',
        curCode: 'MNT',
        terminalId: TDB_QR_TERMINAL,
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
      console.log('TDB QR service error, falling back to bank transfer:', (e as any).message)
    }

    // Fallback: QR service байхгüй бол банк шилжүүлгийн мэдээлэл буцаана
    const refCode = `BP-${Date.now().toString(36).toUpperCase()}`
    const fallbackPayment = await this.paymentRepo.save(this.paymentRepo.create({
      order_id,
      customer_id: '',
      amount,
      provider: 'bank',
      status: 'pending',
      invoice_code: refCode,
    }))
    return {
      method: 'bank_fallback',
      payment_id: fallbackPayment.id,
      invoice_code: refCode,
      accountName: TDB_BIZPRINT_ACCOUNT_NAME,
      iban: TDB_BIZPRINT_IBAN,
      accountNumber: TDB_BIZPRINT_ACCOUNT,
      bank: 'Худалдаа Хөгжлийн Банк (TDB)',
      description: `BizPrint ${refCode}`,
      amount,
    }
  }

  // ─── STATUS ────────────────────────────────────────────
  async checkTdbStatus(invoiceNo: string) {
    const qrToken = await this.fetchQrToken()
    const res = await axios.get(`${TDB_QR_BASE}/api/v1/invoice/${invoiceNo}`, {
      headers: { Authorization: 'Bearer ' + qrToken },
    })
    const status = res.data?.data?.status
    if (status === 1 || status === 'PAID') {
      await this.confirmPayment(invoiceNo)
    }
    return { invoiceNo, status }
  }

  // ─── CALLBACK ──────────────────────────────────────────
  async handleTdbCallback(body: any) {
    const invoiceNo = body?.invoiceNo || body?.invoice_code || body?.invoiceCode
    if (invoiceNo) {
      return this.confirmPayment(invoiceNo)
    }
    return { success: false, msg: 'invoice_code missing' }
  }

  // ─── CONFIRM ───────────────────────────────────────────
  async confirmPayment(invoice_code: string) {
    const payment = await this.paymentRepo.findOne({ where: { invoice_code } })
    if (!payment) throw new NotFoundException('Payment not found')

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
        }).catch(() => {})
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
        }).catch(() => {})
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

    return { success: true, invoice_code, status: 'paid' }
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
}
