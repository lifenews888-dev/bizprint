import { Injectable, ForbiddenException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Product } from './product.entity';
import { ProductImage } from './product-image.entity';
import { EventBusService } from '../events/event-bus.service';
import { BizEvent } from '../events/event-types';

@Injectable()
export class ProductsService {
  constructor(
    @InjectRepository(Product)
    private productRepo: Repository<Product>,
    @InjectRepository(ProductImage)
    private imageRepo: Repository<ProductImage>,
    private eventBus: EventBusService,
  ) {}

  async create(data: Partial<Product>) {
    const product = this.productRepo.create(data);
    const saved = await this.productRepo.save(product);
    this.eventBus.emit(BizEvent.PRODUCT_CREATED, { productId: saved.id, name: saved.name, vendorId: saved.vendor_id });
    return saved;
  }

  private async enrichWithThumbnails(products: Product[]): Promise<any[]> {
    if (products.length === 0) return products;
    const ids = products.map(p => p.id);
    const primaryImages = await this.imageRepo.query(
      `SELECT DISTINCT ON (product_id) product_id, url
       FROM product_images
       WHERE product_id = ANY($1)
       ORDER BY product_id, is_primary DESC, sort_order ASC`,
      [ids],
    );
    const primaryMap: Record<string, string> = {};
    for (const img of primaryImages) { primaryMap[img.product_id] = img.url; }
    return products.map(p => ({
      ...p,
      thumbnail_url: p.thumbnail_url || primaryMap[p.id] || null,
    }));
  }

  async findAll(opts?: { categoryId?: string; limit?: number; page?: number }) {
    const { categoryId, limit, page } = opts ?? {};
    const take = limit && limit > 0 ? limit : undefined;
    const skip = take && page && page > 1 ? (page - 1) * take : undefined;

    let products: Product[];
    if (!categoryId) {
      products = await this.productRepo.find({
        where: { is_active: true },
        order: { sort_order: 'ASC', created_at: 'DESC' },
        take,
        skip,
      });
    } else {
      const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(categoryId);
      if (isUuid) {
        const params: any[] = [categoryId];
        let q = `SELECT p.* FROM products p JOIN categories c ON c.slug = p.category WHERE c.id = $1 AND p.is_active = true ORDER BY p.sort_order ASC`;
        if (take) { q += ` LIMIT $${params.push(take)}`; }
        if (skip) { q += ` OFFSET $${params.push(skip)}`; }
        products = await this.productRepo.query(q, params);
      } else {
        products = await this.productRepo.find({
          where: { is_active: true, category: categoryId },
          order: { sort_order: 'ASC', created_at: 'DESC' },
          take,
          skip,
        });
      }
    }
    return this.enrichWithThumbnails(products);
  }

  async findOne(id: string) {
    const product = await this.productRepo.findOne({ where: [{ id }, { slug: id } as any] });
    if (!product) return null;
    const images = await this.imageRepo.find({
      where: { product_id: product.id },
      order: { is_primary: 'DESC', sort_order: 'ASC' },
    });
    const imageUrls = images.map(img => img.url).filter(Boolean);
    const thumbnail = product.thumbnail_url || imageUrls[0] || null;
    return { ...product, thumbnail_url: thumbnail, images: imageUrls };
  }

  async update(id: string, data: Partial<Product>) {
    await this.productRepo.update(id, data);
    const product = await this.findOne(id);
    this.eventBus.emit(BizEvent.PRODUCT_UPDATED, { productId: id, name: product?.name, vendorId: product?.vendor_id });
    return product;
  }

  async remove(id: string) {
    await this.productRepo.delete(id);
    this.eventBus.emit(BizEvent.PRODUCT_DELETED, { productId: id });
    return { deleted: true };
  }

  // Vendor-specific methods
  findByVendor(vendorId: string) {
    return this.productRepo.find({
      where: { vendor_id: vendorId },
      order: { created_at: 'DESC' },
    });
  }

