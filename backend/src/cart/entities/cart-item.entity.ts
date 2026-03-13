import { Entity, PrimaryGeneratedColumn, Column, ManyToOne } from 'typeorm'
import { Cart } from '../cart.entity'

@Entity('cart_items')
export class CartItem {

  @PrimaryGeneratedColumn('uuid')
  id: string

  @Column()
  product_id: string

  @Column()
  quantity: number

  @ManyToOne(() => Cart, (cart: Cart) => cart.items)
  cart: Cart

}