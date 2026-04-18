import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

export enum DesignStatus {
  PENDING    = 'pending',
  ASSIGNED   = 'assigned',
  IN_PROGRESS = 'in_progress',
  REVIEW     = 'review',
  APPROVED   = 'approved',
  REJECTED   = 'rejected',
}

@Entity('design_requests')
export class DesignRequest {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ nullable: true })
  order_id: string;

  @Column({ nullable: true })
  customer_id: string;

  @Column({ nullable: true })
  customer_name: string;

  @Column({ nullable: true })
  customer_email: string;

  @Column({ nullable: true })
  customer_phone: string;

  @Column({ nullable: true })
  designer_id: string;

  @Column({ nullable: true })
  designer_name: string;

  @Column({ nullable: true })
  designer_phone: string;

  @Column({ nullable: true })
  designer_zoom: string;

  @Column({ default: DesignStatus.PENDING })
  status: string;

  @Column({ nullable: true })
  product_name: string;

  @Column({ type: 'text', nullable: true })
  requirements: string;

  @Column({ nullable: true })
  file_url: string;

  @Column({ nullable: true })
  preview_url: string;

  @Column({ type: 'text', nullable: true })
  notes: string;

  @Column({ type: 'text', nullable: true })
  reject_reason: string;

  @Column({ nullable: true })
  deadline: Date;

  @Column({ type: 'decimal', precision: 14, scale: 2, default: 0 })
  design_fee: number;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}