import { Entity, PrimaryGeneratedColumn, Column, UpdateDateColumn, CreateDateColumn } from 'typeorm';

@Entity('quote_configs')
export class QuoteConfig {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  product_type: string;

  @Column()
  name_mn: string;

  @Column({ default: '📦' })
  icon: string;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  base_rate: number;

  @Column({ type: 'decimal', precision: 5, scale: 2, default: 1.7 })
  double_side_multiplier: number;

  @Column({ type: 'decimal', precision: 5, scale: 2, default: 0.12 })
  overhead_rate: number;

  @Column({ type: 'decimal', precision: 5, scale: 2, default: 0.1 })
  platform_rate: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 7000 })
  ink_cost_per_500: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 5000 })
  finishing_cost_each: number;

  @Column({ type: 'jsonb' })
  sizes: Array<{ label: string; w: number; h: number }>;

  @Column({ type: 'jsonb' })
  materials: string[];

  @Column({ type: 'jsonb', nullable: true })
  materials_mn: string[];

  @Column({ type: 'jsonb' })
  finishing_options: string[];

  @Column({ type: 'jsonb', nullable: true })
  finishing_options_mn: string[];

  @Column({ default: 100 })
  min_qty: number;

  @Column({ default: true })
  is_active: boolean;

  @Column({ default: 0 })
  sort_order: number;

  @Column({ type: 'jsonb', nullable: true })
  volume_discounts: Array<{ min_qty: number; discount_percent: number }>;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}
