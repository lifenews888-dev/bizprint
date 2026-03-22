import {
  Entity, PrimaryGeneratedColumn, Column,
  CreateDateColumn, UpdateDateColumn, ManyToOne, OneToMany, JoinColumn,
} from 'typeorm';
import { Order } from './order.entity';
import { Vendor } from '../../vendors/vendor.entity';

@Entity('order_vendor_groups')
export class OrderVendorGroup {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  order_id: string;

  @ManyToOne(() => Order, (order) => order.vendor_groups)
  @JoinColumn({ name: 'order_id' })
  order: Order;

  @Column()
  vendor_id: string;

  @ManyToOne(() => Vendor, { nullable: false })
  @JoinColumn({ name: 'vendor_id' })
  vendor: Vendor;

  @Column({ type: 'decimal', precision: 14, scale: 2, default: 0 })
  subtotal: number;

  @Column({ default: 'pending' })
  status: string;

  @Column({ nullable: true })
  assigned_at: Date;

  @Column({ nullable: true })
  completed_at: Date;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}
