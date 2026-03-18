import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from 'typeorm'

@Entity('chat_messages')
export class ChatMessage {
  @PrimaryGeneratedColumn()
  id: number

  @Column()
  room_id: string

  @Column()
  sender_id: string

  @Column()
  sender_name: string

  @Column()
  sender_role: string

  @Column({ type: 'text' })
  message: string

  @Column({ nullable: true })
  file_url: string

  @Column({ default: false })
  is_read: boolean

  @CreateDateColumn()
  created_at: Date
}