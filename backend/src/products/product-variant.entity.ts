import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn } from 'typeorm'
import { Product } from './product.entity'
import { Variant } from '../variants/variant.entity'

@Entity('product_variants')
export class ProductVariant {

@PrimaryGeneratedColumn('uuid')
id: string

@ManyToOne(() => Product)
@JoinColumn({ name: 'product_id' })
product: Product

@ManyToOne(() => Variant)
@JoinColumn({ name: 'variant_id' })
variant: Variant

@Column({ default: 0 })
base_price: number

@Column({ default: false })
is_default: boolean

@Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
created_at: Date

}
