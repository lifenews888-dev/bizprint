import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { Order } from '../orders/entities/order.entity';
import { Payment } from '../payment/entities/payment.entity';
import { ProductionJob } from '../production/entities/production-job.entity';
import { Wallet } from '../wallet/wallet.entity';
import { Quotation } from '../quote/entities/quotation.entity';
import { Invoice } from '../payment/entities/invoice.entity';

@Injectable()
export class CustomerDashboardService {
  constructor(
    @InjectRepository(Order) private orderRepo: Repository<Order>,
    @InjectRepository(Payment) private paymentRepo: Repository<Payment>,
    @InjectRepository(ProductionJob) private jobRepo: Repository<ProductionJob>,
    @InjectRepository(Wallet) private walletRepo: Repository<Wallet>,
    @InjectRepository(Quotation) private quoteRepo: Repository<Quotation>,
    @InjectRepository(Invoice) private invoiceRepo: Repository<Invoice>,
  ) {}

  async getSummary(customerId: string) {
    const [orders, wallet, quotes, invoices] = await Promise.all([
      this.orderRepo.find({ where: { customer_id: customerId }, order: { created_at: 'DESC' } }),
      this.walletRepo.findOne({ where: { user_id: customerId } }),
      this.quoteRepo.find({ where: { user_id: customerId }, order: { created_at: 'DESC' }, take: 10 }),
      this.invoiceRepo.find({ where: { customer_id: customerId }, order: { created_at: 'DESC' }, take: 10 }),
    ]);

    const activeStatuses = ['draft', 'quotation_sent', 'confirmed', 'pending_file', 'file_review', 'in_production', 'finishing'];
    const activeOrders = orders.filter(o => activeStatuses.includes(o.status));
    const completedOrders = orders.filter(o => o.status === 'completed' || o.status === 'delivered');
    const totalSpent = orders.reduce((sum, o) => sum + Number(o.total_price || 0), 0);
    const pendingQuotes = quotes.filter(q => q.status === 'sent' || q.status === 'draft');

    // AI-style suggestions based on order patterns
    const suggestions: { icon: string; title: string; description: string; action?: string }[] = [];

    if (orders.length === 0) {
      suggestions.push({ icon: '🎯', title: 'Эхний захиалгаа өгөөрэй', description: 'Нэрийн хуудас, флаер, постер зэрэг хэвлэл захиалах боломжтой', action: '/dashboard/customer/new-order' });
    }
    if (activeOrders.some(o => o.status === 'pending_file')) {
      suggestions.push({ icon: '📁', title: 'Файл оруулах шаардлагатай', description: 'Хэвлэх файлаа оруулж, захиалгаа үргэлжлүүлнэ үү', action: '/dashboard/customer/orders' });
    }
    if (pendingQuotes.length > 0) {
      suggestions.push({ icon: '💰', title: `${pendingQuotes.length} үнийн санал хүлээж байна`, description: 'Үнийн саналаа баталгаажуулж, захиалга болгоно уу', action: '/dashboard/customer/quotes' });
    }
    if (completedOrders.length >= 5 && !wallet) {
      suggestions.push({ icon: '💎', title: 'Loyalty хөтөлбөрт нэгдэнэ үү', description: 'Давтан захиалга хийх тусам хөнгөлөлт нэмэгднэ', action: '/dashboard/customer/loyalty' });
    }
    if (suggestions.length === 0) {
      suggestions.push({ icon: '✨', title: 'Бүх зүйл хэвийн', description: 'Шинэ захиалга өгөх эсвэл marketplace-аас сонгоно уу' });
    }

    return {
      kpis: {
        total_orders: orders.length,
        active_orders: activeOrders.length,
        pending_quotes: pendingQuotes.length,
        total_spent: totalSpent,
        completed: completedOrders.length,
      },
      wallet: {
        balance: Number(wallet?.balance || 0),
        total_earned: Number(wallet?.total_earned || 0),
      },
      recent_orders: orders.slice(0, 5).map(o => ({
        id: o.id,
        product_name: o.product_name,
        quantity: o.quantity,
        total_price: Number(o.total_price || 0),
        status: o.status,
        created_at: o.created_at,
      })),
      active_orders: activeOrders.slice(0, 3).map(o => ({
        id: o.id,
        product_name: o.product_name,
        status: o.status,
        created_at: o.created_at,
        total_price: Number(o.total_price || 0),
      })),
      quotes: pendingQuotes.slice(0, 5).map(q => ({
        id: q.id,
        quote_number: q.quote_number,
        product_name: q.product_name,
        total_price: Number(q.total_price || 0),
        status: q.status,
        created_at: q.created_at,
      })),
      suggestions,
    };
  }

  async getOrders(customerId: string) {
    return this.orderRepo.find({
      where: { customer_id: customerId },
      order: { created_at: 'DESC' },
    });
  }

  async getPayments(customerId: string) {
    return this.invoiceRepo.find({
      where: { customer_id: customerId },
      order: { created_at: 'DESC' },
    });
  }

  async getProductionStatus(customerId: string) {
    const orders = await this.orderRepo.find({
      where: { customer_id: customerId, status: In(['in_production', 'finishing']) },
    });
    return orders;
  }
}
