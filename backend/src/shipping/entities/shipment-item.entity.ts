import {
  Entity, PrimaryGeneratedColumn, Column,
  CreateDateColumn, ManyToOne, JoinColumn,
} from 'typeorm';
import { Shipment } from './shipment.entity';
import { OrderItem } from '../../orders/entities/order-item.entity';

@Entity('shipment_items')
export class ShipmentItem {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  shipment_id: string;

  @ManyToOne(() => Shipment, (shipment) => shipment.shipment_items)
  @JoinColumn({ name: 'shipment_id' })
  shipment: Shipment;

  @Column()
  order_item_id: string;

  @ManyToOne(() => OrderItem)
  @JoinColumn({ name: 'order_item_id' })
  order_item: OrderItem;

  @Column()
  quantity: number;

  @CreateDateColumn()
  created_at: Date;
}
