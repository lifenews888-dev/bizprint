import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from 'typeorm';

@Entity('payment_logs')
export class PaymentLog {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ nullable: true })
  order_id: string;

  @Column({ nullable: true })
  invoice_id: string;

  @Column({ nullable: true })
  transaction_id: string;

  @Column({ default: 'bonum' })
  provider: string;

  @Column({ default: 'webhook' })
  event_type: string;

  @Column({ nullable: true })
  status: string;

  @Column({ type: 'decimal', precision: 14, scale: 2, nullable: true })
  amount: number;

  @Column({ type: 'jsonb', nullable: true })
  raw_payload: any;

  @Column({ default: false })
  checksum_valid: boolean;

  @Column({ nullable: true })
  ip_address: string;

  @CreateDateColumn()
  created_at: Date;
}
