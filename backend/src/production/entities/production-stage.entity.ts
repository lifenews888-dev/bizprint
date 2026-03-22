import {
  Entity, PrimaryGeneratedColumn, Column,
  CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn,
} from 'typeorm';
import { ProductionJob } from './production-job.entity';
import { User } from '../../users/user.entity';

export enum StageStatus {
  PENDING = 'pending',
  IN_PROGRESS = 'in_progress',
  COMPLETED = 'completed',
  SKIPPED = 'skipped',
}

@Entity('production_stages')
export class ProductionStage {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  production_job_id: string;

  @ManyToOne(() => ProductionJob, (job) => job.stages)
  @JoinColumn({ name: 'production_job_id' })
  production_job: ProductionJob;

  @Column()
  stage_name: string;

  @Column()
  stage_order: number;

  @Column({ type: 'enum', enum: StageStatus, default: StageStatus.PENDING })
  status: StageStatus;

  @Column({ nullable: true })
  started_at: Date;

  @Column({ nullable: true })
  completed_at: Date;

  @Column({ nullable: true })
  operator_id: string;

  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'operator_id' })
  operator: User;

  @Column({ type: 'text', nullable: true })
  notes: string;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}
