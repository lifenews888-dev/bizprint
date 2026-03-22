import {
  Entity, PrimaryGeneratedColumn, Column,
  CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn,
} from 'typeorm';
import { Quotation } from './quotation.entity';
import { Product } from '../../products/product.entity';

@Entity('quotation_items')
export class QuotationItem {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  quotation_id: string;

  @ManyToOne(() => Quotation, (quote) => quote.items)
  @JoinColumn({ name: 'quotation_id' })
  quotation: Quotation;

  @Column({ nullable: true })
  product_id: string;

  @ManyToOne(() => Product, { nullable: true })
  @JoinColumn({ name: 'product_id' })
  product: Product;

  @Column()
  quantity: number;

  @Column({ type: 'decimal', precision: 14, scale: 2, default: 0 })
  vendor_cost: number;

  @Column({ type: 'decimal', precision: 6, scale: 4, default: 0 })
  margin_rate: number;

  /** customer_price = vendor_cost × (1 + margin_rate) */
  @Column({ type: 'decimal', precision: 14, scale: 2, default: 0 })
  customer_price: number;

  @Column({ type: 'jsonb', nullable: true })
  specs: Record<string, any>;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}