  async createForVendor(vendorId: string, data: Partial<Product>) {
    const slug = `${data.name?.toLowerCase().replace(/\s+/g, '-')}-${Date.now()}`;
    const product = this.productRepo.create({
      ...data,
      vendor_id: vendorId,
      slug: data.slug || slug,
      name_mn: data.name_mn || data.name || '',
    });
    const saved = await this.productRepo.save(product);
    this.eventBus.emit(BizEvent.PRODUCT_CREATED, { productId: saved.id, name: saved.name, vendorId });
    return saved;
  }

  async updateForVendor(vendorId: string, id: string, data: Partial<Product>) {
    const product = await this.productRepo.findOne({ where: { id } });
    if (!product) throw new NotFoundException('Product not found');
    if (product.vendor_id !== vendorId) throw new ForbiddenException('Not your product');
    await this.productRepo.update(id, data);
    const updated = await this.findOne(id);
    this.eventBus.emit(BizEvent.PRODUCT_UPDATED, { productId: id, name: updated?.name, vendorId });
    return updated;
  }

  async removeForVendor(vendorId: string, id: string) {
    const product = await this.productRepo.findOne({ where: { id } });
    if (!product) throw new NotFoundException('Product not found');
    if (product.vendor_id !== vendorId) throw new ForbiddenException('Not your product');
    await this.productRepo.delete(id);
    this.eventBus.emit(BizEvent.PRODUCT_DELETED, { productId: id, vendorId });
    return { deleted: true };
  }

