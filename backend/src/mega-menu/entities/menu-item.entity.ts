import {
  Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn,
} from 'typeorm';
import { MenuCategory } from './menu-category.entity';

export type MenuItemType = 'product' | 'template' | 'action' | 'link';
export type MenuBadge = 'NEW' | 'HOT' | 'AI' | 'SALE' | null;

@Entity('menu_items')
export class MenuItemEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  category_id: string;

  @ManyToOne(() => MenuCategory, cat => cat.items, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'category_id' })
  category: MenuCategory;

  @Column()
  name: string;

  @Column({ default: 'link' })
  type: MenuItemType;

  @Column({ nullable: true })
  link: string;

  @Column({ nullable: true })
  icon: string;

  @Column({ nullable: true })
  description: string;

  @Column({ type: 'varchar', nullable: true })
  badge: MenuBadge;

  @Column({ default: 0 })
  order: number;
}
