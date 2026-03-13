import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm'

@Entity('variants')
export class Variant {

  @PrimaryGeneratedColumn('uuid')
  id: string

  @Column()
  name: string

  @Column()
  material: string

  @Column()
  finish: string

  @Column()
  size: string

  @Column()
  paper_gsm: number

  @Column({ default: 0 })
  price: number

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  created_at: Date
}