import {
  Entity, PrimaryGeneratedColumn, Column,
  CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn, Index,
} from 'typeorm'
import { Campaign } from './campaign.entity'

/**
 * CampaignRecipient — one person inside a campaign's recipient list.
 *
 * Imported from CSV. Used by personalised CampaignOrder lines (typically
 * business cards) to generate per-person variants. Bulk lines ignore this.
 *
 * The `data` JSONB holds whatever the CSV included — name, role, phone,
 * email, social handles, plus optional per-person delivery address. The
 * shape is intentionally loose so we can accept whatever the customer
 * sends without schema migrations.
 */
@Entity('campaign_recipients')
@Index(['campaign_id', 'row_number'])
export class CampaignRecipient {
  @PrimaryGeneratedColumn('uuid')
  id: string

  @Column()
  campaign_id: string

  @ManyToOne(() => Campaign, c => c.recipients, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'campaign_id' })
  campaign: Campaign

  /** 1-based row index from the source CSV (debugging / dedupe key). */
  @Column({ type: 'int' })
  row_number: number

  @Column({ nullable: true })
  full_name: string

  @Column({ nullable: true })
  job_title: string

  @Column({ nullable: true })
  department: string

  @Column({ nullable: true })
  phone: string

  @Column({ nullable: true })
  email: string

  /** Optional per-person delivery address (fall back to campaign's central
      address when null). */
  @Column({ nullable: true })
  delivery_address: string

  @Column({ nullable: true })
  delivery_city: string

  /** Free-form remaining columns from the CSV. */
  @Column({ type: 'jsonb', nullable: true })
  data: Record<string, any>

  /** Generated personalised assets per product line, e.g.
      { "business_card": { preview_url, print_pdf_url } } */
  @Column({ type: 'jsonb', nullable: true })
  generated_assets: Record<string, { preview_url?: string; print_pdf_url?: string }>

  /** Per-recipient progress: pending → printed → packed → delivered. */
  @Column({ default: 'pending' })
  status: string

  @CreateDateColumn()
  created_at: Date

  @UpdateDateColumn()
  updated_at: Date
}
