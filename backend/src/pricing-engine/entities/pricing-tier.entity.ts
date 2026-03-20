import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm'

@Entity('pricing_tiers')
export class PricingTier {
  @PrimaryGeneratedColumn('uuid')
  id: string

  @Column({ unique: true })
  code: string

  @Column()
  name_mn: string

  @Column({ type: 'decimal', precision: 5, scale: 2 })
  margin_rate: number

  @Column({ type: 'decimal', precision: 14, scale: 2, default: 0 })
  min_order_amount: number

  @Column({ type: 'text', nullable: true })
  description: string

  @Column({ default: true })
  is_active: boolean
}
