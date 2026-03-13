import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm'

@Entity('orders')
export class Order {
  @PrimaryGeneratedColumn('uuid')
  id: string

  @Column()
  customer_id: string

  @Column()
  total_amount: number

  @Column({
    type: 'enum',
    enum: [
      'draft',
      'confirmed',
      'pending_file',
      'in_production',
      'dispatched',
      'delivered',
    ],
    default: 'draft',
  })
  status: string
}