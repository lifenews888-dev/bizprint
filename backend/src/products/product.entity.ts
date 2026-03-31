import {
  Entity, PrimaryGeneratedColumn, Column,
  CreateDateColumn, UpdateDateColumn
} from 'typeorm';

export enum ProductType {
  PRINT   = 'print',
  READY   = 'ready',
}

@Entity('products')
export class Product {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', default: ProductType.PRINT })
  product_type: string;

  @Column({ nullable: true })
  vendor_id: string;

  @Column()
  name: string;

  @Column()
  name_mn: string;

  @Column({ unique: true })
  slug: string;

  @Column()
  category: string;

  @Column({ nullable: true })
  subcategory: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ type: 'decimal', precision: 14, scale: 2 })
  base_price: number;

  @Column({ default: 1 })
  min_quantity: number;

  @Column({ nullable: true })
  max_quantity: number;

  @Column({ default: 3 })
  lead_time_days: number;

  @Column({ nullable: true })
  thumbnail_url: string;

  @Column({ type: 'simple-json', nullable: true })
  images: string[];

  @Column({ nullable: true })
  video_url: string;

  @Column({ nullable: true })
  sale_price: number;

  @Column({ nullable: true })
  stock_quantity: number;

  @Column({ nullable: true })
  sku: string;

  @Column({ default: true })
  is_active: boolean;

  @Column({ default: 0 })
  sort_order: number;

  @Column({ default: false })
  is_featured: boolean;

  @Column({ default: false })
  is_new: boolean;

  @Column({ default: false })
  is_bestseller: boolean;

  @Column({ default: false })
  is_out_of_stock: boolean;

  /** Badge: NEW | HOT | SALE | FEATURED | null */
  @Column({ nullable: true })
  badge: string;

  @Column({ default: false })
  is_flash_deal: boolean;

  @Column({ type: 'timestamptz', nullable: true })
  flash_deal_end: Date;

  /** Specs for comparison: { "Хэмжээ": "A4", "Материал": "250gsm" } */
  @Column({ type: 'jsonb', nullable: true })
  compare_specs: Record<string, string>;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}
