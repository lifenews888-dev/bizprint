import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { Category } from './category.entity';

@Entity('category_parameters')
export class CategoryParameter {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  @Column({ nullable: true })
  name_mn: string;

  @Column({ default: 'dropdown' })
  type: string; // dropdown, radio, checkbox, step_pricing

  @Column({ nullable: true })
  unit: string; // pcs, m, kg, pages

  @Column({ type: 'jsonb', default: '[]' })
  options: {
    label: string;
    value: string;
    price_adjustment: number;
    adjustment_type: 'fixed' | 'percent';
    color?: string;
    thumbnail?: string;
  }[];

  @Column({ type: 'jsonb', nullable: true })
  tiers: {
    min_qty: number;
    max_qty: number;
    unit_price: number;
  }[] | null;

  @Column({ nullable: true })
  category_id: string;

  @ManyToOne(() => Category, { nullable: true })
  @JoinColumn({ name: 'category_id' })
  category: Category;

  @Column({ default: true })
  is_global: boolean;

  @Column({ default: true })
  is_active: boolean;

  @Column({ default: 0 })
  sort_order: number;

  @CreateDateColumn()
  created_at: Date;
}
