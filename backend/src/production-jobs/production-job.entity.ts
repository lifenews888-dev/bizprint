import {
  Entity, PrimaryGeneratedColumn, Column,
  ManyToOne, CreateDateColumn, UpdateDateColumn
} from 'typeorm'
import { Order } from '../orders/entities/order.entity'

export enum ProductionJobStatus {
  PENDING     = 'pending',
  IN_PROGRESS = 'in_progress',
  COMPLETED   = 'completed',
  CANCELLED   = 'cancelled',
}

@Entity()
export class ProductionJob {
  @PrimaryGeneratedColumn()
  id: number

  @Column({ type: 'enum', enum: ProductionJobStatus, default: ProductionJobStatus.PENDING })
  status: ProductionJobStatus

  @Column({ nullable: true })
  notes: string

  @ManyToOne(() => Order, { nullable: true, eager: true })
  order: Order

  @CreateDateColumn()
  created_at: Date

  @UpdateDateColumn()
  updated_at: Date
}