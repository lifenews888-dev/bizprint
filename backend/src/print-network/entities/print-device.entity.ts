import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm'
import { numeric } from './numeric.transformer'

export enum PrintTechnology {
  DTF = 'dtf',
  ECO_SOLVENT = 'eco_solvent',
  UV = 'uv',
  SUBLIMATION = 'sublimation',
  LATEX = 'latex',
  LASER = 'laser',
  INKJET = 'inkjet',
  OFFSET = 'offset',
}

export enum PrintDeviceStatus {
  ACTIVE = 'active',
  PAUSED = 'paused',
  MAINTENANCE = 'maintenance',
}

/**
 * Цех дэх принтер (RIP-ээр дамжуулж удирдагдана).
 * `hotfolderKey` — агент энэ түлхүүрээр өөрийн локал hotfolder замыг олно.
 */
@Entity('print_devices')
export class PrintDevice {
  @PrimaryGeneratedColumn('uuid')
  id: string

  @Column({ length: 120 })
  name: string

  @Column({ length: 32 })
  technology: string

  /** Сүлжээний цех (4-р шат). null = BizPrint-ийн өөрийн цех */
  @Column({ name: 'vendor_id', type: 'uuid', nullable: true })
  vendorId: string | null

  @Column({ name: 'agent_id', type: 'uuid', nullable: true })
  agentId: string | null

  /** Энэ принтер хэвлэж чадах бүтээгдэхүүний төрлүүд: ["dtf_transfer","banner",...] */
  @Column({ name: 'product_types', type: 'jsonb', default: () => "'[]'" })
  productTypes: string[]

  /** Дэмжих материал: ["pet_film","vinyl_440g",...]. Хоосон = ямар ч */
  @Column({ type: 'jsonb', default: () => "'[]'" })
  media: string[]

  @Column({ name: 'max_width_mm', type: 'int', nullable: true })
  maxWidthMm: number | null

  @Column({ name: 'hotfolder_key', type: 'varchar', length: 120, nullable: true })
  hotfolderKey: string | null

  /** Зөвшөөрөгдөх дээд ΔE00 */
  @Column({ name: 'delta_e_tolerance', type: 'numeric', precision: 4, scale: 2, default: 3, transformer: numeric })
  deltaETolerance: number

  @Column({ length: 16, default: PrintDeviceStatus.ACTIVE })
  status: string

  @Column({ type: 'text', nullable: true })
  notes: string | null

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt: Date
}
