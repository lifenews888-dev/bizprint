import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from 'typeorm'

/** Цехийн компьютер дээр ажиллах холбогч агент */
@Entity('print_agents')
export class PrintAgent {
  @PrimaryGeneratedColumn('uuid')
  id: string

  @Column({ length: 120 })
  name: string

  @Column({ name: 'vendor_id', type: 'uuid', nullable: true })
  vendorId: string | null

  /** sha256(token) — токеныг өөрийг нь хадгалахгүй */
  @Column({ name: 'token_hash', length: 64, unique: true, select: false })
  tokenHash: string

  @Column({ name: 'last_seen_at', type: 'timestamptz', nullable: true })
  lastSeenAt: Date | null

  @Column({ type: 'varchar', length: 40, nullable: true })
  version: string | null

  @Column({ type: 'varchar', length: 120, nullable: true })
  hostname: string | null

  @Column({ name: 'is_active', default: true })
  isActive: boolean

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date
}
