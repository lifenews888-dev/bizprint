import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm'

@Entity('competitor_prices')
export class CompetitorPrice {
  @PrimaryGeneratedColumn('uuid')
  id: string

  @Column()
  factory_name: string

  @Column({ default: 'offset' })
  product_type: string  // 'offset' | 'wide' | 'sign'

  @Column({ nullable: true })
  product_subtype: string  // e.g. 'flyer', 'banner', 'tovgor', 'nerj'

  @Column({ nullable: true })
  size: string  // e.g. 'A4', 'A3', '60cm', '1x2m'

  @Column({ type: 'int', nullable: true })
  gsm: number  // paper weight, offset only

  @Column({ type: 'int', default: 1 })
  quantity_min: number

  @Column({ type: 'int', nullable: true })
  quantity_max: number

  @Column({ type: 'decimal', precision: 14, scale: 2 })
  unit_price: number

  @Column({ type: 'decimal', precision: 14, scale: 2, nullable: true })
  total_price: number

  @Column({ type: 'date', nullable: true })
  date_collected: Date

  @Column({ nullable: true })
  notes: string

  @Column({ default: true })
  is_active: boolean

  // backward compat fields (will be removed later)
  @Column({ nullable: true })
  competitor_name: string

  @Column({ nullable: true })
  product_code: string

  @Column({ type: 'decimal', precision: 14, scale: 2, nullable: true })
  price: number

  @CreateDateColumn()
  created_at: Date

  @UpdateDateColumn()
  updated_at: Date
}