  // Admin - find all (including inactive)
  findAllAdmin(query?: { search?: string; product_type?: string; page?: number; limit?: number }) {
    const where: any = {}
    if (query?.product_type) where.product_type = query.product_type
    const page = query?.page || 1
    const limit = query?.limit || 50
    return this.productRepo.findAndCount({
      where,
      order: { sort_order: 'ASC', created_at: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
    }).then(([items, total]) => ({ items, total, page, limit }))
  }

  async createAdmin(data: Partial<Product>) {
    const slug = data.slug || `${(data.name || data.name_mn || 'product').toLowerCase().replace(/[^a-z0-9]+/gi, '-')}-${Date.now()}`
    const product = this.productRepo.create({
      ...data,
      slug,
      name: data.name || data.name_mn || '',
      name_mn: data.name_mn || data.name || '',
      product_type: data.product_type || 'ready',
      base_price: Number(data.base_price) || 0,
    })
    return this.productRepo.save(product)
  }

  async updateAdmin(id: string, data: Partial<Product>) {
    if (data.base_price !== undefined) data.base_price = Number(data.base_price) || 0

    // Бүтээгдэхүүн засагдах бүрд compare_specs автоматаар sync хийгдэнэ
    const existing = await this.productRepo.findOne({ where: { id } })
    if (existing) {
      const specs = { ...(existing.compare_specs || {}), ...(data.compare_specs || {}) }
      const newName = data.name_mn || data.name || existing.name_mn || existing.name
      const newCat = data.category || existing.category

      // Ангилал, төрөл
      if (data.category) specs.shop_category = data.category
      if (data.product_type) specs.top_menu = data.product_type

      // Нэр → image_alt, seo_description
      if (data.name || data.name_mn || data.category) {
        specs.image_alt = `${newCat} ${newName} | Bizprint.mn`
        specs.seo_description = `${newCat} - ${newName}`
      }

      // Дүн
      if (data.base_price !== undefined) {
        const price = Number(data.base_price)
        specs.price_excl_vat = String(Math.round(price / 1.1))
        specs.price_usd = String(Math.round(price / 3450 * 100) / 100)
      }

      data.compare_specs = specs as any
    }

    await this.productRepo.update(id, data)
    return this.findOne(id)
  }

  async removeAdmin(id: string) {
    await this.productRepo.delete(id)
    return { deleted: true }
  }

  /**
   * Smart lead time тооцоо
   * Formula:
   *   base_days + quantity_buffer + pages_buffer + capacity_buffer + file_review_buffer
   */
  async estimateLeadTime(product: any, quantity: number, pages: number = 0) {
    const base = Number(product.lead_time_days) || 3

    // ── Quantity buffer ──
    let qtyBuffer = 0
    if (quantity >= 10000) qtyBuffer = 5
    else if (quantity >= 5000) qtyBuffer = 3
    else if (quantity >= 1000) qtyBuffer = 2
    else if (quantity >= 500) qtyBuffer = 1

    // ── Pages buffer (зөвхөн ном/каталоги) ──
    let pagesBuffer = 0
    if (pages > 0) {
      if (pages >= 200) pagesBuffer = 3
      else if (pages >= 100) pagesBuffer = 2
      else if (pages >= 50) pagesBuffer = 1
    }

    // ── File review buffer (print products require dieline check) ──
    const isPrint = ['print', 'offset', 'book'].includes(product.product_type) ||
      ['book', 'offset'].includes(product.category)
    const fileReviewBuffer = isPrint ? 1 : 0

    // ── Capacity buffer (factory ачаалал) ──
    let capacityBuffer = 0
    let utilization = 0
    try {
      const capacity = await this.productRepo.manager.query(`
        SELECT
          COALESCE(SUM(pv.daily_capacity), 0)::int as total,
          COALESCE(SUM(pv.used_capacity), 0)::int as used
        FROM product_vendors pv
        WHERE pv.product_id = $1 AND pv.is_active = true
      `, [product.id])
      const total = Number(capacity[0]?.total) || 0
      const used = Number(capacity[0]?.used) || 0
      if (total > 0) {
        utilization = Math.round((used / total) * 100)
        if (utilization >= 85) capacityBuffer = 4
        else if (utilization >= 70) capacityBuffer = 2
        else if (utilization >= 50) capacityBuffer = 1
      }
    } catch {}

    const total = base + qtyBuffer + pagesBuffer + fileReviewBuffer + capacityBuffer
    const breakdown: string[] = [`Үндсэн: ${base} өдөр`]
    if (qtyBuffer) breakdown.push(`Тоо (${quantity.toLocaleString()}ш): +${qtyBuffer} өдөр`)
    if (pagesBuffer) breakdown.push(`Нүүр (${pages}): +${pagesBuffer} өдөр`)
    if (fileReviewBuffer) breakdown.push(`Файл шалгалт: +${fileReviewBuffer} өдөр`)
    if (capacityBuffer) breakdown.push(`Үйлдвэрийн ачаалал (${utilization}%): +${capacityBuffer} өдөр`)

    // Бэлэн болох огноо (weekend-ийг алгасах)
    const now = new Date()
    const ready = new Date(now)
    let added = 0
    while (added < total) {
      ready.setDate(ready.getDate() + 1)
      const day = ready.getDay()
      if (day !== 0 && day !== 6) added++
    }

    return {
      total_days: total,
      business_days: total,
      base_days: base,
      quantity_buffer: qtyBuffer,
      pages_buffer: pagesBuffer,
      file_review_buffer: fileReviewBuffer,
      capacity_buffer: capacityBuffer,
      capacity_utilization: utilization,
      ready_date: ready.toISOString().slice(0, 10),
      breakdown,
    }
  }

  // Vendor orders summary (join with orders)
  async getVendorOrderStats(vendorId: string) {
    const result = await this.productRepo.query(
      `SELECT 
        COUNT(DISTINCT o.id) as total_orders,
        COALESCE(SUM(o.total_price), 0) as total_revenue,
        COUNT(DISTINCT p.id) as total_products
       FROM products p
       LEFT JOIN orders o ON o.product_id = p.id
       WHERE p.vendor_id = $1`,
      [vendorId],
    );
    return result[0] || { total_orders: 0, total_revenue: 0, total_products: 0 };
  }
}
