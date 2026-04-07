// ============================================================
// 1. vendor.entity.ts-д НЭМЭХ columns (байгаа entity-д нэмэх)
// ============================================================
export const vendorGeoColumns = `
  // Geo location
  @Column({ type: 'decimal', precision: 10, scale: 7, nullable: true })
  latitude: number;

  @Column({ type: 'decimal', precision: 10, scale: 7, nullable: true })
  longitude: number;

  @Column({ nullable: true })
  district: string; // Дүүрэг: БЗД, СХД, ХУД, ЧД, СБД, БГД, НД, БНД, ХЭД, ЭД, БХД, НДЭ, ЗА, ДА, ДА-1, Дархан, Эрдэнэт

  @Column({ type: 'int', default: 5 })
  delivery_radius_km: number; // Хүргэлтийн радиус км

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  base_delivery_cost: number; // Суурь хүргэлтийн зардал (км-д)

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 500 })
  cost_per_km: number; // км тутамд нэмэгдэх зардал
`;


// ============================================================
// 2. geo-routing.service.ts — байршилд тулгуурласан vendor сонгох
// ============================================================
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

export interface GeoPoint {
  lat: number;
  lng: number;
}

export interface VendorWithDistance {
  vendor: any;
  distanceKm: number;
  estimatedDeliveryHours: number;
  deliveryCost: number;
  score: number; // combined score
}

export interface GeoRoutingResult {
  nearest: VendorWithDistance | null;
  candidates: VendorWithDistance[];
  strategy: 'nearest' | 'fastest' | 'cheapest' | 'best_score';
  customerLocation: GeoPoint;
  estimatedSavings: number; // хүргэлтийн зардал хэмнэлт
}

// Улаанбаатарын дүүргүүдийн координат
export const UB_DISTRICTS: Record<string, GeoPoint> = {
  'БЗД':  { lat: 47.9184, lng: 106.9177 }, // Баянзүрх
  'СХД':  { lat: 47.9057, lng: 106.8325 }, // Сүхбаатар
  'ХУД':  { lat: 47.8953, lng: 106.8917 }, // Хан-Уул
  'ЧД':   { lat: 47.9138, lng: 106.8832 }, // Чингэлтэй
  'СБД':  { lat: 47.9065, lng: 106.9021 }, // Сонгинохайрхан
  'БГД':  { lat: 47.9273, lng: 106.9384 }, // Баянгол
  'НД':   { lat: 47.8845, lng: 106.7612 }, // Налайх
  'БНД':  { lat: 47.7612, lng: 107.0234 }, // Багануур
  'ХЭД':  { lat: 47.9421, lng: 106.7823 }, // Хэнтий зам
  'ЭД':   { lat: 47.9532, lng: 106.9745 }, // Эмээлт
};

@Injectable()
export class GeoRoutingService {
  constructor(
    @InjectRepository('Vendor')
    private vendorRepo: Repository<any>,
  ) {}

