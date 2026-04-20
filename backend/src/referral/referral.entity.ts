import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, CreateDateColumn } from 'typeorm'
import { User } from '../users/user.entity'

@Entity('referrals')
export class Referral {
  @PrimaryGeneratedColumn('uuid')
  id: string

  @Column({ unique: true })
  code: string

  @Column()
  sales_user_id: string

  @ManyToOne(() => User)
  @JoinColumn({ name: 'sales_user_id' })
  sales_user: User

  @Column({ nullable: true })
  referred_user_id: string

  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'referred_user_id' })
  referred_user: User

  @Column({ type: 'decimal', precision: 14, scale: 2, default: 0 })
  commission_rate: number

  @Column({ type: 'decimal', precision: 14, scale: 2, default: 0 })
  total_commission: number

  @Column({ default: true })
  is_active: boolean

  @Column({ default: 0 })
  referral_count: number

  @CreateDateColumn()
  created_at: Date
}