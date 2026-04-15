import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from 'typeorm';

export enum CommissionStatus {
  PENDING = 'pending',
  APPROVED = 'approved',
  PAID = 'paid',
  CANCELLED = 'cancelled',
}

@Entity('commission_logs')
export class CommissionLog {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ nullable: true })
  order_id: string;

  @Column({ nullable: true })
  inquiry_id: string;

  @Column({ nullable: true })
  vendor_id: string;

  @Column({ nullable: true })
  vendor_name: string;

  @Column({ type: 'decimal', precision: 14, scale: 2, default: 0 })
  gross_amount: number;

  @Column({ type: 'decimal', precision: 5, scale: 2, default: 15 })
  commission_rate: number;

  @Column({ type: 'decimal', precision: 14, scale: 2, default: 0 })
  commission_amount: number;

  @Column({ type: 'decimal', precision: 14, scale: 2, default: 0 })
  net_amount: number;

  @Column({ type: 'enum', enum: CommissionStatus, default: CommissionStatus.PENDING })
  status: CommissionStatus;

  @Column({ nullable: true })
  paid_at: Date;

  @Column({ nullable: true })
  payout_batch_id: string;

  @Column({ type: 'text', nullable: true })
  notes: string;

  @CreateDateColumn()
  created_at: Date;
}
