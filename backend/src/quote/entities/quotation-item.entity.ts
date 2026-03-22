import {
  Entity, PrimaryGeneratedColumn, Column,
  CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn,
} from 'typeorm';
import { QuoteV2 } from '../../quotes-v2/quote-v2.entity';
import { Product } from '../../products/product.entity';

@Entity('quotation_items')
export class QuotationItem {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  quotation_id: string;

  @ManyToOne(() => QuoteV2, (quote) => quote.items)
  @JoinColumn({ name: 'quotation_id' })
  quotation: QuoteV2;

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
