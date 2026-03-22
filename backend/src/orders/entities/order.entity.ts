import {
  Entity, PrimaryGeneratedColumn, Column,
  CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn
} from 'typeorm';
import { User } from '../../users/user.entity';
import { Product } from '../../products/product.entity';

export enum OrderStatus {
  DRAFT = 'draft',
  QUOTATION_SENT = 'quotation_sent',
  CONFIRMED = 'confirmed',
  PENDING_FILE = 'pending_file',
  FILE_REVIEW = 'file_review',
  FILE_REJECTED = 'file_rejected',
  ON_HOLD = 'on_hold',
  IN_PRODUCTION = 'in_production',
  FINISHING = 'finishing',
  PARTIALLY_DISPATCHED = 'partially_dispatched',
  DISPATCHED = 'dispatched',
  DELIVERED = 'delivered',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled',
}

@Entity('orders')
export class Order {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ nullable: true })
  customer_id: string;

  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'customer_id' })
  customer: User;

  @Column({ nullable: true })
  product_id: string;

  @ManyToOne(() => Product, { nullable: true })
  @JoinColumn({ name: 'product_id' })
  product: Product;

  @Column({ nullable: true })
  quote_id: string;

  @Column({ nullable: true })
  quote_number: string;

  @Column({ nullable: true })
  customer_name: string;

  @Column({ nullable: true })
  customer_phone: string;

  @Column({ nullable: true })
  customer_email: string;

  @Column({ nullable: true })
  product_name: string;

  @Column()
  quantity: number;

  @Column({ nullable: true })
  width_mm: number;

  @Column({ nullable: true })
  height_mm: number;

  @Column({ nullable: true })
  paper_gsm: number;

  @Column({ nullable: true })
  color_mode: string;

  @Column({ nullable: true })
  sides: string;

  @Column({ nullable: true })
  finishing: string;

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

  @Column({ default: OrderStatus.DRAFT })
  status: string;

  @Column({ nullable: true })
  payment_status: string;

  @Column({ nullable: true })
  payment_method: string;

  @Column({ nullable: true })
  invoice_no: string;

  @Column({ nullable: true })
  file_url: string;

  @Column({ nullable: true })
  assigned_to: string;

  @Column({ nullable: true })
  deadline: Date;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}