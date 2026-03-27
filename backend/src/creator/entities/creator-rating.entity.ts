import {
  Entity, PrimaryGeneratedColumn, Column,
  CreateDateColumn,
} from 'typeorm';

export enum CreatorType {
  SOCIAL = 'social',
  PREPRESS = 'prepress',
  LIVE = 'live',
  AI = 'ai',
  UGC = 'ugc',
  // Legacy alias
  DESIGN = 'design',
}

/** Valid capability keys accepted during creator application */
export const VALID_CAPABILITIES = ['social', 'prepress', 'live', 'ai', 'ugc'] as const;

@Entity('creator_ratings')
export class CreatorRating {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  creator_id: string;

  @Column()
  customer_id: string;

  /** Reference to the job (UGC request ID or Live booking ID) */
  @Column()
  job_id: string;

  @Column({
    type: 'enum',
    enum: CreatorType,
    default: CreatorType.UGC,
  })
  creator_type: CreatorType;

  /** Overall rating 1-5 */
  @Column({ type: 'decimal', precision: 3, scale: 1 })
  overall: number;

  /* ── UGC metrics (1-5 each) ── */
  @Column({ type: 'decimal', precision: 3, scale: 1, nullable: true })
  content_quality: number;

  @Column({ type: 'decimal', precision: 3, scale: 1, nullable: true })
  creativity: number;

  @Column({ type: 'decimal', precision: 3, scale: 1, nullable: true })
  engagement_potential: number;

  /* ── Prepress / Designer metrics ── */
  @Column({ type: 'decimal', precision: 3, scale: 1, nullable: true })
  design_quality: number;

  @Column({ type: 'decimal', precision: 3, scale: 1, nullable: true })
  deadline_adherence: number;

  @Column({ type: 'decimal', precision: 3, scale: 1, nullable: true })
  communication: number;

  /** Prepress file accuracy (bleed, resolution, color) */
  @Column({ type: 'decimal', precision: 3, scale: 1, nullable: true })
  file_accuracy: number;

  /** Zoom session quality */
  @Column({ type: 'decimal', precision: 3, scale: 1, nullable: true })
  zoom_session_quality: number;

  /* ── Live metrics ── */
  @Column({ type: 'decimal', precision: 3, scale: 1, nullable: true })
  live_performance: number;

  @Column({ type: 'decimal', precision: 3, scale: 1, nullable: true })
  sales_ability: number;

  @Column({ type: 'decimal', precision: 3, scale: 1, nullable: true })
  audience_engagement: number;

  /** Text review */
  @Column({ type: 'text', nullable: true })
  review: string;

  @Column({ nullable: true })
  customer_name: string;

  @CreateDateColumn()
  created_at: Date;
}
