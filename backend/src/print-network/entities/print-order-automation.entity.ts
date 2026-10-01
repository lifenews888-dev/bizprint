import { Entity, PrimaryColumn, Column, UpdateDateColumn } from 'typeorm'

export enum AutomationState {
  PREFLIGHT_FAILED = 'preflight_failed', // файлд ноцтой алдаа — админ шийднэ
  APPROVED = 'approved', //                 админ preflight-ийг үл харгалзан зөвшөөрсөн
  NO_PRINTER = 'no_printer', //             тохирох принтер алга — дахин оролдоно
  DISPATCHED = 'dispatched', //             тасалбар үүссэн
  ERROR = 'error',
}

/** Төлбөр орсон хэвлэлийн захиалгын автомат урсгалын явц (админд харуулах, давтан мэдэгдэхгүй) */
@Entity('print_order_automation')
export class PrintOrderAutomation {
  @PrimaryColumn({ name: 'order_id', type: 'uuid' })
  orderId: string

  @Column({ length: 24 })
  state: string

  @Column({ type: 'text', nullable: true })
  detail: string | null

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt: Date
}
