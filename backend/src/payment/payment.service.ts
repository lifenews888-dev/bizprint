import { Injectable, NotFoundException } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository } from 'typeorm'
import { Payment } from './entities/payment.entity'
import { Order } from '../orders/entities/order.entity'
import { MailService } from '../mail/mail.service'
import { ProductionJobsService } from '../production-jobs/production-jobs.service'

@Injectable()
export class PaymentService {
  constructor(
    @InjectRepository(Payment)
    private paymentRepo: Repository<Payment>,
    @InjectRepository(Order)
    private orderRepo: Repository<Order>,
    private mailService: MailService,
    private productionJobsService: ProductionJobsService,
  ) {}

  async createPayment(order_id: string, amount: number, customer_id: string) {
    const invoice_code = `BIZ-${Date.now()}`
    const payment = this.paymentRepo.create({
      order_id,
      customer_id,
      amount,
      invoice_code,
      status: 'pending',
      provider: 'qpay',
    })
    const saved = await this.paymentRepo.save(payment)
    const qpay_url = `https://qpay.mn/payment/qr/${invoice_code}`
    const qr_text = `QPay:${invoice_code}:${amount}`
    return {
      payment_id: saved.id,
      invoice_code,
      amount,
      currency: 'MNT',
      provider: 'qpay',
      status: 'pending',
      qpay_url,
      qr_text,
      expires_at: new Date(Date.now() + 30 * 60 * 1000).toISOString(),
      message: 'QPay QR code created. Please pay within 30 minutes.',
    }
  }

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

  async confirmPayment(invoice_code: string) {
    const payment = await this.paymentRepo.findOne({ where: { invoice_code } })
    if (!payment) throw new NotFoundException('Payment not found')

    // 1. Payment status -> paid
    payment.status = 'paid'
    payment.paid_at = new Date()
    await this.paymentRepo.save(payment)

    // 2. Order status -> paid
    const order = await this.orderRepo.findOne({
      where: { id: payment.order_id },
    })
    if (order) {
      order.status = 'paid'
      order.payment_status = 'paid'
      await this.orderRepo.save(order)

      // 3. Auto-create production job
      try {
        await this.productionJobsService.createFromOrder(payment.order_id as any)
        // 4. Order status -> in_production
        order.status = 'in_production'
        await this.orderRepo.save(order)
      } catch (e) {
        console.log('Production job creation error:', e.message)
      }

      // 5. Email confirmation
      const email = order.customer_email
      const name = order.customer_name || 'Khereglech'
      if (email) {
        this.mailService.sendOrderConfirmation({
          to: email,
          name,
          orderId: order.id,
          productName: order.product_name || 'Buteegedkheen',
          quantity: order.quantity,
          total: Number(order.total_price),
          invoiceCode: invoice_code,
        }).catch(() => {})
      }
    }

    return {
      success: true,
      payment_id: payment.id,
      invoice_code,
      order_id: payment.order_id,
      order_status: 'in_production',
      status: 'paid',
      message: 'Payment confirmed. Production job created automatically!',
    }
  }

  async getPaymentsByCustomer(customer_id: string) {
    return this.paymentRepo.find({
      where: { customer_id },
      order: { created_at: 'DESC' },
    })
  }
}
