import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Order, OrderStatus } from './entities/order.entity';
import { MailService } from '../mail/mail.service';

@Injectable()
export class OrdersService {
  constructor(
    @InjectRepository(Order)
    private ordersRepo: Repository<Order>,
    private mailService: MailService,
  ) {}

  async createOrder(data: any) {
    const order = this.ordersRepo.create({ ...data, status: OrderStatus.PENDING })
    const saved: Order = await this.ordersRepo.save(order as any)
    if (data.customer_email) {
      try {
        await this.mailService.sendOrderConfirmation({
          to: data.customer_email,
          name: data.customer_name || 'Хэрэглэгч',
          orderId: saved.id,
          productName: data.product_name || 'Бүтээгдэхүүн',
          quantity: saved.quantity,
          total: saved.total_price,
          invoiceCode: data.invoice_code || '',
        })
      } catch (e) { console.log('Email error:', e.message) }
    }
    return saved
  }

  async createFromQuote(quoteId: string, userId: string, paymentMethod?: string) {
    const { DataSource } = require('typeorm')
    const quoteRepo = this.ordersRepo.manager.connection.getRepository('QuoteV2')
    const quote = await quoteRepo.findOne({ where: { id: quoteId } })
    if (!quote) throw new NotFoundException('Quote олдсонгүй')

    const order = this.ordersRepo.create({
      customer_id: userId,
      quote_id: quoteId,
      quote_number: quote.quote_number,
      customer_name: quote.customer_name,
      customer_phone: quote.customer_phone,
      customer_email: quote.customer_email,
      product_name: quote.product_name,
      quantity: quote.quantity,
      unit_price: quote.unit_price,
      total_price: quote.total_price,
      paper_gsm: quote.paper_gsm,
      color_mode: quote.color_mode,
      sides: quote.sides,
      finishing: quote.finishing,
      payment_method: paymentMethod || 'pending',
      payment_status: 'pending',
      status: OrderStatus.PENDING,
      notes: `Quote ${quote.quote_number}-аас үүсгэгдсэн`,
    })
    const saved: Order = await this.ordersRepo.save(order as any)

    // Quote-ийн статусыг ordered болгох
    await quoteRepo.update(quoteId, { status: 'ordered' })

    // Баталгаажуулах имэйл
    if (quote.customer_email) {
      try {
        await this.mailService.sendOrderConfirmation({
          to: quote.customer_email,
          name: quote.customer_name || 'Хэрэглэгч',
          orderId: saved.id,
          productName: quote.product_name || 'Хэвлэл',
          quantity: quote.quantity,
          total: quote.total_price,
          invoiceCode: saved.id.slice(0, 8).toUpperCase(),
        })
      } catch (e) { console.log('Email error:', e.message) }
    }
    return saved
  }

  async updateStatus(id: string, status: string) {
    await this.ordersRepo.update(id, { status })
    return this.getOrderById(id)
  }

  async getOrders() {
    return this.ordersRepo.find({ order: { created_at: 'DESC' } })
  }

  async getOrdersByCustomer(customer_id: string) {
    return this.ordersRepo.find({ where: { customer_id }, order: { created_at: 'DESC' } })
  }

  async getOrderById(id: string) {
    const order = await this.ordersRepo.findOne({ where: { id } })
    if (!order) throw new NotFoundException('Захиалга олдсонгүй')
    return order
  }

  async cancelOrder(id: string) {
    const order = await this.getOrderById(id)
    order.status = OrderStatus.CANCELLED
    return this.ordersRepo.save(order)
  }
}