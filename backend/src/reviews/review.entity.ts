import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from 'typeorm'

@Entity('reviews')
export class Review {
  @PrimaryGeneratedColumn('uuid')
  id: string

  @Column()
  customer_name: string

  @Column({ nullable: true })
  customer_company: string

  @Column({ type: 'int', default: 5 })
  rating: number

  @Column({ type: 'text' })
  text: string

  @Column({ nullable: true })
  product_category: string

  @Column({ default: false })
  is_approved: boolean

  @CreateDateColumn()
  created_at: Date
}
