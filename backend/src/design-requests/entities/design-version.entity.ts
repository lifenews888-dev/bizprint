import {
  Entity, PrimaryGeneratedColumn, Column,
  CreateDateColumn, ManyToOne, JoinColumn,
} from 'typeorm';
import { DesignRequest } from '../design-request.entity';

@Entity('design_versions')
export class DesignVersion {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  design_request_id: string;

  @ManyToOne(() => DesignRequest, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'design_request_id' })
  designRequest: DesignRequest;

  /** Version number: 1, 2, 3... */
  @Column({ type: 'int', default: 1 })
  version_number: number;

  @Column({ nullable: true })
  file_url: string;

  @Column({ nullable: true })
  preview_url: string;

  /** Who uploaded: 'designer' | 'customer' */
  @Column({ nullable: true })
  uploaded_by_role: string;

  @Column({ nullable: true })
  uploaded_by_id: string;

  @Column({ nullable: true })
  uploaded_by_name: string;

  /** Designer's note for this version */
  @Column({ type: 'text', nullable: true })
  version_note: string;

  /** Issue flags from PDF analysis */
  @Column({ type: 'jsonb', nullable: true })
  issues: {
    resolution?: boolean;
    bleed?: boolean;
    color_mode?: boolean;
    fonts?: boolean;
    file_size?: boolean;
  };

  /** Is this the currently active version? */
  @Column({ default: false })
  is_current: boolean;

  @CreateDateColumn()
  created_at: Date;
}
