import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm'

export enum PriceType {
  FIXED = 'FIXED',
  PER_M2 = 'PER_M2',
  PER_PIECE = 'PER_PIECE',
  HOURLY = 'HOURLY',
}

@Entity('product_addons')
export class ProductAddon {
  @PrimaryGeneratedColumn('uuid')
  id: string

  @Column({ unique: true })
  code: string

  @Column()
  name_mn: string

  @Column({ type: 'decimal', precision: 14, scale: 2, default: 0 })
  price: number

  @Column({ type: 'enum', enum: PriceType, default: PriceType.FIXED })
  price_type: PriceType

  @Column({ type: 'simple-array', nullable: true })
  applicable_products: string[]

  @Column({ type: 'text', nullable: true })
  description: string

  @Column({ default: true })
  is_active: boolean
}
