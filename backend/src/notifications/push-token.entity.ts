import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, JoinColumn } from 'typeorm'
import { User } from '../users/user.entity'

@Entity('user_push_tokens')
export class PushToken {
  @PrimaryGeneratedColumn('uuid')
  id: string

  @Column()
  user_id: string

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: User

  @Column()
  token: string

  @Column({ default: 'web' })
  platform: string  // ios | android | web

  @Column({ nullable: true })
  device_id: string

  @CreateDateColumn()
  created_at: Date
}
