import {
  Entity, PrimaryGeneratedColumn, Column, ManyToOne,
  CreateDateColumn, JoinColumn,
} from 'typeorm';
import { Order } from '../../orders/entities/order.entity';
import { User } from '../../users/user.entity';

export enum QaStage {
  PREPRESS   = 'prepress',
  PRINTING   = 'printing',
  FINISHING  = 'finishing',
  PACKAGING  = 'packaging',
  DELIVERY   = 'delivery',
}

export enum QaStatus {
  PASSED        = 'passed',
  FAILED        = 'failed',
  NEEDS_REWORK  = 'needs_rework',
  PENDING       = 'pending',
}

@Entity('qa_checkpoints')
export class QaCheckpoint {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  orderId: string;

  @ManyToOne(() => Order)
  @JoinColumn({ name: 'orderId' })
  order: Order;

  @Column({ type: 'enum', enum: QaStage })
  stage: QaStage;

  @Column({ type: 'enum', enum: QaStatus, default: QaStatus.PENDING })
  status: QaStatus;

  @Column({ nullable: true })
  checkedById: string;

  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'checkedById' })
  checkedBy: User;

  @Column({ type: 'text', nullable: true })
  notes: string;

  @Column({ type: 'jsonb', default: [] })
  photos: string[]; // Cloudinary URLs

  @Column({ type: 'jsonb', default: [] })
  issues: string[];

  @CreateDateColumn()
  createdAt: Date;
}
