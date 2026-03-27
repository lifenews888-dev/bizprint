import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Order } from '../orders/entities/order.entity';
import { OrderProfit } from '../orders/entities/order-profit.entity';

@Injectable()
export class ReportsService {
  constructor(
    @InjectRepository(Order) private orderRepo: Repository<Order>,
    @InjectRepository(OrderProfit) private profitRepo: Repository<OrderProfit>,
  ) {}

  /* ─── GET /reports/summary ─── */
  async getSummary(start: Date, end: Date, prevStart?: Date, prevEnd?: Date) {
    const current = await this.aggregatePeriod(start, end);
    const previous = prevStart && prevEnd
      ? await this.aggregatePeriod(prevStart, prevEnd)
      : null;

    // Quote → Paid conversion
    const quoteCount = await this.orderRepo.count({
      where: { created_at: this.between(start, end) } as any,
    });
    const paidCount = await this.orderRepo
      .createQueryBuilder('o')
      .where('o.created_at BETWEEN :s AND :e', { s: start, e: end })
      .andWhere("o.payment_status = 'paid'")
      .getCount();
    const conversionRate = quoteCount > 0 ? Math.round((paidCount / quoteCount) * 10000) / 100 : 0;

    return {
      ...current,
      conversion_rate: conversionRate,
      previous: previous ? { ...previous } : null,
    };
  }

  private async aggregatePeriod(start: Date, end: Date) {
    const raw = await this.profitRepo
      .createQueryBuilder('op')
      .select([
        'COUNT(*)::int as total_orders',
        'COALESCE(SUM(op.customer_price), 0)::decimal as total_revenue',
        'COALESCE(SUM(op.vendor_price), 0)::decimal as total_cost',
        'COALESCE(SUM(op.margin), 0)::decimal as total_margin',
        'COALESCE(SUM(op.bizprint_profit), 0)::decimal as total_profit',
        'COALESCE(SUM(op.sales_commission), 0)::decimal as total_commission',
        'COALESCE(SUM(op.delivery_cost), 0)::decimal as total_delivery_cost',
        'COALESCE(SUM(op.vat_amount), 0)::decimal as total_vat',
        'COALESCE(AVG(op.margin_rate), 0)::decimal as avg_margin_rate',
        'CASE WHEN COUNT(*) > 0 THEN (SUM(op.customer_price) / COUNT(*))::decimal ELSE 0 END as avg_order_value',
      ])
      .where('op.created_at BETWEEN :s AND :e', { s: start, e: end })
      .getRawOne();

    return {
      total_orders: Number(raw.total_orders) || 0,
      total_revenue: Math.round(Number(raw.total_revenue) || 0),
      total_cost: Math.round(Number(raw.total_cost) || 0),
      total_margin: Math.round(Number(raw.total_margin) || 0),
      total_profit: Math.round(Number(raw.total_profit) || 0),
      total_commission: Math.round(Number(raw.total_commission) || 0),
      total_delivery_cost: Math.round(Number(raw.total_delivery_cost) || 0),
      total_vat: Math.round(Number(raw.total_vat) || 0),
      avg_margin_rate: Math.round(Number(raw.avg_margin_rate) * 100) / 100 || 0,
      avg_order_value: Math.round(Number(raw.avg_order_value) || 0),
    };
  }

  /* ─── GET /reports/profit — time series ─── */
  async getProfitTimeSeries(start: Date, end: Date, groupBy: 'day' | 'week' | 'month' = 'day') {
    const trunc = groupBy === 'month' ? 'month' : groupBy === 'week' ? 'week' : 'day';
    const rows = await this.profitRepo
      .createQueryBuilder('op')
      .select([
        `date_trunc('${trunc}', op.created_at) as date`,
        'COALESCE(SUM(op.customer_price), 0)::decimal as revenue',
        'COALESCE(SUM(op.vendor_price), 0)::decimal as cost',
        'COALESCE(SUM(op.bizprint_profit), 0)::decimal as profit',
        'COUNT(*)::int as orders',
      ])
      .where('op.created_at BETWEEN :s AND :e', { s: start, e: end })
      .groupBy(`date_trunc('${trunc}', op.created_at)`)
      .orderBy('date', 'ASC')
      .getRawMany();

    return rows.map(r => ({
      date: r.date,
      revenue: Math.round(Number(r.revenue) || 0),
      cost: Math.round(Number(r.cost) || 0),
      profit: Math.round(Number(r.profit) || 0),
      orders: Number(r.orders) || 0,
    }));
  }

  /* ─── GET /reports/vendors ─── */
  async getVendorReport(start: Date, end: Date) {
    const rows = await this.profitRepo
      .createQueryBuilder('op')
      .innerJoin('orders', 'o', 'o.id = op.order_id')
      .leftJoin('vendors', 'v', 'v.id = o.factory_id')
      .select([
        'o.factory_id as vendor_id',
        "COALESCE(v.company_name, 'Тодорхойгүй') as vendor_name",
        'COUNT(*)::int as order_count',
        'COALESCE(SUM(op.customer_price), 0)::decimal as revenue',
        'COALESCE(SUM(op.vendor_price), 0)::decimal as cost',
        'COALESCE(SUM(op.margin), 0)::decimal as margin',
        'COALESCE(SUM(op.bizprint_profit), 0)::decimal as profit',
        'COALESCE(SUM(op.sales_commission), 0)::decimal as commission',
        'COALESCE(AVG(op.margin_rate), 0)::decimal as avg_margin_rate',
      ])
      .where('op.created_at BETWEEN :s AND :e', { s: start, e: end })
      .groupBy('o.factory_id')
      .addGroupBy('v.company_name')
      .orderBy('profit', 'DESC')
      .getRawMany();

    return rows.map(r => ({
      vendor_id: r.vendor_id,
      vendor_name: r.vendor_name,
      order_count: Number(r.order_count),
      revenue: Math.round(Number(r.revenue) || 0),
      cost: Math.round(Number(r.cost) || 0),
      margin: Math.round(Number(r.margin) || 0),
      profit: Math.round(Number(r.profit) || 0),
      commission: Math.round(Number(r.commission) || 0),
      avg_margin_rate: Math.round(Number(r.avg_margin_rate) * 100) / 100,
    }));
  }

