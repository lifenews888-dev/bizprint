import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn } from 'typeorm';
import { Product } from '../products/product.entity';

@Entity('pricing_rules')
export class PricingRule {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ nullable: true })
  product_id: string;

  @ManyToOne(() => Product)
  @JoinColumn({ name: 'product_id' })
  product: Product;

  @Column({ nullable: true })
  category_id: string;

  @Column()
  attribute_key: string;

  @Column({ default: '' })
  attribute_value: string;

  @Column({ type: 'decimal', precision: 10, scale: 4, nullable: true })
  price_multiplier: number;

  @Column({ type: 'decimal', precision: 14, scale: 2, nullable: true })
  price_addition: number;

  @Column({ type: 'decimal', precision: 14, scale: 2, nullable: true })
  price_override: number;

  @Column({ nullable: true })
  min_quantity: number;

  @Column({ default: true })
  is_active: boolean;
}