import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from 'typeorm'

@Entity('password_resets')
export class PasswordReset {
  @PrimaryGeneratedColumn('uuid')
  id: string

  @Column()
  user_id: string

  @Column({ unique: true })
  token: string

  @Column()
  expires_at: Date

  @Column({ nullable: true })
  used_at: Date

  @CreateDateColumn()
  created_at: Date
}
