import {
  Entity, PrimaryGeneratedColumn, Column,
  CreateDateColumn, UpdateDateColumn, OneToOne, JoinColumn,
} from 'typeorm';
import { Order } from './order.entity';

@Entity('order_profits')
export class OrderProfit {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  order_id: string;

  @OneToOne(() => Order, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'order_id' })
  order: Order;

  // Vendor-ийн үнэ (НӨАТ-тэй)
  @Column({ type: 'decimal', precision: 14, scale: 2, default: 0 })
  vendor_price: number;

  // Хэрэглэгчийн үнэ (НӨАТ-тэй)
  @Column({ type: 'decimal', precision: 14, scale: 2, default: 0 })
  customer_price: number;

  // Нийт margin (customer_price - vendor_price)
  @Column({ type: 'decimal', precision: 14, scale: 2, default: 0 })
  margin: number;

  // Margin хувь
  @Column({ type: 'decimal', precision: 5, scale: 2, default: 0 })
  margin_rate: number;

  // Борлуулагчийн шимтгэл (margin × sales_commission_rate)
  @Column({ type: 'decimal', precision: 14, scale: 2, default: 0 })
  sales_commission: number;

  @Column({ type: 'decimal', precision: 5, scale: 2, default: 10 })
  sales_commission_rate: number;

  // Хүргэлтийн зардал
  @Column({ type: 'decimal', precision: 14, scale: 2, default: 0 })
  delivery_cost: number;

  // BizPrint-ийн цэвэр ашиг (margin - sales_commission - delivery_cost)
  @Column({ type: 'decimal', precision: 14, scale: 2, default: 0 })
  bizprint_profit: number;

  // НӨАТ дүн
  @Column({ type: 'decimal', precision: 14, scale: 2, default: 0 })
  vat_amount: number;

  // Нэмэлт мэдээлэл
  @Column({ type: 'jsonb', nullable: true })
  metadata: Record<string, any>;

  @Column({ nullable: true })
  sales_partner_id: string;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}
