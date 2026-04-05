import {
  Entity, PrimaryGeneratedColumn, Column, ManyToOne,
  JoinColumn, CreateDateColumn,
} from 'typeorm';
import { B2BCompany } from './b2b-company.entity';

@Entity('b2b_approval_flows')
export class B2BApprovalFlow {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  companyId: string;

  @ManyToOne(() => B2BCompany)
  @JoinColumn({ name: 'companyId' })
  company: B2BCompany;

  @Column()
  orderId: string;

  @Column()
  requestedById: string;

  @Column({ type: 'enum', enum: ['pending', 'approved', 'rejected'], default: 'pending' })
  status: string;

  @Column({ nullable: true })
  reviewedById: string;

  @Column({ nullable: true, type: 'text' })
  reviewNote: string;

  @Column({ nullable: true })
  reviewedAt: Date;

  @CreateDateColumn()
  createdAt: Date;
}
