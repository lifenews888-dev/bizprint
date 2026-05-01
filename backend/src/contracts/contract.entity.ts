import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm'

export enum ContractStatus {
  DRAFT = 'DRAFT',
  SENT = 'SENT',
  VIEWED = 'VIEWED',
  SIGNED = 'SIGNED',
  CANCELLED = 'CANCELLED',
  EXPIRED = 'EXPIRED',
}

@Entity('contracts')
export class Contract {
  @PrimaryGeneratedColumn('uuid')
  id: string

  @Column()
  quote_id: string

  @Column({ nullable: true })
  order_id: string

  @Column({ nullable: true })
  customer_id: string

  @Column({ unique: true })
  contract_number: string

  @Column({ type: 'varchar', default: ContractStatus.DRAFT })
  status: ContractStatus

  @Column({ nullable: true })
  template_version: string

  @Column({ type: 'jsonb', nullable: true })
  terms_json: any

  @Column({ nullable: true })
  pdf_url: string

  @Column({ nullable: true })
  signed_pdf_url: string

  @Column({ nullable: true })
  company_stamp_url: string

  @Column({ nullable: true })
  company_signature_url: string

  @Column({ type: 'jsonb', nullable: true })
  customer_signature_data: any

  @Column({ nullable: true })
  customer_ip: string

  @Column({ nullable: true })
  customer_user_agent: string

  @Column({ type: 'timestamptz', nullable: true })
  signed_at: Date

  @Column({ type: 'timestamptz', nullable: true })
  expires_at: Date

  @CreateDateColumn()
  created_at: Date

  @UpdateDateColumn()
  updated_at: Date
}