  /* ─── GET /reports/products ─── */
  async getProductReport(start: Date, end: Date) {
    const rows = await this.profitRepo
      .createQueryBuilder('op')
      .innerJoin('orders', 'o', 'o.id = op.order_id')
      .select([
        'o.product_id as product_id',
        "COALESCE(o.product_name, 'Тодорхойгүй') as product_name",
        'COUNT(*)::int as order_count',
        'COALESCE(SUM(op.customer_price), 0)::decimal as revenue',
        'COALESCE(SUM(op.vendor_price), 0)::decimal as cost',
        'COALESCE(SUM(op.margin), 0)::decimal as margin',
        'COALESCE(SUM(op.bizprint_profit), 0)::decimal as profit',
        'COALESCE(AVG(op.margin_rate), 0)::decimal as avg_margin_rate',
      ])
      .where('op.created_at BETWEEN :s AND :e', { s: start, e: end })
      .groupBy('o.product_id')
      .addGroupBy('o.product_name')
      .orderBy('profit', 'DESC')
      .getRawMany();

    return rows.map(r => ({
      product_id: r.product_id,
      product_name: r.product_name,
      order_count: Number(r.order_count),
      revenue: Math.round(Number(r.revenue) || 0),
      cost: Math.round(Number(r.cost) || 0),
      margin: Math.round(Number(r.margin) || 0),
      profit: Math.round(Number(r.profit) || 0),
      avg_margin_rate: Math.round(Number(r.avg_margin_rate) * 100) / 100,
    }));
  }

  /* ─── GET /reports/customers ─── */
  async getCustomerReport(start: Date, end: Date) {
    const rows = await this.orderRepo
      .createQueryBuilder('o')
      .leftJoin('order_profits', 'op', 'op.order_id = o.id')
      .select([
        'o.customer_id as customer_id',
        "COALESCE(o.customer_name, o.customer_email, 'Зочин') as customer_name",
        'o.customer_email as email',
        'COUNT(*)::int as order_count',
        'COALESCE(SUM(o.total_price), 0)::decimal as total_spend',
        'COALESCE(SUM(op.bizprint_profit), 0)::decimal as profit_generated',
        'MAX(o.created_at) as last_order_date',
      ])
      .where('o.created_at BETWEEN :s AND :e', { s: start, e: end })
      .andWhere("o.status != 'CANCELLED'")
      .groupBy('o.customer_id')
      .addGroupBy('o.customer_name')
      .addGroupBy('o.customer_email')
      .orderBy('total_spend', 'DESC')
      .limit(20)
      .getRawMany();

    return rows.map(r => ({
      customer_id: r.customer_id,
      customer_name: r.customer_name,
      email: r.email,
      order_count: Number(r.order_count),
      total_spend: Math.round(Number(r.total_spend) || 0),
      profit_generated: Math.round(Number(r.profit_generated) || 0),
      last_order_date: r.last_order_date,
    }));
  }

  /* ─── GET /reports/cashflow ─── */
  async getCashflow(start: Date, end: Date) {
    const paid = await this.orderRepo
      .createQueryBuilder('o')
      .select('COALESCE(SUM(o.total_price), 0)::decimal as amount')
      .where('o.created_at BETWEEN :s AND :e', { s: start, e: end })
      .andWhere("o.payment_status = 'paid'")
      .getRawOne();

    const pending = await this.orderRepo
      .createQueryBuilder('o')
      .select('COALESCE(SUM(o.total_price), 0)::decimal as amount')
      .where('o.created_at BETWEEN :s AND :e', { s: start, e: end })
      .andWhere("o.payment_status != 'paid'")
      .andWhere("o.status != 'CANCELLED'")
      .getRawOne();

    const commission = await this.profitRepo
      .createQueryBuilder('op')
      .select([
        'COALESCE(SUM(op.sales_commission), 0)::decimal as total',
        'COALESCE(SUM(op.delivery_cost), 0)::decimal as delivery',
        'COALESCE(SUM(op.vat_amount), 0)::decimal as vat',
      ])
      .where('op.created_at BETWEEN :s AND :e', { s: start, e: end })
      .getRawOne();

    return {
      paid_orders: Math.round(Number(paid.amount) || 0),
      pending_payments: Math.round(Number(pending.amount) || 0),
      total_commission: Math.round(Number(commission.total) || 0),
      total_delivery_cost: Math.round(Number(commission.delivery) || 0),
      total_vat: Math.round(Number(commission.vat) || 0),
    };
  }

  private between(start: Date, end: Date) {
    // TypeORM Between helper — used for simple count queries
    const { Between } = require('typeorm');
    return Between(start, end);
  }
}
