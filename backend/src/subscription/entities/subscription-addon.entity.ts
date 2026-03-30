import {
  Entity, PrimaryGeneratedColumn, Column,
  CreateDateColumn, UpdateDateColumn,
} from 'typeorm';

@Entity('subscription_addons')
export class SubscriptionAddon {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  @Column({ unique: true })
  slug: string;

  @Column({ nullable: true })
  description: string;

  /** Maps to plan limit key: qr_codes, invitations, product_qrs, digital_cards, storage_mb */
  @Column()
  feature_key: string;

  /** How much this add-on adds to the limit */
  @Column({ default: 0 })
  bonus_amount: number;

  /** Price in MNT */
  @Column({ type: 'decimal', precision: 12, scale: 2, default: 0 })
  price: number;

  @Column({ default: true })
  is_active: boolean;

  @Column({ default: 0 })
  sort_order: number;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}
