import {
  Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn,
  ManyToOne, JoinColumn, Unique,
} from 'typeorm';
import { User } from '../../users/user.entity';
import { LoyaltyProgram } from './loyalty-program.entity';

@Entity('loyalty_cards')
@Unique(['user_id', 'program_id'])
export class LoyaltyCard {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  user_id: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'user_id' })
  user: User;

  @Column()
  program_id: string;

  @ManyToOne(() => LoyaltyProgram)
  @JoinColumn({ name: 'program_id' })
  program: LoyaltyProgram;

  /** Phone number for phone-based stamp flow (nullable) */
  @Column({ nullable: true })
  phone: string;

  /** Current stamps toward next reward */
  @Column({ default: 0 })
  current_stamps: number;

  /** Accumulated unredeemed rewards */
  @Column({ default: 0 })
  rewards: number;

  /** Total stamps ever collected */
  @Column({ default: 0 })
  total_stamps: number;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}
