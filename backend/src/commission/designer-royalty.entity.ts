import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from 'typeorm'
import { CommissionStatus } from './commission.entity'

/**
 * DesignerRoyalty — payout owed to a template designer when their template
 * was used to produce an order. Mirrors SalesCommission and CommissionLog
 * so admin payout flows are uniform.
 */
@Entity('designer_royalties')
export class DesignerRoyalty {
  @PrimaryGeneratedColumn('uuid')
  id: string

  @Column({ nullable: true })
  order_id: string

  @Column()
  designer_user_id: string

  @Column({ nullable: true })
  template_id: string

  @Column({ nullable: true })
  template_name: string

  @Column({ type: 'decimal', precision: 14, scale: 2, default: 0 })
  order_total: number

  @Column({ type: 'decimal', precision: 5, scale: 2, default: 5 })
  royalty_rate: number

  @Column({ type: 'decimal', precision: 14, scale: 2, default: 0 })
  royalty_amount: number

  @Column({ type: 'enum', enum: CommissionStatus, default: CommissionStatus.PENDING })
  status: CommissionStatus

  @Column({ nullable: true })
  paid_at: Date

  @Column({ nullable: true })
  payout_batch_id: string

  @CreateDateColumn()
  created_at: Date
}
