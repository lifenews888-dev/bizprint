import {
  Entity, PrimaryGeneratedColumn, Column, OneToMany,
  CreateDateColumn, UpdateDateColumn,
} from 'typeorm';
import { ProductionStage } from './production-stage.entity';

export enum ProductionStatus {
  QUEUED    = 'QUEUED',
  ASSIGNED  = 'ASSIGNED',
  PRINTING  = 'PRINTING',
  FINISHING = 'FINISHING',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED',
}

@Entity('production_jobs')
export class ProductionJob {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  // ── Order reference ────────────────────────────
  @Column({ name: 'order_id' })
  orderId: string;

  @Column({ nullable: true })
  orderNumber: string;

  @Column({ nullable: true })
  customerName: string;

  @Column({ nullable: true })
  productType: string;

  @Column({ type: 'int', default: 1 })
  quantity: number;

  @Column({ nullable: true })
  colorMode: string;

  @Column({ nullable: true })
  paperStock: string;

  // ── Machine & Vendor ───────────────────────────
  @Column({ name: 'machine_id', nullable: true })
  machineId: string;

  @Column({ nullable: true })
  machineName: string;

  @Column({ name: 'vendor_id', nullable: true })
  vendorId: string;

  @Column({ nullable: true })
  shopId: string;

  // ── Status & Priority ──────────────────────────
  @Column({
    type: 'enum',
    enum: ProductionStatus,
    default: ProductionStatus.QUEUED,
  })
  status: string;

  @Column({ default: 'normal' })
  priority: string; // rush | high | normal | low

  @Column({ nullable: true })
  deadline: Date;

  @Column({ type: 'int', nullable: true })
  estimatedMinutes: number;

  // ── Timestamps ─────────────────────────────────
  @Column({ name: 'start_time', nullable: true })
  startedAt: Date;

  @Column({ name: 'end_time', nullable: true })
  completedAt: Date;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  // ── Stages ─────────────────────────────────────
  @OneToMany(() => ProductionStage, (stage) => stage.production_job)
  stages: ProductionStage[];
}
