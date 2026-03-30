import {
  Entity, PrimaryGeneratedColumn, Column,
  CreateDateColumn, UpdateDateColumn,
} from 'typeorm';

export type ProductPricingType = 'digital_card' | 'loyalty_campaign' | 'qr_campaign' | 'invitation_premium' | 'custom';
export type PriceModel = 'one_time' | 'subscription' | 'per_unit';

@Entity('product_pricing')
export class ProductPricing {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  /** Unique key for lookup */
  @Column({ unique: true })
  slug: string;

  @Column()
  name: string;

  @Column({ nullable: true })
  description: string;

  @Column({ default: 'digital_card' })
  product_type: ProductPricingType;

  @Column({ default: 'one_time' })
  price_model: PriceModel;

  /** Price in MNT */
  @Column({ type: 'decimal', precision: 12, scale: 2, default: 0 })
  price: number;

  /** Duration in days (for subscription model) */
  @Column({ default: 365 })
  duration_days: number;

  /** Per-unit price (for per_unit model) */
  @Column({ type: 'decimal', precision: 12, scale: 2, default: 0 })
  unit_price: number;

  /** Free tier included? (trial days or free units) */
  @Column({ default: 0 })
  free_tier_days: number;

  @Column({ default: 0 })
  free_tier_units: number;

  @Column({ default: true })
  is_active: boolean;

  @Column({ default: 0 })
  sort_order: number;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}
