import {
  Entity, PrimaryGeneratedColumn, Column,
  CreateDateColumn, UpdateDateColumn,
} from 'typeorm';

export enum LivePlatform {
  FACEBOOK = 'facebook',
  INSTAGRAM = 'instagram',
  TIKTOK = 'tiktok',
  YOUTUBE = 'youtube',
  OTHER = 'other',
}

export enum LiveBookingStatus {
  PENDING = 'pending',
  CONFIRMED = 'confirmed',
  IN_PROGRESS = 'in_progress',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled',
}

@Entity('live_bookings')
export class LiveBooking {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  /* ── Customer ── */
  @Column()
  customer_id: string;

  @Column({ nullable: true })
  customer_name: string;

  /* ── Creator ── */
  @Column({ nullable: true })
  creator_id: string;

  @Column({ nullable: true })
  creator_name: string;

  /* ── Booking details ── */
  @Column()
  title: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({
    type: 'enum',
    enum: LivePlatform,
    default: LivePlatform.FACEBOOK,
  })
  platform: LivePlatform;

  /** Scheduled date/time */
  @Column()
  scheduled_at: Date;

  /** Duration in minutes */
  @Column({ default: 60 })
  duration_minutes: number;

  /** Budget in MNT */
  @Column({ type: 'decimal', precision: 12, scale: 2, default: 0 })
  budget: number;

  @Column({ type: 'decimal', precision: 12, scale: 2, default: 0 })
  platform_fee: number;

  @Column({ type: 'decimal', precision: 12, scale: 2, default: 0 })
  creator_payout: number;

  @Column({
    type: 'enum',
    enum: LiveBookingStatus,
    default: LiveBookingStatus.PENDING,
  })
  status: LiveBookingStatus;

  /** Product/brand to promote */
  @Column({ nullable: true })
  product_name: string;

  @Column('simple-array', { nullable: true })
  reference_urls: string[];

  /** Stream URL */
  @Column({ nullable: true })
  stream_url: string;

  /** Recording URL after completion */
  @Column({ nullable: true })
  recording_url: string;

  /** Viewer count */
  @Column({ default: 0 })
  viewer_count: number;

  @Column({ nullable: true })
  rating: number;

  @Column({ type: 'text', nullable: true })
  review: string;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}
