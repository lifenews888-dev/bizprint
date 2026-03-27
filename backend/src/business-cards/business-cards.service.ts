import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { existsSync, unlinkSync } from 'fs';
import { join } from 'path';
import { BcProduct, BcStatus } from './entities/bc-product.entity';
import { BcLayout } from './entities/bc-layout.entity';
import { BcPricingTier } from './entities/bc-pricing-tier.entity';
import { BcLayoutBackground } from './entities/bc-layout-background.entity';

@Injectable()
export class BusinessCardsService {
  constructor(
    @InjectRepository(BcProduct) private productRepo: Repository<BcProduct>,
    @InjectRepository(BcLayout) private layoutRepo: Repository<BcLayout>,
    @InjectRepository(BcPricingTier) private tierRepo: Repository<BcPricingTier>,
    @InjectRepository(BcLayoutBackground) private bgRepo: Repository<BcLayoutBackground>,
  ) {}

  /* ── Products ── */

  async createProduct(data: Partial<BcProduct>) {
    if (!data.slug && data.name) {
      data.slug = data.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
    }
    const product = this.productRepo.create(data);
    return this.productRepo.save(product);
  }

  async findAllProducts() {
    return this.productRepo.find({
      relations: ['layouts', 'pricingTiers'],
      order: { created_at: 'DESC' },
    });
  }

  async findAllPublished() {
    const products = await this.productRepo.find({
      where: { status: BcStatus.PUBLISHED, is_active: true },
      relations: ['layouts', 'pricingTiers'],
      order: { created_at: 'DESC' },
    });
    // backgrounds-г layouts дотор нэмэх
    for (const product of products) {
      for (const layout of product.layouts || []) {
        (layout as any).backgrounds = await this.bgRepo.find({
          where: { layout_id: layout.id, is_active: true },
          order: { sort_order: 'ASC' },
        });
      }
    }
    return products;
  }

  async findProduct(id: string) {
    const product = await this.productRepo.findOne({
      where: { id },
      relations: ['layouts', 'pricingTiers'],
    });
    if (!product) throw new NotFoundException('Бүтээгдэхүүн олдсонгүй');
    return product;
  }

  async findPublishedProduct(id: string) {
    const product = await this.productRepo.findOne({
      where: { id, status: BcStatus.PUBLISHED, is_active: true },
      relations: ['layouts', 'pricingTiers'],
    });
    if (!product) throw new NotFoundException('Бүтээгдэхүүн олдсонгүй');
    // backgrounds нэмэх
    for (const layout of product.layouts || []) {
      (layout as any).backgrounds = await this.bgRepo.find({
        where: { layout_id: layout.id, is_active: true },
        order: { sort_order: 'ASC' },
      });
    }
    return product;
  }

  async updateProduct(id: string, data: Partial<BcProduct>) {
    await this.productRepo.update(id, data);
    return this.findProduct(id);
  }

  async deleteProduct(id: string) {
    await this.productRepo.delete(id);
    return { deleted: true };
  }

  async publishProduct(id: string) {
    await this.productRepo.update(id, { status: BcStatus.PUBLISHED });
    return this.findProduct(id);
  }

  /* ── Layouts ── */

  async createLayout(productId: string, data: Partial<BcLayout>) {
    const count = await this.layoutRepo.count({ where: { product_id: productId } });
    const layout = this.layoutRepo.create({ ...data, product_id: productId, sort_order: count });
    return this.layoutRepo.save(layout);
  }

  async updateLayout(productId: string, layoutId: string, data: Partial<BcLayout>) {
    await this.layoutRepo.update({ id: layoutId, product_id: productId }, data);
    return this.layoutRepo.findOne({ where: { id: layoutId } });
  }

  async deleteLayout(productId: string, layoutId: string) {
    // Layout-тай холбоотой бүх background файлуудыг устгах
    const bgs = await this.bgRepo.find({ where: { layout_id: layoutId } });
    for (const bg of bgs) {
      this._deleteFile(bg.url);
    }
    await this.layoutRepo.delete({ id: layoutId, product_id: productId });
    return { deleted: true };
  }

  /* ── Backgrounds ── */

  async addBackground(layoutId: string, file: Express.Multer.File, name?: string) {
    const count = await this.bgRepo.count({ where: { layout_id: layoutId } });
    const url = `/uploads/bc-backgrounds/${file.filename}`;
    const bg = this.bgRepo.create({
      layout_id: layoutId,
      name: name || file.originalname.replace(/\.[^.]+$/, ''),
      url,
      sort_order: count,
    });
    return this.bgRepo.save(bg);
  }

  async addBackgroundsBulk(layoutId: string, files: Express.Multer.File[]) {
    const count = await this.bgRepo.count({ where: { layout_id: layoutId } });
    const entities = files.map((file, i) =>
      this.bgRepo.create({
        layout_id: layoutId,
        name: file.originalname.replace(/\.[^.]+$/, ''),
        url: `/uploads/bc-backgrounds/${file.filename}`,
        sort_order: count + i,
      })
    );
    return this.bgRepo.save(entities);
  }

  async getBackgrounds(layoutId: string) {
    return this.bgRepo.find({
      where: { layout_id: layoutId },
      order: { sort_order: 'ASC' },
    });
  }

  async updateBackground(bgId: string, data: { name?: string; sort_order?: number; is_active?: boolean }) {
    await this.bgRepo.update(bgId, data);
    return this.bgRepo.findOne({ where: { id: bgId } });
  }

  async deleteBackground(bgId: string) {
    const bg = await this.bgRepo.findOne({ where: { id: bgId } });
    if (bg) {
      this._deleteFile(bg.url);
      await this.bgRepo.delete(bgId);
    }
    return { deleted: true };
  }

  private _deleteFile(url: string) {
    try {
      const filePath = join(process.cwd(), url);
      if (existsSync(filePath)) unlinkSync(filePath);
    } catch {}
  }

  /* ── Pricing Tiers ── */

  async setPricingTiers(productId: string, tiers: any[]) {
    await this.tierRepo.delete({ product_id: productId });
    const entities = tiers.map((t, i) =>
      this.tierRepo.create({
        product_id: productId,
        quantity: t.quantity,
        unit_price: t.unit_price || t.standard || 0,
        standard: t.standard || t.unit_price || 0,
        laminated: t.laminated || 0,
        embossed: t.embossed || 0,
        sort_order: i,
      }),
    );
    return this.tierRepo.save(entities);
  }

  /* ── Price Calculation ── */

  async calculatePrice(productId: string, quantity: number) {
    const product = await this.findProduct(productId);
    const tiers = (product.pricingTiers || []).sort((a, b) => a.quantity - b.quantity);

    let unitPrice = Number(product.base_price);
    for (const tier of tiers) {
      if (quantity >= tier.quantity) unitPrice = Number(tier.unit_price);
    }

    const subtotal = unitPrice * quantity;
    const vat = product.vat_enabled ? Math.round(subtotal * Number(product.vat_rate) / 100) : 0;
    const total = subtotal + vat;

    return { unit_price: unitPrice, quantity, subtotal, vat, vat_rate: Number(product.vat_rate), total };
  }
}
