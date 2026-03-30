import {
  Entity, PrimaryGeneratedColumn, Column,
  CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn,
} from 'typeorm';
import { User } from '../../users/user.entity';
import { SubscriptionPlan } from './subscription-plan.entity';

export type SubStatus = 'active' | 'expired' | 'cancelled' | 'past_due' | 'trial';
export type BillingCycle = 'monthly' | 'yearly';

@Entity('user_subscriptions')
export class UserSubscription {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  user_id: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'user_id' })
  user: User;

  @Column()
  plan_id: string;

  @ManyToOne(() => SubscriptionPlan)
  @JoinColumn({ name: 'plan_id' })
  plan: SubscriptionPlan;

  @Column({ default: 'active' })
  status: SubStatus;

  @Column({ default: 'monthly' })
  billing_cycle: BillingCycle;

  @Column({ type: 'decimal', precision: 12, scale: 2, default: 0 })
  amount_paid: number;

  @Column()
  starts_at: Date;

  @Column()
  expires_at: Date;

  @Column({ nullable: true })
  cancelled_at: Date;

  @Column({ nullable: true })
  cancel_reason: string;

  /** Auto-renew */
  @Column({ default: true })
  auto_renew: boolean;

  /** Payment reference */
  @Column({ nullable: true })
  payment_id: string;

  /** Trial period? */
  @Column({ default: false })
  is_trial: boolean;

  @Column({ default: 0 })
  renewal_count: number;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}
