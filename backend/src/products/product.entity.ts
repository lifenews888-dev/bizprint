import {
  Entity, PrimaryGeneratedColumn, Column,
  CreateDateColumn, UpdateDateColumn, OneToMany
} from 'typeorm';

@Entity('products')
export class Product {
  @PrimaryGeneratedColumn('uuid')
  id: string;

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

  @Column({ default: true })
  is_active: boolean;

  @Column({ default: 0 })
  sort_order: number;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}