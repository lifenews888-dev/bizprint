import {
  Entity, PrimaryGeneratedColumn, Column,
  ManyToOne, CreateDateColumn, UpdateDateColumn
} from 'typeorm'
import { Order } from '../orders/entities/order.entity'

export enum DeliveryStatus {
  PENDING    = 'pending',
  ASSIGNED   = 'assigned',
  PICKED_UP  = 'picked_up',
  ON_THE_WAY = 'on_the_way',
  IN_TRANSIT = 'in_transit',
  DELIVERED  = 'delivered',
  FAILED     = 'failed',
  CANCELLED  = 'cancelled',
}

@Entity()
export class Delivery {
  @PrimaryGeneratedColumn()
  id: number

  @ManyToOne(() => Order, { eager: true })
  order: Order

  @Column({ nullable: true })
  courier_id: number

  @Column({ nullable: true })
  courier_name: string

  @Column({ nullable: true })
  courier_phone: string

  @Column({ type: 'enum', enum: DeliveryStatus, default: DeliveryStatus.ASSIGNED })
  status: DeliveryStatus

  @Column({ nullable: true })
  address: string

  @Column({ nullable: true })
  note: string

  @Column({ nullable: true })
  estimated_at: Date

  // Third-party provider fields
  @Column({ nullable: true })
  provider: string

  @Column({ nullable: true })
  provider_order_id: string

  @Column({ nullable: true })
  provider_tracking_url: string

  @Column({ type: 'jsonb', nullable: true })
  provider_data: Record<string, any>

  @Column({ nullable: true })
  recipient_name: string

  @Column({ nullable: true })
  recipient_phone: string

  @Column({ type: 'decimal', precision: 10, scale: 6, nullable: true })
  lat: number

  @Column({ type: 'decimal', precision: 10, scale: 6, nullable: true })
  lng: number

  @CreateDateColumn()
  created_at: Date

  @UpdateDateColumn()
  updated_at: Date
}
