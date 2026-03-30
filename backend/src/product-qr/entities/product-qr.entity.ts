import {
  Entity, PrimaryGeneratedColumn, Column,
  CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn,
} from 'typeorm';
import { User } from '../../users/user.entity';

@Entity('product_qrs')
export class ProductQr {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  user_id: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'user_id' })
  user: User;

  /** Public slug: /p/{slug} */
  @Column({ unique: true })
  slug: string;

  @Column()
  product_name: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ nullable: true })
  sku: string;

  @Column({ nullable: true })
  barcode: string;

  /** Price in MNT */
  @Column({ type: 'decimal', precision: 12, scale: 2, default: 0 })
  price: number;

  @Column({ nullable: true })
  currency: string;

  // ── Media ──
  @Column({ nullable: true })
  main_image_url: string;

  @Column({ type: 'jsonb', default: '[]' })
  gallery_urls: string[];

  @Column({ nullable: true })
  video_url: string;

  // ── Product Details ──
  @Column({ nullable: true })
  category: string;

  @Column({ nullable: true })
  brand: string;

  @Column({ type: 'jsonb', nullable: true, default: '{}' })
  specifications: Record<string, string>;

  @Column({ type: 'jsonb', nullable: true, default: '[]' })
  features: string[];

  // ── CTA / Reorder ──
  @Column({ nullable: true })
  cta_text: string;

  @Column({ nullable: true })
  cta_url: string;

  @Column({ nullable: true })
  reorder_url: string;

  @Column({ default: true })
  show_reorder_button: boolean;

  @Column({ default: true })
  show_reviews: boolean;

  // ── Contact / Brand ──
  @Column({ nullable: true })
  company_name: string;

  @Column({ nullable: true })
  company_logo_url: string;

  @Column({ nullable: true })
  company_website: string;

  @Column({ nullable: true })
  company_phone: string;

  // ── Theme ──
  @Column({ default: '#FF6B00' })
  accent_color: string;

  @Column({ default: '#FFFFFF' })
  bg_color: string;

  // ── QR & Analytics ──
  @Column({ nullable: true })
  qr_code_url: string;

  @Column({ default: 0 })
  scan_count: number;

  @Column({ default: 0 })
  view_count: number;

  @Column({ default: 0 })
  reorder_count: number;

  @Column({ default: true })
  is_active: boolean;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}
