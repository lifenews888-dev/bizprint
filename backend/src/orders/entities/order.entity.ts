import {
  Entity, PrimaryGeneratedColumn, Column,
  CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn
} from 'typeorm';
import { User } from '../../users/user.entity';
import { Product } from '../../products/product.entity';

export enum OrderStatus {
  PENDING = 'pending',
  PAID = 'paid',
  SCHEDULED = 'scheduled',
  IN_PRODUCTION = 'in_production',
  COMPLETED = 'completed',
  SHIPPED = 'shipped',
  DELIVERED = 'delivered',
  CANCELLED = 'cancelled',
}

@Entity('orders')
export class Order {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  customer_id: string;

  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'customer_id' })
  customer: User;

  @Column()
  product_id: string;

  @ManyToOne(() => Product, { nullable: true })
  @JoinColumn({ name: 'product_id' })
  product: Product;

  @Column()
  quantity: number;

  @Column({ nullable: true })
  width_mm: number;

  @Column({ nullable: true })
  height_mm: number;

  @Column({ nullable: true })
  factory_id: string;

  @Column({ type: 'decimal', precision: 14, scale: 2, nullable: true })
  unit_price: number;

  @Column({ type: 'decimal', precision: 14, scale: 2, nullable: true })
  total_price: number;

  @Column({ type: 'jsonb', nullable: true })
  options: Record<string, string>;

  @Column({ nullable: true })
  notes: string;

  @Column({ default: OrderStatus.PENDING })
  status: string;

  @Column({ nullable: true })
  file_url: string;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}