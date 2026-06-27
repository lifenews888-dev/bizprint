import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity('marketing_email_send_logs')
export class MarketingEmailSendLog {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  campaign_id: string;

  @Column({ nullable: true })
  contact_id: string;

  @Column()
  email: string;

  @Column()
  status: string;

  @Column({ nullable: true })
  message_id: string;

  @Column({ type: 'text', nullable: true })
  error: string;

  @CreateDateColumn()
  created_at: Date;
}
