import {
  Entity, PrimaryGeneratedColumn, Column, CreateDateColumn,
  ManyToOne, JoinColumn,
} from 'typeorm';
import { User } from '../../users/user.entity';
import { LoyaltyProgram } from './loyalty-program.entity';

@Entity('loyalty_logs')
export class LoyaltyLog {
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

  /** 'stamp' | 'redeem' */
  @Column()
  action: string;

  /** Extra info (e.g. "Reward earned!", "Redeemed free coffee") */
  @Column({ nullable: true })
  note: string;

  @CreateDateColumn()
  created_at: Date;
}
