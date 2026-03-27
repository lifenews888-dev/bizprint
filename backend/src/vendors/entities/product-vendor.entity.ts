import {
  Entity, PrimaryGeneratedColumn, Column,
  CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn, Unique,
} from 'typeorm';
import { Vendor } from '../vendor.entity';
import { Product } from '../../products/product.entity';

@Entity('product_vendors')
@Unique(['product_id', 'vendor_id'])
export class ProductVendor {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  product_id: string;

  @ManyToOne(() => Product, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'product_id' })
  product: Product;

  @Column()
  vendor_id: string;

  @ManyToOne(() => Vendor, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'vendor_id' })
  vendor: Vendor;

  // Vendor-ийн үнэ (НӨАТ-тэй)
  @Column({ type: 'decimal', precision: 14, scale: 2 })
  price_with_vat: number;

  // Vendor-ийн үнэ (НӨАТ-гүй)
  @Column({ type: 'decimal', precision: 14, scale: 2 })
  price_without_vat: number;

  // Хийх хугацаа (цагаар)
  @Column({ type: 'int', default: 24 })
  lead_time_hours: number;

  // Чанарын үнэлгээ (0-100)
  @Column({ type: 'int', default: 80 })
  quality_score: number;

  // Эрэмбэ (бага = давуу)
  @Column({ type: 'int', default: 1 })
  priority: number;

  // Хамгийн бага захиалгын тоо
  @Column({ type: 'int', default: 1 })
  min_quantity: number;

  // Хамгийн их захиалгын тоо (null = хязгааргүй)
  @Column({ type: 'int', nullable: true })
  max_quantity: number;

  // ─── Per-Product Capacity ───
  // Өдрийн хүчин чадал (тухайн бүтээгдэхүүнд)
  @Column({ type: 'int', default: 100 })
  daily_capacity: number;

  // Хэмжих нэгж: 'pieces' (ширхэг) | 'm2' (м²) | 'meters' (метр)
  @Column({ default: 'pieces' })
  capacity_unit: string;

  // Ашиглагдаж буй хүчин чадал (идэвхтэй захиалгуудаас)
  @Column({ type: 'int', default: 0 })
  used_capacity: number;

  @Column({ default: true })
  is_active: boolean;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}
