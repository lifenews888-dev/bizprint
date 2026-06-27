import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';

@Entity('marketing_email_campaigns')
export class MarketingEmailCampaign {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  @Column()
  subject: string;

  @Column({ nullable: true })
  preheader: string;

  @Column({ type: 'text' })
  html: string;

  @Column({ default: 'all' })
  segment: string;

  @Column({ default: 'draft' })
  status: string;

  @Column({ nullable: true })
  sender_name: string;

  @Column({ nullable: true })
  sender_email: string;

  @Column({ default: 40 })
  batch_size: number;

  @Column({ default: 2000 })
  delay_ms: number;

  @Column({ default: 0 })
  total_recipients: number;

  @Column({ default: 0 })
  sent_count: number;

  @Column({ default: 0 })
  failed_count: number;

  @Column({ default: 0 })
  dry_run_count: number;

  @Column({ nullable: true })
  last_sent_at: Date;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}
