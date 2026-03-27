import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, OneToMany } from 'typeorm'
import { ProductMaterial } from './product-material.entity'
import { ProductSizeOption } from './product-size-option.entity'

export enum ProductCategory {
  HADAG_REKLAM = 'HADAG_REKLAM',
  KHEVLEL = 'KHEVLEL',
  PROMO = 'PROMO',
  AWARD = 'AWARD',
}

export enum UnitType {
  PIECE = 'PIECE',
  M2 = 'M2',
  METER = 'METER',
  SET = 'SET',
}

@Entity('product_masters')
export class ProductMaster {
  @PrimaryGeneratedColumn('uuid')
  id: string

  @Column({ unique: true, nullable: true })
  code: string

  @Column()
  name_mn: string

  @Column({ nullable: true })
  name_en: string

  @Column({ type: 'enum', enum: ProductCategory })
  category: ProductCategory

  @Column({ nullable: true })
  subcategory: string

  @Column({ type: 'text', nullable: true })
  description: string

  @Column({ type: 'enum', enum: UnitType, default: UnitType.PIECE })
  unit_type: UnitType

  @Column({ default: true })
  is_active: boolean

  @Column({ default: 0 })
  sort_order: number

  @Column({ nullable: true })
  thumbnail_url: string

  @Column({ type: 'simple-json', nullable: true })
  images: string[]

  @Column({ nullable: true })
  video_url: string

  @OneToMany(() => ProductMaterial, m => m.product, { cascade: true })
  materials: ProductMaterial[]

  @OneToMany(() => ProductSizeOption, s => s.product, { cascade: true })
  sizes: ProductSizeOption[]

  @CreateDateColumn()
  created_at: Date

  @UpdateDateColumn()
  updated_at: Date
}
