import {
  Entity, PrimaryGeneratedColumn, Column,
  CreateDateColumn, Index, ManyToOne, JoinColumn,
} from 'typeorm';
import { User } from '../../users/user.entity';

@Entity('events')
@Index('IDX_events_entity', ['entity_type', 'entity_id'])
export class Event {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  entity_type: string;

  @Column('uuid')
  entity_id: string;

  @Column()
  action: string;

  @Column({ type: 'jsonb', nullable: true })
  old_value: Record<string, any>;

  @Column({ type: 'jsonb', nullable: true })
  new_value: Record<string, any>;

  @Column({ nullable: true })
  actor_id: string;

  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'actor_id' })
  actor: User;

  @Column({ default: 'user' })
  actor_type: string;

  @Column({ type: 'jsonb', nullable: true })
  metadata: Record<string, any>;

  @CreateDateColumn()
  created_at: Date;
  // NO updated_at — events are immutable
}
