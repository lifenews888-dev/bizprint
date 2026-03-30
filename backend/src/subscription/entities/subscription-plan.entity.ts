import {
  Entity, PrimaryGeneratedColumn, Column,
  CreateDateColumn, UpdateDateColumn,
} from 'typeorm';

export type PlanTier = 'free' | 'pro' | 'business' | 'enterprise';

@Entity('subscription_plans')
export class SubscriptionPlan {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  slug: string;

  @Column()
  name: string;

  @Column({ nullable: true })
  description: string;

  @Column({ default: 'free' })
  tier: PlanTier;

  // ── Pricing ──
  /** Monthly price in MNT */
  @Column({ type: 'decimal', precision: 12, scale: 2, default: 0 })
  price_monthly: number;

  /** Yearly price in MNT */
  @Column({ type: 'decimal', precision: 12, scale: 2, default: 0 })
  price_yearly: number;

  // ── Limits ──
  @Column({ default: 1 })
  max_digital_cards: number;

  @Column({ default: 0 })
  max_invitations: number;

  @Column({ default: 0 })
  max_product_qrs: number;

  @Column({ default: 5 })
  max_qr_codes: number;

  /** Max file storage in MB */
  @Column({ default: 50 })
  max_storage_mb: number;

  /** Max loyalty campaigns */
  @Column({ default: 0 })
  max_loyalty_campaigns: number;

  // ── Features ──
  @Column({ default: false })
  loyalty_enabled: boolean;

  @Column({ default: false })
  qr_campaign_enabled: boolean;

  @Column({ default: false })
  custom_domain: boolean;

  @Column({ default: false })
  remove_branding: boolean;

  @Column({ default: false })
  advanced_analytics: boolean;

  @Column({ default: false })
  priority_support: boolean;

  @Column({ default: false })
  ai_content_generation: boolean;

  @Column({ default: false })
  team_members: boolean;

  @Column({ default: 1 })
  max_team_members: number;

  /** Feature list as JSON for display */
  @Column({ type: 'jsonb', default: '[]' })
  features_list: { name: string; included: boolean }[];

  // ── Meta ──
  @Column({ default: true })
  is_active: boolean;

  @Column({ default: 0 })
  sort_order: number;

  @Column({ default: false })
  is_popular: boolean;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}
