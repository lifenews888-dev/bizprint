import {
  Entity, PrimaryGeneratedColumn, Column,
  CreateDateColumn, UpdateDateColumn,
} from 'typeorm';

@Entity('invitation_templates')
export class InvitationTemplate {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  @Column({ nullable: true })
  description: string;

  /** wedding | birthday | corporate | universal */
  @Column({ default: 'universal' })
  category: string;

  @Column({ nullable: true })
  thumbnail_url: string;

  @Column({ nullable: true })
  preview_url: string;

  /** Full design config as JSON */
  @Column({ type: 'jsonb', nullable: true })
  design_config: {
    accent_color?: string;
    bg_color?: string;
    font_family?: string;
    layout?: string;
    hero_style?: string;
    sections?: string[];
  };

  /** CSS / style overrides */
  @Column({ type: 'text', nullable: true })
  custom_css: string;

  @Column({ default: false })
  is_premium: boolean;

  @Column({ default: 0 })
  price: number;

  @Column({ default: 0 })
  usage_count: number;

  @Column({ default: true })
  is_active: boolean;

  @Column({ default: 0 })
  sort_order: number;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}
