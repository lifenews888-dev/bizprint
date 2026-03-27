import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, MoreThan } from 'typeorm';
import { Vendor, VendorTier, CapacityTier, LoadStatus } from '../vendor.entity';
import { VendorMetrics } from '../entities/vendor-metrics.entity';
import { OrderVendorGroup } from '../../orders/entities/order-vendor-group.entity';

@Injectable()
export class VendorTierService {
  private readonly logger = new Logger(VendorTierService.name);

  constructor(
    @InjectRepository(Vendor)
    private vendorRepo: Repository<Vendor>,
    @InjectRepository(VendorMetrics)
    private metricsRepo: Repository<VendorMetrics>,
    @InjectRepository(OrderVendorGroup)
    private ovgRepo: Repository<OrderVendorGroup>,
  ) {}

  /* ═══════════════════════════════════════
     CAPACITY TIER (dynamic, based on capacity_per_day)
     ═══════════════════════════════════════ */
  determineCapacityTier(capacityPerDay: number): CapacityTier {
    if (capacityPerDay >= 50000) return CapacityTier.ENTERPRISE;
    if (capacityPerDay >= 10000) return CapacityTier.LARGE;
    if (capacityPerDay >= 1000) return CapacityTier.MEDIUM;
    return CapacityTier.SMALL;
  }

  /* ═══════════════════════════════════════
     LOAD STATUS (real-time, based on current_load / capacity)
     ═══════════════════════════════════════ */
  determineLoadStatus(currentLoad: number, capacityPerDay: number): LoadStatus {
    if (capacityPerDay <= 0) return LoadStatus.FULL;
    const pct = (currentLoad / capacityPerDay) * 100;
    if (pct >= 90) return LoadStatus.FULL;
    if (pct >= 60) return LoadStatus.BUSY;
    return LoadStatus.AVAILABLE;
  }

  getLoadPercentage(currentLoad: number, capacityPerDay: number): number {
    if (capacityPerDay <= 0) return 100;
    return Math.round((currentLoad / capacityPerDay) * 10000) / 100;
  }

  getAvailableCapacity(currentLoad: number, capacityPerDay: number): number {
    return Math.max(0, capacityPerDay - currentLoad);
  }

  /* ═══════════════════════════════════════
     VENDOR SCORE (combined — capacity + performance)
     ═══════════════════════════════════════ */

  /**
   * Score = weighted combination:
   *   0.35 × capacity_utilization_inverse (lower load = higher score)
   *   0.25 × on_time_rate
   *   0.20 × quality_score (100 - defect_rate)
   *   0.20 × margin (rating-based)
   */
  calculateScore(metrics: VendorMetrics, vendor?: Vendor): number {
    const onTimeScore = Number(metrics.on_time_rate || 0);
    const qualityScore = 100 - Number(metrics.defect_rate || 0);
    const ratingScore = (Number(metrics.avg_rating || 3) / 5) * 100;

    // Capacity utilization inverse: lower load = higher score
    let utilizationInverse = 100;
    if (vendor && vendor.capacity_per_day > 0) {
      const loadPct = (Number(vendor.current_load) / vendor.capacity_per_day) * 100;
      utilizationInverse = Math.max(0, 100 - loadPct);
    }

    const score =
      (utilizationInverse * 0.35) +
      (onTimeScore * 0.25) +
      (qualityScore * 0.20) +
      (ratingScore * 0.20);

    return Math.round(Math.min(100, Math.max(0, score)));
  }

  /**
   * Performance tier (Gold/Silver/Bronze).
   *   > 85 → GOLD
   *   > 70 → SILVER
   *   <= 70 → BRONZE
   */
  determineTier(score: number): VendorTier {
    if (score > 85) return VendorTier.GOLD;
    if (score > 70) return VendorTier.SILVER;
    return VendorTier.BRONZE;
  }

