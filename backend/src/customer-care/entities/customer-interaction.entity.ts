import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, CreateDateColumn } from 'typeorm'
import { CustomerProfile } from './customer-profile.entity'

export enum InteractionType {
  QUOTE_REQUESTED = 'QUOTE_REQUESTED',
  ORDER_PLACED = 'ORDER_PLACED',
  EMAIL_SENT = 'EMAIL_SENT',
  CALL_NOTE = 'CALL_NOTE',
  COMPLAINT = 'COMPLAINT',
  FEEDBACK = 'FEEDBACK',
}

@Entity('customer_interactions')
export class CustomerInteraction {
  @PrimaryGeneratedColumn('uuid')
  id: string

  @Column()
  customer_id: string

  @ManyToOne(() => CustomerProfile, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'customer_id' })
  customer: CustomerProfile

  @Column({ type: 'enum', enum: InteractionType })
  type: InteractionType

  @Column()
  title: string

  @Column({ type: 'text', nullable: true })
  content: string

  @Column({ default: 'system' })
  created_by: string

  @Column({ type: 'jsonb', nullable: true })
  metadata: any

  @CreateDateColumn()
  created_at: Date
}
