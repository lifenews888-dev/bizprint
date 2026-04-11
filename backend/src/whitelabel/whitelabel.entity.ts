import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity('whitelabel_configs')
export class WhitelabelConfig {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  subdomain: string;

  @Column({ nullable: true })
  custom_domain: string;

  @Column()
  brand_name: string;

  @Column({ nullable: true })
  brand_logo: string;

  @Column({ nullable: true })
  brand_favicon: string;

  @Column({ default: '#FF6B00' })
  primary_color: string;

  @Column({ default: '#1a1a1a' })
  secondary_color: string;

  @Column({ nullable: true })
  owner_user_id: string;

  @Column({ nullable: true })
  owner_email: string;

  @Column({ default: true })
  is_active: boolean;

  @Column({ default: false })
  hide_bizprint_branding: boolean;

  @Column({ type: 'jsonb', nullable: true })
  features: string[];

  @Column({ type: 'jsonb', nullable: true })
  allowed_categories: string[];

  @Column({ type: 'decimal', precision: 5, scale: 2, default: 15 })
  commission_percent: number;

  @Column({ type: 'text', nullable: true })
  notes: string;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}
