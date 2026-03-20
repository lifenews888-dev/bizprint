import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn } from 'typeorm'
import { ProductMaster } from './product-master.entity'

@Entity('product_materials')
export class ProductMaterial {
  @PrimaryGeneratedColumn('uuid')
  id: string

  @Column()
  product_id: string

  @ManyToOne(() => ProductMaster, p => p.materials, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'product_id' })
  product: ProductMaster

  @Column()
  material_code: string

  @Column()
  material_name_mn: string

  @Column({ nullable: true })
  material_name_en: string

  @Column({ default: 'ш' })
  unit: string

  @Column({ type: 'decimal', precision: 14, scale: 2, default: 0 })
  base_cost: number

  @Column({ nullable: true })
  display_name: string

  @Column({ default: false })
  is_default: boolean

  @Column({ default: 0 })
  sort_order: number
}
