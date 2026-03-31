import {
  Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, CreateDateColumn,
} from 'typeorm';
import { MegaMenuV2 } from './mega-menu.entity';

export type PromoType = 'AI_QUOTE' | 'CAMPAIGN' | 'FEATURED' | 'BANNER';

@Entity('promo_blocks')
export class PromoBlock {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  menu_id: string;

  @ManyToOne(() => MegaMenuV2, menu => menu.promos, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'menu_id' })
  menu: MegaMenuV2;

  @Column()
  title: string;

  @Column({ nullable: true })
  description: string;

  @Column({ default: 'FEATURED' })
  type: PromoType;

  @Column({ nullable: true })
  image_url: string;

  @Column({ nullable: true })
  link: string;

  @Column({ nullable: true })
  cta_text: string;

  @Column({ nullable: true })
  bg_color: string;

  @Column({ default: 0 })
  priority: number;

  @Column({ default: true })
  is_active: boolean;

  @Column({ type: 'timestamptz', nullable: true })
  start_at: Date;

  @Column({ type: 'timestamptz', nullable: true })
  end_at: Date;

  @CreateDateColumn()
  created_at: Date;
}