  /* ═══════════════════════════════════════
     REFRESH METRICS (30-day window)
     ═══════════════════════════════════════ */
  async refreshMetrics(vendorId: string): Promise<VendorMetrics> {
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

    const recentOrders = await this.ovgRepo.find({
      where: { vendor_id: vendorId, created_at: MoreThan(thirtyDaysAgo) },
    });

    const totalRecent = recentOrders.length;
    const completed = recentOrders.filter(o => o.status === 'completed');
    const onTime = completed.filter(o => {
      if (!o.completed_at || !o.assigned_at) return true;
      const hours = (o.completed_at.getTime() - o.assigned_at.getTime()) / (1000 * 60 * 60);
      return hours <= 48;
    });

    const onTimeRate = completed.length > 0
      ? Math.round(onTime.length / completed.length * 100) : 100;

    let metrics = await this.metricsRepo.findOne({ where: { vendor_id: vendorId } });
    if (!metrics) metrics = this.metricsRepo.create({ vendor_id: vendorId });

    metrics.on_time_rate = onTimeRate;
    metrics.last_30d_orders = totalRecent;
    metrics.total_completed = completed.length;
    metrics.last_calculated_at = new Date();

    return this.metricsRepo.save(metrics);
  }

  /* ═══════════════════════════════════════
     UPDATE SINGLE VENDOR — tier + capacity tier + load status
     ═══════════════════════════════════════ */
  async updateVendorTier(vendorId: string) {
    const metrics = await this.refreshMetrics(vendorId);
    const vendor = await this.vendorRepo.findOne({ where: { id: vendorId } });
    if (!vendor) throw new Error(`Vendor ${vendorId} олдсонгүй`);

    const score = this.calculateScore(metrics, vendor);
    const oldTier = vendor.tier;
    const newTier = this.determineTier(score);

    vendor.tier = newTier;
    vendor.score = score;
    vendor.capacity_tier = this.determineCapacityTier(vendor.capacity_per_day);
    vendor.load_status = this.determineLoadStatus(vendor.current_load, vendor.capacity_per_day);
    await this.vendorRepo.save(vendor);

    if (oldTier !== newTier) {
      this.logger.log(`Vendor ${vendor.company_name}: ${oldTier} → ${newTier} (score: ${score})`);
    }

    return { vendor, oldTier, newTier, score };
  }

  /* ═══════════════════════════════════════
     UPDATE ALL VENDORS (cron/batch)
     ═══════════════════════════════════════ */
  async updateAllTiers() {
    const vendors = await this.vendorRepo.find();
    let upgraded = 0, downgraded = 0, unchanged = 0;
    const results: any[] = [];

    for (const vendor of vendors) {
      try {
        // Update capacity tier + load status even without metrics refresh
        vendor.capacity_tier = this.determineCapacityTier(vendor.capacity_per_day);
        vendor.load_status = this.determineLoadStatus(vendor.current_load, vendor.capacity_per_day);

        if (vendor.verified) {
          const { oldTier, newTier, score } = await this.updateVendorTier(vendor.id);
          const tierOrder = { bronze: 0, silver: 1, gold: 2 };
          if (tierOrder[newTier] > tierOrder[oldTier]) upgraded++;
          else if (tierOrder[newTier] < tierOrder[oldTier]) downgraded++;
          else unchanged++;
          results.push({ vendor_id: vendor.id, company_name: vendor.company_name, old_tier: oldTier, new_tier: newTier, score });
        } else {
          await this.vendorRepo.save(vendor);
          unchanged++;
        }
      } catch (err) {
        this.logger.error(`Tier update failed for ${vendor.id}: ${err.message}`);
      }
    }

    return { total: vendors.length, upgraded, downgraded, unchanged, results };
  }

  /* ═══════════════════════════════════════
     UPDATE LOAD STATUS (call after order assign/complete)
     ═══════════════════════════════════════ */
  async updateLoadStatus(vendorId: string): Promise<Vendor> {
    const vendor = await this.vendorRepo.findOne({ where: { id: vendorId } });
    if (!vendor) throw new Error(`Vendor ${vendorId} олдсонгүй`);
    vendor.load_status = this.determineLoadStatus(vendor.current_load, vendor.capacity_per_day);
    vendor.capacity_tier = this.determineCapacityTier(vendor.capacity_per_day);
    return this.vendorRepo.save(vendor);
  }

  /* ═══════════════════════════════════════
     DAILY RESET
     ═══════════════════════════════════════ */
  async resetDailyCapacity(): Promise<number> {
    const result = await this.vendorRepo
      .createQueryBuilder()
      .update(Vendor)
      .set({ current_load: 0, load_status: LoadStatus.AVAILABLE })
      .where('current_load > 0')
      .execute();
    this.logger.log(`Daily capacity reset: ${result.affected} vendors`);
    return result.affected || 0;
  }
}
