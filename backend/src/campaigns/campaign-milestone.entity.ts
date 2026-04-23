import {
  Entity, PrimaryGeneratedColumn, Column,
  CreateDateColumn, ManyToOne, JoinColumn,
} from 'typeorm'
import { Campaign } from './campaign.entity'

/**
 * CampaignMilestone — a checkpoint in a campaign's timeline.
 *
 * Examples for a 100-day campaign:
 *   Day 0-30:  business cards delivered to all 20,000 recipients
 *   Day 30-60: 50,000 flyers + 5,000 brochures
 *   Day 60-90: event signage in 5 cities
 *   Day 90:    campaign close + final report
 *
 * Each milestone may reference one CampaignOrder (deliverable for that
 * milestone), or be a standalone admin checkpoint (kickoff, design
 * approval, payment milestone).
 */
export enum MilestoneType {
  DELIVERABLE = 'deliverable', // physical product handover
  PAYMENT     = 'payment',     // invoice + payment due
  REVIEW      = 'review',      // customer/admin sign-off
  CUSTOM      = 'custom',
}

export enum MilestoneStatus {
  UPCOMING   = 'upcoming',
  IN_PROGRESS = 'in_progress',
  COMPLETED  = 'completed',
  OVERDUE    = 'overdue',
  SKIPPED    = 'skipped',
}

@Entity('campaign_milestones')
export class CampaignMilestone {
  @PrimaryGeneratedColumn('uuid')
  id: string

  @Column()
  campaign_id: string

  @ManyToOne(() => Campaign, c => c.milestones, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'campaign_id' })
  campaign: Campaign

  /** Optional CampaignOrder this milestone tracks. */
  @Column({ nullable: true })
  campaign_order_id: string

  @Column()
  title: string

  @Column({ type: 'text', nullable: true })
  description: string

  @Column({ type: 'enum', enum: MilestoneType, default: MilestoneType.DELIVERABLE })
  type: MilestoneType

  @Column({ type: 'enum', enum: MilestoneStatus, default: MilestoneStatus.UPCOMING })
  status: MilestoneStatus

  @Column({ type: 'date' })
  due_date: Date

  @Column({ type: 'date', nullable: true })
  completed_at: Date

  /** Display order in the timeline. */
  @Column({ type: 'int', default: 0 })
  sort_order: number

  /** Amount owed at this checkpoint (only for PAYMENT type). */
  @Column({ type: 'decimal', precision: 14, scale: 2, nullable: true })
  amount: number

  @CreateDateColumn()
  created_at: Date
}
