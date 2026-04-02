import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, JoinColumn } from 'typeorm'
import { User } from '../../users/user.entity'

@Entity('password_resets')
export class PasswordReset {
  @PrimaryGeneratedColumn('uuid')
  id: string

  @Column()
  user_id: string

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: User

  @Column({ comment: 'SHA-256 hash of the raw token — raw token is NEVER stored' })
  token_hash: string

  @Column()
  expires_at: Date

  @Column({ type: 'timestamp', nullable: true })
  used_at: Date | null

  @CreateDateColumn()
  created_at: Date
}
