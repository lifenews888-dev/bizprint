import {
  Entity, PrimaryGeneratedColumn, Column,
  CreateDateColumn, UpdateDateColumn, ManyToOne, OneToMany, JoinColumn,
} from 'typeorm';
import { User } from '../../users/user.entity';
import { Product } from '../../products/product.entity';
import { OrderItem } from './order-item.entity';
import { OrderVendorGroup } from './order-vendor-group.entity';
import { Invoice } from '../../payment/entities/invoice.entity';
import { Shipment } from '../../shipping/entities/shipment.entity';

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

  // ── Zoom meeting fields ──
  @Column({ nullable: true })
  zoom_meeting_id: string;

  @Column({ nullable: true })
  zoom_join_url: string;

  @Column({ nullable: true })
  zoom_start_url: string;

  @Column({ nullable: true })
  zoom_password: string;

  @Column({ nullable: true })
  zoom_scheduled_at: Date;

  @Column({ nullable: true })
  zoom_status: string; // scheduled | active | completed | cancelled

  @Column({ nullable: true })
  zoom_reminder_sent: boolean;

  @Column({ nullable: true })
  assigned_to: string;

  @Column({ nullable: true })
  deadline: Date;

  @Column({ nullable: true })
  delivered_at: Date;

  @Column({ default: 'normal' })
  priority: string; // low, normal, high, urgent

  @Column({ default: false })
  is_delayed: boolean;

  // ── Delivery Geo ───────────────────────────────────────
  @Column({ type: 'decimal', precision: 10, scale: 7, nullable: true })
  delivery_lat: number;

  @Column({ type: 'decimal', precision: 10, scale: 7, nullable: true })
  delivery_lng: number;

  @Column({ nullable: true })
  delivery_district: string;

  @Column({ nullable: true })
  assigned_vendor_id: string;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  delivery_cost: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  vendor_distance_km: number;

  @OneToMany(() => OrderItem, (item) => item.order)
  items: OrderItem[];

  @OneToMany(() => OrderVendorGroup, (vg) => vg.order)
  vendor_groups: OrderVendorGroup[];

  @OneToMany(() => Invoice, (inv) => inv.order)
  invoices: Invoice[];

  @OneToMany(() => Shipment, (s) => s.order)
  shipments: Shipment[];

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}