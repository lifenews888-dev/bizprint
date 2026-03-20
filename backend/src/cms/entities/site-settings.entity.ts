import { Entity, PrimaryGeneratedColumn, Column, UpdateDateColumn } from 'typeorm'

@Entity('site_settings')
export class SiteSettings {
  @PrimaryGeneratedColumn('uuid')
  id: string

  @Column({ unique: true })
  key: string

  @Column({ type: 'jsonb' })
  value: any

  @Column({ default: 'site' })
  group: string

  @Column({ nullable: true })
  label: string

  @UpdateDateColumn()
  updated_at: Date

  @Column({ nullable: true })
  updated_by: string
}
