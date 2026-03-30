import {
  Entity, PrimaryGeneratedColumn, Column,
  CreateDateColumn, Index,
} from 'typeorm';

export type SubEventType =
  | 'usage_threshold_reached'
  | 'limit_exceeded'
  | 'subscription_expired'
  | 'payment_failed'
  | 'upgrade_success'
  | 'downgrade'
  | 'addon_purchased'
  | 'renewal'
  | 'cancellation';

export type EventSeverity = 'info' | 'warning' | 'critical';

@Index(['user_id', 'event_type'])
@Entity('subscription_events')
export class SubscriptionEvent {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  user_id: string;

  @Column()
  event_type: SubEventType;

  @Column({ default: 'info' })
  severity: EventSeverity;

  @Column()
  title: string;

  @Column({ nullable: true })
  message: string;

  @Column({ type: 'jsonb', nullable: true })
  metadata: Record<string, any>;

  @Column({ default: false })
  is_resolved: boolean;

  @CreateDateColumn()
  created_at: Date;
}
