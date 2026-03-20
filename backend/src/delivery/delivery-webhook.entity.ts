import {
  Entity, PrimaryGeneratedColumn, Column,
  CreateDateColumn, UpdateDateColumn
} from 'typeorm'

@Entity('delivery_webhooks')
export class DeliveryWebhook {
  @PrimaryGeneratedColumn()
  id: number

  @Column()
  name: string

  @Column()
  url: string

  @Column({ nullable: true })
  secret: string

  @Column({ default: true })
  is_active: boolean

  @Column({ type: 'simple-array', nullable: true })
  events: string[]

  @Column({ nullable: true })
  provider: string

  @Column({ type: 'jsonb', nullable: true })
  config: Record<string, any>

  @Column({ default: 0 })
  failure_count: number

  @Column({ nullable: true })
  last_triggered_at: Date

  @CreateDateColumn()
  created_at: Date

  @UpdateDateColumn()
  updated_at: Date
}
