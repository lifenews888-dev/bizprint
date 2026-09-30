import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm'
import { numeric } from './numeric.transformer'

/**
 * BizPrint өнгөний каталог — "BP-R101 Улаан" гэх мэт.
 * Lab (D50) нь эталон утга; принтер бүр энэ утгад хэр ойр хэвлэж
 * чадахыг DeviceColorProfile-д хадгална.
 */
@Entity('color_codes')
export class ColorCode {
  @PrimaryGeneratedColumn('uuid')
  id: string

  @Column({ length: 32, unique: true })
  code: string

  @Column({ length: 120 })
  name: string

  @Column({ type: 'varchar', length: 40, nullable: true })
  family: string | null

  @Column({ name: 'lab_l', type: 'numeric', precision: 6, scale: 2, transformer: numeric })
  labL: number

  @Column({ name: 'lab_a', type: 'numeric', precision: 6, scale: 2, transformer: numeric })
  labA: number

  @Column({ name: 'lab_b', type: 'numeric', precision: 6, scale: 2, transformer: numeric })
  labB: number

  /** Дэлгэцэнд харуулах ойролцоо өнгө */
  @Column({ type: 'varchar', length: 7, nullable: true })
  hex: string | null

  @Column({ name: 'is_active', default: true })
  isActive: boolean

  @Column({ name: 'sort_order', type: 'int', default: 0 })
  sortOrder: number

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt: Date
}
