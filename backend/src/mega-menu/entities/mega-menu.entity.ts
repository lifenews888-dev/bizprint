import {
  Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, OneToMany,
} from 'typeorm';
import { MenuColumn } from './menu-column.entity';
import { PromoBlock } from './promo-block.entity';

@Entity('mega_menus')
export class MegaMenuV2 {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  @Column({ default: true })
  is_active: boolean;

  @Column({ default: 1 })
  version: number;

  @OneToMany(() => MenuColumn, col => col.menu, { cascade: true, eager: true })
  columns: MenuColumn[];

  @OneToMany(() => PromoBlock, promo => promo.menu, { cascade: true, eager: true })
  promos: PromoBlock[];

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}
