import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity('ugc_packages')
export class UgcPackage {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  /** Service type: social, prepress, live, ai, ugc */
  @Column({ default: 'ugc' })
  service_type: string;

  /** e.g. starter, business, pro_business */
  @Column()
  slug: string;

  /** Duration in months */
  @Column({ default: 1 })
  duration_months: number;

  /** Price in MNT */
  @Column({ type: 'decimal', precision: 12, scale: 2 })
  price: number;

  /** Discounted price (for 3-month plans etc) */
  @Column({ type: 'decimal', precision: 12, scale: 2, nullable: true })
  discount_price: number;

  /** Discount label like "5% OFF" */
  @Column({ nullable: true })
  discount_label: string;

  /** Number of content pieces included */
  @Column({ default: 4 })
  content_count: number;

  /** Features list as JSON array of strings */
  @Column('simple-array', { nullable: true })
  features: string[];

  /** Content types included (e.g. reels, posts, stories) */
  @Column('simple-array', { nullable: true })
  content_types: string[];

  /** Add-on: brand boost bundle */
  @Column({ default: false })
  has_brand_boost: boolean;

  @Column({ nullable: true })
  brand_boost_description: string;

  @Column({ type: 'decimal', precision: 12, scale: 2, nullable: true })
  brand_boost_price: number;

  /** Is this package active/visible */
  @Column({ default: true })
  is_active: boolean;

  /** Sort order */
  @Column({ default: 0 })
  sort_order: number;

  /** Mark as popular/recommended */
  @Column({ default: false })
  is_popular: boolean;

  /** Target audience description */
  @Column({ type: 'text', nullable: true })
  target_audience: string;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}
