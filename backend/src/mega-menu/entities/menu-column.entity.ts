import {
  Entity, PrimaryGeneratedColumn, Column, ManyToOne, OneToMany, JoinColumn,
} from 'typeorm';
import { MegaMenuV2 } from './mega-menu.entity';
import { MenuCategory } from './menu-category.entity';

@Entity('menu_columns')
export class MenuColumn {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  menu_id: string;

  @ManyToOne(() => MegaMenuV2, menu => menu.columns, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'menu_id' })
  menu: MegaMenuV2;

  @Column()
  title: string;

  @Column({ nullable: true })
  icon: string;

  @Column({ nullable: true })
  color: string;

  @Column({ default: 0 })
  order: number;

  @Column({ type: 'simple-array', nullable: true })
  visibility_roles: string[];

  @Column({ default: true })
  is_active: boolean;

  @OneToMany(() => MenuCategory, cat => cat.column, { cascade: true, eager: true })
  categories: MenuCategory[];
}
