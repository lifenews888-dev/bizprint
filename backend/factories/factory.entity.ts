import { Entity, Column, PrimaryGeneratedColumn } from 'typeorm'

@Entity()
export class Factory {

  @PrimaryGeneratedColumn()
  id: number

  @Column()
  name: string

  @Column()
  location: string

  @Column()
  machine: string

  @Column()
  capacity_per_day: number

  @Column()
  base_cost: number

  @Column()
  queue_load: number

}