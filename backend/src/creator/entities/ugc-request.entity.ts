import {
  Entity, PrimaryGeneratedColumn, Column,
  CreateDateColumn, UpdateDateColumn,
} from 'typeorm';

export enum UgcRequestStatus {
  DRAFT = 'draft',
  OPEN = 'open',
  ASSIGNED = 'assigned',
  IN_PROGRESS = 'in_progress',
  SUBMITTED = 'submitted',
  REVISION = 'revision',
  APPROVED = 'approved',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled',
}

export enum UgcContentType {
  POSTER = 'poster',
  FLYER = 'flyer',
  BANNER = 'banner',
  SOCIAL_POST = 'social_post',
  STORY_REEL = 'story_reel',
  LOGO = 'logo',
  BROCHURE = 'brochure',
  BUSINESS_CARD = 'business_card',
  MENU = 'menu',
  INVITATION = 'invitation',
  VIDEO = 'video',
  PHOTO = 'photo',
  OTHER = 'other',
}

export enum UgcPackage {
  STARTER = 'starter',
  GROWTH = 'growth',
  PRO = 'pro',
  CUSTOM = 'custom',
  PER_PIECE = 'per_piece',
}

@Entity('ugc_requests')
export class UgcRequest {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  /* ── Customer (requester) ── */
  @Column()
  customer_id: string;

  @Column({ nullable: true })
  customer_name: string;

  @Column({ nullable: true })
  customer_email: string;

  /* ── Creator (fulfiller) ── */
  @Column({ nullable: true })
  creator_id: string;

  @Column({ nullable: true })
  creator_name: string;

  /* ── Request details ── */
  @Column()
  title: string;

  @Column({ type: 'text' })
  description: string;

  @Column({
    type: 'enum',
    enum: UgcContentType,
    default: UgcContentType.POSTER,
  })
  content_type: UgcContentType;

  @Column({ default: 'starter' })
  package: string;

  /** Number of deliverables */
  @Column({ default: 1 })
  quantity: number;

  /** Budget in MNT */
  @Column({ type: 'decimal', precision: 12, scale: 2, default: 0 })
  budget: number;

  /** Platform fee (escrow) */
  @Column({ type: 'decimal', precision: 12, scale: 2, default: 0 })
  platform_fee: number;

  /** Creator payout amount */
  @Column({ type: 'decimal', precision: 12, scale: 2, default: 0 })
  creator_payout: number;

  @Column({
    type: 'enum',
    enum: UgcRequestStatus,
    default: UgcRequestStatus.DRAFT,
  })
  status: UgcRequestStatus;

  /** Deadline */
  @Column({ nullable: true })
  deadline: Date;

  /** Attached reference files */
  @Column('simple-array', { nullable: true })
  reference_urls: string[];

  /** Brand guidelines / notes */
  @Column({ type: 'text', nullable: true })
  brand_notes: string;

  /* ── Deliverables ── */
  @Column('simple-array', { nullable: true })
  deliverable_urls: string[];

  /** Revision count */
  @Column({ default: 0 })
  revision_count: number;

  @Column({ default: 3 })
  max_revisions: number;

  @Column({ type: 'text', nullable: true })
  revision_notes: string;

  /* ── Payment ── */
  @Column({ default: false })
  is_paid: boolean;

  /** Payment status: pending, paid, refunded */
  @Column({ default: 'pending' })
  payment_status: string;

  /** Payment method: qpay, socialpay, card, bank */
  @Column({ nullable: true })
  payment_method: string;

  @Column({ nullable: true })
  payment_id: string;

  /** QR image for payment */
  @Column({ nullable: true })
  qr_image: string;

  /** Invoice number */
  @Column({ nullable: true })
  invoice_no: string;

  @Column({ default: false })
  is_released: boolean;

  @Column({ nullable: true })
  released_at: Date;

  /* ── Creator type: social, prepress, live ── */
  @Column({ default: 'social' })
  creator_type: string;

  /* ── Zoom workflow (social & prepress) ── */
  @Column({ nullable: true })
  zoom_meeting_id: string;

  @Column({ nullable: true })
  zoom_join_url: string;

  @Column({ nullable: true })
  zoom_start_url: string;

  @Column({ nullable: true })
  zoom_password: string;

  @Column({ nullable: true })
  zoom_scheduled_at: Date;

  /** Screen share session completed */
  @Column({ default: false })
  zoom_completed: boolean;

  @Column({ nullable: true })
  zoom_recording_url: string;

  /* ── Approval workflow ── */
  /** Current approval stage: draft, screen_share, working, review, final_check, done */
  @Column({ default: 'draft' })
  approval_stage: string;

  @Column({ nullable: true })
  approved_by: string;

  @Column({ nullable: true })
  approved_at: Date;

  /** Final production files (prepress-only: print-ready PDF, etc.) */
  @Column('simple-array', { nullable: true })
  final_file_urls: string[];

  /** Prepress specs: bleed, color profile, resolution etc. */
  @Column({ type: 'text', nullable: true })
  prepress_specs: string;

  /* ── Rating ── */
  @Column({ nullable: true })
  rating: number;

  @Column({ type: 'text', nullable: true })
  review: string;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}
