import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { BcProduct } from './bc-product.entity';

export enum BcLayoutType {
  MINIMAL = 'minimal',
  BUSINESS = 'business',
  FULL = 'full',
  CREATIVE = 'creative',
  CORPORATE = 'corporate',
  BOLD = 'bold',
  DARK = 'dark',
}

@Entity('bc_layouts')
export class BcLayout {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  product_id: string;

  @ManyToOne(() => BcProduct, p => p.layouts, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'product_id' })
  product: BcProduct;

  @Column()
  name: string;

  @Column({ nullable: true })
  name_mn: string;

  @Column({ type: 'varchar', default: BcLayoutType.MINIMAL })
  type: string;

  @Column({ type: 'jsonb', nullable: true })
  front_json: any[];

  @Column({ type: 'jsonb', nullable: true })
  back_json: any[];

  @Column({ type: 'jsonb', nullable: true })
  canvas_data: Record<string, any>;

  @Column({ nullable: true })
  preview_url: string;

  @Column({ default: 0 })
  sort_order: number;

  @Column({ default: true })
  is_active: boolean;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}
