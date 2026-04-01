import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, OneToMany } from 'typeorm'
import { ProductMaterial } from './product-material.entity'
import { ProductSizeOption } from './product-size-option.entity'

// Legacy enum — now stored as varchar in DB, any category slug accepted
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

  @Column({ type: 'varchar', length: 50, default: 'print' })
  product_type: string  // 'print' | 'offset' | 'signage'

  @Column({ type: 'varchar', length: 100 })
  category: string

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

  @Column({ type: 'decimal', precision: 14, scale: 2, default: 0 })
  base_price: number

  @Column({ type: 'varchar', length: 50, default: 'fixed' })
  pricing_mode: string  // 'fixed' | 'formula' | 'tier'

  @Column({ type: 'jsonb', nullable: true })
  book_info: any  // { standard_sizes, recommended_pages, recommended_paper, tips, video_intro_url }

  @Column({ type: 'jsonb', nullable: true })
  paper_configs: any  // [{ label, gsm, price }]

  @Column({ type: 'jsonb', nullable: true })
  size_configs: any  // [{ code, label, width_mm, height_mm, pagesPerSig }]

  @Column({ type: 'jsonb', nullable: true })
  calc_input: any  // Calculator input state

  @Column({ type: 'jsonb', nullable: true })
  calc_overrides: any  // Manual price overrides

  @Column({ type: 'varchar', length: 20, nullable: true })
  calc_method: string  // 'offset' | 'digital'

  @Column({ type: 'decimal', precision: 14, scale: 2, nullable: true })
  unit_price: number

  @OneToMany(() => ProductMaterial, m => m.product, { cascade: true })
  materials: ProductMaterial[]

  @OneToMany(() => ProductSizeOption, s => s.product, { cascade: true })
  sizes: ProductSizeOption[]

  @CreateDateColumn()
  created_at: Date

  @UpdateDateColumn()
  updated_at: Date
}
