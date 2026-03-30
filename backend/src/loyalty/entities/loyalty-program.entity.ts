import {
  Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn,
  ManyToOne, JoinColumn,
} from 'typeorm';
import { User } from '../../users/user.entity';

@Entity('loyalty_programs')
export class LoyaltyProgram {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  /** Vendor who owns this program */
  @Column()
  vendor_id: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'vendor_id' })
  vendor: User;

  @Column()
  name: string;

  @Column({ nullable: true })
  description: string;

  /** How many stamps needed for 1 reward */
  @Column({ default: 10 })
  required_stamps: number;

  /** 'free' = free item, 'discount' = percentage discount */
  @Column({ default: 'free' })
  reward_type: string;

  /** Reward description (e.g. "1 кофе үнэгүй", "20% хөнгөлөлт") */
  @Column({ nullable: true })
  reward_description: string;

  /** Discount percentage (if reward_type = 'discount') */
  @Column({ default: 0 })
  discount_percent: number;

  /** Logo / image */
  @Column({ nullable: true })
  logo_url: string;

  /** Brand color */
  @Column({ default: '#FF6B00' })
  accent_color: string;

  @Column({ default: true })
  is_active: boolean;

  // ── Marketing ──
  @Column({ default: false })
  marketing_enabled: boolean;

  @Column({ type: 'jsonb', nullable: true, default: '[]' })
  marketing: {
    type: 'banner' | 'product' | 'promo';
    image_url?: string;
    title?: string;
    description?: string;
    button_text?: string;
    button_link?: string;
    product_id?: string;
    message?: string;
  }[];

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}
