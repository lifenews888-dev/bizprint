import {
  Entity, PrimaryGeneratedColumn, Column,
  CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn, Index,
} from 'typeorm';
import { Vendor } from '../vendor.entity';
import { Capability } from './capability.entity';

@Entity('vendor_capabilities')
@Index('UQ_vendor_capability', ['vendor_id', 'capability_id'], { unique: true })
export class VendorCapability {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  vendor_id: string;

  @ManyToOne(() => Vendor)
  @JoinColumn({ name: 'vendor_id' })
  vendor: Vendor;

  @Column()
  capability_id: string;

  @ManyToOne(() => Capability)
  @JoinColumn({ name: 'capability_id' })
  capability: Capability;

  @Column({ type: 'jsonb', nullable: true })
  specs: Record<string, any>;

  @Column({ default: true })
  is_active: boolean;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}
