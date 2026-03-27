import {
  Entity, PrimaryGeneratedColumn, Column,
  CreateDateColumn,
} from 'typeorm';

export enum CommentRole {
  CUSTOMER = 'customer',
  CREATOR = 'creator',
  ADMIN = 'admin',
}

@Entity('order_comments')
export class OrderComment {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  /** UGC request / order ID */
  @Column()
  order_id: string;

  @Column()
  user_id: string;

  @Column({ nullable: true })
  user_name: string;

  @Column({
    type: 'enum',
    enum: CommentRole,
    default: CommentRole.CUSTOMER,
  })
  role: CommentRole;

  @Column({ type: 'text' })
  message: string;

  /** Attached file URLs */
  @Column('simple-array', { nullable: true })
  attachment_urls: string[];

  /** Whether this comment triggers a workflow action */
  @Column({ nullable: true })
  action: string; // 'revision_request' | 'approval' | 'status_change' | null

  @Column({ default: false })
  is_system: boolean;

  @CreateDateColumn()
  created_at: Date;
}
