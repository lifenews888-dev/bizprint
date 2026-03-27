import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, Index } from 'typeorm';

@Entity('template_purchases')
export class TemplatePurchase {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Index()
  @Column()
  user_id: string;

  @Index()
  @Column()
  template_id: string;

  @Column({ nullable: true })
  order_id: string;  // future: link to payment order

  @Column({ type: 'decimal', precision: 14, scale: 2, default: 0 })
  amount_paid: number;

  @Column({ default: 0 })
  download_count: number;  // how many times this user downloaded this template

  @CreateDateColumn()
  purchased_at: Date;
}
