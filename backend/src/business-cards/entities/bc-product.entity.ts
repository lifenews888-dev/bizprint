import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, OneToMany } from 'typeorm';
import { BcLayout } from './bc-layout.entity';
import { BcPricingTier } from './bc-pricing-tier.entity';

export enum BcStatus { DRAFT = 'draft', PUBLISHED = 'published' }

@Entity('bc_products')
export class BcProduct {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  @Column({ nullable: true })
  name_mn: string;

  @Column({ unique: true })
  slug: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ type: 'decimal', precision: 14, scale: 2, default: 3000 })
  base_price: number;

  @Column({ default: true })
  vat_enabled: boolean;

  @Column({ type: 'decimal', precision: 5, scale: 2, default: 10 })
  vat_rate: number;

  @Column({ default: true })
  is_active: boolean;

  @Column({ type: 'varchar', default: BcStatus.DRAFT })
  status: BcStatus;

  @OneToMany(() => BcLayout, l => l.product, { cascade: true, eager: false })
  layouts: BcLayout[];

  @OneToMany(() => BcPricingTier, t => t.product, { cascade: true, eager: false })
  pricingTiers: BcPricingTier[];

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}
