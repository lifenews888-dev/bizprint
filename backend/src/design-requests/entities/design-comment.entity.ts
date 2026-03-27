import {
  Entity, PrimaryGeneratedColumn, Column,
  CreateDateColumn, ManyToOne, JoinColumn,
} from 'typeorm';
import { DesignRequest } from '../design-request.entity';

export type CommentRole = 'customer' | 'designer' | 'admin';
export type CommentType = 'comment' | 'issue' | 'suggestion' | 'system';

@Entity('design_comments')
export class DesignComment {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  design_request_id: string;

  @ManyToOne(() => DesignRequest, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'design_request_id' })
  designRequest: DesignRequest;

  /** Linked to specific version (optional) */
  @Column({ nullable: true })
  version_id: string;

  /** Version number for display */
  @Column({ type: 'int', nullable: true })
  version_number: number;

  @Column()
  author_id: string;

  @Column({ nullable: true })
  author_name: string;

  /** 'customer' | 'designer' | 'admin' */
  @Column()
  author_role: CommentRole;

  @Column({ type: 'text' })
  content: string;

  /** 'comment' | 'issue' | 'suggestion' | 'system' */
  @Column({ default: 'comment' })
  type: CommentType;

  /** Was this resolved? */
  @Column({ default: false })
  resolved: boolean;

  @CreateDateColumn()
  created_at: Date;
}
