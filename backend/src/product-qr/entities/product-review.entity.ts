import {
  Entity, PrimaryGeneratedColumn, Column,
  CreateDateColumn, ManyToOne, JoinColumn,
} from 'typeorm';
import { ProductQr } from './product-qr.entity';

@Entity('product_qr_reviews')
export class ProductReview {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  product_qr_id: string;

  @ManyToOne(() => ProductQr)
  @JoinColumn({ name: 'product_qr_id' })
  product_qr: ProductQr;

  @Column()
  reviewer_name: string;

  @Column({ nullable: true })
  reviewer_email: string;

  @Column({ type: 'decimal', precision: 2, scale: 1 })
  rating: number;

  @Column({ type: 'text', nullable: true })
  comment: string;

  @Column({ type: 'jsonb', default: '[]' })
  image_urls: string[];

  @Column({ default: true })
  is_approved: boolean;

  @Column({ default: false })
  is_verified_purchase: boolean;

  @CreateDateColumn()
  created_at: Date;
}
