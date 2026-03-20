import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from 'typeorm'

export type NotificationType = 'chat' | 'order' | 'payment' | 'wallet' | 'system'

@Entity('notifications')
export class Notification {
  @PrimaryGeneratedColumn()
  id: number

  @Column()
  user_id: string

  @Column({ type: 'varchar' })
  type: NotificationType

  @Column()
  title: string

  @Column({ type: 'text', nullable: true })
  message: string

  @Column({ type: 'json', nullable: true })
  data: any

  @Column({ default: false })
  is_read: boolean

  @CreateDateColumn()
  created_at: Date
}
