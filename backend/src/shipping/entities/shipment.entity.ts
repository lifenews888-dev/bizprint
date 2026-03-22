import {
  Entity, PrimaryGeneratedColumn, Column,
  CreateDateColumn, UpdateDateColumn, ManyToOne, OneToMany, JoinColumn,
} from 'typeorm';
import { Order } from '../../orders/entities/order.entity';
import { OrderVendorGroup } from '../../orders/entities/order-vendor-group.entity';
import { ShipmentItem } from './shipment-item.entity';

export enum ShipmentStatus {
  PREPARING = 'preparing',
  PICKED_UP = 'picked_up',
  IN_TRANSIT = 'in_transit',
  DELIVERED = 'delivered',
  RETURNED = 'returned',
}

@Entity('shipments')
export class Shipment {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  order_id: string;

  @ManyToOne(() => Order, (order) => order.shipments)
  @JoinColumn({ name: 'order_id' })
  order: Order;

  @Column({ nullable: true })
  vendor_group_id: string;

  @ManyToOne(() => OrderVendorGroup, { nullable: true })
  @JoinColumn({ name: 'vendor_group_id' })
  vendor_group: OrderVendorGroup;

  @Column({ nullable: true })
  tracking_number: string;

  @Column({ nullable: true })
  carrier: string;

  @Column({ type: 'enum', enum: ShipmentStatus, default: ShipmentStatus.PREPARING })
  status: ShipmentStatus;

  @Column({ nullable: true })
  shipped_at: Date;

  @Column({ nullable: true })
  delivered_at: Date;

  @Column({ type: 'date', nullable: true })
  estimated_delivery: Date;

  @Column({ type: 'jsonb', nullable: true })
  shipping_address: Record<string, any>;

  @Column({ type: 'text', nullable: true })
  notes: string;

  @OneToMany(() => ShipmentItem, (si) => si.shipment)
  shipment_items: ShipmentItem[];

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}
