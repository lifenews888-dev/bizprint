import {
  Entity, PrimaryGeneratedColumn, Column,
  CreateDateColumn, UpdateDateColumn,
} from 'typeorm';

export enum ApplicationStatus {
  PENDING = 'pending',
  APPROVED = 'approved',
  REJECTED = 'rejected',
}

@Entity('creator_applications')
export class CreatorApplication {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  user_id: string;

  @Column()
  full_name: string;

  @Column({ nullable: true })
  email: string;

  @Column({ nullable: true })
  phone: string;

  /** Short bio / introduction */
  @Column({ type: 'text', nullable: true })
  bio: string;

  /** Skills: graphic_design, illustration, video, photo, etc. */
  @Column('simple-array', { nullable: true })
  skills: string[];

  /** Portfolio URL or social links */
  @Column({ nullable: true })
  portfolio_url: string;

  /** Sample work URLs */
  @Column('simple-array', { nullable: true })
  sample_urls: string[];

  /** Why they want to be a creator */
  @Column({ type: 'text', nullable: true })
  motivation: string;

  /** Capabilities applying for: ugc, live, design */
  @Column('simple-array', { nullable: true })
  capabilities: string[];

  @Column({
    type: 'enum',
    enum: ApplicationStatus,
    default: ApplicationStatus.PENDING,
  })
  status: ApplicationStatus;

  /** Admin notes on review */
  @Column({ type: 'text', nullable: true })
  admin_notes: string;

  @Column({ nullable: true })
  reviewed_by: string;

  @Column({ nullable: true })
  reviewed_at: Date;

  @Column({ nullable: true })
  reject_reason: string;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}
