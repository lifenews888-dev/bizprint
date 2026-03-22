import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from 'typeorm'

export enum MachineStatus {
  AVAILABLE = 'available',
  BUSY = 'busy',
  MAINTENANCE = 'maintenance',
}

@Entity('machines')
export class Machine {
  @PrimaryGeneratedColumn()
  id: number

  @Column()
  name: string

  @Column()
  type: string

  @Column()
  speed_per_hour: number

  @Column()
  sheet_width_mm: number

  @Column()
  sheet_height_mm: number

  @Column()
  hour_rate: number

  @Column()
  factory_id: number

  @Column({
    type: 'enum',
    enum: MachineStatus,
    default: MachineStatus.AVAILABLE,
  })
  status: MachineStatus

  @CreateDateColumn()
  created_at: Date
}