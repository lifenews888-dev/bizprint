import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm'

@Entity('product_finishings')
export class ProductFinishing {
  @PrimaryGeneratedColumn('uuid')
  id: string

  @Column({ unique: true })
  code: string

  @Column()
  name_mn: string

  @Column({ type: 'decimal', precision: 14, scale: 2, default: 0 })
  price_per_m2: number

  @Column({ type: 'decimal', precision: 14, scale: 2, default: 0 })
  price_per_piece: number

  @Column({ type: 'simple-array', nullable: true })
  applicable_categories: string[]

  @Column({ default: true })
  is_active: boolean
}
