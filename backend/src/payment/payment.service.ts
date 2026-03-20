import { Injectable, NotFoundException } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository } from 'typeorm'
import axios from 'axios'
import { Payment } from './entities/payment.entity'
import { Order } from '../orders/entities/order.entity'
import { MailService } from '../mail/mail.service'
import { ProductionJobsService } from '../production-jobs/production-jobs.service'
import { NotificationService } from '../notifications/notification.service'

const TDB_QR_BASE = process.env.TDB_QR_BASE || 'https://qrservice.tdbmlabs.mn'
const TDB_QR_USER = process.env.TDB_QR_USER || 'tdbm'
const TDB_QR_PASS = process.env.TDB_QR_PASS || 'tdbm'
const TDB_QR_TERMINAL = process.env.TDB_QR_TERMINAL || '91200026'
const TDB_OAUTH_URL = process.env.TDB_OAUTH_URL || 'https://api-sandbox.tdbmlabs.mn:8443/oauth2/token'
const TDB_CLIENT_ID = process.env.TDB_CLIENT_ID || '6c790056-e40e-48b3-81d8-223b10be27ef'
const TDB_CLIENT_SECRET = process.env.TDB_CLIENT_SECRET || '2b$10jNzbLy62RHB5m1g6LEF3nemjVyDAHWYVElETenFGsQGZFlN2XKKG6'

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
      return {
        method,
        accountName: 'BizPrint LLC',
        accountNumber: '0000000000',
        bank: 'TDB',
        description: `Order ${order_id}`,
        amount,
        currency: 'MNT',
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

    const qrToken = await this.fetchQrToken()
    const res = await axios.post(`${TDB_QR_BASE}/api/v1/invoice`, {
      qrType: 'dynamic',
      transactionType: 1,
      qrGenerator: 'TDBM',
      accountNumber: ' ',
      amount,
      bankCode: 'TDBMNUB',
      curCode: 'MNT',
      terminalId: TDB_QR_TERMINAL,
      additional: {
        purposeTransaction: 'BizPrint ' + order_id,
        callbackUrl: 'http://localhost:4000/payment/callback',
      },
    }, { headers: { Authorization: 'Bearer ' + qrToken } })

    const data = res.data?.data || {}
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
      invoiceNo: data.invoiceNo,
      qrImage: data.qrImage,
      expiresAt: data.expireTime,
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
      order.status = 'paid'
      order.payment_status = 'paid'
      await this.orderRepo.save(order)

      // auto production job
      try {
        await this.productionJobsService.createFromOrder(payment.order_id as any)
        order.status = 'in_production'
        await this.orderRepo.save(order)
      } catch (e) {
        console.log('Production job creation error:', (e as any).message)
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
