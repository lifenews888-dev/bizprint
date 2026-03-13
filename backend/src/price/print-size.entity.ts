import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm'

@Entity()
export class PrintSize {

  @PrimaryGeneratedColumn('uuid')
  id: string

  @Column()
  name: string

  @Column()
  width_mm: number

  @Column()
  height_mm: number

}