import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm'

export enum QuoteDeliveryChannel {
  EMAIL = 'EMAIL',
  DASHBOARD = 'DASHBOARD',
  SMS = 'SMS',
  MESSENGER = 'MESSENGER',
}

export enum QuoteDeliveryStatus {
  DRAFT = 'DRAFT',
  SENT = 'SENT',
  OPENED = 'OPENED',
  ACCEPTED = 'ACCEPTED',
  EXPIRED = 'EXPIRED',
  CANCELLED = 'CANCELLED',
}

@Entity('quote_deliveries')
export class QuoteDelivery {
  @PrimaryGeneratedColumn('uuid')
  id: string

  @Column({ name: 'quote_id' })
  quote_id: string

  @Column({ nullable: true })
  recipient_email: string

  @Column({ nullable: true })
  recipient_phone: string

  @Column({ type: 'varchar', default: QuoteDeliveryChannel.EMAIL })
  delivery_channel: QuoteDeliveryChannel

  @Column({ type: 'varchar', default: QuoteDeliveryStatus.DRAFT })
  status: QuoteDeliveryStatus

  @Column({ unique: true })
  public_token_hash: string

  @Column({ type: 'timestamptz', nullable: true })
  sent_at: Date

  @Column({ type: 'timestamptz', nullable: true })
  opened_at: Date

  @Column({ type: 'timestamptz', nullable: true })
  accepted_at: Date

  @Column({ type: 'timestamptz' })
  expires_at: Date

  @CreateDateColumn()
  created_at: Date

  @UpdateDateColumn()
  updated_at: Date
}
