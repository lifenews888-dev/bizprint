import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { BcLayout } from './bc-layout.entity';

@Entity('bc_layout_backgrounds')
export class BcLayoutBackground {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  layout_id: string;

  @ManyToOne(() => BcLayout, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'layout_id' })
  layout: BcLayout;

  @Column({ default: 'Background' })
  name: string;

  @Column()
  url: string;

  @Column({ default: 0 })
  sort_order: number;

  @Column({ default: true })
  is_active: boolean;

  @CreateDateColumn()
  created_at: Date;
}
