import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ProductQr } from './entities/product-qr.entity';
import { ProductReview } from './entities/product-review.entity';
import { UsageService } from '../subscription/usage.service';
import { randomBytes } from 'crypto';

@Injectable()
export class ProductQrService {
  constructor(
    @InjectRepository(ProductQr)
    private qrRepo: Repository<ProductQr>,
    @InjectRepository(ProductReview)
    private reviewRepo: Repository<ProductReview>,
    private usageService: UsageService,
  ) {}

  // ─── CREATE ───
  async create(userId: string, dto: Partial<ProductQr>) {
    // Check subscription limit before creating
    await this.usageService.checkAndEnforce(userId, 'product_qrs');
    const slug = this.generateSlug(dto.product_name || 'product');
    const qr = this.qrRepo.create({ ...dto, user_id: userId, slug });
    const saved = await this.qrRepo.save(qr);
    // Log usage
    await this.usageService.logUsage(userId, 'product_qrs', 'create', saved.id);
    return saved;
  }

  // ─── UPDATE ───
  async update(id: string, userId: string, dto: Partial<ProductQr>) {
    const qr = await this.findOwned(id, userId);
    Object.assign(qr, dto);
    return this.qrRepo.save(qr);
  }

  // ─── LIST (user's product QRs) ───
  async findByUser(userId: string) {
    return this.qrRepo.find({
      where: { user_id: userId },
      order: { created_at: 'DESC' },
    });
  }

  // ─── PUBLIC VIEW ───
  async findBySlug(slug: string) {
    const qr = await this.qrRepo.findOne({ where: { slug, is_active: true } });
    if (!qr) throw new NotFoundException('Бүтээгдэхүүн олдсонгүй');
    await this.qrRepo.increment({ id: qr.id }, 'view_count', 1);
    return qr;
  }

  // ─── TRACK SCAN ───
  async trackScan(id: string) {
    await this.qrRepo.increment({ id }, 'scan_count', 1);
  }

  // ─── TRACK REORDER CLICK ───
  async trackReorder(id: string) {
    await this.qrRepo.increment({ id }, 'reorder_count', 1);
  }

  // ─── REVIEWS ───
  async addReview(productQrId: string, dto: Partial<ProductReview>) {
    const qr = await this.qrRepo.findOne({ where: { id: productQrId } });
    if (!qr) throw new NotFoundException();
    const review = this.reviewRepo.create({ ...dto, product_qr_id: productQrId });
    return this.reviewRepo.save(review);
  }

  async getReviews(productQrId: string) {
    return this.reviewRepo.find({
      where: { product_qr_id: productQrId, is_approved: true },
      order: { created_at: 'DESC' },
    });
  }

  async getReviewStats(productQrId: string) {
    const reviews = await this.reviewRepo.find({ where: { product_qr_id: productQrId, is_approved: true } });
    const count = reviews.length;
    const avg = count ? reviews.reduce((s, r) => s + Number(r.rating), 0) / count : 0;
    return { count, average: Math.round(avg * 10) / 10 };
  }

  // ─── DELETE ───
  async remove(id: string, userId: string) {
    const qr = await this.findOwned(id, userId);
    await this.reviewRepo.delete({ product_qr_id: id });
    const result = await this.qrRepo.remove(qr);
    // Log usage decrement
    await this.usageService.logUsage(userId, 'product_qrs', 'delete', id);
    return result;
  }

  // ─── ADMIN ───
  async adminList(page = 1, limit = 20) {
    return this.qrRepo.findAndCount({
      order: { created_at: 'DESC' },
      take: limit,
      skip: (page - 1) * limit,
      relations: ['user'],
    });
  }

  async getStats() {
    const total = await this.qrRepo.count();
    const active = await this.qrRepo.count({ where: { is_active: true } });
    const totalScans = await this.qrRepo.createQueryBuilder('pqr')
      .select('SUM(pqr.scan_count)', 'sum')
      .getRawOne();
    return { total, active, totalScans: Number(totalScans?.sum || 0) };
  }

  // ─── HELPERS ───
  private async findOwned(id: string, userId: string) {
    const qr = await this.qrRepo.findOne({ where: { id } });
    if (!qr) throw new NotFoundException();
    if (qr.user_id !== userId) throw new ForbiddenException();
    return qr;
  }

  private generateSlug(name: string): string {
    const base = name.toLowerCase().replace(/[^a-z0-9\u0400-\u04ff]+/g, '-').substring(0, 30);
    return `${base}-${randomBytes(4).toString('hex')}`;
  }
}
