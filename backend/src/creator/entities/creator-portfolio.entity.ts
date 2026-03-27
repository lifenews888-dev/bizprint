import {
  Entity, PrimaryGeneratedColumn, Column,
  CreateDateColumn,
} from 'typeorm';

@Entity('creator_portfolios')
export class CreatorPortfolio {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  creator_id: string;

  /** Type: image, video, before_after, carousel */
  @Column({ default: 'image' })
  type: string;

  /** Service category: ai_image, ai_video, ai_avatar, photo_restore, social, prepress */
  @Column({ nullable: true })
  category: string;

  @Column()
  title: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  /** Main image/video URL */
  @Column({ nullable: true })
  media_url: string;

  /** For before/after: the before image */
  @Column({ nullable: true })
  before_url: string;

  /** For before/after: the after image */
  @Column({ nullable: true })
  after_url: string;

  /** Additional images (carousel) */
  @Column('simple-array', { nullable: true })
  gallery_urls: string[];

  @Column('simple-array', { nullable: true })
  tags: string[];

  @Column({ default: 0 })
  views: number;

  @Column({ default: 0 })
  likes: number;

  @Column({ default: true })
  is_active: boolean;

  @Column({ default: 0 })
  sort_order: number;

  @CreateDateColumn()
  created_at: Date;
}
