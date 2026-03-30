import {
  Entity, PrimaryGeneratedColumn, Column,
  CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn,
} from 'typeorm';
import { User } from '../../users/user.entity';

export type InvitationType = 'wedding' | 'birthday' | 'corporate' | 'baby_shower' | 'graduation' | 'anniversary' | 'other';
export type InvitationStatus = 'draft' | 'active' | 'expired' | 'cancelled';

@Entity('invitations')
export class Invitation {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  user_id: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'user_id' })
  user: User;

  /** Public slug: /invite/{slug} */
  @Column({ unique: true })
  slug: string;

  @Column()
  title: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ default: 'wedding' })
  type: InvitationType;

  @Column({ default: 'draft' })
  status: InvitationStatus;

  // ── Event Details ──
  @Column({ nullable: true })
  event_date: Date;

  @Column({ nullable: true })
  event_time: string;

  @Column({ nullable: true })
  event_end_date: Date;

  @Column({ nullable: true })
  venue_name: string;

  @Column({ nullable: true })
  venue_address: string;

  /** Google Maps lat,lng */
  @Column({ type: 'decimal', precision: 10, scale: 7, nullable: true })
  venue_lat: number;

  @Column({ type: 'decimal', precision: 10, scale: 7, nullable: true })
  venue_lng: number;

  // ── Design / Template ──
  @Column({ nullable: true })
  template_id: string;

  @Column({ nullable: true })
  cover_image_url: string;

  @Column({ type: 'jsonb', nullable: true, default: '[]' })
  gallery_urls: string[];

  @Column({ nullable: true })
  music_url: string;

  /** Video URLs */
  @Column({ type: 'jsonb', nullable: true, default: '[]' })
  video_urls: string[];

  /** Custom theme colors */
  @Column({ default: '#FF6B00' })
  accent_color: string;

  @Column({ default: '#FFFFFF' })
  bg_color: string;

  @Column({ nullable: true })
  font_family: string;

  // ── Content Sections ──
  /** Hero section: bride/groom names, title, subtitle */
  @Column({ type: 'jsonb', nullable: true })
  hero_section: {
    names?: string;
    subtitle?: string;
    greeting?: string;
  };

  /** Story / timeline section */
  @Column({ type: 'jsonb', nullable: true, default: '[]' })
  story_timeline: {
    date?: string;
    title?: string;
    description?: string;
    image_url?: string;
  }[];

  /** Additional custom sections */
  @Column({ type: 'jsonb', nullable: true, default: '[]' })
  custom_sections: {
    type: string;
    title?: string;
    content?: string;
    image_url?: string;
    order: number;
  }[];

  // ── Settings ──
  @Column({ default: true })
  rsvp_enabled: boolean;

  @Column({ default: 0 })
  max_guests: number;

  @Column({ default: false })
  plus_one_allowed: boolean;

  /** Show countdown timer */
  @Column({ default: true })
  show_countdown: boolean;

  /** Show map */
  @Column({ default: true })
  show_map: boolean;

  // ── QR & Analytics ──
  @Column({ nullable: true })
  qr_code_url: string;

  @Column({ default: 0 })
  view_count: number;

  @Column({ default: 0 })
  rsvp_count: number;

  @Column({ default: 0 })
  share_count: number;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}
