import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

export enum DesignStatus {
  // ── Initial ───────────────────────────────────────────────
  PENDING       = 'pending',        // Created, no designer yet
  ASSIGNED      = 'assigned',       // Designer assigned

  // ── Work in progress ──────────────────────────────────────
  IN_PROGRESS   = 'in_progress',    // Designer is working

  // ── Review loop ───────────────────────────────────────────
  UNDER_REVIEW  = 'under_review',   // Designer submitted → customer reviews
  REVISION_REQUESTED = 'revision_requested', // Customer wants changes
  UPDATED_VERSION = 'updated_version',       // Designer uploaded new version

  // ── Consultation ──────────────────────────────────────────
  ZOOM_SCHEDULED = 'zoom_scheduled', // Live session requested

  // ── Final ─────────────────────────────────────────────────
  APPROVED      = 'approved',       // Customer approved → trigger production
  IN_PRODUCTION = 'in_production',  // Locked, sent to production

  // ── Terminal ──────────────────────────────────────────────
  REJECTED      = 'rejected',       // Rejected (cancelled)
}

@Entity('design_requests')
export class DesignRequest {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ nullable: true })
  order_id: string;

  // ── Customer ──────────────────────────────────────────────
  @Column({ nullable: true })
  customer_id: string;

  @Column({ nullable: true })
  customer_name: string;

  @Column({ nullable: true })
  customer_email: string;

  @Column({ nullable: true })
  customer_phone: string;

  // ── Designer ──────────────────────────────────────────────
  @Column({ nullable: true })
  designer_id: string;

  @Column({ nullable: true })
  designer_name: string;

  @Column({ nullable: true })
  designer_phone: string;

  /** Designer's personal Zoom link (fallback if no Zoom API) */
  @Column({ nullable: true })
  designer_zoom: string;

  // ── Status & Version ──────────────────────────────────────
  @Column({ default: DesignStatus.PENDING })
  status: string;

  /** Current design version number (1, 2, 3...) */
  @Column({ type: 'int', default: 0 })
  current_version: number;

  /** Locked when APPROVED — prevents further changes */
  @Column({ default: false })
  approval_locked: boolean;

  // ── Design files (latest version shortcut) ────────────────
  @Column({ nullable: true })
  file_url: string;

  @Column({ nullable: true })
  preview_url: string;

  // ── Content ───────────────────────────────────────────────
  @Column({ nullable: true })
  product_name: string;

  @Column({ type: 'text', nullable: true })
  requirements: string;

  @Column({ type: 'text', nullable: true })
  notes: string;

  @Column({ type: 'text', nullable: true })
  reject_reason: string;

  @Column({ nullable: true })
  deadline: Date;

  @Column({ type: 'decimal', precision: 14, scale: 2, default: 0 })
  design_fee: number;

  // ── Zoom meeting (created via API or personal link) ────────
  @Column({ nullable: true })
  zoom_meeting_id: string;

  @Column({ nullable: true })
  zoom_join_url: string;

  @Column({ nullable: true })
  zoom_start_url: string;

  @Column({ nullable: true })
  zoom_password: string;

  /** Customer's preferred Zoom meeting time (set when requesting zoom) */
  @Column({ nullable: true })
  zoom_preferred_at: Date;

  // ── Timestamps ─────────────────────────────────────────────
  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}
