import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Vendor, VendorTier, VendorStatus, LoadStatus, CapacityTier } from '../vendor.entity';
import { ProductVendor } from '../entities/product-vendor.entity';
import { VendorMetrics } from '../entities/vendor-metrics.entity';

export interface AssignmentResult {
  vendor: Vendor;
  productVendor: ProductVendor;
  reason: string;
}

@Injectable()
export class AssignmentEngineService {
  constructor(
    @InjectRepository(Vendor)
    private vendorRepo: Repository<Vendor>,
    @InjectRepository(ProductVendor)
    private pvRepo: Repository<ProductVendor>,
    @InjectRepository(VendorMetrics)
    private metricsRepo: Repository<VendorMetrics>,
  ) {}

  // ─── Tier weight: GOLD=1, SILVER=2, BRONZE=3 ───
  private tierWeight(tier: VendorTier): number {
    const weights: Record<VendorTier, number> = {
      [VendorTier.GOLD]: 1,
      [VendorTier.SILVER]: 2,
      [VendorTier.BRONZE]: 3,
    };
    return weights[tier] || 3;
  }

  /* ─── Utilization helpers ─── */
  private getProductUtilization(pv: ProductVendor): number {
    if (pv.daily_capacity <= 0) return 100;
    return Math.round((pv.used_capacity / pv.daily_capacity) * 100);
  }

  private getRemainingCapacity(pv: ProductVendor): number {
    return Math.max(0, pv.daily_capacity - pv.used_capacity);
  }

  /**
   * Weighted score for vendor ranking:
   *   0.30 × available_capacity_ratio (бага ачаалал = өндөр оноо)
   *   0.25 × quality_score
   *   0.25 × vendor.score (tier + performance)
   *   0.10 × speed (lead_time inverse)
   *   0.10 × priority (lower = better)
   */
  private calculateAssignmentScore(pv: ProductVendor): number {
    const capacityRatio = pv.daily_capacity > 0
      ? (1 - pv.used_capacity / pv.daily_capacity) * 100
      : 0;
    const quality = pv.quality_score || 80;
    const vendorScore = Number(pv.vendor?.score || 50);
    const speedScore = Math.max(0, 100 - (pv.lead_time_hours || 24)); // faster = higher
    const priorityScore = Math.max(0, 100 - (pv.priority || 1) * 10);

    return Math.round(
      capacityRatio * 0.30 +
      quality * 0.25 +
      vendorScore * 0.25 +
      speedScore * 0.10 +
      priorityScore * 0.10
    );
  }

  // ─── CORE: Auto-assign vendor for a product ───
  async assignVendor(productId: string, quantity: number = 1): Promise<AssignmentResult> {
    // 1. Тухайн бүтээгдэхүүнийг хийж чадах бүх vendor-уудыг авах
    const productVendors = await this.pvRepo.find({
      where: { product_id: productId, is_active: true },
      relations: ['vendor'],
    });

    if (!productVendors.length) {
      throw new NotFoundException(`"${productId}" бүтээгдэхүүнд vendor олдсонгүй`);
    }

    // 2. Active vendor + quantity constraints + per-product capacity
    const eligible = productVendors.filter(pv => {
      const v = pv.vendor;
      if (!v || v.status !== VendorStatus.ACTIVE) return false;
      if (quantity < pv.min_quantity) return false;
      if (pv.max_quantity && quantity > pv.max_quantity) return false;
      // Per-product capacity check: must have enough remaining
      if (this.getRemainingCapacity(pv) < quantity) return false;
      return true;
    });

    if (!eligible.length) {
      // Fallback: ignore capacity constraint, pick least loaded
      const fallback = productVendors
        .filter(pv => pv.vendor?.status === VendorStatus.ACTIVE)
        .sort((a, b) => this.getProductUtilization(a) - this.getProductUtilization(b))[0];

      if (fallback) {
        return {
          vendor: fallback.vendor,
          productVendor: fallback,
          reason: `Fallback: бүгд хүчин чадал дүүрэн, хамгийн бага ачаалалтайг сонгов (${this.getProductUtilization(fallback)}%)`,
        };
      }
      throw new NotFoundException('Идэвхтэй vendor олдсонгүй');
    }

    // 3. Weighted score-оор эрэмбэлэх
    const scored = eligible
      .map(pv => ({ pv, score: this.calculateAssignmentScore(pv) }))
      .sort((a, b) => b.score - a.score);

    const best = scored[0];
    const utilization = this.getProductUtilization(best.pv);

    return {
      vendor: best.pv.vendor,
      productVendor: best.pv,
      reason: `Score: ${best.score}, Product utilization: ${utilization}%, Remaining: ${this.getRemainingCapacity(best.pv)} ${best.pv.capacity_unit}`,
    };
  }

