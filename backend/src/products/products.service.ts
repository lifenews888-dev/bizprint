import { Injectable, ForbiddenException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Product } from './product.entity';

@Injectable()
export class ProductsService {
  constructor(
    @InjectRepository(Product)
    private productRepo: Repository<Product>,
  ) {}

  create(data: Partial<Product>) {
    const product = this.productRepo.create(data);
    return this.productRepo.save(product);
  }

  async findAll(opts?: { categoryId?: string; limit?: number; page?: number }) {
    const { categoryId, limit, page } = opts ?? {};
    const take = limit && limit > 0 ? limit : undefined;
    const skip = take && page && page > 1 ? (page - 1) * take : undefined;

    if (!categoryId) {
      return this.productRepo.find({
        where: { is_active: true },
        order: { sort_order: 'ASC', created_at: 'DESC' },
        take,
        skip,
      });
    }

    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(categoryId);
    if (isUuid) {
      const params: any[] = [categoryId];
      let q = `SELECT p.* FROM products p JOIN categories c ON c.slug = p.category WHERE c.id = $1 AND p.is_active = true ORDER BY p.sort_order ASC`;
      if (take) { q += ` LIMIT $${params.push(take)}`; }
      if (skip) { q += ` OFFSET $${params.push(skip)}`; }
      return this.productRepo.query(q, params);
    }

    return this.productRepo.find({
      where: { is_active: true, category: categoryId },
      order: { sort_order: 'ASC', created_at: 'DESC' },
      take,
      skip,
    });
  }

  findOne(id: string) {
    return this.productRepo.findOne({ where: { id } });
  }

  async update(id: string, data: Partial<Product>) {
    await this.productRepo.update(id, data);
    return this.findOne(id);
  }

  async remove(id: string) {
    await this.productRepo.delete(id);
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
    return this.productRepo.save(product);
  }

  async updateForVendor(vendorId: string, id: string, data: Partial<Product>) {
    const product = await this.productRepo.findOne({ where: { id } });
    if (!product) throw new NotFoundException('Product not found');
    if (product.vendor_id !== vendorId) throw new ForbiddenException('Not your product');
    await this.productRepo.update(id, data);
    return this.findOne(id);
  }

  async removeForVendor(vendorId: string, id: string) {
    const product = await this.productRepo.findOne({ where: { id } });
    if (!product) throw new NotFoundException('Product not found');
    if (product.vendor_id !== vendorId) throw new ForbiddenException('Not your product');
    await this.productRepo.delete(id);
    return { deleted: true };
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
