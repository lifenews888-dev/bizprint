// ============================================================
// БАЙРШУУЛАХ ЗААВАР
// ============================================================

// ── 1. vendor.entity.ts-д нэмэх (байгаа @OneToMany-н өмнө) ──
export const VENDOR_GEO_FIELDS = `
  // ── Geo Location ──────────────────────────────────────────
  @Column({ type: 'decimal', precision: 10, scale: 7, nullable: true })
  latitude: number;

  @Column({ type: 'decimal', precision: 10, scale: 7, nullable: true })
  longitude: number;

  @Column({ nullable: true })
  district: string; // БЗД, СХД, ХУД, ЧД, СБД, БГД, НД, БНД

  @Column({ type: 'int', default: 5 })
  delivery_radius_km: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  base_delivery_cost: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 500 })
  cost_per_km: number; // 500₮/км
`;

// ── 2. order.entity.ts-д нэмэх ──────────────────────────────
export const ORDER_GEO_FIELDS = `
  // ── Delivery Location ─────────────────────────────────────
  @Column({ type: 'decimal', precision: 10, scale: 7, nullable: true })
  delivery_lat: number;

  @Column({ type: 'decimal', precision: 10, scale: 7, nullable: true })
  delivery_lng: number;

  @Column({ nullable: true })
  delivery_district: string;

  @Column({ nullable: true })
  assigned_vendor_id: string; // Geo-routing-р автомат сонгогдсон vendor

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  delivery_cost: number; // Тооцоолсон хүргэлтийн зардал

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  vendor_distance_km: number; // Vendor → захиалагчийн зай
`;

// ── 3. orders.service.ts-д нэмэх (create method дотор) ──────
export const ORDER_CREATE_GEO = `
// GeoRoutingService inject хийх
constructor(
  // ... байгаа dependencies ...
  private geoRouting: GeoRoutingService,
) {}

async create(dto: CreateOrderDto) {
  const order = this.repo.create(dto);

  // Байршил байгаа бол автомат vendor assign
  if (dto.delivery_lat && dto.delivery_lng) {
    const assignment = await this.geoRouting.autoAssignVendor(
      order.id,
      dto.delivery_lat,
      dto.delivery_lng,
      dto.product_type,
      dto.quantity,
    );

    if (assignment) {
      order.assigned_vendor_id = assignment.vendorId;
      order.delivery_cost = assignment.deliveryCost;
      order.vendor_distance_km = assignment.distanceKm;
    }
  }

  return this.repo.save(order);
}
`;

// ── 4. app.module.ts-д нэмэх ────────────────────────────────
export const APP_MODULE_ADDITION = `
import { GeoRoutingModule } from './geo-routing/geo-routing.module';

@Module({
  imports: [
    // ... байгаа modules ...
    GeoRoutingModule,
  ],
})
`;

// ── 5. Vendor seed-д байршил нэмэх ──────────────────────────
export const VENDOR_GEO_SEED = `
// Демо vendor-уудад байршил нэмэх
const vendorLocations = [
  {
    company_name: 'БЗД Принт',
    latitude: 47.9184, longitude: 106.9177,
    district: 'БЗД',
    delivery_radius_km: 3,
    base_delivery_cost: 3000,
    cost_per_km: 500,
  },
  {
    company_name: 'СХД Хэвлэл',
    latitude: 47.9057, longitude: 106.8325,
    district: 'СХД',
    delivery_radius_km: 5,
    base_delivery_cost: 2000,
    cost_per_km: 400,
  },
  {
    company_name: 'ХУД Дижитал Принт',
    latitude: 47.8953, longitude: 106.8917,
    district: 'ХУД',
    delivery_radius_km: 4,
    base_delivery_cost: 2500,
    cost_per_km: 450,
  },
  {
    company_name: 'ЧД Офсет',
    latitude: 47.9138, longitude: 106.8832,
    district: 'ЧД',
    delivery_radius_km: 3,
    base_delivery_cost: 3000,
    cost_per_km: 500,
  },
  {
    company_name: 'БГД Баннер Молл',
    latitude: 47.9273, longitude: 106.9384,
    district: 'БГД',
    delivery_radius_km: 6,
    base_delivery_cost: 1500,
    cost_per_km: 350,
  },
];
`;

// ── 6. Frontend-д ашиглах ───────────────────────────────────
export const FRONTEND_USAGE = `
// checkout/page.tsx эсвэл quote/instant/page.tsx-д нэмэх
import NearestVendorCard from '@/components/geo/NearestVendorCard';

// Захиалга хийх хэсэгт нэмэх:
<NearestVendorCard
  productType={productType}
  quantity={quantity}
  onVendorSelect={(vendorId, deliveryCost) => {
    setSelectedVendorId(vendorId);
    setDeliveryCost(deliveryCost); // Автомат хямдрал
  }}
/>
`;
