import { Entity, PrimaryGeneratedColumn, Column, OneToMany, Index, CreateDateColumn, UpdateDateColumn } from 'typeorm'
import { CartItem } from './entities/cart-item.entity'

export enum CartStatus {
  ACTIVE = 'active',
  MERGED = 'merged',
  CONVERTED = 'converted',
  EXPIRED = 'expired',
  ABANDONED = 'abandoned',
}

@Entity('carts')
@Index('UQ_cart_active_customer', ['customer_id'], { unique: true, where: "status = 'active'" })
export class Cart {

  @PrimaryGeneratedColumn('uuid')
  id: string

  @Column({
    type: 'uuid'
  })
  customer_id: string

  @Column({
    type: 'enum',
    enum: CartStatus,
    default: CartStatus.ACTIVE
  })
  status: CartStatus

  @OneToMany(() => CartItem, (item: CartItem) => item.cart, {
    cascade: true
  })
  items: CartItem[]

  @CreateDateColumn()
  created_at: Date

  @UpdateDateColumn()
  updated_at: Date

}