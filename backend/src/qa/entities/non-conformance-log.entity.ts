import {
  Entity, PrimaryGeneratedColumn, Column,
  CreateDateColumn,
} from 'typeorm';

@Entity('non_conformance_logs')
export class NonConformanceLog {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  orderId: string;

  @Column()
  stage: string;

  @Column()
  description: string;

  @Column({ type: 'enum', enum: ['minor', 'major', 'critical'], default: 'minor' })
  severity: string;

  @Column({ type: 'enum', enum: ['open', 'in_review', 'resolved', 'rejected'], default: 'open' })
  status: string;

  @Column({ type: 'jsonb', default: [] })
  photos: string[];

  @Column({ nullable: true })
  resolution: string;

  @Column({ nullable: true })
  reportedById: string;

  @Column({ nullable: true })
  resolvedById: string;

  @Column({ nullable: true })
  resolvedAt: Date;

  @CreateDateColumn()
  createdAt: Date;
}
