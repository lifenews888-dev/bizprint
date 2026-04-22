import {
  Entity, PrimaryGeneratedColumn, Column,
  CreateDateColumn, UpdateDateColumn, OneToMany,
} from 'typeorm'
import { CampaignOrder } from './campaign-order.entity'
import { CampaignMilestone } from './campaign-milestone.entity'
import { CampaignRecipient } from './campaign-recipient.entity'

/**
 * Campaign — a corporate/B2B deal that bundles many product orders under
 * one shared brand kit, recipient list, timeline and sales agent.
 *
 * Lifecycle:
 *   draft → submitted → quoted → approved → in_production
 *         → partially_delivered → completed | cancelled
 *
 * One Campaign owns:
 *   - 1+ CampaignOrder (each is a product line: business cards, flyers, …)
 *   - 0+ CampaignRecipient (per-person rows for personalised products)
 *   - 0+ CampaignMilestone (timeline checkpoints; e.g. month-1 deliverable)
 */
export enum CampaignStatus {
  DRAFT               = 'draft',                // customer building the brief
  SUBMITTED           = 'submitted',            // sent to admin for quote
  QUOTED              = 'quoted',               // admin replied with quote
  APPROVED            = 'approved',             // customer accepted
  IN_PRODUCTION       = 'in_production',
  PARTIALLY_DELIVERED = 'partially_delivered',
  COMPLETED           = 'completed',
  CANCELLED           = 'cancelled',
}

@Entity('campaigns')
export class Campaign {
  @PrimaryGeneratedColumn('uuid')
  id: string

  /** Short human-friendly code shown to admin/customer (e.g. "CMP-2026-001"). */
  @Column({ unique: true })
  code: string

  /** Customer who owns the campaign (B2B contact). */
  @Column()
  customer_id: string

  @Column({ nullable: true })
  customer_company: string

  @Column({ nullable: true })
  customer_contact_name: string

  @Column({ nullable: true })
  customer_contact_phone: string

  @Column({ nullable: true })
  customer_contact_email: string

  /** Title shown on dashboards (e.g. "Q1 2026 Brand Refresh"). */
  @Column()
  title: string

  @Column({ type: 'text', nullable: true })
  description: string

  /** Sales agent credited for the entire campaign. Same logic as
      Order.sales_agent_id — locked at submission time. */
  @Column({ nullable: true })
  sales_agent_id: string

  /** Brand kit data — logo URL, primary/secondary colours, fonts, slogan.
      Reused across every product in the campaign so designers don't
      rebuild the brand for each line. */
  @Column({ type: 'jsonb', nullable: true })
  brand_kit: {
    logo_url?: string
    primary_color?: string
    secondary_color?: string
    accent_color?: string
    font_family?: string
    slogan?: string
    company_full_name?: string
    address?: string
    website?: string
    social?: { platform: string; handle: string }[]
  }

  @Column({ type: 'enum', enum: CampaignStatus, default: CampaignStatus.DRAFT })
  status: CampaignStatus

  /** Total recipient count (for CSV-driven campaigns); 0 for bulk-only
      campaigns where every product is a single-batch run. */
  @Column({ type: 'int', default: 0 })
  recipient_count: number

  /** Estimated total budget customer pre-budgeted, in MNT. Updated when
      the admin confirms the quote. */
  @Column({ type: 'decimal', precision: 14, scale: 2, default: 0 })
  estimated_budget: number

  /** Final agreed total after quote acceptance. */
  @Column({ type: 'decimal', precision: 14, scale: 2, default: 0 })
  total_amount: number

  /** Timeline. start_date when production begins; deadline is the final
      delivery target. Per-product milestones live in CampaignMilestone. */
  @Column({ type: 'date', nullable: true })
  start_date: Date

  @Column({ type: 'date', nullable: true })
  deadline: Date

  /** Free-form notes from admin / sales conversation. */
  @Column({ type: 'text', nullable: true })
  admin_notes: string

  @CreateDateColumn()
  created_at: Date

  @UpdateDateColumn()
  updated_at: Date

  // ── Relations ──
  @OneToMany(() => CampaignOrder, o => o.campaign, { cascade: true })
  orders: CampaignOrder[]

  @OneToMany(() => CampaignMilestone, m => m.campaign, { cascade: true })
  milestones: CampaignMilestone[]

  @OneToMany(() => CampaignRecipient, r => r.campaign, { cascade: true })
  recipients: CampaignRecipient[]
}
