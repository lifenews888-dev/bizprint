import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm'

@Entity('chat_rooms')
export class ChatRoom {
  @PrimaryGeneratedColumn()
  id: number

  @Column({ unique: true })
  room_id: string

  @Column()
  type: string

  @Column({ nullable: true })
  order_id: string

  @Column({ type: 'simple-array' })
  participants: string[]

  @Column({ type: 'simple-array' })
  participant_names: string[]

  @Column({ nullable: true })
  last_message: string

  @Column({ nullable: true })
  last_message_at: Date

  @Column({ default: 0 })
  unread_count: number

  @CreateDateColumn()
  created_at: Date

  @UpdateDateColumn()
  updated_at: Date
}