  // ─── Manual assign (Admin override) ───
  async manualAssign(productId: string, vendorId: string): Promise<AssignmentResult> {
    const pv = await this.pvRepo.findOne({
      where: { product_id: productId, vendor_id: vendorId },
      relations: ['vendor'],
    });

    if (!pv) {
      throw new NotFoundException('Vendor тухайн бүтээгдэхүүнд бүртгэлгүй');
    }

    return {
      vendor: pv.vendor,
      productVendor: pv,
      reason: 'Admin manual assignment',
    };
  }

  // ─── Capacity tracking: order assign → vendor load + per-product capacity ───
  async incrementLoad(vendorId: string, productId?: string, quantity: number = 1): Promise<void> {
    // Update vendor-level load
    await this.vendorRepo.increment({ id: vendorId }, 'current_load', 1);
    await this.vendorRepo.increment({ id: vendorId }, 'total_orders', 1);
    const vendor = await this.vendorRepo.findOne({ where: { id: vendorId } });
    if (vendor) {
      const p = vendor.capacity_per_day > 0 ? (vendor.current_load / vendor.capacity_per_day) * 100 : 100;
      vendor.load_status = p >= 90 ? LoadStatus.FULL : p >= 60 ? LoadStatus.BUSY : LoadStatus.AVAILABLE;
      await this.vendorRepo.save(vendor);
    }

    // Update per-product used_capacity
    if (productId) {
      const pv = await this.pvRepo.findOne({ where: { vendor_id: vendorId, product_id: productId } });
      if (pv) {
        pv.used_capacity = Math.min((pv.used_capacity || 0) + quantity, pv.daily_capacity * 2); // cap at 2x to prevent overflow
        await this.pvRepo.save(pv);
      }
    }
  }

  // ─── Capacity tracking: order complete/cancel → release capacity ───
  async decrementLoad(vendorId: string, productId?: string, quantity: number = 1): Promise<void> {
    const vendor = await this.vendorRepo.findOne({ where: { id: vendorId } });
    if (vendor && vendor.current_load > 0) {
      vendor.current_load = Math.max(0, vendor.current_load - 1);
      const p = vendor.capacity_per_day > 0 ? (vendor.current_load / vendor.capacity_per_day) * 100 : 100;
      vendor.load_status = p >= 90 ? LoadStatus.FULL : p >= 60 ? LoadStatus.BUSY : LoadStatus.AVAILABLE;
      await this.vendorRepo.save(vendor);
    }

    // Release per-product capacity
    if (productId) {
      const pv = await this.pvRepo.findOne({ where: { vendor_id: vendorId, product_id: productId } });
      if (pv && pv.used_capacity > 0) {
        pv.used_capacity = Math.max(0, pv.used_capacity - quantity);
        await this.pvRepo.save(pv);
      }
    }
  }

  // ─── Get vendor candidates (for admin UI) ───
  async getCandidates(productId: string, quantity: number = 1) {
    const productVendors = await this.pvRepo.find({
      where: { product_id: productId, is_active: true },
      relations: ['vendor'],
      order: { priority: 'ASC' },
    });

    return productVendors.map(pv => {
      const v = pv.vendor;
      const utilization = v.capacity_per_day > 0 ? v.current_load / v.capacity_per_day : 1;
      const eligible = v.status === VendorStatus.ACTIVE &&
        quantity >= pv.min_quantity &&
        (!pv.max_quantity || quantity <= pv.max_quantity);

      return {
        vendor_id: v.id,
        company_name: v.company_name,
        tier: v.tier,
        capacity_tier: v.capacity_tier,
        load_status: v.load_status,
        score: Number(v.score),
        assignment_score: this.calculateAssignmentScore(pv),
        // Vendor-level
        vendor_utilization: Math.round(utilization * 100),
        vendor_capacity_per_day: v.capacity_per_day,
        vendor_current_load: v.current_load,
        // Per-product level
        product_daily_capacity: pv.daily_capacity,
        product_used_capacity: pv.used_capacity,
        product_remaining: this.getRemainingCapacity(pv),
        product_utilization: this.getProductUtilization(pv),
        capacity_unit: pv.capacity_unit,
        // Pricing
        price_with_vat: Number(pv.price_with_vat),
        price_without_vat: Number(pv.price_without_vat),
        lead_time_hours: pv.lead_time_hours,
        priority: pv.priority,
        eligible,
        status: v.status,
      };
    });
  }
}
