import {
  Entity, PrimaryGeneratedColumn, Column,
  CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn
} from 'typeorm'
import { Order } from '../orders/entities/order.entity'

export enum FileStatus {
  UPLOADED  = 'uploaded',
  CHECKING  = 'checking',
  APPROVED  = 'approved',
  REJECTED  = 'rejected',
  NEEDS_FIX = 'needs_fix',
}

export enum FileType {
  ORIGINAL   = 'original',
  DESIGN     = 'design',
  PREPRESS   = 'prepress',
  PRODUCTION = 'production',
  QC         = 'qc',
  FINAL      = 'final',
}

@Entity('files')
export class File {
  @PrimaryGeneratedColumn('uuid')
  id: string

  @Column()
  order_id: string

  @ManyToOne(() => Order, { nullable: true })
  @JoinColumn({ name: 'order_id' })
  order: Order

  @Column()
  filename: string

  @Column()
  path: string

  @Column({ default: 0 })
  size: number

  @Column({ default: 1 })
  version: number

  @Column({
    type: 'enum',
    enum: FileType,
    default: FileType.ORIGINAL,
  })
  file_type: FileType

  @Column({
    type: 'enum',
    enum: FileStatus,
    default: FileStatus.UPLOADED,
  })
  status: FileStatus

  @Column({ default: false })
  is_final: boolean

  @Column({ nullable: true })
  uploaded_by: string

  @Column({ nullable: true })
  uploaded_by_role: string

  @Column({ nullable: true })
  mime_type: string

  @Column({ type: 'jsonb', nullable: true })
  analysis: {
    pages?: number
    dpi?: number
    color_mode?: string
    has_bleed?: boolean
    bleed_mm?: number
    width_mm?: number
    height_mm?: number
    fonts_embedded?: boolean
    issues?: Array<{ type: string; severity: string; message: string }>
    score?: number
    risk?: string
    summary?: string
  }

  @Column({ nullable: true })
  notes: string

  @CreateDateColumn()
  created_at: Date

  @UpdateDateColumn()
  updated_at: Date
}
