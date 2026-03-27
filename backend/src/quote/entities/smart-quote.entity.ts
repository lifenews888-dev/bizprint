import {
  Entity, PrimaryGeneratedColumn, Column,
  CreateDateColumn, UpdateDateColumn, OneToMany,
} from 'typeorm';

export enum QuoteStatus {
  DRAFT = 'draft',
  SENT = 'sent',
  ACCEPTED = 'accepted',
  REJECTED = 'rejected',
  EXPIRED = 'expired',
  ORDERED = 'ordered',
}

@Entity('smart_quotes')
export class SmartQuote {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  /** Customer */
  @Column({ nullable: true })
  customer_id: string;

  @Column({ nullable: true })
  customer_name: string;

  @Column({ nullable: true })
  customer_email: string;

  @Column({ nullable: true })
  customer_phone: string;

  @Column({ nullable: true })
  customer_company: string;

  /** Product */
  @Column()
  product_type: string; // tovgor, nerj, 3d, sambar, pvc, offset, wide, book

  @Column({ nullable: true })
  product_name: string;

  @Column({ nullable: true })
  sign_text: string;

  @Column({ nullable: true })
  logo_url: string;

  /** Dimensions */
  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  width: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  height: number;

  @Column({ default: 'м' })
  dimension_unit: string;

  @Column({ default: 1 })
  quantity: number;

  /** Material & Finishing */
  @Column({ nullable: true })
  material: string;

  @Column({ nullable: true })
  finishing: string;

  @Column({ nullable: true })
  paper_gsm: string;

  @Column({ nullable: true })
  cover_type: string;

  /** Letter-based (tovgor) */
  @Column({ nullable: true })
  letter_size_cm: number;

  @Column({ nullable: true })
  letter_count: number;

  /** Pricing */
  @Column({ type: 'decimal', precision: 12, scale: 2, default: 0 })
  base_price: number;

  @Column({ type: 'decimal', precision: 12, scale: 2, default: 0 })
  extras_price: number;

  @Column({ type: 'decimal', precision: 12, scale: 2, default: 0 })
  subtotal: number;

  @Column({ type: 'decimal', precision: 12, scale: 2, default: 0 })
  vat: number;

  @Column({ type: 'decimal', precision: 12, scale: 2, default: 0 })
  total_price: number;

  @Column({ type: 'decimal', precision: 12, scale: 2, default: 0 })
  unit_price: number;

  /** Rush */
  @Column({ default: 'normal' })
  urgency: string;

  @Column({ type: 'decimal', precision: 5, scale: 2, default: 0 })
  urgency_multiplier: number;

  /** AI */
  @Column({ type: 'text', nullable: true })
  ai_recommendation: string;

  @Column({ type: 'text', nullable: true })
  ai_proposal_text: string;

  @Column('simple-array', { nullable: true })
  ai_upsell_suggestions: string[];

  /** Production */
  @Column({ nullable: true })
  estimated_production_days: number;

  @Column({ nullable: true })
  machine_type: string;

  /** Status */
  @Column({ type: 'enum', enum: QuoteStatus, default: QuoteStatus.DRAFT })
  status: QuoteStatus;

  @Column({ nullable: true })
  notes: string;

  @Column({ nullable: true })
  quote_number: string;

  @Column({ nullable: true })
  valid_until: Date;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}

@Entity('smart_quote_options')
export class SmartQuoteOption {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  quote_id: string;

  @Column()
  tier: string; // economy, standard, premium

  @Column({ nullable: true })
  material: string;

  @Column({ nullable: true })
  finishing: string;

  @Column({ nullable: true })
  description: string;

  @Column({ type: 'decimal', precision: 12, scale: 2, default: 0 })
  price: number;

  @Column({ nullable: true })
  delivery_days: number;
}
