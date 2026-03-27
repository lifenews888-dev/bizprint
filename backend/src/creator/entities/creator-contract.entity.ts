import {
  Entity, PrimaryGeneratedColumn, Column,
  CreateDateColumn, UpdateDateColumn,
} from 'typeorm';

export enum ContractStatus {
  ACTIVE = 'active',
  TERMINATED = 'terminated',
  EXPIRED = 'expired',
}

@Entity('creator_contracts')
export class CreatorContract {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  creator_id: string;

  @Column({
    type: 'enum',
    enum: ContractStatus,
    default: ContractStatus.ACTIVE,
  })
  status: ContractStatus;

  /** Commission rate for this creator (platform takes this %) */
  @Column({ type: 'decimal', precision: 5, scale: 2, default: 20 })
  commission_rate: number;

  /** Tax deduction rate */
  @Column({ type: 'decimal', precision: 5, scale: 2, default: 10 })
  tax_rate: number;

  /** Digital signature (typed name or base64 image) */
  @Column({ type: 'text', nullable: true })
  signature: string;

  /** Whether creator accepted the terms */
  @Column({ default: false })
  terms_accepted: boolean;

  @Column({ nullable: true })
  signed_at: Date;

  @Column({ nullable: true })
  terminated_at: Date;

  @Column({ type: 'text', nullable: true })
  termination_reason: string;

  /** Contract version for tracking policy changes */
  @Column({ default: '1.0' })
  version: string;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}
