import {
  Entity, PrimaryGeneratedColumn, Column,
  CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn,
} from 'typeorm';
import { User } from '../../users/user.entity';

@Entity('digital_cards')
export class DigitalCard {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  user_id: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'user_id' })
  user: User;

  /** Public slug: /u/{slug} */
  @Column({ unique: true })
  slug: string;

  // ── Profile fields ──
  @Column({ nullable: true })
  display_name: string;

  @Column({ nullable: true })
  job_title: string;

  @Column({ nullable: true })
  company_name: string;

  @Column({ nullable: true })
  company_message: string;

  @Column({ nullable: true })
  phone: string;

  @Column({ nullable: true })
  email: string;

  @Column({ nullable: true })
  website: string;

  @Column({ nullable: true })
  address: string;

  @Column({ nullable: true })
  logo_url: string;

  @Column({ nullable: true })
  avatar_url: string;

  /** Social links: [{ platform: 'facebook', value: 'bizprint', icon: 'f' }] */
  @Column({ type: 'jsonb', nullable: true, default: '[]' })
  social_links: { platform: string; value: string }[];

  /** Theme / accent color */
  @Column({ default: '#FF6B00' })
  accent_color: string;

  @Column({ default: '#FFFFFF' })
  bg_color: string;

  /** Template ID (links to business card template if any) */
  @Column({ nullable: true })
  template_id: string;

  /** Total views */
  @Column({ default: 0 })
  view_count: number;

  /** Total contact saves */
  @Column({ default: 0 })
  save_count: number;

  @Column({ default: true })
  is_active: boolean;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}
