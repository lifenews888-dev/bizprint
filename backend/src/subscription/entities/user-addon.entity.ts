import {
  Entity, PrimaryGeneratedColumn, Column,
  CreateDateColumn, ManyToOne, JoinColumn,
} from 'typeorm';
import { User } from '../../users/user.entity';
import { SubscriptionAddon } from './subscription-addon.entity';
import { UserSubscription } from './user-subscription.entity';

@Entity('user_subscription_addons')
export class UserAddon {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  user_id: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'user_id' })
  user: User;

  @Column()
  addon_id: string;

  @ManyToOne(() => SubscriptionAddon)
  @JoinColumn({ name: 'addon_id' })
  addon: SubscriptionAddon;

  @Column({ nullable: true })
  subscription_id: string;

  @ManyToOne(() => UserSubscription, { nullable: true })
  @JoinColumn({ name: 'subscription_id' })
  subscription: UserSubscription;

  @Column({ nullable: true })
  payment_id: string;

  @Column({ default: true })
  is_active: boolean;

  /** Null = permanent (until subscription ends) */
  @Column({ nullable: true })
  expires_at: Date;

  @CreateDateColumn()
  purchased_at: Date;
}
