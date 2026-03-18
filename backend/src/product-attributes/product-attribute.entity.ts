import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, CreateDateColumn } from 'typeorm';
import { Product } from '../products/product.entity';

export enum AttributeType {
  SELECT = 'select',
  NUMBER = 'number',
  DIMENSIONS = 'dimensions',
  CHECKBOX = 'checkbox',
  TEXT = 'text',
}

@Entity('product_attributes')
export class ProductAttribute {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  product_id: string;

  @ManyToOne(() => Product)
  @JoinColumn({ name: 'product_id' })
  product: Product;

  @Column()
  name: string;

  @Column()
  name_mn: string;

  @Column({ type: 'varchar', default: 'select' })
  type: string;

  @Column({ type: 'jsonb', nullable: true })
  options: any;

  @Column({ nullable: true })
  unit: string;

  @Column({ nullable: true })
  default_value: string;

  @Column({ default: false })
  required: boolean;

  @Column({ default: 0 })
  sort_order: number;
}