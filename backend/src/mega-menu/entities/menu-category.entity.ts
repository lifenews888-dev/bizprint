import {
  Entity, PrimaryGeneratedColumn, Column, ManyToOne, OneToMany, JoinColumn,
} from 'typeorm';
import { MenuColumn } from './menu-column.entity';
import { MenuItemEntity } from './menu-item.entity';

@Entity('menu_categories')
export class MenuCategory {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  column_id: string;

  @ManyToOne(() => MenuColumn, col => col.categories, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'column_id' })
  column: MenuColumn;

  @Column()
  name: string;

  @Column({ nullable: true })
  image_url: string;

  @Column({ nullable: true })
  slug: string;

  @Column({ default: 0 })
  order: number;

  @Column({ default: false })
  is_featured: boolean;

  @Column({ default: false })
  hover_preview_enabled: boolean;

  @OneToMany(() => MenuItemEntity, item => item.category, { cascade: true, eager: true })
  items: MenuItemEntity[];
}
