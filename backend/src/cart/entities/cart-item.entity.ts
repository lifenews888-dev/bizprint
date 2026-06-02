import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, CreateDateColumn } from 'typeorm'
import { Cart } from '../cart.entity'
import { Product } from '../../products/product.entity'

@Entity('cart_items')
export class CartItem {

  @PrimaryGeneratedColumn('uuid')
  id: string

  @Column()
  cart_id: string

  @ManyToOne(() => Cart, (cart: Cart) => cart.items)
  @JoinColumn({ name: 'cart_id' })
  cart: Cart

  @Column({ type: 'uuid', nullable: true })
  product_id: string | null

  @ManyToOne(() => Product, { nullable: true })
  @JoinColumn({ name: 'product_id' })
  product: Product

  @Column()
  quantity: number

  @Column({ type: 'jsonb', nullable: true })
  specs: Record<string, any>

  @Column({ type: 'decimal', precision: 14, scale: 2, nullable: true })
  unit_price: number

  @CreateDateColumn()
  created_at: Date
}
