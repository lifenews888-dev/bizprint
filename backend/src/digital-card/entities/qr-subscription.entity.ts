import {
  Entity, PrimaryGeneratedColumn, Column,
  CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn,
} from 'typeorm';
import { User } from '../../users/user.entity';
import { DigitalCard } from './digital-card.entity';

export enum QrSubStatus {
  TRIAL = 'trial',
  ACTIVE = 'active',
  EXPIRED = 'expired',
  CANCELLED = 'cancelled',
}

@Entity('qr_subscriptions')
export class QrSubscription {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  user_id: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'user_id' })
  user: User;

  @Column()
  digital_card_id: string;

  @ManyToOne(() => DigitalCard)
  @JoinColumn({ name: 'digital_card_id' })
  digital_card: DigitalCard;

  @Column({ default: QrSubStatus.TRIAL })
  status: string;

  @Column({ default: true })
  is_trial: boolean;

  @Column({ type: 'timestamptz' })
  start_date: Date;

  @Column({ type: 'timestamptz' })
  end_date: Date;

  /** Payment ID that activated this subscription */
  @Column({ nullable: true })
  payment_id: string;

  @Column({ type: 'decimal', precision: 14, scale: 2, default: 0 })
  amount_paid: number;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}
