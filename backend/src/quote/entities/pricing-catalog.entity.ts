import {
  Entity, PrimaryGeneratedColumn, Column,
  CreateDateColumn, UpdateDateColumn,
} from 'typeorm';

/* ═══════════════════════════════════════
 *  Catalog Material — материалын мэдээллийн сан
 * ═══════════════════════════════════════ */

@Entity('catalog_materials')
export class CatalogMaterial {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  key: string; // e.g. acrylic_5mm

  @Column()
  name: string; // Акрил 5мм

  @Column({ default: 'signage' })
  category: string; // signage, printing, wide_format, metal, special

  @Column({ type: 'decimal', precision: 12, scale: 2 })
  rate_per_m2: number; // ₮/м²

  @Column({ type: 'decimal', precision: 5, scale: 2, default: 0.10 })
  waste_factor: number; // 0.10 = 10%

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  min_order_m2: number;

  @Column({ nullable: true })
  description: string;

  @Column({ default: true })
  is_active: boolean;

  @Column({ default: 0 })
  sort_order: number;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}

/* ═══════════════════════════════════════
 *  Catalog Machine — машин/тоног төхөөрөмж
 * ═══════════════════════════════════════ */

@Entity('catalog_machines')
export class CatalogMachine {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  key: string; // e.g. cnc_router

  @Column()
  name: string; // CNC Router

  @Column()
  machine_type: string; // cnc, laser, uv_print, offset, digital, wide, led

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  speed_m2_per_hour: number;

  @Column({ type: 'decimal', precision: 12, scale: 2 })
  hourly_rate: number; // ₮/цаг

  @Column({ type: 'int', default: 30 })
  setup_time_min: number;

  @Column({ type: 'decimal', precision: 12, scale: 2, default: 15000 })
  setup_cost: number;

  @Column({ type: 'int', default: 2400 })
  max_width_mm: number;

  @Column({ type: 'int', default: 1200 })
  max_height_mm: number;

  @Column({ nullable: true })
  description: string;

  @Column({ default: true })
  is_active: boolean;

  @Column({ default: 0 })
  sort_order: number;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}

/* ═══════════════════════════════════════
 *  Catalog Finishing — дараа боловсруулалт
 * ═══════════════════════════════════════ */

@Entity('catalog_finishings')
export class CatalogFinishing {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  key: string; // e.g. lamination_matt

  @Column()
  name: string; // Мат ламинаци

  @Column({ type: 'decimal', precision: 12, scale: 2 })
  cost_per_m2: number; // ₮/м²

  @Column({ type: 'decimal', precision: 5, scale: 2, default: 0.3 })
  time_hours_per_m2: number;

  @Column({ nullable: true })
  description: string;

  @Column({ default: true })
  is_active: boolean;

  @Column({ default: 0 })
  sort_order: number;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}

/* ═══════════════════════════════════════
 *  Catalog Margin Rule — ашгийн дүрэм
 * ═══════════════════════════════════════ */

@Entity('catalog_margin_rules')
export class CatalogMarginRule {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  key: string; // e.g. retail, b2b, rush

  @Column()
  name: string; // Жижиглэн

  @Column({ type: 'decimal', precision: 5, scale: 2 })
  margin_rate: number; // 0.45 = 45%

  @Column({ nullable: true })
  description: string;

  @Column({ default: true })
  is_active: boolean;

  @Column({ default: 0 })
  sort_order: number;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}

/* ═══════════════════════════════════════
 *  Material → Machine mapping
 * ═══════════════════════════════════════ */

@Entity('catalog_material_machine_map')
export class CatalogMaterialMachineMap {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  material_key: string;

  @Column()
  machine_key: string;

  @Column({ type: 'int', default: 0 })
  min_quantity: number; // 0 = default

  @Column({ type: 'int', default: 999999 })
  max_quantity: number;

  @Column({ default: 0 })
  priority: number; // higher = preferred

  @Column({ default: true })
  is_active: boolean;
}

/* ═══════════════════════════════════════
 *  Товгор үсэг үнэ (per letter/size)
 * ═══════════════════════════════════════ */

@Entity('catalog_letter_prices')
export class CatalogLetterPrice {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'int' })
  size_cm: number; // 15, 20, 25, 30...

  @Column({ type: 'decimal', precision: 12, scale: 2 })
  price_per_letter: number; // ₮

  @Column({ nullable: true })
  material_type: string; // acrylic, pvc, stainless

  @Column({ default: true })
  is_active: boolean;
}
