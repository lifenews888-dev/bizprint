import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn } from 'typeorm'
import { ProductMaster } from './product-master.entity'

@Entity('product_size_options')
export class ProductSizeOption {
  @PrimaryGeneratedColumn('uuid')
  id: string

  @Column()
  product_id: string

  @ManyToOne(() => ProductMaster, p => p.sizes, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'product_id' })
  product: ProductMaster

  @Column()
  size_code: string

  @Column()
  size_label: string

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  width_mm: number

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  height_mm: number

  @Column({ default: false })
  is_custom: boolean

  @Column({ type: 'decimal', precision: 14, scale: 2, default: 0 })
  base_price: number

  @Column({ default: 0 })
  sort_order: number
}
