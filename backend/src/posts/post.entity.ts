import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, Index } from 'typeorm';

@Entity('posts')
@Index(['is_published', 'published_at'])
export class Post {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  title: string;

  @Column({ unique: true })
  slug: string;

  @Column({ type: 'text', nullable: true })
  content: string;

  @Column({ nullable: true })
  excerpt: string;

  @Column({ nullable: true })
  thumbnail: string;

  @Column({ nullable: true })
  category: string;

  @Column({ type: 'text', array: true, default: '{}' })
  tags: string[];

  /** Нийтлэгчийн хэрэглэгчийн ID (дотоод холбоос) */
  @Column({ nullable: true })
  author_id: string;

  /** Нийтлэлд харагдах зохиогчийн нэр */
  @Column({ nullable: true })
  author_name: string;

  @Column({ default: false })
  is_published: boolean;

  /** Нүүр хуудсанд онцлох */
  @Column({ default: false })
  is_featured: boolean;

  /**
   * Нийтэлсэн цаг. is_published анх true болоход тавигдаж, дараа нь
   * хадгалагдана — драфт болгоод дахин нийтлэхэд анхны огноо нь алдагдахгүй.
   */
  @Column({ type: 'timestamp', nullable: true })
  published_at: Date | null;

  /** Агуулгын үгийн тооноос автоматаар бодогдох унших хугацаа (минут) */
  @Column({ type: 'int', nullable: true })
  reading_minutes: number | null;

  @Column({ nullable: true })
  seo_title: string;

  @Column({ nullable: true })
  seo_description: string;

  @Column({ default: 0 })
  view_count: number;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}
