import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, Index } from 'typeorm'

export enum PrintTicketStatus {
  QUEUED = 'queued', //             чиглүүлэгдсэн, агент аваагүй
  CLAIMED = 'claimed', //           агент татаж авсан
  IN_HOTFOLDER = 'in_hotfolder', // файл RIP-ийн hotfolder-т орсон
  PRINTING = 'printing',
  PRINTED = 'printed',
  FAILED = 'failed',
  CANCELLED = 'cancelled',
}

/** Нэг захиалгын мөрийг нэг принтер рүү илгээх ажлын тасалбар (JDF + JSON) */
@Entity('print_tickets')
@Index('idx_print_tickets_device_status', ['deviceId', 'status'])
export class PrintTicket {
  @PrimaryGeneratedColumn('uuid')
  id: string

  @Index('idx_print_tickets_order')
  @Column({ name: 'order_id', type: 'uuid' })
  orderId: string

  @Column({ name: 'order_item_id', type: 'uuid', nullable: true })
  orderItemId: string | null

  @Column({ name: 'order_number', type: 'varchar', length: 64, nullable: true })
  orderNumber: string | null

  @Column({ name: 'device_id', type: 'uuid' })
  deviceId: string

  @Column({ name: 'agent_id', type: 'uuid', nullable: true })
  agentId: string | null

  @Column({ length: 16, default: PrintTicketStatus.QUEUED })
  status: string

  @Column({ name: 'file_url', type: 'text' })
  fileUrl: string

  @Column({ type: 'jsonb' })
  payload: Record<string, any>

  @Column({ type: 'text' })
  jdf: string

  @Column({ type: 'int', default: 0 })
  attempts: number

  @Column({ type: 'text', nullable: true })
  error: string | null

  @Column({ name: 'claimed_at', type: 'timestamptz', nullable: true })
  claimedAt: Date | null

  @Column({ name: 'finished_at', type: 'timestamptz', nullable: true })
  finishedAt: Date | null

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt: Date
}
