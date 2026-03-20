import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from 'typeorm'

export enum CustomerType {
  INDIVIDUAL = 'INDIVIDUAL',
  COMPANY = 'COMPANY',
}

@Entity('customer_profiles')
export class CustomerProfile {
  @PrimaryGeneratedColumn('uuid')
  id: string

  @Column({ nullable: true })
  user_id: string

  @Column({ nullable: true })
  guest_email: string

  @Column()
  name: string

  @Column({ nullable: true })
  phone: string

  @Column({ nullable: true })
  company_name: string

  @Column({ nullable: true })
  company_register: string

  @Column({ type: 'enum', enum: CustomerType, default: CustomerType.INDIVIDUAL })
  customer_type: CustomerType

  @Column({ default: 'RETAIL' })
  pricing_tier: string

  @Column({ default: 0 })
  total_orders: number

  @Column({ type: 'decimal', precision: 14, scale: 2, default: 0 })
  total_spent: number

  @Column({ type: 'text', nullable: true })
  notes: string

  @Column({ type: 'simple-array', nullable: true })
  tags: string[]

  @Column({ type: 'timestamp', nullable: true })
  last_contact_at: Date

  @CreateDateColumn()
  created_at: Date
}
