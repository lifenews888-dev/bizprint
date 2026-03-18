import { Entity, Column, PrimaryGeneratedColumn } from 'typeorm';

@Entity('menus')
export class Menu {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  label: string;

  @Column({ nullable: true })
  label_mn: string;

  @Column({ nullable: true })
  url: string;

  @Column({ nullable: true })
  pageSlug: string;

  @Column({ default: 'header' })
  location: string;

  @Column({ default: 0 })
  order: number;

  @Column({ nullable: true })
  parentId: number;

  @Column({ nullable: true })
  icon: string;

  @Column({ nullable: true })
  description: string;

  @Column({ nullable: true })
  color: string;

  @Column({ nullable: true })
  section_title: string;

  @Column({ default: true })
  isActive: boolean;

  @Column({ default: false })
  is_mega: boolean;
}