import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
} from 'typeorm';

export type QueueStatus =
  | 'queued'
  | 'printing'
  | 'completed'
  | 'cancelled';

@Entity('production_queue')
export class ProductionQueue {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  factory_id: number;

  @Column()
  machine_id: number;

  @Column()
  job_id: number;

  @Column()
  queue_position: number;

  @Column({
    type: 'varchar',
    default: 'queued',
  })
  status: QueueStatus;

  @CreateDateColumn()
  created_at: Date;
}