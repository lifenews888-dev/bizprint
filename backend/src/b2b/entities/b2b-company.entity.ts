import {
  Entity, PrimaryGeneratedColumn, Column, OneToMany,
  CreateDateColumn, UpdateDateColumn,
} from 'typeorm';
import { B2BMember } from './b2b-member.entity';
import { B2BApprovalFlow } from './b2b-approval-flow.entity';

export enum B2BPaymentTerms {
  PREPAID   = 'prepaid',
  NET_15    = 'net_15',
  NET_30    = 'net_30',
  NET_60    = 'net_60',
}

@Entity('b2b_companies')
export class B2BCompany {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  @Column({ nullable: true, unique: true })
  registrationNo: string; // Аж ахуйн нэгжийн регистр

  @Column({ nullable: true })
  vatNo: string; // НӨАТ

  @Column({ nullable: true })
  address: string;

  @Column({ nullable: true })
  phone: string;

  @Column({ nullable: true })
  email: string;

  @Column({ nullable: true })
  website: string;

  @Column({ nullable: true })
  logoUrl: string;

  @Column('decimal', { precision: 15, scale: 2, default: 0 })
  creditLimit: number; // MNT

  @Column('decimal', { precision: 15, scale: 2, default: 0 })
  creditUsed: number;

  @Column({ type: 'enum', enum: B2BPaymentTerms, default: B2BPaymentTerms.PREPAID })
  paymentTerms: B2BPaymentTerms;

  @Column({ type: 'decimal', precision: 5, scale: 2, default: 0 })
  discountRate: number; // % хөнгөлөлт

  @Column({ type: 'jsonb', nullable: true })
  customPricing: Record<string, number>; // productType → customPrice

  @Column({ default: 'active' })
  status: string; // active, suspended, pending

  @OneToMany(() => B2BMember, m => m.company)
  members: B2BMember[];

  @OneToMany(() => B2BApprovalFlow, f => f.company)
  approvalFlows: B2BApprovalFlow[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
