import {
  Entity, PrimaryGeneratedColumn, Column,
  CreateDateColumn, UpdateDateColumn, OneToOne, JoinColumn,
} from 'typeorm';
import { Vendor } from '../vendor.entity';

@Entity('vendor_metrics')
export class VendorMetrics {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  vendor_id: string;

  @OneToOne(() => Vendor, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'vendor_id' })
  vendor: Vendor;

  // Цагт нь хүргэсэн хувь (0-100)
  @Column({ type: 'decimal', precision: 5, scale: 2, default: 100 })
  on_time_rate: number;

  // Гэмтэлтэй бүтээгдэхүүний хувь (0-100, бага = сайн)
  @Column({ type: 'decimal', precision: 5, scale: 2, default: 0 })
  defect_rate: number;

  // Дундаж хийх хугацаа (цагаар)
  @Column({ type: 'decimal', precision: 8, scale: 2, default: 24 })
  avg_lead_time: number;

  // Сүүлийн 30 хоногийн захиалгын тоо
  @Column({ type: 'int', default: 0 })
  last_30d_orders: number;

  // Нийт дууссан захиалга
  @Column({ type: 'int', default: 0 })
  total_completed: number;

  // Нийт цуцалсан захиалга
  @Column({ type: 'int', default: 0 })
  total_cancelled: number;

  // Дундаж үнэлгээ (1-5)
  @Column({ type: 'decimal', precision: 3, scale: 2, default: 5 })
  avg_rating: number;

  // Хамгийн сүүлийн тооцоо
  @Column({ nullable: true })
  last_calculated_at: Date;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}
