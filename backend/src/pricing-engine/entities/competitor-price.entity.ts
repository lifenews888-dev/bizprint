import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from 'typeorm'

@Entity('competitor_prices')
export class CompetitorPrice {
  @PrimaryGeneratedColumn('uuid')
  id: string

  @Column()
  competitor_name: string

  @Column()
  product_code: string

  @Column({ type: 'decimal', precision: 14, scale: 2 })
  price: number

  @Column({ nullable: true })
  notes: string

  @CreateDateColumn()
  updated_at: Date
}
