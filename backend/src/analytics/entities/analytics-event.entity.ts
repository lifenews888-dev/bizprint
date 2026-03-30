import {
  Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, Index,
} from 'typeorm';

/** Unified analytics event for all QR/page interactions */
@Entity('analytics_events')
@Index(['entity_type', 'entity_id'])
@Index(['user_id'])
@Index(['created_at'])
export class AnalyticsEvent {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  /** Entity: digital_card | invitation | product_qr | quote */
  @Column()
  entity_type: string;

  @Column()
  entity_id: string;

  /** Event type: view | scan | save | share | rsvp | reorder | click */
  @Column()
  event_type: string;

  /** Owner of the entity */
  @Column({ nullable: true })
  user_id: string;

  /** Visitor info */
  @Column({ nullable: true })
  visitor_ip: string;

  @Column({ nullable: true })
  visitor_ua: string;

  @Column({ nullable: true })
  referrer: string;

  @Column({ nullable: true })
  country: string;

  @Column({ nullable: true })
  city: string;

  @Column({ nullable: true })
  device_type: string;

  @Column({ nullable: true })
  browser: string;

  @Column({ nullable: true })
  os: string;

  /** Extra metadata */
  @Column({ type: 'jsonb', nullable: true })
  metadata: Record<string, any>;

  @CreateDateColumn()
  created_at: Date;
}
