import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { OrderProfit } from '../entities/order-profit.entity';

export interface ProfitSplit {
  vendor_price: number;
  customer_price: number;
  margin: number;
  margin_rate: number;
  sales_commission: number;
  sales_commission_rate: number;
  delivery_cost: number;
  bizprint_profit: number;
  vat_amount: number;
}

@Injectable()
export class ProfitEngineService {
  constructor(
    @InjectRepository(OrderProfit)
    private profitRepo: Repository<OrderProfit>,
  ) {}

  // ─── Default rates (admin-аас тохируулж болно) ───
  static readonly DEFAULT_SALES_COMMISSION_RATE = 0.10; // 10%
  static readonly DEFAULT_DELIVERY_COST = 5000; // 5000₮

  /**
   * Ашгийн хуваарилалт тооцоолох.
   *
   * margin = customer_price - vendor_price
   * sales_commission = margin × sales_commission_rate
   * bizprint_profit = margin - sales_commission - delivery_cost
   */
  splitProfit(params: {
    vendor_price: number;
    customer_price: number;
    vat_amount?: number;
    sales_commission_rate?: number;
    delivery_cost?: number;
    sales_partner_id?: string;
  }): ProfitSplit {
    const { vendor_price, customer_price } = params;
    const margin = customer_price - vendor_price;
    const margin_rate = vendor_price > 0 ? (margin / vendor_price) : 0;

    // Sales commission: хэрэв sales partner байвал тооцох
    const salesRate = params.sales_partner_id
      ? (params.sales_commission_rate ?? ProfitEngineService.DEFAULT_SALES_COMMISSION_RATE)
      : 0;
    const sales_commission = Math.round(margin * salesRate);

    // Delivery cost
    const delivery_cost = params.delivery_cost ?? ProfitEngineService.DEFAULT_DELIVERY_COST;

    // BizPrint profit
    const bizprint_profit = margin - sales_commission - delivery_cost;

    return {
      vendor_price,
      customer_price,
      margin: Math.round(margin),
      margin_rate: Math.round(margin_rate * 100) / 100,
      sales_commission,
      sales_commission_rate: salesRate,
      delivery_cost,
      bizprint_profit: Math.round(bizprint_profit),
      vat_amount: params.vat_amount ?? 0,
    };
  }

  /**
   * Захиалгын ашгийн бичлэг хадгалах.
   */
  async createOrderProfit(
    orderId: string,
    profitData: ProfitSplit,
    salesPartnerId?: string,
  ): Promise<OrderProfit> {
    // Давхардсан бичлэг шалгах
    const existing = await this.profitRepo.findOne({ where: { order_id: orderId } });
    if (existing) {
      // Шинэчлэх
      Object.assign(existing, {
        ...profitData,
        sales_partner_id: salesPartnerId || null,
      });
      return this.profitRepo.save(existing);
    }

    return this.profitRepo.save(this.profitRepo.create({
      order_id: orderId,
      ...profitData,
      sales_partner_id: salesPartnerId || null,
    }));
  }

  /**
   * Захиалгын ашгийн мэдээлэл авах.
   */
  async getOrderProfit(orderId: string): Promise<OrderProfit | null> {
    return this.profitRepo.findOne({ where: { order_id: orderId } });
  }

  /**
   * Тодорхой хугацааны нийт ашгийн тайлан.
   */
  async getProfitSummary(startDate: Date, endDate: Date) {
    const result = await this.profitRepo
      .createQueryBuilder('op')
      .select([
        'COUNT(*)::int as total_orders',
        'SUM(op.customer_price)::decimal as total_revenue',
        'SUM(op.vendor_price)::decimal as total_vendor_cost',
        'SUM(op.margin)::decimal as total_margin',
        'SUM(op.sales_commission)::decimal as total_sales_commission',
        'SUM(op.delivery_cost)::decimal as total_delivery_cost',
        'SUM(op.bizprint_profit)::decimal as total_bizprint_profit',
        'SUM(op.vat_amount)::decimal as total_vat',
        'AVG(op.margin_rate)::decimal as avg_margin_rate',
      ])
      .where('op.created_at BETWEEN :start AND :end', { start: startDate, end: endDate })
      .getRawOne();

    return {
      period: { start: startDate, end: endDate },
      total_orders: Number(result.total_orders) || 0,
      total_revenue: Math.round(Number(result.total_revenue) || 0),
      total_vendor_cost: Math.round(Number(result.total_vendor_cost) || 0),
      total_margin: Math.round(Number(result.total_margin) || 0),
      total_sales_commission: Math.round(Number(result.total_sales_commission) || 0),
      total_delivery_cost: Math.round(Number(result.total_delivery_cost) || 0),
      total_bizprint_profit: Math.round(Number(result.total_bizprint_profit) || 0),
      total_vat: Math.round(Number(result.total_vat) || 0),
      avg_margin_rate: Math.round(Number(result.avg_margin_rate) * 100) / 100 || 0,
    };
  }

  /**
   * Vendor тус бүрийн ашгийн тайлан.
   */
  async getProfitByVendor(startDate: Date, endDate: Date) {
    const results = await this.profitRepo
      .createQueryBuilder('op')
      .innerJoin('orders', 'o', 'o.id = op.order_id')
      .select([
        'o.factory_id as vendor_id',
        'COUNT(*)::int as order_count',
        'SUM(op.vendor_price)::decimal as total_vendor_cost',
        'SUM(op.margin)::decimal as total_margin',
        'SUM(op.bizprint_profit)::decimal as total_profit',
      ])
      .where('op.created_at BETWEEN :start AND :end', { start: startDate, end: endDate })
      .groupBy('o.factory_id')
      .orderBy('total_profit', 'DESC')
      .getRawMany();

    return results.map(r => ({
      vendor_id: r.vendor_id,
      order_count: Number(r.order_count),
      total_vendor_cost: Math.round(Number(r.total_vendor_cost) || 0),
      total_margin: Math.round(Number(r.total_margin) || 0),
      total_profit: Math.round(Number(r.total_profit) || 0),
    }));
  }
}
