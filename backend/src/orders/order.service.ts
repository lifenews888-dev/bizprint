import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Order, OrderStatus } from './entities/order.entity';
import { AuditTrail } from '../audit-trail/audit-trail.entity';
import { MailService } from '../mail/mail.service';

// Workflow stage дараалал (index-ээр буцаана)
const WORKFLOW_STAGES = [
  'pending',
  'designing',
  'prepress',
  'printing',
  'finishing',
  'qc',
  'ready',
  'delivering',
  'completed',
];

@Injectable()
export class OrdersService {
  constructor(
    @InjectRepository(Order)
    private ordersRepo: Repository<Order>,
    @InjectRepository(AuditTrail)
    private auditRepo: Repository<AuditTrail>,
    private mailService: MailService,
  ) {}

  async createOrder(data: any) {
    const order = this.ordersRepo.create({ ...data, status: OrderStatus.PENDING });
    const saved: Order = await this.ordersRepo.save(order as any);
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
        });
      } catch (e) {
        console.log('Email error:', e.message);
      }
    }
    return saved;
  }

  async createFromQuote(quoteId: string, userId: string, paymentMethod?: string) {
    const quoteRepo = this.ordersRepo.manager.connection.getRepository('QuoteV2');
    const quote = await quoteRepo.findOne({ where: { id: quoteId } });
    if (!quote) throw new NotFoundException('Quote олдсонгүй');

    const order = this.ordersRepo.create({
      customer_id: userId,
      quote_id: quoteId,
      quote_number: (quote as any).quote_number,
      customer_name: (quote as any).customer_name,
      customer_phone: (quote as any).customer_phone,
      customer_email: (quote as any).customer_email,
      product_name: (quote as any).product_name,
      quantity: (quote as any).quantity,
      unit_price: (quote as any).unit_price,
      total_price: (quote as any).total_price,
      paper_gsm: (quote as any).paper_gsm,
      color_mode: (quote as any).color_mode,
      sides: (quote as any).sides,
      finishing: (quote as any).finishing,
      payment_method: paymentMethod || 'pending',
      payment_status: 'pending',
      status: OrderStatus.PENDING,
      notes: `Quote ${(quote as any).quote_number}-аас үүсгэгдсэн`,
    });
    const saved: Order = await this.ordersRepo.save(order as any);

    await quoteRepo.update(quoteId, { status: 'ordered' });

    if ((quote as any).customer_email) {
      try {
        await this.mailService.sendOrderConfirmation({
          to: (quote as any).customer_email,
          name: (quote as any).customer_name || 'Хэрэглэгч',
          orderId: saved.id,
          productName: (quote as any).product_name || 'Хэвлэл',
          quantity: (quote as any).quantity,
          total: (quote as any).total_price,
          invoiceCode: saved.id.slice(0, 8).toUpperCase(),
        });
      } catch (e) {
        console.log('Email error:', e.message);
      }
    }
    return saved;
  }

  async updateStatus(id: string, status: string) {
    await this.ordersRepo.update(id, { status });
    return this.getOrderById(id);
  }

  async updateOrder(id: string, data: any) {
    const update: any = {};
    if (data.status) update.status = data.status;
    if (data.assigned_to !== undefined) update.assigned_to = data.assigned_to;
    if (data.deadline !== undefined) update.deadline = data.deadline;
    await this.ordersRepo.update(id, update);
    return this.getOrderById(id);
  }

  /**
   * QC fail буцаах — одоогийн stage-аас өмнөх stage руу буцаана
   * @param id - Order ID
   * @param reason - Буцаах шалтгаан
   * @param targetStage - Аль stage руу буцаах (optional, default = өмнөх stage)
   * @param user - Хэн буцаасан
   */
  async revertStatus(
    id: string,
    reason: string,
    user: string,
    targetStage?: string,
  ) {
    const order = await this.getOrderById(id);
    const currentStatus = order.status;

    // Одоогийн stage-ийн index олох
    const currentIndex = WORKFLOW_STAGES.indexOf(currentStatus);

    // completed, cancelled, pending бол буцаах боломжгүй
    if (currentIndex <= 0) {
      throw new BadRequestException(
        `"${currentStatus}" төлөвөөс буцаах боломжгүй`,
      );
    }
    if (currentStatus === 'completed' || currentStatus === 'cancelled') {
      throw new BadRequestException(
        `"${currentStatus}" төлөвөөс буцаах боломжгүй`,
      );
    }

    let revertToIndex: number;

    if (targetStage) {
      // Тодорхой stage руу буцаах
      revertToIndex = WORKFLOW_STAGES.indexOf(targetStage);
      if (revertToIndex < 0 || revertToIndex >= currentIndex) {
        throw new BadRequestException(
          `"${targetStage}" руу буцаах боломжгүй (одоогийн: ${currentStatus})`,
        );
      }
    } else {
      // Default: өмнөх stage руу
      revertToIndex = currentIndex - 1;
    }

    const revertTo = WORKFLOW_STAGES[revertToIndex];

    // Статус шинэчлэх
    await this.ordersRepo.update(id, { status: revertTo });

    // Audit trail бичих
    const auditEntry = this.auditRepo.create({
      order_id: id,
      user: user,
      action: `БУЦААГДСАН: "${currentStatus}" → "${revertTo}" | Шалтгаан: ${reason}`,
    });
    await this.auditRepo.save(auditEntry);

    return this.getOrderById(id);
  }

  async getOrders() {
    return this.ordersRepo.find({ order: { created_at: 'DESC' } });
  }

  async getOrdersByCustomer(customer_id: string) {
    return this.ordersRepo.find({
      where: { customer_id },
      order: { created_at: 'DESC' },
    });
  }

  async getOrderById(id: string) {
    const order = await this.ordersRepo.findOne({ where: { id } });
    if (!order) throw new NotFoundException('Захиалга олдсонгүй');
    return order;
  }

  async cancelOrder(id: string) {
    const order = await this.getOrderById(id);
    order.status = OrderStatus.CANCELLED;
    return this.ordersRepo.save(order);
  }
}
