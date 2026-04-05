import {
  Entity, PrimaryGeneratedColumn, Column, ManyToOne,
  JoinColumn, CreateDateColumn,
} from 'typeorm';
import { B2BCompany } from './b2b-company.entity';
import { User } from '../../users/user.entity';

export enum B2BMemberRole {
  OWNER   = 'owner',
  MANAGER = 'manager',
  BUYER   = 'buyer',
}

@Entity('b2b_members')
export class B2BMember {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  companyId: string;

  @ManyToOne(() => B2BCompany, c => c.members)
  @JoinColumn({ name: 'companyId' })
  company: B2BCompany;

  @Column()
  userId: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'userId' })
  user: User;

  @Column({ type: 'enum', enum: B2BMemberRole, default: B2BMemberRole.BUYER })
  role: B2BMemberRole;

  @Column('decimal', { precision: 15, scale: 2, nullable: true })
  monthlyBudget: number; // Сарын зарцуулгын хязгаар

  @Column('decimal', { precision: 15, scale: 2, default: 0 })
  budgetUsed: number; // Энэ сард зарцуулсан

  @Column({ default: true })
  canPlaceOrder: boolean;

  @Column({ default: false })
  requiresApproval: boolean; // Захиалга илгээхэд батлах шаардлагатай

  @CreateDateColumn()
  createdAt: Date;
}
