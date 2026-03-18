import {
  Entity, PrimaryGeneratedColumn, Column,
  ManyToOne, CreateDateColumn, UpdateDateColumn
} from 'typeorm'
import { Order } from '../orders/entities/order.entity'

export enum DeliveryStatus {
  ASSIGNED   = 'assigned',
  PICKED_UP  = 'picked_up',
  ON_THE_WAY = 'on_the_way',
  DELIVERED  = 'delivered',
  FAILED     = 'failed',
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

  @CreateDateColumn()
  created_at: Date

  @UpdateDateColumn()
  updated_at: Date
}