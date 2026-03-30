import {
  Entity, PrimaryGeneratedColumn, Column,
  CreateDateColumn, Index,
} from 'typeorm';

@Index(['user_id', 'feature_key'])
@Entity('usage_logs')
export class UsageLog {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  user_id: string;

  /** qr_codes, invitations, product_qrs, digital_cards */
  @Column()
  feature_key: string;

  /** create, delete */
  @Column()
  action: string;

  /** ID of the created/deleted resource */
  @Column({ nullable: true })
  entity_id: string;

  /** User's total count after this action */
  @Column({ default: 0 })
  count_after: number;

  @Column({ type: 'jsonb', nullable: true })
  metadata: Record<string, any>;

  @CreateDateColumn()
  created_at: Date;
}
