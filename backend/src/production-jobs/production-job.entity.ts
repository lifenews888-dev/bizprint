import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm'

@Entity()
export class ProductionJob {

  @PrimaryGeneratedColumn('uuid')
  id: string

  @Column()
  order_id: number

  @Column()
  factory_id: number

  @Column({ nullable: true })
  machine_id: number

  @Column({
    default: 'queued'
  })
  status: string

  @Column()
  queue_position: number

  @Column({ type: 'timestamp', nullable: true })
  started_at: Date

  @Column({ type: 'timestamp', nullable: true })
  completed_at: Date

  @CreateDateColumn()
  created_at: Date

  @UpdateDateColumn()
  updated_at: Date

}