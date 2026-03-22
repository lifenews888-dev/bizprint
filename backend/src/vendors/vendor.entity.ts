import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, OneToMany } from 'typeorm';
import { VendorCapability } from './entities/vendor-capability.entity';

@Entity('vendors')
export class Vendor {

  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  company_name: string;

  @Column()
  contact_email: string;

  @Column({ nullable: true })
  phone: string;

  @Column({ nullable: true })
  address: string;

  @Column({ default: false })
  verified: boolean;

  @OneToMany(() => VendorCapability, (vc) => vc.vendor)
  vendor_capabilities: VendorCapability[];

  @CreateDateColumn()
  created_at: Date;
}