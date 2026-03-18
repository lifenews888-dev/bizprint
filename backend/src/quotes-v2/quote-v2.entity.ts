import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

export enum QuoteStatus {
  DRAFT     = 'draft',
  SENT      = 'sent',
  CONFIRMED = 'confirmed',
  ORDERED   = 'ordered',
  EXPIRED   = 'expired',
}

@Entity('quotes_v2')
export class QuoteV2 {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  quote_number: string;

  @Column()
  customer_name: string;

  @Column()
  customer_phone: string;

  @Column()
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

  @Column({ type: 'jsonb', nullable: true })
  breakdown: any;

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

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}