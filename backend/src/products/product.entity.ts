import {
  Entity, PrimaryGeneratedColumn, Column, Index,
  CreateDateColumn, UpdateDateColumn
} from 'typeorm';

export enum ProductType {
  SHOP    = 'shop',
  PRINT   = 'print',
  SIGNAGE = 'signage',
  DESIGN  = 'design',
  READY   = 'ready', // legacy alias for shop
}

@Entity('products')
// Catalog/storefront hot path: filter by category + active flag, and list a
// vendor's own products. (slug is already indexed via its unique constraint.)
@Index(['category', 'is_active'])
export class Product {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', default: ProductType.PRINT })
  product_type: string;

  @Index()
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

  /** ID of the user who originally added this product to the catalog —
      vendor, designer, or sales agent. Used for attribution and "owned by"
      filters on the storefront. Distinct from vendor_id, which is the
      production vendor that fulfils the order. */
  @Column({ nullable: true })
  created_by_user_id: string;

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

  // ─── Product Type System ───

  /** Link to product_masters for PRINT/SIGNAGE */
  @Column({ nullable: true })
  product_master_id: string;

  /** Link to templates for DESIGN */
  @Column({ nullable: true })
  template_id: string;

  /** Pricing mode: fixed | formula | tier | quote_required */
  @Column({ default: 'fixed' })
  pricing_mode: string;

  /** Price formula JSON for dynamic pricing (signage area-based, print tier-based) */
  @Column({ type: 'jsonb', nullable: true })
  price_formula: Record<string, any>;

  /** Order flow type: standard | file_upload | site_survey | template_customize */
  @Column({ default: 'standard' })
  order_flow: string;

  @Column({ default: false })
  requires_file_upload: boolean;

  @Column({ default: false })
  requires_dimensions: boolean;

  @Column({ default: false })
  requires_quote_approval: boolean;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}
