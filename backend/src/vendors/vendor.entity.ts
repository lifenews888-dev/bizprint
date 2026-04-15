import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, OneToMany } from 'typeorm';
import { VendorCapability } from './entities/vendor-capability.entity';

export enum VendorTier {
  GOLD = 'gold',
  SILVER = 'silver',
  BRONZE = 'bronze',
}

export enum CapacityTier {
  SMALL = 'small',           // < 1,000/day
  MEDIUM = 'medium',         // 1,000 – 10,000/day
  LARGE = 'large',           // 10,000 – 50,000/day
  ENTERPRISE = 'enterprise', // > 50,000/day
}

export enum LoadStatus {
  AVAILABLE = 'available',   // < 60%
  BUSY = 'busy',             // 60–90%
  FULL = 'full',             // > 90%
}

export enum VendorStatus {
  ACTIVE = 'active',
  PAUSED = 'paused',
  SUSPENDED = 'suspended',
  PENDING = 'pending',
}

export enum VendorType {
  DIGITAL_PRINT = 'digital_print',
  OFFSET_PRINT = 'offset_print',
  LARGE_FORMAT = 'large_format',
  SIGNAGE = 'signage',
  PACKAGING = 'packaging',
  MIXED = 'mixed',
}

export enum PricingTier {
  A = 'A',  // Premium — high quality, high price
  B = 'B',  // Standard
  C = 'C',  // Budget — low cost
}

export enum CoverageArea {
  LOCAL = 'local',       // Улаанбаатар дотор
  NATIONWIDE = 'nationwide', // Бүх монгол
}

export enum PaymentTerms {
  DAYS_7 = '7',
  DAYS_14 = '14',
  DAYS_30 = '30',
}

@Entity('vendors')
export class Vendor {

  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  company_name: string;

  @Column({ nullable: true })
  user_id: string;  // Linked user account id (for JWT → vendor lookup)

  @Column({ nullable: true, unique: true })
  slug: string;  // Public URL slug: bizprint.mn/vendor/<slug>

  @Column()
  contact_email: string;

  @Column({ nullable: true })
  phone: string;

  @Column({ nullable: true })
  address: string;

  @Column({ default: false })
  verified: boolean;

  // ─── Tier & Performance ───
  @Column({ type: 'enum', enum: VendorTier, default: VendorTier.BRONZE })
  tier: VendorTier;

  @Column({ type: 'decimal', precision: 5, scale: 2, default: 50 })
  score: number;

  @Column({ type: 'enum', enum: VendorStatus, default: VendorStatus.ACTIVE })
  status: VendorStatus;

  // ─── Capacity ───
  @Column({ type: 'int', default: 10 })
  capacity_per_day: number;

  @Column({ type: 'int', default: 0 })
  current_load: number;

  @Column({ type: 'enum', enum: CapacityTier, default: CapacityTier.SMALL })
  capacity_tier: CapacityTier;

  @Column({ type: 'enum', enum: LoadStatus, default: LoadStatus.AVAILABLE })
  load_status: LoadStatus;

  // ─── Vendor Type & Services ───
  @Column({ type: 'enum', enum: VendorType, default: VendorType.DIGITAL_PRINT })
  vendor_type: VendorType;

  @Column({ type: 'jsonb', default: [] })
  services: string[];  // ['banner', 'sticker', 'book', 'business_card', ...]

  @Column({ type: 'jsonb', default: [] })
  machine_types: string[];  // ['digital_press', 'offset_4color', 'large_format_printer', ...]

  @Column({ type: 'jsonb', default: [] })
  supported_materials: string[];  // ['art_paper', 'coated', 'vinyl', 'canvas', ...]

  // ─── Pricing ───
  @Column({ type: 'enum', enum: PricingTier, default: PricingTier.B })
  pricing_tier: PricingTier;

  @Column({ type: 'decimal', precision: 3, scale: 1, default: 1.2 })
  rush_multiplier: number;  // яаралтай захиалгын үнийн коэффициент

  @Column({ type: 'decimal', precision: 5, scale: 2, default: 15 })
  commission_rate: number;  // BizPrint-ийн шимтгэл (%)

  @Column({ type: 'jsonb', nullable: true })
  floor_prices: Record<string, number>;  // product_type → нь хүлээн авах хамгийн бага үнэ

  @Column({ default: true })
  accepts_orders: boolean;  // vendor шинэ захиалга хүлээн авч буй эсэх

  @Column({ type: 'enum', enum: PaymentTerms, default: PaymentTerms.DAYS_14 })
  payment_terms: PaymentTerms;

  // ─── Logistics ───
  @Column({ default: false })
  has_delivery: boolean;

  @Column({ type: 'int', default: 24 })
  delivery_time_hours: number;

  @Column({ type: 'enum', enum: CoverageArea, default: CoverageArea.LOCAL })
  coverage_area: CoverageArea;

  // ─── System Flags ───
  @Column({ default: false })
  is_priority: boolean;  // Давуу эрхтэй vendor (захиалга сонголтонд)

  @Column({ nullable: true })
  contact_name: string;

  // ─── Business Info ───
  @Column({ nullable: true })
  logo_url: string;

  @Column({ nullable: true })
  description: string;

  @Column({ type: 'decimal', precision: 3, scale: 1, default: 0 })
  rating: number;

  @Column({ type: 'int', default: 0 })
  total_orders: number;

  @OneToMany(() => VendorCapability, (vc) => vc.vendor)
  vendor_capabilities: VendorCapability[];

  // ── Geo Location ──────────────────────────────────────
  @Column({ type: 'decimal', precision: 10, scale: 7, nullable: true })
  latitude: number;

  @Column({ type: 'decimal', precision: 10, scale: 7, nullable: true })
  longitude: number;

  @Column({ nullable: true })
  district: string;

  @Column({ type: 'int', default: 5 })
  delivery_radius_km: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  base_delivery_cost: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 500 })
  cost_per_km: number;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}