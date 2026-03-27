import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity('templates')
export class Template {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  title: string;

  @Column({ nullable: true })
  title_mn: string;

  @Column({ nullable: true })
  description: string;

  @Column()
  designer_id: string;

  @Column({ nullable: true })
  designer_name: string;

  @Column({ nullable: true })
  category: string;

  @Column({ nullable: true })
  thumbnail_url: string;

  /** Өвөр талын preview зураг */
  @Column({ nullable: true })
  front_preview_url: string;

  /** Ар талын preview зураг */
  @Column({ nullable: true })
  back_preview_url: string;

  @Column({ nullable: true })
  file_url: string;

  @Column({ type: 'jsonb', nullable: true })
  canvas_data: any;

  @Column({ type: 'decimal', precision: 14, scale: 2, default: 0 })
  price: number;

  /** standard | laminated | embossed */
  @Column({ nullable: true, default: 'standard' })
  card_type: string;

  /** Per-quantity pricing by card type: [{ qty, standard, laminated, embossed }] */
  @Column({ type: 'jsonb', nullable: true })
  pricing_tiers: { qty: number; standard: number; laminated: number; embossed: number }[];

  @Column({ type: 'decimal', precision: 14, scale: 2, default: 0 })
  royalty_rate: number;

  @Column({ default: 'pending' })
  status: string;

  @Column({ default: 0 })
  download_count: number;

  @Column({ default: 0 })
  use_count: number;

  @Column({ type: 'simple-array', nullable: true })
  tags: string[];

  @Column({ nullable: true })
  width_mm: number;

  @Column({ nullable: true })
  height_mm: number;

  /**
   * Editable zones — AI layout engine ашиглана
   * Жишээ: [{ key: "logo", type: "image", x: 50, y: 50, w: 200, h: 200 },
   *          { key: "title", type: "text", x: 50, y: 280, w: 400, h: 60, fontSize: 32 }]
   */
  @Column({ type: 'jsonb', nullable: true })
  zones: {
    key: string        // logo, title, subtitle, phone, etc.
    type: 'image' | 'text'
    x: number
    y: number
    w: number
    h: number
    fontSize?: number
    fontWeight?: string
    fill?: string
    align?: string
    placeholder?: string
  }[];

  /** Back side zones — contact, social, QR */
  @Column({ type: 'jsonb', nullable: true })
  back_zones: any[];

  /** Social placement: 'back' | 'front' | 'both' */
  @Column({ nullable: true, default: 'back' })
  social_placement: string;

  /** Background image URL for template */
  @Column({ nullable: true })
  background_url: string;

  @Column({ default: true })
  is_active: boolean;

  @Column({ default: 0 })
  sort_order: number;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}