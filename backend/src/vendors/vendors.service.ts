import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Vendor } from './vendor.entity';
import { ProductVendor } from './entities/product-vendor.entity';
import { VendorMetrics } from './entities/vendor-metrics.entity';
import { Repository } from 'typeorm';

@Injectable()
export class VendorsService {
  constructor(
    @InjectRepository(Vendor)
    private repo: Repository<Vendor>,
    @InjectRepository(ProductVendor)
    private pvRepo: Repository<ProductVendor>,
    @InjectRepository(VendorMetrics)
    private metricsRepo: Repository<VendorMetrics>,
  ) {}

  create(data: any) {
    const vendor = this.repo.create(data);
    return this.repo.save(vendor);
  }

  findAll() {
    return this.repo.find({
      relations: ['vendor_capabilities'],
      order: { score: 'DESC' },
    });
  }

  async findOne(id: string) {
    const vendor = await this.repo.findOne({
      where: { id },
      relations: ['vendor_capabilities'],
    });
    if (!vendor) throw new NotFoundException('Vendor олдсонгүй');

    const metrics = await this.metricsRepo.findOne({ where: { vendor_id: id } });
    const products = await this.pvRepo.find({ where: { vendor_id: id } });

    return { ...vendor, metrics, product_count: products.length };
  }

  async findBySlug(slug: string) {
    const vendor = await this.repo.findOne({
      where: { slug },
      relations: ['vendor_capabilities'],
    });
    if (!vendor) return null;
    const metrics = await this.metricsRepo.findOne({ where: { vendor_id: vendor.id } });
    const products = await this.pvRepo.find({ where: { vendor_id: vendor.id } });
    return { ...vendor, metrics, product_count: products.length };
  }

  async findByUserId(userId: string) {
    const vendor = await this.repo.findOne({
      where: { user_id: userId },
      relations: ['vendor_capabilities'],
    });
    if (!vendor) return null;
    const metrics = await this.metricsRepo.findOne({ where: { vendor_id: vendor.id } });
    return { ...vendor, metrics };
  }

  async updateByUserId(userId: string, data: Partial<Vendor>, logoUrl?: string): Promise<Vendor | null> {
    const vendor = await this.repo.findOne({ where: { user_id: userId } });
    if (!vendor) throw new NotFoundException('Vendor олдсонгүй');

    // Normalize boolean fields coming from FormData (strings)
    const acceptsOrdersRaw = (data as any).accepts_orders;
    const acceptsOrders = acceptsOrdersRaw === 'true' || acceptsOrdersRaw === true;

    const updateData: Partial<Vendor> = {
      company_name: data.company_name || vendor.company_name,
      slug: (data as any).slug ?? vendor.slug,
      description: data.description ?? vendor.description,
      address: data.address ?? vendor.address,
      district: data.district ?? vendor.district,
      phone: (data as any).phone ?? (data as any).contact_phone ?? vendor.phone,
      contact_email: data.contact_email ?? vendor.contact_email,
      accepts_orders: acceptsOrders,
    };
    if (logoUrl) updateData.logo_url = logoUrl;

    await this.repo.update(vendor.id, updateData);
    return this.repo.findOne({ where: { id: vendor.id } });
  }

  async update(id: string, data: any) {
    await this.repo.update(id, data);
    return this.findOne(id);
  }

  // ─── Product-Vendor ───

  getVendorProducts(vendorId: string) {
    return this.pvRepo.find({
      where: { vendor_id: vendorId },
      relations: ['product'],
      order: { priority: 'ASC' },
    });
  }

  async addVendorProduct(vendorId: string, data: any) {
    const pv = this.pvRepo.create({
      vendor_id: vendorId,
      product_id: data.product_id,
      price_with_vat: data.price_with_vat,
      price_without_vat: data.price_without_vat,
      lead_time_hours: data.lead_time_hours || 24,
      quality_score: data.quality_score || 80,
      priority: data.priority || 1,
      min_quantity: data.min_quantity || 1,
      max_quantity: data.max_quantity || null,
    });
    return this.pvRepo.save(pv);
  }

  async updateVendorProduct(vendorId: string, productId: string, data: any) {
    const pv = await this.pvRepo.findOne({
      where: { vendor_id: vendorId, product_id: productId },
    });
    if (!pv) throw new NotFoundException('Product-vendor холбоос олдсонгүй');
    Object.assign(pv, data);
    return this.pvRepo.save(pv);
  }

  /**
   * Bulk save vendor product capabilities.
   * Replaces all existing product-vendor links for this vendor.
   */
  async saveVendorProducts(vendorId: string, products: Array<{
    product_id: string
    daily_capacity?: number
    capacity_unit?: string
    price_with_vat?: number
    price_without_vat?: number
    lead_time_hours?: number
    quality_score?: number
    min_quantity?: number
    max_quantity?: number
    priority?: number
  }>): Promise<ProductVendor[]> {
    // Remove existing links
    await this.pvRepo.delete({ vendor_id: vendorId });

    if (!products.length) return [];

    // Create new links with per-product capacity
    const entities = products.map((p, i) =>
      this.pvRepo.create({
        vendor_id: vendorId,
        product_id: p.product_id,
        daily_capacity: p.daily_capacity || 100,
        capacity_unit: p.capacity_unit || 'pieces',
        used_capacity: 0,
        price_with_vat: p.price_with_vat || 0,
        price_without_vat: p.price_without_vat || 0,
        lead_time_hours: p.lead_time_hours || 24,
        quality_score: p.quality_score || 80,
        min_quantity: p.min_quantity || 1,
        max_quantity: p.max_quantity || null,
        priority: p.priority || i + 1,
        is_active: true,
      }),
    );

    return this.pvRepo.save(entities);
  }
}