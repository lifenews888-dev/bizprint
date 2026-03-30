import {
  Entity, PrimaryGeneratedColumn, Column, CreateDateColumn,
  ManyToOne, JoinColumn,
} from 'typeorm';
import { LoyaltyProgram } from './loyalty-program.entity';

/**
 * Short-lived QR session for staff-approved stamps.
 * Token is embedded in QR. Customer scans → system validates → stamp added.
 * Expires after 60 seconds. Single-use.
 */
@Entity('loyalty_sessions')
export class LoyaltySession {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  /** Cryptographic token embedded in QR */
  @Column({ unique: true })
  token: string;

  @Column()
  program_id: string;

  @ManyToOne(() => LoyaltyProgram)
  @JoinColumn({ name: 'program_id' })
  program: LoyaltyProgram;

  /** Staff/vendor who generated this session */
  @Column()
  staff_id: string;

  /** When this session expires (created_at + 60s) */
  @Column()
  expires_at: Date;

  /** Has this session been consumed? */
  @Column({ default: false })
  is_used: boolean;

  /** User who consumed this session (null until used) */
  @Column({ nullable: true })
  used_by: string;

  @Column({ nullable: true })
  used_at: Date;

  @CreateDateColumn()
  created_at: Date;
}
