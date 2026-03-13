import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm'

@Entity()
export class Factory {

  @PrimaryGeneratedColumn()
  id: number

  @Column()
  name: string

  @Column()
  city: string

  @Column()
  machine_type: string

  @Column()
  speed_per_hour: number

  @Column()
  setup_cost: number

  @Column()
  run_cost: number

  @Column({ default: 0 })
  current_load: number

}