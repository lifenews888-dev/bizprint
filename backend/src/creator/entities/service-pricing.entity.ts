import {
  Entity, PrimaryGeneratedColumn, Column,
  CreateDateColumn, UpdateDateColumn,
} from 'typeorm';

@Entity('service_pricing')
export class ServicePricing {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  /** Service type: social, prepress, live */
  @Column()
  service_type: string;

  /** Content sub-type: poster, flyer, banner, etc. or 'hourly' for live */
  @Column()
  content_type: string;

  @Column()
  label: string;

  /** Base price (what creator earns) */
  @Column({ type: 'decimal', precision: 12, scale: 2, default: 0 })
  base_price: number;

  /** Platform margin percentage (0-100) */
  @Column({ type: 'decimal', precision: 5, scale: 2, default: 20 })
  margin_percent: number;

  /** Final customer price = base_price * (1 + margin_percent/100) */
  @Column({ type: 'decimal', precision: 12, scale: 2, default: 0 })
  final_price: number;

  /** Rush fee multiplier (e.g. 1.5 for 50% extra) */
  @Column({ type: 'decimal', precision: 4, scale: 2, default: 1 })
  rush_multiplier: number;

  /** Revision cost per revision */
  @Column({ type: 'decimal', precision: 12, scale: 2, default: 0 })
  revision_cost: number;

  /** Free revisions included */
  @Column({ default: 2 })
  free_revisions: number;

  /** For live: bonus commission % on sales */
  @Column({ type: 'decimal', precision: 5, scale: 2, default: 0 })
  bonus_commission: number;

  /** Min duration (live, in minutes) */
  @Column({ default: 30 })
  min_duration: number;

  @Column({ default: true })
  is_active: boolean;

  @Column({ default: 0 })
  sort_order: number;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}
