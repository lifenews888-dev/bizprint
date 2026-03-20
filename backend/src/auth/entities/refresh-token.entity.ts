import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, JoinColumn } from 'typeorm'
import { User } from '../../users/user.entity'

@Entity('refresh_tokens')
export class RefreshToken {
  @PrimaryGeneratedColumn('uuid')
  id: string

  @Column()
  token: string

  @Column()
  user_id: string

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: User

  @Column({ nullable: true })
  device_id: string

  @Column({ nullable: true })
  device_name: string

  @Column({ default: 'web' })
  platform: string  // web | ios | android

  @Column({ type: 'timestamp' })
  expires_at: Date

  @Column({ default: false })
  is_revoked: boolean

  @CreateDateColumn()
  created_at: Date
}
