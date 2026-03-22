import { Entity, PrimaryGeneratedColumn, Column, OneToMany } from 'typeorm'
import { ProductionStage } from './production-stage.entity'

export enum ProductionStatus {
  QUEUED = 'queued',
  ASSIGNED = 'assigned',
  PRINTING = 'printing',
  FINISHING = 'finishing',
  COMPLETED = 'completed'
}

@Entity('production_jobs')
export class ProductionJob {

  @PrimaryGeneratedColumn('uuid')
  id: string

  @Column()
  order_id: string

  @Column({ nullable: true })
  machine_id: string

  @Column({ nullable: true })
  vendor_id: string

  @Column({
    type: 'enum',
    enum: ProductionStatus,
    default: ProductionStatus.QUEUED
  })
  status: ProductionStatus

  @Column({ nullable: true })
  start_time: Date

  @Column({ nullable: true })
  end_time: Date

  @OneToMany(() => ProductionStage, (stage) => stage.production_job)
  stages: ProductionStage[]
}