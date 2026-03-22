import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, OneToMany } from 'typeorm';
import { QuotationItem } from './quotation-item.entity';

export enum QuoteStatus {
  DRAFT     = 'draft',
  SENT      = 'sent',
  CONFIRMED = 'confirmed',
  ORDERED   = 'ordered',
  EXPIRED   = 'expired',
}

@Entity('quotes_v2')
export class Quotation {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  quote_number: string;

  @Column({ default: '' })
  customer_name: string;

  @Column({ default: '' })
  customer_phone: string;

  @Column({ default: '' })
  customer_email: string;

  @Column({ nullable: true })
  product_name: string;

  @Column({ nullable: true })
  product_description: string;

  @Column({ default: 1 })
  quantity: number;

  @Column({ nullable: true })
  pages: number;

  @Column({ nullable: true })
  size: string;

  @Column({ nullable: true })
  width_mm: number;

  @Column({ nullable: true })
  height_mm: number;

  @Column({ nullable: true })
  paper_type: string;

  @Column({ nullable: true })
  paper_gsm: number;

  @Column({ nullable: true })
  color_mode: string;

  @Column({ nullable: true })
  sides: string;

  @Column({ nullable: true })
  finishing: string;

  @Column({ nullable: true })
  binding: string;

  @Column({ type: 'decimal', precision: 14, scale: 2, default: 0 })
  unit_price: number;

  @Column({ type: 'decimal', precision: 14, scale: 2, default: 0 })
  total_price: number;

  @Column({ type: 'decimal', precision: 14, scale: 2, default: 0 })
  discount_amount: number;

  @Column({ type: 'decimal', precision: 14, scale: 2, default: 0 })
  rush_fee: number;

  @Column({ type: 'decimal', precision: 14, scale: 2, default: 0 })
  savings_amount: number;

  @Column({ nullable: true })
  urgency: string;

  @Column({ type: 'jsonb', nullable: true })
  breakdown: any;

  @Column({ type: 'jsonb', nullable: true })
  smart_adjustments: any;

  @Column({ nullable: true })
  product_type: string;

  @Column({ nullable: true })
  product_subtype: string;

  @Column({ type: 'jsonb', nullable: true })
  dimensions: any;

  @Column({ type: 'decimal', precision: 14, scale: 2, default: 0 })
  base_price: number;

  @Column({ type: 'decimal', precision: 6, scale: 4, nullable: true })
  margin_rate: number;

  @Column({ type: 'jsonb', nullable: true })
  extras: any;

  @Column({ nullable: true })
  pricing_mode: string;

  @Column({ nullable: true })
  expires_at: Date;

  @Column({ nullable: true })
  guest_email: string;

  @Column({ nullable: true })
  user_id: string;

  @Column({ nullable: true })
  rush_type: string;

  @Column({ nullable: true })
  guest_name: string;

  @Column({ nullable: true })
  guest_phone: string;

  @Column({ nullable: true })
  company_name: string;

  @Column({ type: 'varchar', default: QuoteStatus.DRAFT })
  status: string;

  @Column({ nullable: true })
  valid_until: Date;

  @Column({ nullable: true })
  notes: string;

  @Column({ default: false })
  email_sent: boolean;

  @Column({ default: false })
  daily_report_sent: boolean;

  @OneToMany(() => QuotationItem, (item) => item.quotation)
  items: QuotationItem[];

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}
