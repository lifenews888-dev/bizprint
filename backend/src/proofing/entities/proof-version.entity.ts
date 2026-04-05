import {
  Entity, PrimaryGeneratedColumn, Column, CreateDateColumn,
} from 'typeorm';

@Entity('proof_versions')
export class ProofVersion {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  orderId: string;

  @Column()
  version: number;

  @Column()
  fileUrl: string;

  @Column({ default: 'pending' })
  status: string; // pending | approved | changes_requested

  @Column({ type: 'jsonb', default: [] })
  annotations: any[];

  @Column({ nullable: true })
  reviewNote: string;

  @Column({ nullable: true })
  reviewedById: string;

  @Column({ nullable: true })
  reviewedAt: Date;

  @CreateDateColumn()
  createdAt: Date;
}
