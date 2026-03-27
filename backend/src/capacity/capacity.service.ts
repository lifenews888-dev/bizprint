import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ProductVendor } from '../vendors/entities/product-vendor.entity';
import { Vendor } from '../vendors/vendor.entity';

@Injectable()
export class CapacityService {
  constructor(
    @InjectRepository(ProductVendor) private pvRepo: Repository<ProductVendor>,
    @InjectRepository(Vendor) private vendorRepo: Repository<Vendor>,
  ) {}

  /* ═══ GLOBAL OVERVIEW ═══ */
  async getOverview() {
    // System-wide from product_vendors table
    const pvAgg = await this.pvRepo
      .createQueryBuilder('pv')
      .innerJoin('vendors', 'v', 'v.id = pv.vendor_id')
      .select([
        'COALESCE(SUM(pv.daily_capacity), 0)::int as total_capacity',
        'COALESCE(SUM(pv.used_capacity), 0)::int as used_capacity',
        'COUNT(DISTINCT pv.vendor_id)::int as vendor_count',
        'COUNT(DISTINCT pv.product_id)::int as product_count',
        'COUNT(*)::int as capability_count',
      ])
      .where('pv.is_active = true')
      .andWhere("v.status = 'active'")
      .getRawOne();

    const total = Number(pvAgg.total_capacity) || 0;
    const used = Number(pvAgg.used_capacity) || 0;
    const remaining = Math.max(0, total - used);
    const utilization = total > 0 ? Math.round((used / total) * 10000) / 100 : 0;

    // Vendor-level stats
    const vendorStats = await this.vendorRepo
      .createQueryBuilder('v')
      .select([
        "SUM(CASE WHEN v.load_status = 'available' THEN 1 ELSE 0 END)::int as available_count",
        "SUM(CASE WHEN v.load_status = 'busy' THEN 1 ELSE 0 END)::int as busy_count",
        "SUM(CASE WHEN v.load_status = 'full' THEN 1 ELSE 0 END)::int as full_count",
      ])
      .where("v.status = 'active'")
      .getRawOne();

    // Bottleneck detection: products with utilization > 85%
    const bottlenecks = await this.pvRepo
      .createQueryBuilder('pv')
      .innerJoin('products', 'p', 'p.id = pv.product_id')
      .select([
        'pv.product_id as product_id',
        "COALESCE(p.name_mn, p.name, 'Тодорхойгүй') as product_name",
        'SUM(pv.daily_capacity)::int as total_capacity',
        'SUM(pv.used_capacity)::int as used_capacity',
      ])
      .where('pv.is_active = true')
      .groupBy('pv.product_id')
      .addGroupBy('p.name_mn')
      .addGroupBy('p.name')
      .having('SUM(pv.daily_capacity) > 0 AND (SUM(pv.used_capacity)::float / SUM(pv.daily_capacity)::float) > 0.85')
      .getRawMany();

    return {
      total_capacity: total,
      used_capacity: used,
      remaining_capacity: remaining,
      utilization,
      vendor_count: Number(pvAgg.vendor_count) || 0,
      product_count: Number(pvAgg.product_count) || 0,
      capability_count: Number(pvAgg.capability_count) || 0,
      vendors_available: Number(vendorStats.available_count) || 0,
      vendors_busy: Number(vendorStats.busy_count) || 0,
      vendors_full: Number(vendorStats.full_count) || 0,
      bottleneck_count: bottlenecks.length,
      bottlenecks: bottlenecks.map(b => ({
        product_id: b.product_id,
        product_name: b.product_name,
        total_capacity: Number(b.total_capacity),
        used_capacity: Number(b.used_capacity),
        utilization: Math.round((Number(b.used_capacity) / Number(b.total_capacity)) * 100),
      })),
    };
  }

  /* ═══ PER-PRODUCT CAPACITY ═══ */
  async getProductCapacity() {
    const rows = await this.pvRepo
      .createQueryBuilder('pv')
      .innerJoin('products', 'p', 'p.id = pv.product_id')
      .select([
        'pv.product_id as product_id',
        "COALESCE(p.name_mn, p.name, 'Тодорхойгүй') as product_name",
        'p.category as category',
        'COUNT(DISTINCT pv.vendor_id)::int as vendor_count',
        'SUM(pv.daily_capacity)::int as total_capacity',
        'SUM(pv.used_capacity)::int as used_capacity',
      ])
      .where('pv.is_active = true')
      .groupBy('pv.product_id')
      .addGroupBy('p.name_mn')
      .addGroupBy('p.name')
      .addGroupBy('p.category')
      .orderBy('SUM(pv.used_capacity)::float / GREATEST(SUM(pv.daily_capacity)::float, 1)', 'DESC')
      .getRawMany();

    return rows.map(r => {
      const total = Number(r.total_capacity) || 0;
      const used = Number(r.used_capacity) || 0;
      const remaining = Math.max(0, total - used);
      const utilization = total > 0 ? Math.round((used / total) * 100) : 0;
      return {
        product_id: r.product_id,
        product_name: r.product_name,
        category: r.category,
        vendor_count: Number(r.vendor_count),
        total_capacity: total,
        used_capacity: used,
        remaining_capacity: remaining,
        utilization,
        status: utilization >= 85 ? 'critical' : utilization >= 60 ? 'warning' : 'healthy',
      };
    });
  }

  /* ═══ PER-VENDOR CAPACITY ═══ */
  async getVendorCapacity() {
    const rows = await this.pvRepo
      .createQueryBuilder('pv')
      .innerJoin('vendors', 'v', 'v.id = pv.vendor_id')
      .select([
        'pv.vendor_id as vendor_id',
        'v.company_name as vendor_name',
        'v.status as vendor_status',
        'v.load_status as load_status',
        'v.capacity_tier as capacity_tier',
        'v.score as vendor_score',
        'v.current_load as current_load',
        'v.total_orders as total_orders',
        'COUNT(DISTINCT pv.product_id)::int as product_count',
        'SUM(pv.daily_capacity)::int as total_capacity',
        'SUM(pv.used_capacity)::int as used_capacity',
      ])
      .where('pv.is_active = true')
      .groupBy('pv.vendor_id')
      .addGroupBy('v.company_name')
      .addGroupBy('v.status')
      .addGroupBy('v.load_status')
      .addGroupBy('v.capacity_tier')
      .addGroupBy('v.score')
      .addGroupBy('v.current_load')
      .addGroupBy('v.total_orders')
      .orderBy('SUM(pv.used_capacity)::float / GREATEST(SUM(pv.daily_capacity)::float, 1)', 'DESC')
      .getRawMany();

    return rows.map(r => {
      const total = Number(r.total_capacity) || 0;
      const used = Number(r.used_capacity) || 0;
      const remaining = Math.max(0, total - used);
      const utilization = total > 0 ? Math.round((used / total) * 100) : 0;
      return {
        vendor_id: r.vendor_id,
        vendor_name: r.vendor_name,
        vendor_status: r.vendor_status,
        load_status: r.load_status,
        capacity_tier: r.capacity_tier,
        vendor_score: Number(r.vendor_score),
        current_load: Number(r.current_load),
        total_orders: Number(r.total_orders),
        product_count: Number(r.product_count),
        total_capacity: total,
        used_capacity: used,
        remaining_capacity: remaining,
        utilization,
        status: utilization >= 85 ? 'overloaded' : utilization >= 60 ? 'busy' : 'available',
      };
    });
  }
}
