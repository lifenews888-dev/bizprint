import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm'

@Entity()
export class FinishType {

  @PrimaryGeneratedColumn('uuid')
  id: string

  @Column()
  name: string

  @Column('decimal')
  price_per_unit: number

}