import {
  Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn,
} from 'typeorm';

export type CTAPosition = 'left' | 'center' | 'right' | 'bottom-left' | 'bottom-center' | 'bottom-right';

@Entity('hero_slides')
export class HeroSlide {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  title: string;

  @Column({ nullable: true })
  subtitle: string;

  @Column({ nullable: true })
  image_url: string;

  @Column({ nullable: true })
  video_url: string;

  /** Overlay gradient/color */
  @Column({ default: 'rgba(0,0,0,0.3)' })
  overlay: string;

  /** CTA button */
  @Column({ nullable: true })
  cta_text: string;

  @Column({ nullable: true })
  cta_url: string;

  @Column({ nullable: true })
  cta_style: string; // 'solid' | 'outline' | 'ghost'

  /** Secondary CTA */
  @Column({ nullable: true })
  cta2_text: string;

  @Column({ nullable: true })
  cta2_url: string;

  /** Text/CTA position */
  @Column({ default: 'center' })
  position: CTAPosition;

  /** Tag/badge above title */
  @Column({ nullable: true })
  tag: string;

  @Column({ default: 0 })
  sort_order: number;

  @Column({ default: true })
  is_active: boolean;

  /** Schedule */
  @Column({ type: 'timestamptz', nullable: true })
  start_at: Date;

  @Column({ type: 'timestamptz', nullable: true })
  end_at: Date;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}
