import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from 'typeorm'

/**
 * Хэвлэлийн төрөл (dtf_transfer, banner…) → дэлгүүрийн бүтээгдэхүүн.
 * Desktop апп захиалга өгөхдөө `productId`-аар cart → quote → order
 * урсгалаар явна (үнэ нь бүтээгдэхүүнээс). `key` нь print_devices.product_types-тэй таарна.
 */
@Entity('print_product_types')
export class PrintProductType {
  @PrimaryGeneratedColumn('uuid')
  id: string

  @Column({ length: 40, unique: true })
  key: string

  @Column({ length: 120 })
  name: string

  /** print = принтерт чиглүүлэгдэнэ; service = зөвхөн үнэтэй мөр (жишээ нь дизайн үйлчилгээ) */
  @Column({ length: 16, default: 'print' })
  kind: string

  @Column({ name: 'product_id', type: 'uuid', nullable: true })
  productId: string | null

  /** Сонгох боломжтой материал: [{key:"pet_film", name:"PET хальс"}] */
  @Column({ type: 'jsonb', default: () => "'[]'" })
  media: { key: string; name: string }[]

  @Column({ name: 'is_active', default: true })
  isActive: boolean

  @Column({ name: 'sort_order', type: 'int', default: 0 })
  sortOrder: number

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date
}
