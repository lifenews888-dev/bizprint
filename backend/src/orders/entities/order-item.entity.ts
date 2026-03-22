import {
  Entity, PrimaryGeneratedColumn, Column,
  CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn,
} from 'typeorm';
import { Order } from './order.entity';
import { Product } from '../../products/product.entity';
import { OrderVendorGroup } from './order-vendor-group.entity';

@Entity('order_items')
export class OrderItem {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  order_id: string;

  @ManyToOne(() => Order, (order) => order.items)
  @JoinColumn({ name: 'order_id' })
  order: Order;

  @Column({ nullable: true })
  product_id: string;

  @ManyToOne(() => Product, { nullable: true })
  @JoinColumn({ name: 'product_id' })
  product: Product;

  @Column({ nullable: true })
  vendor_group_id: string;

  @ManyToOne(() => OrderVendorGroup, { nullable: true })
  @JoinColumn({ name: 'vendor_group_id' })
  vendor_group: OrderVendorGroup;

  @Column()
  quantity: number;

  @Column({ type: 'decimal', precision: 14, scale: 2, default: 0 })
  unit_price: number;

  @Column({ type: 'decimal', precision: 14, scale: 2, default: 0 })
  total_price: number;

  @Column({ type: 'jsonb', nullable: true })
  specs: Record<string, any>;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}
