import { Entity, PrimaryGeneratedColumn, Column, Unique, Index } from 'typeorm'
import { numeric } from './numeric.transformer'

/**
 * Калибровкын хэмжилт: өнгө X-г принтер Y дээр материал Z-д хэвлээд
 * спектрофотометрээр хэмжсэн Lab ба эталоноос зөрөх ΔE00.
 * media = '' → бүх материалд хамаарна.
 */
@Entity('device_color_profiles')
@Unique('uq_device_color_media', ['deviceId', 'colorCodeId', 'media'])
export class DeviceColorProfile {
  @PrimaryGeneratedColumn('uuid')
  id: string

  @Index('idx_device_color_profiles_device')
  @Column({ name: 'device_id', type: 'uuid' })
  deviceId: string

  @Column({ name: 'color_code_id', type: 'uuid' })
  colorCodeId: string

  @Column({ length: 80, default: '' })
  media: string

  @Column({ name: 'measured_l', type: 'numeric', precision: 6, scale: 2, transformer: numeric })
  measuredL: number

  @Column({ name: 'measured_a', type: 'numeric', precision: 6, scale: 2, transformer: numeric })
  measuredA: number

  @Column({ name: 'measured_b', type: 'numeric', precision: 6, scale: 2, transformer: numeric })
  measuredB: number

  @Column({ name: 'delta_e', type: 'numeric', precision: 6, scale: 2, transformer: numeric })
  deltaE: number

  /** RIP-ийн spot сангийн нэр, CMYK+W хольц гэх мэт */
  @Column({ type: 'jsonb', nullable: true })
  recipe: Record<string, any> | null

  @Column({ name: 'measured_at', type: 'timestamptz', default: () => 'now()' })
  measuredAt: Date
}
