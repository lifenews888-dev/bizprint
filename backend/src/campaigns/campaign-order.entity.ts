import {
  Entity, PrimaryGeneratedColumn, Column,
  CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn,
} from 'typeorm'
import { Campaign } from './campaign.entity'

/**
 * CampaignOrder — one product line within a campaign.
 *
 * A campaign typically has many of these: business cards, flyers,
 * banners, stickers, etc. Each line either:
 *   - personalised  → one variant per CampaignRecipient (business cards)
 *   - bulk          → one design printed N times (flyers, banners)
 *
 * Once the customer approves the campaign quote, each CampaignOrder
 * spawns a real Order row in the orders table for production tracking.
 * The Order is linked back via spawned_order_id.
 */
export enum CampaignOrderType {
  PERSONALISED = 'personalised',  // one variant per recipient
  BULK         = 'bulk',          // identical units
}

export enum CampaignOrderStatus {
  PLANNED      = 'planned',       // included in brief
  QUOTED       = 'quoted',
  APPROVED     = 'approved',
  IN_PRODUCTION = 'in_production',
  DISPATCHED   = 'dispatched',
  DELIVERED    = 'delivered',
  CANCELLED    = 'cancelled',
}

@Entity('campaign_orders')
export class CampaignOrder {
  @PrimaryGeneratedColumn('uuid')
  id: string

  @Column()
  campaign_id: string

  @ManyToOne(() => Campaign, c => c.orders, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'campaign_id' })
  campaign: Campaign

  /** Product catalog reference (the master product / template). */
  @Column({ nullable: true })
  product_id: string

  @Column({ nullable: true })
  product_name: string

  /** business-card | flyer | banner | sticker | poster | book | … */
  @Column({ nullable: true })
  product_category: string

  @Column({ type: 'enum', enum: CampaignOrderType, default: CampaignOrderType.BULK })
  type: CampaignOrderType

  /** Total units (sum of per-recipient or single bulk count). */
  @Column({ type: 'int', default: 0 })
  quantity: number

  /** For personalised lines: how many cards per person (e.g. 200/500/1000).
      For bulk lines this is null and `quantity` is the only count. */
  @Column({ type: 'int', nullable: true })
  per_recipient_qty: number

  /** Customer-facing price per unit + extended total. */
  @Column({ type: 'decimal', precision: 14, scale: 2, default: 0 })
  unit_price: number

  @Column({ type: 'decimal', precision: 14, scale: 2, default: 0 })
  total_price: number

  /** Production specifications (paper, finish, size, sides, …). */
  @Column({ type: 'jsonb', nullable: true })
  specs: Record<string, any>

  /** Optional override of the campaign's brand kit for this product line. */
  @Column({ type: 'jsonb', nullable: true })
  design_overrides: Record<string, any>

  @Column({ type: 'enum', enum: CampaignOrderStatus, default: CampaignOrderStatus.PLANNED })
  status: CampaignOrderStatus

  /** Scheduled production start date for this line (drawn from the
      campaign's milestone timeline). */
  @Column({ type: 'date', nullable: true })
  scheduled_start: Date

  @Column({ type: 'date', nullable: true })
  scheduled_delivery: Date

  /** Real Order row spawned at production start. Null until approved. */
  @Column({ nullable: true })
  spawned_order_id: string

  @CreateDateColumn()
  created_at: Date

  @UpdateDateColumn()
  updated_at: Date
}
