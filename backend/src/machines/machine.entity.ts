import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm'

@Entity('machine')
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

}