  // ── Хоёр цэгийн хоорондох зай тооцоох (Haversine formula) ──
  calculateDistance(point1: GeoPoint, point2: GeoPoint): number {
    const R = 6371; // Дэлхийн радиус км
    const dLat = this.toRad(point2.lat - point1.lat);
    const dLng = this.toRad(point2.lng - point1.lng);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.toRad(point1.lat)) *
        Math.cos(this.toRad(point2.lat)) *
        Math.sin(dLng / 2) *
        Math.sin(dLng / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  private toRad(deg: number): number {
    return (deg * Math.PI) / 180;
  }

  // ── Захиалагчийн байршилд хамгийн тохиромжтой vendor олох ──
  async findNearestVendors(
    customerLocation: GeoPoint,
    options: {
      productType?: string;
      quantity?: number;
      maxDistanceKm?: number;
      strategy?: 'nearest' | 'fastest' | 'cheapest' | 'best_score';
      limit?: number;
    } = {},
  ): Promise<GeoRoutingResult> {
    const {
      productType,
      maxDistanceKm = 50,
      strategy = 'best_score',
      limit = 5,
    } = options;

    // Бүх идэвхтэй vendor авах
    const vendors = await this.vendorRepo.find({
      where: { status: 'active' },
    });

    // Координаттай vendor-уудыг шүүх + зай тооцоолох
    const vendorsWithDistance: VendorWithDistance[] = vendors
      .filter(v => v.latitude && v.longitude)
      .map(vendor => {
        const vendorPoint: GeoPoint = {
          lat: Number(vendor.latitude),
          lng: Number(vendor.longitude),
        };
        const distanceKm = this.calculateDistance(customerLocation, vendorPoint);

        // Хүргэлтийн зардал тооцоолох
        const deliveryCost = this.calcDeliveryCost(
          distanceKm,
          Number(vendor.base_delivery_cost || 0),
          Number(vendor.cost_per_km || 500),
          Number(vendor.delivery_radius_km || 5),
        );

        // Хүргэлтийн цаг тооцоолох
        const estimatedDeliveryHours = this.estimateDeliveryTime(
          distanceKm,
          vendor.delivery_time_hours || 24,
        );

        // Combined score (байршил + чанар + үнэ)
        const score = this.calcScore(vendor, distanceKm, deliveryCost);

        return { vendor, distanceKm, estimatedDeliveryHours, deliveryCost, score };
      })
      .filter(v => v.distanceKm <= maxDistanceKm);

    // Product type-р шүүх
    let filtered = vendorsWithDistance;
    if (productType) {
      filtered = vendorsWithDistance.filter(v =>
        !v.vendor.services?.length ||
        v.vendor.services.includes(productType) ||
        v.vendor.services.includes('all')
      );
    }

    // Strategy-р эрэмблэх
    const sorted = [...filtered].sort((a, b) => {
      switch (strategy) {
        case 'nearest':  return a.distanceKm - b.distanceKm;
        case 'fastest':  return a.estimatedDeliveryHours - b.estimatedDeliveryHours;
        case 'cheapest': return a.deliveryCost - b.deliveryCost;
        case 'best_score': return b.score - a.score;
        default: return b.score - a.score;
      }
    });

    const candidates = sorted.slice(0, limit);
    const nearest = candidates[0] || null;

    // Хэмнэлт тооцоолох (хамгийн алслагдсан vendor-тэй харьцуулан)
    const maxCost = Math.max(...candidates.map(v => v.deliveryCost), 0);
    const estimatedSavings = nearest ? maxCost - nearest.deliveryCost : 0;

    return {
      nearest,
      candidates,
      strategy,
      customerLocation,
      estimatedSavings,
    };
  }

  // ── Хүргэлтийн зардал тооцоолох ──
  calcDeliveryCost(
    distanceKm: number,
    baseCost: number,
    costPerKm: number,
    freeRadiusKm: number,
  ): number {
    if (distanceKm <= freeRadiusKm) return 0; // Ойрхон бол үнэгүй
    const extraKm = distanceKm - freeRadiusKm;
    return Math.round(baseCost + extraKm * costPerKm);
  }

  // ── Хүргэлтийн цаг тооцоолох ──
  estimateDeliveryTime(distanceKm: number, baseHours: number): number {
    // УБ хотын дотор: 2-4 цаг, гадна: +1 цаг/10км
    if (distanceKm <= 5) return Math.min(baseHours, 4);
    if (distanceKm <= 15) return Math.min(baseHours, 8);
    if (distanceKm <= 30) return Math.min(baseHours, 12);
    return baseHours + Math.floor(distanceKm / 10);
  }

  // ── Нийт оноо тооцоолох ──
  private calcScore(vendor: any, distanceKm: number, deliveryCost: number): number {
    let score = 0;

    // Байршлын оноо (ойр = өндөр оноо)
    const locationScore = Math.max(0, 100 - distanceKm * 3);
    score += locationScore * 0.35;

    // Чанарын оноо
    const qualityScore = (Number(vendor.score) || 50);
    score += qualityScore * 0.30;

    // Үнийн оноо (хүргэлт үнэгүй = өндөр оноо)
    const costScore = deliveryCost === 0 ? 100 : Math.max(0, 100 - deliveryCost / 100);
    score += costScore * 0.20;

    // Хүчин чадлын оноо
    const loadScore = vendor.load_status === 'available' ? 100
      : vendor.load_status === 'busy' ? 50 : 0;
    score += loadScore * 0.15;

    return Math.round(score);
  }

  // ── Захиалга үүсэхэд автомат vendor assign ──
  async autoAssignVendor(
    orderId: string,
    customerLat: number,
    customerLng: number,
    productType: string,
    quantity: number,
  ): Promise<{ vendorId: string; distanceKm: number; deliveryCost: number } | null> {
    const result = await this.findNearestVendors(
      { lat: customerLat, lng: customerLng },
      { productType, quantity, strategy: 'best_score', limit: 3 },
    );

    if (!result.nearest) return null;

    return {
      vendorId: result.nearest.vendor.id,
      distanceKm: result.nearest.distanceKm,
      deliveryCost: result.nearest.deliveryCost,
    };
  }

  // ── Дүүргийн нэрээр координат авах ──
  getDistrictCoordinates(district: string): GeoPoint | null {
    return UB_DISTRICTS[district] || null;
  }

  // ── IP эсвэл browser-ийн байршилгүй үед default UБ төв ──
  getDefaultLocation(): GeoPoint {
    return { lat: 47.9138, lng: 106.9057 }; // УБ төв
  }
}


// ============================================================
// 3. geo-routing.controller.ts
// ============================================================
import { Controller, Post, Get, Body, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';

@ApiTags('Geo Routing')
@Controller('geo')
export class GeoRoutingController {
  constructor(private readonly geoSvc: GeoRoutingService) {}

  // Хамгийн ойр үйлдвэрүүд олох
  @Post('nearest-vendors')
  findNearest(@Body() body: {
    lat: number;
    lng: number;
    productType?: string;
    quantity?: number;
    strategy?: string;
  }) {
    return this.geoSvc.findNearestVendors(
      { lat: body.lat, lng: body.lng },
      {
        productType: body.productType,
        quantity: body.quantity,
        strategy: (body.strategy as any) || 'best_score',
      },
    );
  }

  // Зай тооцоолох
  @Post('distance')
  calcDistance(@Body() body: {
    from: { lat: number; lng: number };
    to: { lat: number; lng: number };
  }) {
    const distance = this.geoSvc.calculateDistance(body.from, body.to);
    const cost = this.geoSvc.calcDeliveryCost(distance, 0, 500, 5);
    return {
      distanceKm: Math.round(distance * 10) / 10,
      deliveryCost: cost,
      isFreeDelivery: cost === 0,
      estimatedHours: this.geoSvc.estimateDeliveryTime(distance, 24),
    };
  }

  // Дүүргүүдийн жагсаалт
  @Get('districts')
  getDistricts() {
    return Object.entries(UB_DISTRICTS).map(([name, coords]) => ({
      name,
      ...coords,
    }));
  }
}


// ============================================================
// 4. geo-routing.module.ts
// ============================================================
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

@Module({
  imports: [TypeOrmModule.forFeature(['Vendor'])],
  controllers: [GeoRoutingController],
  providers: [GeoRoutingService],
  exports: [GeoRoutingService],
})
export class GeoRoutingModule {}
