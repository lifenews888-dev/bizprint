import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { BcProduct } from './bc-product.entity';

@Entity('bc_pricing_tiers')
export class BcPricingTier {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  product_id: string;

  @ManyToOne(() => BcProduct, p => p.pricingTiers, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'product_id' })
  product: BcProduct;

  @Column({ type: 'int' })
  quantity: number;

  @Column({ type: 'decimal', precision: 14, scale: 2 })
  unit_price: number;

  @Column({ default: 0 })
  sort_order: number;

  @CreateDateColumn()
  created_at: Date;
}
