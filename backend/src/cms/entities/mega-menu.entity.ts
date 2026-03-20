import { Entity, PrimaryGeneratedColumn, Column, UpdateDateColumn } from 'typeorm'

@Entity('mega_menu')
export class MegaMenu {
  @PrimaryGeneratedColumn('uuid')
  id: string

  @Column()
  nav_label: string

  @Column({ default: '/' })
  nav_url: string

  @Column({ default: 'LINK' })
  nav_type: string // LINK | MEGA | DROPDOWN

  @Column({ default: true })
  is_active: boolean

  @Column({ default: 0 })
  sort_order: number

  @Column({ type: 'jsonb', nullable: true })
  columns: any[]

  @Column({ type: 'jsonb', nullable: true })
  featured: any

  @UpdateDateColumn()
  updated_at: Date
}
