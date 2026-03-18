import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity('templates')
export class Template {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  title: string;

  @Column({ nullable: true })
  title_mn: string;

  @Column({ nullable: true })
  description: string;

  @Column()
  designer_id: string;

  @Column({ nullable: true })
  designer_name: string;

  @Column({ nullable: true })
  category: string;

  @Column({ nullable: true })
  thumbnail_url: string;

  @Column({ nullable: true })
  file_url: string;

  @Column({ type: 'jsonb', nullable: true })
  canvas_data: any;

  @Column({ type: 'decimal', precision: 14, scale: 2, default: 0 })
  price: number;

  @Column({ type: 'decimal', precision: 14, scale: 2, default: 0 })
  royalty_rate: number;

  @Column({ default: 'pending' })
  status: string;

  @Column({ default: 0 })
  download_count: number;

  @Column({ default: 0 })
  use_count: number;

  @Column({ type: 'simple-array', nullable: true })
  tags: string[];

  @Column({ nullable: true })
  width_mm: number;

  @Column({ nullable: true })
  height_mm: number;

  @Column({ default: true })
  is_active: boolean;

  @Column({ default: 0 })
  sort_order: number;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}