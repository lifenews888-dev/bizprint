import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Vendor } from '../vendors/vendor.entity';

export interface GeoPoint {
  lat: number;
  lng: number;
}

export interface VendorWithDistance {
  vendor: {
    id: string;
    company_name: string;
    district: string;
    tier: string;
    score: number;
    load_status: string;
    delivery_time_hours: number;
    services: string[];
  };
  distanceKm: number;
  estimatedDeliveryHours: number;
  deliveryCost: number;
  score: number;
}

export interface GeoRoutingResult {
  nearest: VendorWithDistance | null;
  candidates: VendorWithDistance[];
  strategy: string;
  customerLocation: GeoPoint;
  estimatedSavings: number;
}

export const UB_DISTRICTS: Record<string, GeoPoint> = {
  'БЗД': { lat: 47.9184, lng: 106.9177 },
  'СХД': { lat: 47.9057, lng: 106.8325 },
  'ХУД': { lat: 47.8953, lng: 106.8917 },
  'ЧД':  { lat: 47.9138, lng: 106.8832 },
  'СБД': { lat: 47.9065, lng: 106.9021 },
  'БГД': { lat: 47.9273, lng: 106.9384 },
  'НД':  { lat: 47.8845, lng: 106.7612 },
  'БНД': { lat: 47.7612, lng: 107.0234 },
  'ХЭЗ': { lat: 47.9421, lng: 106.7823 },
  'ЭМ':  { lat: 47.9532, lng: 106.9745 },
};

@Injectable()
export class GeoRoutingService {
  private readonly logger = new Logger(GeoRoutingService.name);

  constructor(
    @InjectRepository(Vendor)
    private vendorRepo: Repository<Vendor>,
  ) {}

  calculateDistance(p1: GeoPoint, p2: GeoPoint): number {
    const R = 6371;
    const dLat = this.toRad(p2.lat - p1.lat);
    const dLng = this.toRad(p2.lng - p1.lng);
    const a =
      Math.sin(dLat / 2) ** 2 +
      Math.cos(this.toRad(p1.lat)) * Math.cos(this.toRad(p2.lat)) *
      Math.sin(dLng / 2) ** 2;
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  }

  private toRad(deg: number): number {
    return (deg * Math.PI) / 180;
  }

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
    const { productType, maxDistanceKm = 50, strategy = 'best_score', limit = 5 } = options;

    const vendors = await this.vendorRepo.find({ where: { status: 'active' } });

    const vendorsWithDistance: VendorWithDistance[] = vendors
      .filter(v => (v as any).latitude && (v as any).longitude)
      .map(v => {
        const vPoint: GeoPoint = { lat: Number((v as any).latitude), lng: Number((v as any).longitude) };
        const distanceKm = this.calculateDistance(customerLocation, vPoint);
        const deliveryCost = this.calcDeliveryCost(
          distanceKm,
          Number((v as any).base_delivery_cost || 0),
          Number((v as any).cost_per_km || 500),
          Number((v as any).delivery_radius_km || 5),
        );
        const estimatedDeliveryHours = this.estimateDeliveryTime(distanceKm, (v as any).delivery_time_hours || 24);
        const score = this.calcScore(v, distanceKm, deliveryCost);

        return {
          vendor: {
            id: v.id,
            company_name: (v as any).company_name || v.id,
            district: (v as any).district || '',
            tier: (v as any).tier || 'bronze',
            score: Number((v as any).score || 50),
            load_status: (v as any).load_status || 'available',
            delivery_time_hours: (v as any).delivery_time_hours || 24,
            services: (v as any).services || [],
          },
          distanceKm,
          estimatedDeliveryHours,
          deliveryCost,
          score,
        };
      })
      .filter(v => v.distanceKm <= maxDistanceKm);

    let filtered = vendorsWithDistance;
    if (productType) {
      filtered = vendorsWithDistance.filter(v =>
        !v.vendor.services?.length ||
        v.vendor.services.includes(productType) ||
        v.vendor.services.includes('all'),
      );
    }

    const sorted = [...filtered].sort((a, b) => {
      switch (strategy) {
        case 'nearest':  return a.distanceKm - b.distanceKm;
        case 'fastest':  return a.estimatedDeliveryHours - b.estimatedDeliveryHours;
        case 'cheapest': return a.deliveryCost - b.deliveryCost;
        default:         return b.score - a.score;
      }
    });

    const candidates = sorted.slice(0, limit);
    const nearest = candidates[0] || null;
    const maxCost = Math.max(...candidates.map(v => v.deliveryCost), 0);
    const estimatedSavings = nearest ? maxCost - nearest.deliveryCost : 0;

    return { nearest, candidates, strategy, customerLocation, estimatedSavings };
  }

  calcDeliveryCost(distanceKm: number, baseCost: number, costPerKm: number, freeRadiusKm: number): number {
    if (distanceKm <= freeRadiusKm) return 0;
    return Math.round(baseCost + (distanceKm - freeRadiusKm) * costPerKm);
  }

  estimateDeliveryTime(distanceKm: number, baseHours: number): number {
    if (distanceKm <= 5) return Math.min(baseHours, 4);
    if (distanceKm <= 15) return Math.min(baseHours, 8);
    if (distanceKm <= 30) return Math.min(baseHours, 12);
    return baseHours + Math.floor(distanceKm / 10);
  }

  private calcScore(vendor: any, distanceKm: number, deliveryCost: number): number {
    const locationScore = Math.max(0, 100 - distanceKm * 3) * 0.35;
    const qualityScore = (Number(vendor.score) || 50) * 0.30;
    const costScore = (deliveryCost === 0 ? 100 : Math.max(0, 100 - deliveryCost / 100)) * 0.20;
    const loadScore = (vendor.load_status === 'available' ? 100 : vendor.load_status === 'busy' ? 50 : 0) * 0.15;
    return Math.round(locationScore + qualityScore + costScore + loadScore);
  }

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
    this.logger.log(`Auto-assign order ${orderId} → vendor ${result.nearest.vendor.id} (${result.nearest.distanceKm.toFixed(1)}km)`);
    return {
      vendorId: result.nearest.vendor.id,
      distanceKm: result.nearest.distanceKm,
      deliveryCost: result.nearest.deliveryCost,
    };
  }

  getDistrictCoordinates(district: string): GeoPoint | null {
    return UB_DISTRICTS[district] || null;
  }

  getDefaultLocation(): GeoPoint {
    return { lat: 47.9138, lng: 106.9057 };
  }
}
