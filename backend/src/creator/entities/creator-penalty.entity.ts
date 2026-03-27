import {
  Entity, PrimaryGeneratedColumn, Column,
  CreateDateColumn,
} from 'typeorm';

export enum PenaltyType {
  WARNING = 'warning',
  STRIKE = 'strike',
  SUSPEND = 'suspend',
  VISIBILITY_REDUCE = 'visibility_reduce',
}

export enum PenaltyReason {
  DEADLINE_MISSED = 'deadline_missed',
  LOW_QUALITY = 'low_quality',
  CUSTOMER_COMPLAINT = 'customer_complaint',
  CONTRACT_VIOLATION = 'contract_violation',
  INACTIVITY = 'inactivity',
  OTHER = 'other',
}

@Entity('creator_penalties')
export class CreatorPenalty {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  creator_id: string;

  @Column({
    type: 'enum',
    enum: PenaltyType,
    default: PenaltyType.WARNING,
  })
  type: PenaltyType;

  @Column({
    type: 'enum',
    enum: PenaltyReason,
    default: PenaltyReason.OTHER,
  })
  reason: PenaltyReason;

  /** Detailed description */
  @Column({ type: 'text', nullable: true })
  description: string;

  /** Reference to related job/order ID */
  @Column({ nullable: true })
  reference_id: string;

  /** Who issued this penalty */
  @Column({ nullable: true })
  issued_by: string;

  /** Whether this penalty has been resolved/cleared */
  @Column({ default: false })
  resolved: boolean;

  @Column({ nullable: true })
  resolved_at: Date;

  @CreateDateColumn()
  created_at: Date;
}
