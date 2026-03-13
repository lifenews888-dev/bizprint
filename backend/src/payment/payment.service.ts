import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Payment } from './entities/payment.entity';

@Injectable()
export class PaymentService {
  constructor(
    @InjectRepository(Payment)
    private paymentRepo: Repository<Payment>,
  ) {}

  async createPayment(order_id: string, amount: number, customer_id: string) {
    const invoice_code = `BIZ-${Date.now()}`;

    const payment = this.paymentRepo.create({
      order_id,
      customer_id,
      amount,
      invoice_code,
      status: 'pending',
      provider: 'qpay',
    });

    const saved = await this.paymentRepo.save(payment);

    const qpay_url = `https://qpay.mn/payment/qr/${invoice_code}`;
    const qr_text = `QPay:${invoice_code}:${amount}`;

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
    };
  }

  async checkPayment(payment_id: string) {
    const payment = await this.paymentRepo.findOne({
      where: { id: payment_id },
    });

    if (!payment) throw new NotFoundException('Payment not found');

    return {
      payment_id: payment.id,
      invoice_code: payment.invoice_code,
      amount: payment.amount,
      status: payment.status,
      provider: payment.provider,
    };
  }

  async confirmPayment(invoice_code: string) {
    const payment = await this.paymentRepo.findOne({
      where: { invoice_code },
    });

    if (!payment) throw new NotFoundException('Payment not found');

    payment.status = 'paid';
    payment.paid_at = new Date();
    await this.paymentRepo.save(payment);

    return {
      success: true,
      payment_id: payment.id,
      invoice_code,
      status: 'paid',
      message: 'Payment confirmed successfully!',
    };
  }

  async getPaymentsByCustomer(customer_id: string) {
    return this.paymentRepo.find({
      where: { customer_id },
      order: { created_at: 'DESC' },
    });
  }
}